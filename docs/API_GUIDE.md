# API Usage Guide

Practical guide for using the FinCred API with real examples.

---

## Table of Contents

1. [Base URL & Authentication](#base-url--authentication)
2. [Authentication Flow](#authentication-flow)
3. [Goals API](#goals-api)
4. [Error Handling](#error-handling)
5. [Pagination](#pagination)
6. [Common Patterns](#common-patterns)

---

## Base URL & Authentication

**Base URL:**
```
Development: http://127.0.0.1:8000
Production: https://api.fincred.com
```

**API Prefix:** `/api/v0`

**Authentication:** Bearer Token (JWT)

All endpoints except authentication require the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Flow

### 1. Register New User

**Endpoint:** `POST /api/v0/auth/register`

**Request:**
```bash
curl -X POST "http://127.0.0.1:8000/api/v0/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Response (201 Created):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "email": "user@example.com"
}
```

### 2. Verify Email

**Endpoint:** `POST /api/v0/auth/verify-email`

**Request:**
```bash
curl -X POST "http://127.0.0.1:8000/api/v0/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "token": "verification_token_from_email"
  }'
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully. You can now log in."
}
```

### 3. Login

**Endpoint:** `POST /api/v0/auth/login`

**Request:**
```bash
curl -X POST "http://127.0.0.1:8000/api/v0/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-...",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_verified": true,
    "is_active": true
  }
}
```

**Save the `access_token`** for subsequent requests!

---

## Goals API

### 1. Create Goal

**Endpoint:** `POST /api/v0/goals`

**Request:**
```bash
curl -X POST "http://127.0.0.1:8000/api/v0/goals" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "short_term_saving",
    "name": "Emergency Fund",
    "target_amount": 10000.00,
    "target_date": "2025-12-31",
    "priority": "High",
    "primary_flag": true,
    "why_text": "Build 6 months of expenses for financial security"
  }'
```

**Response (201 Created):**
```json
{
  "id": "uuid-...",
  "user_id": "uuid-...",
  "type": "short_term_saving",
  "name": "Emergency Fund",
  "target_amount": 10000.0,
  "target_date": "2025-12-31",
  "priority": "High",
  "primary_flag": true,
  "why_text": "Build 6 months of expenses for financial security",
  "status": "active",
  "created_at": "2026-02-04T13:00:00Z",
  "updated_at": "2026-02-04T13:00:00Z"
}
```

### 2. List Goals

**Endpoint:** `GET /api/v0/goals`

**Request:**
```bash
curl "http://127.0.0.1:8000/api/v0/goals?limit=10&offset=0" \
  -H "Authorization: Bearer <your_token>"
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid-...",
    "user_id": "uuid-...",
    "type": "short_term_saving",
    "name": "Emergency Fund",
    "target_amount": 10000.0,
    "target_date": "2025-12-31",
    "priority": "High",
    "primary_flag": true,
    "why_text": "Build 6 months of expenses",
    "status": "active",
    "created_at": "2026-02-04T13:00:00Z",
    "updated_at": "2026-02-04T13:00:00Z"
  }
]
```

### 3. Get Single Goal

**Endpoint:** `GET /api/v0/goals/{goal_id}`

**Request:**
```bash
curl "http://127.0.0.1:8000/api/v0/goals/<goal_id>" \
  -H "Authorization: Bearer <your_token>"
```

**Response (200 OK):**
```json
{
  "id": "<goal_id>",
  "user_id": "uuid-...",
  "type": "short_term_saving",
  "name": "Emergency Fund",
  "target_amount": 10000.0,
  "target_date": "2025-12-31",
  "priority": "High",
  "primary_flag": true,
  "why_text": "Build 6 months of expenses",
  "status": "active",
  "created_at": "2026-02-04T13:00:00Z",
  "updated_at": "2026-02-04T13:00:00Z"
}
```

### 4. Update Goal

**Endpoint:** `PATCH /api/v0/goals/{goal_id}`

**Request:**
```bash
curl -X PATCH "http://127.0.0.1:8000/api/v0/goals/<goal_id>" \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_amount": 15000.00,
    "priority": "Medium"
  }'
```

**Response (200 OK):**
```json
{
  "id": "<goal_id>",
  "target_amount": 15000.0,
  "priority": "Medium",
  "..." : "other fields unchanged"
}
```

### 5. Delete Goal (Cancel)

**Endpoint:** `DELETE /api/v0/goals/{goal_id}`

**Request:**
```bash
curl -X DELETE "http://127.0.0.1:8000/api/v0/goals/<goal_id>" \
  -H "Authorization: Bearer <your_token>"
```

**Response (200 OK):**
```json
{
  "message": "Goal cancelled successfully"
}
```

**Note:** Goals are soft-deleted (status changed to "cancelled")

---

## Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "details": {}  // Optional additional context
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `EMAIL_ALREADY_EXISTS` | 409 | Email already registered |
| `GOAL_LIMIT_EXCEEDED` | 409 | Max 5 active goals reached |
| `INVALID_GOAL_DATE` | 400 | Target date must be in future |
| `RESOURCE_NOT_FOUND` | 404 | Goal/resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NO_FIELDS_TO_UPDATE` | 400 | Empty update request |

### Example Error Responses

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "target_amount",
      "message": "Target amount must be greater than 0",
      "code": "VALUE_ERROR"
    }
  ]
}
```

**Authentication Error:**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "error_code": "INVALID_CREDENTIALS"
}
```

**Business Logic Error:**
```json
{
  "success": false,
  "error": "Goal limit exceeded",
  "error_code": "GOAL_LIMIT_EXCEEDED",
  "details": {
    "current_count": 5,
    "max_count": 5
  }
}
```

---

## Pagination

### Using Pagination

All list endpoints support pagination via query parameters:

**Parameters:**
- `limit` (integer, 1-100, default: 20) - Items per page
- `offset` (integer, ≥0, default: 0) - Items to skip

**Example:**
```bash
# First page (20 items)
curl "http://127.0.0.1:8000/api/v0/goals?limit=20&offset=0" \
  -H "Authorization: Bearer <your_token>"

# Second page
curl "http://127.0.0.1:8000/api/v0/goals?limit=20&offset=20" \
  -H "Authorization: Bearer <your_token>"

# Get 50 items per page
curl "http://127.0.0.1:8000/api/v0/goals?limit=50&offset=0" \
  -H "Authorization: Bearer <your_token>"
```

### Future Pagination Response

**Note:** Currently list endpoints return arrays. Future versions will use `PaginatedResponse`:

```json
{
  "items": [...],
  "total": 150,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

---

## Common Patterns

### Pattern 1: Complete Registration Flow

```bash
# Step 1: Register
curl -X POST ".../auth/register" \
  -d '{"email": "user@example.com", "password": "Pass123!", "first_name": "John", "last_name": "Doe"}'

# Step 2: Check email for verification token

# Step 3: Verify email
curl -X POST ".../auth/verify-email" \
  -d '{"email": "user@example.com", "token": "abc123..."}'

# Step 4: Login
curl -X POST ".../auth/login" \
  -d '{"email": "user@example.com", "password": "Pass123!"}'

# Save the access_token from response
```

### Pattern 2: Create and Track Goal

```bash
# Create goal
GOAL_RESPONSE=$(curl -X POST ".../goals" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "short_term_saving",
    "name": "Vacation Fund",
    "target_amount": 5000,
    "target_date": "2025-08-01",
    "priority": "Medium"
  }')

# Extract goal ID
GOAL_ID=$(echo $GOAL_RESPONSE | jq -r '.id')

# Get goal details
curl ".../goals/$GOAL_ID" \
  -H "Authorization: Bearer $TOKEN"

# Update progress
curl -X PATCH ".../goals/$GOAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"target_amount": 6000}'
```

### Pattern 3: List All Active Goals

```bash
# Get all goals for authenticated user
curl ".../goals?limit=100&offset=0" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.[] | select(.status == "active")'
```

### Pattern 4: Error Handling in Client

**JavaScript example:**
```javascript
async function createGoal(goalData, token) {
  const response = await fetch('http://127.0.0.1:8000/api/v0/goals', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(goalData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    // Handle specific error codes
    if (error.error_code === 'GOAL_LIMIT_EXCEEDED') {
      alert(`You can only have ${error.details.max_count} active goals`);
    } else if (error.error_code === 'INVALID_GOAL_DATE') {
      alert('Target date must be in the future');
    } else {
      alert(error.error);
    }
    
    throw new Error(error.error);
  }
  
  return await response.json();
}
```

---

## Health Checks

### Basic Health Check

```bash
curl "http://127.0.0.1:8000/api/v0/health"
```

**Response:**
```json
{
  "status": "healthy"
}
```

### Database Health

```bash
curl "http://127.0.0.1:8000/api/v0/health/db"
```

**Response (Healthy):**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "connection refused"
}
```

### Detailed Health

```bash
curl "http://127.0.0.1:8000/api/v0/health/detailed"
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development",
  "database": {
    "status": "connected",
    "pool_size": 5,
    "overflow": 10
  },
  "uptime_seconds": 12345
}
```

---

## Rate Limiting

**Note:** Rate limiting is not yet implemented. Future implementation will:

- Limit requests per user per minute
- Return HTTP 429 (Too Many Requests) when exceeded
- Include `X-RateLimit-*` headers:
  - `X-RateLimit-Limit: 60`
  - `X-RateLimit-Remaining: 45`
  - `X-RateLimit-Reset: 1706974800`

---

## Best Practices

### 1. Store Tokens Securely

**✅ Good:**
- Store in httpOnly cookies (web)
- Store in secure storage (mobile)
- Never log tokens

**❌ Bad:**
- LocalStorage (vulnerable to XSS)
- Plain text files
- Hard-coded in code

### 2. Handle Token Expiration

Tokens expire after 30 minutes. Implement refresh logic or re-authenticate.

```javascript
// Pseudocode
if (response.status === 401 && error.error_code === 'TOKEN_EXPIRED') {
  // Redirect to login
  redirectToLogin();
}
```

### 3. Validate Input Client-Side

Validate before sending:
- Email format
- Password strength (min 8 chars, uppercase, number)
- Amount > 0
- Date in future

### 4. Use Appropriate HTTP Methods

- `GET` - Retrieve data
- `POST` - Create new resource
- `PATCH` - Partial update
- `DELETE` - Remove/cancel resource

---

## Interactive API Documentation

The best way to explore the API is through the **interactive Swagger UI**:

**URL:** `http://127.0.0.1:8000/docs`

Features:
- Try out endpoints directly
- See request/response examples
- View schema definitions
- Test authentication

**Alternative:** ReDoc at `http://127.0.0.1:8000/redoc`

---

## Support

For API issues:
- Check error codes and details carefully
- Review [Development Guide](./DEVELOPMENT.md) for setup issues
- Check [GitHub Issues](https://github.com/your-org/fincred/issues)
- Contact: support@fincred.com

---

Happy coding! 🚀
