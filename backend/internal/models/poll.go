package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PollOption is an answer choice inside a Poll.
type PollOption struct {
	ID   primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Text string             `bson:"text"          json:"text"`
}

// Poll is stored in the "polls" collection.
// Vote counts are stored in Redis (not here) for performance.
// MongoDB is the source of truth for structure + metadata.
type Poll struct {
	ID                   primitive.ObjectID   `bson:"_id,omitempty"         json:"id"`
	Question             string               `bson:"question"              json:"question"`
	Options              []PollOption         `bson:"options"               json:"options"`
	CreatorID            primitive.ObjectID   `bson:"creatorId"             json:"creatorId"`
	CreatorName          string               `bson:"creatorName"           json:"creatorName"`
	IsActive             bool                 `bson:"isActive"              json:"isActive"`
	ShowResultsBeforeVote bool                `bson:"showResultsBeforeVote" json:"showResultsBeforeVote"`
	ExpiresAt            *time.Time           `bson:"expiresAt,omitempty"   json:"expiresAt"`
	CreatedAt            time.Time            `bson:"createdAt"             json:"createdAt"`
	UpdatedAt            time.Time            `bson:"updatedAt"             json:"updatedAt"`
}

// PollWithCounts is the full poll response including live vote counts from Redis.
type PollWithCounts struct {
	ID                   string             `json:"id"`
	Question             string             `json:"question"`
	Options              []OptionWithVotes  `json:"options"`
	IsActive             bool               `json:"isActive"`
	TotalVotes           int64              `json:"totalVotes"`
	CreatorID            string             `json:"creatorId"`
	CreatorName          string             `json:"creatorName"`
	ShowResultsBeforeVote bool              `json:"showResultsBeforeVote"`
	ExpiresAt            *time.Time         `json:"expiresAt"`
	CreatedAt            time.Time          `json:"createdAt"`
}

// OptionWithVotes combines static option data with live vote count from Redis.
type OptionWithVotes struct {
	ID    string `json:"id"`
	Text  string `json:"text"`
	Votes int64  `json:"votes"`
}

// SSEPayload is what we publish to Redis pub/sub and stream to clients.
type SSEPayload struct {
	Type       string         `json:"type"`
	Poll       PollWithCounts `json:"poll"`
}
