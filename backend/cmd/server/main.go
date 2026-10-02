package main

import (
	"bufio"
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/pulsep/backend/internal/config"
	"github.com/pulsep/backend/internal/db"
	"github.com/pulsep/backend/internal/handlers"
	"github.com/pulsep/backend/internal/middleware"
	"github.com/pulsep/backend/internal/services"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// ── Load .env file if present (dev convenience) ──────────────────
	loadDotEnv()

	// ── Config ──────────────────────────────────────────────────────
	cfg := config.Load()

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// ── Databases ────────────────────────────────────────────────────
	mongoDB := db.ConnectMongo(cfg)
	defer mongoDB.Disconnect()

	rdb := db.ConnectRedis(cfg)
	defer rdb.Close()

	// ── MongoDB indexes ──────────────────────────────────────────────
	ensureIndexes(mongoDB)

	// ── Services & Handlers ──────────────────────────────────────────
	pollSvc := services.NewPollService(rdb)

	userCol := mongoDB.Col("users")
	pollCol := mongoDB.Col("polls")

	authH := handlers.NewAuthHandler(userCol, cfg.JWTSecret)
	pollH := handlers.NewPollHandler(pollCol, pollSvc)
	voteH := handlers.NewVoteHandler(pollCol, pollSvc)

	// ── Router ───────────────────────────────────────────────────────
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS — allow the React dev server and any deployed frontend origin
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
		AllowOriginFunc: func(origin string) bool {
			// Allow any origin in development; in production set CORS_ORIGIN env var
			allowed := os.Getenv("CORS_ORIGIN")
			if allowed == "" || allowed == "*" {
				return true
			}
			return origin == allowed
		},
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now().UTC()})
	})

	// ── API routes ───────────────────────────────────────────────────
	api := r.Group("/api")

	// Auth
	auth := api.Group("/auth")
	{
		auth.POST("/signup", authH.Signup)
		auth.POST("/login",  authH.Login)
		auth.GET("/me",      middleware.RequireAuth(cfg.JWTSecret), authH.Me)
	}

	// Polls
	polls := api.Group("/polls")
	{
		// Protected: create + manage
		polls.POST("",          middleware.RequireAuth(cfg.JWTSecret), pollH.Create)
		polls.GET("/my",        middleware.RequireAuth(cfg.JWTSecret), pollH.MyPolls)
		polls.PATCH("/:id/toggle", middleware.RequireAuth(cfg.JWTSecret), pollH.Toggle)
		polls.DELETE("/:id",   middleware.RequireAuth(cfg.JWTSecret), pollH.Delete)

		// Public: read + vote + stream
		polls.GET("/:id",           middleware.OptionalAuth(cfg.JWTSecret), pollH.Get)
		polls.POST("/:id/vote",     voteH.Vote)
		polls.GET("/:id/stream",    middleware.OptionalAuth(cfg.JWTSecret), voteH.Stream)
	}

	// ── Server ───────────────────────────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 0, // 0 = no timeout for SSE streams
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("🚀 PulseP backend  port=%s  env=%s", cfg.Port, cfg.Env)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	<-quit
	log.Println("shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("forced shutdown: %v", err)
	}
	log.Println("bye.")
}

// ensureIndexes creates necessary MongoDB indexes on startup.
func ensureIndexes(m *db.Mongo) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// users: unique email
	m.Col("users").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	// polls: by creatorId (for /my endpoint)
	m.Col("polls").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "creatorId", Value: 1}},
	})

	// polls: by createdAt descending (for listing)
	m.Col("polls").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "createdAt", Value: -1}},
	})

	log.Println("✓ MongoDB indexes ensured")
}

// loadDotEnv reads a .env file from the working directory or the directory
// containing the binary and sets any unset environment variables.
// It is intentionally silent — missing .env is not an error in production.
func loadDotEnv() {
	candidates := []string{
		".env",
		filepath.Join(filepath.Dir(os.Args[0]), ".env"),
	}
	for _, path := range candidates {
		f, err := os.Open(path)
		if err != nil {
			continue
		}
		defer f.Close()
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) != 2 {
				continue
			}
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			// Only set if not already set — real env vars take priority
			if os.Getenv(key) == "" {
				os.Setenv(key, val)
			}
		}
		log.Printf("✓ Loaded env from %s", path)
		return
	}
}
