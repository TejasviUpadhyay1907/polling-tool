package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pulsep/backend/internal/middleware"
	"github.com/pulsep/backend/internal/models"
	"github.com/pulsep/backend/internal/services"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// PollHandler handles CRUD for polls.
type PollHandler struct {
	polls *mongo.Collection
	svc   *services.PollService
}

func NewPollHandler(polls *mongo.Collection, svc *services.PollService) *PollHandler {
	return &PollHandler{polls: polls, svc: svc}
}

// ── POST /api/polls ───────────────────────────────────────────────────────

type createPollReq struct {
	Question              string    `json:"question"              binding:"required,min=5,max=300"`
	Options               []string  `json:"options"               binding:"required,min=2,max=6"`
	ExpiresAt             *string   `json:"expiresAt"`
	ShowResultsBeforeVote *bool     `json:"showResultsBeforeVote"`
}

func (h *PollHandler) Create(c *gin.Context) {
	var req createPollReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": formatValidationError(err)})
		return
	}

	// Validate options
	req.Question = strings.TrimSpace(req.Question)
	cleaned := make([]string, 0, len(req.Options))
	seen := map[string]bool{}
	for _, o := range req.Options {
		t := strings.TrimSpace(o)
		if t == "" {
			continue
		}
		if len(t) > 100 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "each option must be under 100 characters"})
			return
		}
		low := strings.ToLower(t)
		if seen[low] {
			c.JSON(http.StatusBadRequest, gin.H{"message": "options must be unique"})
			return
		}
		seen[low] = true
		cleaned = append(cleaned, t)
	}
	if len(cleaned) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "at least 2 options required"})
		return
	}

	userID, _ := middleware.GetUserID(c)
	userName, _ := c.Get(middleware.UserNameKey)

	opts := make([]models.PollOption, len(cleaned))
	for i, text := range cleaned {
		opts[i] = models.PollOption{
			ID:   primitive.NewObjectID(),
			Text: text,
		}
	}

	showResults := true
	if req.ShowResultsBeforeVote != nil {
		showResults = *req.ShowResultsBeforeVote
	}

	var expiresAt *time.Time
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		t, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid expiresAt format, use RFC3339"})
			return
		}
		if t.Before(time.Now()) {
			c.JSON(http.StatusBadRequest, gin.H{"message": "expiresAt must be in the future"})
			return
		}
		expiresAt = &t
	}

	now := time.Now().UTC()
	poll := models.Poll{
		ID:                    primitive.NewObjectID(),
		Question:              req.Question,
		Options:               opts,
		CreatorID:             userID,
		CreatorName:           safeStr(userName),
		IsActive:              true,
		ShowResultsBeforeVote: showResults,
		ExpiresAt:             expiresAt,
		CreatedAt:             now,
		UpdatedAt:             now,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := h.polls.InsertOne(ctx, poll); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "could not create poll"})
		return
	}

	result := h.svc.Enrich(ctx, &poll)
	c.JSON(http.StatusCreated, gin.H{"poll": result})
}

// ── GET /api/polls/my ─────────────────────────────────────────────────────

func (h *PollHandler) MyPolls(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	opts := options.Find().
		SetSort(bson.D{{Key: "createdAt", Value: -1}}).
		SetLimit(100)

	cursor, err := h.polls.Find(ctx, bson.M{"creatorId": userID}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "could not fetch polls"})
		return
	}
	defer cursor.Close(ctx)

	var polls []models.Poll
	if err := cursor.All(ctx, &polls); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "could not decode polls"})
		return
	}

	result := make([]models.PollWithCounts, len(polls))
	for i := range polls {
		result[i] = h.svc.Enrich(ctx, &polls[i])
	}

	c.JSON(http.StatusOK, gin.H{"polls": result})
}

// ── GET /api/polls/:id ────────────────────────────────────────────────────

func (h *PollHandler) Get(c *gin.Context) {
	poll, ok := h.findPoll(c)
	if !ok {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result := h.svc.Enrich(ctx, poll)
	c.JSON(http.StatusOK, gin.H{"poll": result})
}

// ── PATCH /api/polls/:id/toggle ───────────────────────────────────────────

func (h *PollHandler) Toggle(c *gin.Context) {
	poll, ok := h.findPoll(c)
	if !ok {
		return
	}

	userID, _ := middleware.GetUserID(c)
	if poll.CreatorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"message": "only the poll creator can modify this poll"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	newActive := !poll.IsActive
	_, err := h.polls.UpdateOne(ctx,
		bson.M{"_id": poll.ID},
		bson.M{"$set": bson.M{"isActive": newActive, "updatedAt": time.Now().UTC()}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "could not update poll"})
		return
	}

	poll.IsActive = newActive
	result := h.svc.Enrich(ctx, poll)
	c.JSON(http.StatusOK, gin.H{"poll": result})
}

// ── DELETE /api/polls/:id ─────────────────────────────────────────────────

func (h *PollHandler) Delete(c *gin.Context) {
	poll, ok := h.findPoll(c)
	if !ok {
		return
	}

	userID, _ := middleware.GetUserID(c)
	if poll.CreatorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"message": "only the poll creator can delete this poll"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := h.polls.DeleteOne(ctx, bson.M{"_id": poll.ID}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "could not delete poll"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// ── helpers ───────────────────────────────────────────────────────────────

func (h *PollHandler) findPoll(c *gin.Context) (*models.Poll, bool) {
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

func safeStr(v interface{}) string {
	if v == nil {
		return ""
	}
	s, _ := v.(string)
	return s
}
