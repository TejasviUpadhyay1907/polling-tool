package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User is stored in the "users" collection.
type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
	Name      string             `bson:"name"           json:"name"`
	Email     string             `bson:"email"          json:"email"`
	Password  string             `bson:"password"       json:"-"` // bcrypt hash — never serialised
	CreatedAt time.Time          `bson:"createdAt"      json:"createdAt"`
}

// UserPublic is the safe subset sent to the client.
type UserPublic struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (u *User) Public() UserPublic {
	return UserPublic{
		ID:    u.ID.Hex(),
		Name:  u.Name,
		Email: u.Email,
	}
}
