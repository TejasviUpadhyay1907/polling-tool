package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const UserIDKey = "userID"
const UserNameKey = "userName"

// Claims is the JWT payload.
type Claims struct {
	UserID   string `json:"userId"`
	UserName string `json:"userName"`
	jwt.RegisteredClaims
}

// RequireAuth validates the Bearer JWT and sets userID in context.
func RequireAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "authentication required"})
			return
		}

		claims, err := parseToken(token, secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid or expired token"})
			return
		}

		c.Set(UserIDKey, claims.UserID)
		c.Set(UserNameKey, claims.UserName)
		c.Next()
	}
}

// OptionalAuth parses the token if present but does not abort on missing/invalid.
func OptionalAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token != "" {
			if claims, err := parseToken(token, secret); err == nil {
				c.Set(UserIDKey, claims.UserID)
				c.Set(UserNameKey, claims.UserName)
			}
		}
		c.Next()
	}
}

// GetUserID returns the authenticated user's ID from context.
func GetUserID(c *gin.Context) (primitive.ObjectID, bool) {
	v, exists := c.Get(UserIDKey)
	if !exists {
		return primitive.NilObjectID, false
	}
	idStr, ok := v.(string)
	if !ok {
		return primitive.NilObjectID, false
	}
	oid, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return primitive.NilObjectID, false
	}
	return oid, true
}

func extractToken(c *gin.Context) string {
	// 1. Authorization: Bearer <token>
	header := c.GetHeader("Authorization")
	if strings.HasPrefix(header, "Bearer ") {
		return strings.TrimPrefix(header, "Bearer ")
	}
	// 2. ?token=<token>  (used by SSE EventSource which can't set headers)
	return c.Query("token")
}

func parseToken(tokenStr, secret string) (*Claims, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	return claims, err
}
