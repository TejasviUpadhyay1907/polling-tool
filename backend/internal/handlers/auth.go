package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/pulsep/backend/internal/middleware"
	"github.com/pulsep/backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles auth endpoints.
type AuthHandler struct {
	users     *mongo.Collection
	jwtSecret string
}

func NewAuthHandler(users *mongo.Collection, jwtSecret string) *AuthHandler {
	return &AuthHandler{users: users, jwtSecret: jwtSecret}
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────

type signupReq struct {
	Name     string `json:"name"     binding:"required,min=2,max=80"`
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=128"`
}

func (h *AuthHandler) Signup(c *gin.Context) {
	var req signupReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": formatValidationError(err)})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Name  = strings.TrimSpace(req.Name)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Check duplicate email
	var existing models.User
	err := h.users.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existing)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"message": "email already registered"})
		return
	}
	if err != mongo.ErrNoDocuments {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "database error"})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "could not hash password"})
		return
	}

	user := models.User{
		ID:        primitive.NewObjectID(),
		Name:      req.Name,
		Email:     req.Email,
		Password:  string(hash),
		CreatedAt: time.Now().UTC(),
	}

	if _, err := h.users.InsertOne(ctx, user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "could not create user"})
		return
	}

	token, err := h.generateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "could not generate token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user":  user.Public(),
	})
}

// ── POST /api/auth/login ──────────────────────────────────────────────────

type loginReq struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": formatValidationError(err)})
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	if err := h.users.FindOne(ctx, bson.M{"email": req.Email}).Decode(&user); err != nil {
		// Same message for both "not found" and "wrong password" — no user enumeration
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid email or password"})
		return
	}

	token, err := h.generateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user.Public(),
	})
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────

func (h *AuthHandler) Me(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "not authenticated"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	if err := h.users.FindOne(ctx, bson.M{"_id": userID}).Decode(&user); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user.Public()})
}

// ── helpers ───────────────────────────────────────────────────────────────

func (h *AuthHandler) generateToken(u *models.User) (string, error) {
	claims := middleware.Claims{
		UserID:   u.ID.Hex(),
		UserName: u.Name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.jwtSecret))
}

func formatValidationError(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}
