package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pulsep/backend/internal/models"
	"github.com/pulsep/backend/internal/services"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// VoteHandler handles voting and SSE streaming.
type VoteHandler struct {
	polls *mongo.Collection
	svc   *services.PollService
}

func NewVoteHandler(polls *mongo.Collection, svc *services.PollService) *VoteHandler {
	return &VoteHandler{polls: polls, svc: svc}
}

// ── POST /api/polls/:id/vote ──────────────────────────────────────────────

type voteReq struct {
	OptionID string `json:"optionId"`
	VoterID  string `json:"voterId"` // browser-generated UUID from localStorage
}

func (h *VoteHandler) Vote(c *gin.Context) {
	poll, ok := h.fetchActivePoll(c)
	if !ok {
		return
	}

	var req voteReq
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.OptionID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "optionId is required"})
		return
	}

	optID, err := primitive.ObjectIDFromHex(req.OptionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid optionId"})
		return
	}

	// Build fingerprint:
	// - If browser sent a voterId (localStorage UUID), use it — incognito gets a fresh UUID
	// - Fall back to IP + User-Agent if no voterId sent (e.g. API clients)
	var fingerprint string
	if strings.TrimSpace(req.VoterID) != "" {
		fingerprint = "vid:" + strings.TrimSpace(req.VoterID)
	} else {
		fingerprint = c.ClientIP() + "|" + c.GetHeader("User-Agent")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// One vote per browser/device fingerprint
	isNew, err := h.svc.CheckAndSetVoter(ctx, poll.ID.Hex(), fingerprint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "vote tracking error"})
		return
	}
	if !isNew {
		// Already voted — return current results without incrementing
		result := h.svc.Enrich(ctx, poll)
		c.JSON(http.StatusOK, gin.H{
			"poll":        result,
			"alreadyVoted": true,
		})
		return
	}

	// Atomic increment in Redis
	result, err := h.svc.IncrVote(ctx, poll, optID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// Publish live update to all SSE subscribers
	payload := models.SSEPayload{Type: "vote", Poll: result}
	if b, err := json.Marshal(payload); err == nil {
		_ = h.svc.Publish(ctx, poll.ID.Hex(), b)
	}

	c.JSON(http.StatusOK, gin.H{"poll": result})
}

// ── GET /api/polls/:id/stream ─────────────────────────────────────────────
// Server-Sent Events — one long-lived HTTP connection per client.
// Redis pub/sub delivers updates; we forward them as SSE data frames.

func (h *VoteHandler) Stream(c *gin.Context) {
	poll, ok := h.fetchPollForStream(c)
	if !ok {
		return
	}

	ctx := c.Request.Context()

	// Subscribe to Redis channel
	sub := h.svc.Subscribe(ctx, poll.ID.Hex())
	defer sub.Close()

	ch := sub.Channel()

	// SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no") // disable nginx buffering

	// Send initial "connected" event with current state
	initial := h.svc.Enrich(ctx, poll)
	writeSSE(c, "status", models.SSEPayload{Type: "status", Poll: initial})
	c.Writer.Flush()

	// Keep-alive ticker — prevents proxy timeouts
	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				return
			}
			// Forward the raw JSON payload as an SSE data line
			writeSSERaw(c, "vote", msg.Payload)
			c.Writer.Flush()

		case <-ticker.C:
			// SSE comment — keeps the connection alive through proxies
			c.Writer.WriteString(": ping\n\n")
			c.Writer.Flush()

		case <-ctx.Done():
			return
		}
	}
}

// ── helpers ───────────────────────────────────────────────────────────────

// fetchActivePoll finds the poll and verifies it's open for voting.
func (h *VoteHandler) fetchActivePoll(c *gin.Context) (*models.Poll, bool) {
	idStr := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid poll id"})
		return nil, false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll
	if err := h.polls.FindOne(ctx, bson.M{"_id": oid}).Decode(&poll); err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"message": "poll not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "database error"})
		}
		return nil, false
	}

	if !poll.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"message": "this poll is closed"})
		return nil, false
	}

	if poll.ExpiresAt != nil && poll.ExpiresAt.Before(time.Now()) {
		c.JSON(http.StatusForbidden, gin.H{"message": "this poll has expired"})
		return nil, false
	}

	return &poll, true
}

// fetchPollForStream finds a poll without enforcing active status (results are still viewable after close).
func (h *VoteHandler) fetchPollForStream(c *gin.Context) (*models.Poll, bool) {
	idStr := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid poll id"})
		return nil, false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var poll models.Poll
	if err := h.polls.FindOne(ctx, bson.M{"_id": oid}).Decode(&poll); err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"message": "poll not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "database error"})
		}
		return nil, false
	}

	return &poll, true
}

func writeSSE(c *gin.Context, event string, payload interface{}) {
	b, _ := json.Marshal(payload)
	writeSSERaw(c, event, string(b))
}

func writeSSERaw(c *gin.Context, event, data string) {
	c.Writer.WriteString("event: " + event + "\n")
	c.Writer.WriteString("data: " + data + "\n\n")
}
