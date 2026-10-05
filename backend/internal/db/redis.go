package db

import (
	"context"
	"crypto/tls"
	"log"
	"os"
	"time"

	"github.com/pulsep/backend/internal/config"
	"github.com/redis/go-redis/v9"
)

// ConnectRedis creates and verifies a Redis client.
// If REDIS_TLS=true or APP_ENV=production, TLS is enabled (required by Upstash).
func ConnectRedis(cfg *config.Config) *redis.Client {
	opts := &redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB:       0,
	}

	// Enable TLS for Upstash / production Redis
	redisTLS := os.Getenv("REDIS_TLS")
	if cfg.Env == "production" || redisTLS == "true" {
		opts.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	rdb := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Fatalf("Redis ping error: %v", err)
	}

	log.Printf("✓ Redis connected  addr=%s  tls=%v", cfg.RedisAddr, opts.TLSConfig != nil)
	return rdb
}

// --- Key helpers ---

// VoteCountKey is the Redis hash that stores per-option vote counts for a poll.
func VoteCountKey(pollID string) string {
	return "pulsep:votes:" + pollID
}

// VoterKey tracks whether a given voter fingerprint has voted on a poll.
func VoterKey(pollID, fingerprint string) string {
	return "pulsep:voter:" + pollID + ":" + fingerprint
}

// PollChannel is the Redis pub/sub channel for live vote events.
func PollChannel(pollID string) string {
	return "pulsep:channel:" + pollID
}
