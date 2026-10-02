package services

import (
	"context"
	"fmt"
	"time"

	"github.com/pulsep/backend/internal/db"
	"github.com/pulsep/backend/internal/models"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PollService handles Redis vote counts and builds PollWithCounts responses.
type PollService struct {
	rdb *redis.Client
}

func NewPollService(rdb *redis.Client) *PollService {
	return &PollService{rdb: rdb}
}

// Enrich attaches live Redis vote counts to a Poll.
func (s *PollService) Enrich(ctx context.Context, poll *models.Poll) models.PollWithCounts {
	key := db.VoteCountKey(poll.ID.Hex())
	counts, _ := s.rdb.HGetAll(ctx, key).Result()

	var total int64
	options := make([]models.OptionWithVotes, len(poll.Options))
	for i, opt := range poll.Options {
		idStr := opt.ID.Hex()
		v, _ := parseCount(counts[idStr])
		total += v
		options[i] = models.OptionWithVotes{
			ID:    idStr,
			Text:  opt.Text,
			Votes: v,
		}
	}

	return models.PollWithCounts{
		ID:                    poll.ID.Hex(),
		Question:              poll.Question,
		Options:               options,
		IsActive:              poll.IsActive,
		TotalVotes:            total,
		CreatorID:             poll.CreatorID.Hex(),
		CreatorName:           poll.CreatorName,
		ShowResultsBeforeVote: poll.ShowResultsBeforeVote,
		ExpiresAt:             poll.ExpiresAt,
		CreatedAt:             poll.CreatedAt,
	}
}

// IncrVote atomically increments the vote count for an option in Redis.
// Returns the updated PollWithCounts.
func (s *PollService) IncrVote(ctx context.Context, poll *models.Poll, optionID primitive.ObjectID) (models.PollWithCounts, error) {
	key := db.VoteCountKey(poll.ID.Hex())
	optStr := optionID.Hex()

	// Verify option belongs to this poll
	found := false
	for _, o := range poll.Options {
		if o.ID == optionID {
			found = true
			break
		}
	}
	if !found {
		return models.PollWithCounts{}, fmt.Errorf("option not found in poll")
	}

	// HINCRBY is atomic — safe under high concurrency
	if err := s.rdb.HIncrBy(ctx, key, optStr, 1).Err(); err != nil {
		return models.PollWithCounts{}, fmt.Errorf("redis HIncrBy: %w", err)
	}

	return s.Enrich(ctx, poll), nil
}

// CheckAndSetVoter returns true if this is a NEW voter (not seen before).
// Uses Redis SET NX (set if not exists) for atomicity.
func (s *PollService) CheckAndSetVoter(ctx context.Context, pollID, fingerprint string) (bool, error) {
	key := db.VoterKey(pollID, fingerprint)
	// SET key 1 NX EX 365days
	set, err := s.rdb.SetNX(ctx, key, 1, 365*24*time.Hour).Result()
	return set, err
}

// Publish sends the updated poll state to Redis pub/sub so all SSE clients receive it.
func (s *PollService) Publish(ctx context.Context, pollID string, payload []byte) error {
	return s.rdb.Publish(ctx, db.PollChannel(pollID), payload).Err()
}

// Subscribe returns a PubSub subscription for a poll channel.
func (s *PollService) Subscribe(ctx context.Context, pollID string) *redis.PubSub {
	return s.rdb.Subscribe(ctx, db.PollChannel(pollID))
}

func parseCount(s string) (int64, error) {
	if s == "" {
		return 0, nil
	}
	var n int64
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}
