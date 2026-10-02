package db

import (
	"context"
	"log"
	"time"

	"github.com/pulsep/backend/internal/config"
	"github.com/redis/go-redis/v9"
)

// ConnectRedis creates and verifies a Redis client.
func ConnectRedis(cfg *config.Config) *redis.Client {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPass,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Fatalf("Redis ping error: %v", err)
	}

	log.Printf("✓ Redis connected  addr=%s", cfg.RedisAddr)
	return rdb
}

// --- Key helpers ---

// VoteCountKey is the Redis hash that stores per-option vote counts for a poll.
// HSET pulsep:votes:<pollID> <optionID> <count>
func VoteCountKey(pollID string) string {
	return "pulsep:votes:" + pollID
}

// VoterKey tracks whether a given voter (fingerprint) has voted on a poll.
// SET pulsep:voter:<pollID>:<fingerprint>  1  EX 60*60*24*365
func VoterKey(pollID, fingerprint string) string {
	return "pulsep:voter:" + pollID + ":" + fingerprint
}

// PollChannel is the Redis pub/sub channel for live vote events.
func PollChannel(pollID string) string {
	return "pulsep:channel:" + pollID
}
