package db

import (
	"context"
	"log"
	"time"

	"github.com/pulsep/backend/internal/config"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Mongo wraps the MongoDB client and selected database.
type Mongo struct {
	Client *mongo.Client
	DB     *mongo.Database
}

// ConnectMongo establishes a MongoDB connection and pings it.
func ConnectMongo(cfg *config.Config) *Mongo {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(cfg.MongoURI)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Fatalf("MongoDB connect error: %v", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("MongoDB ping error: %v", err)
	}

	log.Printf("✓ MongoDB connected  db=%s", cfg.MongoDB)
	return &Mongo{
		Client: client,
		DB:     client.Database(cfg.MongoDB),
	}
}

// Disconnect cleanly closes the MongoDB connection.
func (m *Mongo) Disconnect() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := m.Client.Disconnect(ctx); err != nil {
		log.Printf("MongoDB disconnect error: %v", err)
	}
}

// Col returns a collection handle.
func (m *Mongo) Col(name string) *mongo.Collection {
	return m.DB.Collection(name)
}
