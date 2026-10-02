package config

import (
	"log"
	"os"
	"strconv"
)

// Config holds all runtime configuration loaded from environment variables.
type Config struct {
	Port        string
	MongoURI    string
	MongoDB     string
	RedisAddr   string
	RedisPass   string
	JWTSecret   string
	Env         string
}

// Load reads environment variables and returns a Config.
// It panics if required variables are missing.
func Load() *Config {
	c := &Config{
		Port:      getEnv("PORT", "8080"),
		MongoURI:  mustEnv("MONGO_URI"),
		MongoDB:   getEnv("MONGO_DB", "pulsep"),
		RedisAddr: getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPass: getEnv("REDIS_PASS", ""),
		JWTSecret: mustEnv("JWT_SECRET"),
		Env:       getEnv("APP_ENV", "development"),
	}
	return c
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("FATAL: required environment variable %q is not set", key)
	}
	return v
}

// GetInt reads an env var as int, falls back to defaultVal.
func GetInt(key string, defaultVal int) int {
	v := os.Getenv(key)
	if v == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return defaultVal
	}
	return n
}
