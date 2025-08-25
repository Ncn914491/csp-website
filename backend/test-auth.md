# JWT Authentication Testing Guide

## Setup Instructions

1. **Install dependencies** (if not already done):
   ```bash
   cd backend
   npm install
   ```

2. **Update .env file**:
   - Replace `<db_password>` in MONGO_URL with your actual MongoDB password
   - Set JWT_SECRET to a secure random string (e.g., `JWT_SECRET=mySecretKey123!@#`)

3. **Start the backend server**:
   ```bash
   node server.js
   ```
   
   You should see:
   ```
   MongoDB connected successfully
   Server is running on port 5000
   ```

## API Testing

### 1. Test API Connection
```bash
curl http://localhost:5000/api/test
```
Expected response:
```json
{"message": "API working!"}
```

### 2. Register a New User
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "role": "student"
  }'
```

Expected response:
```json
{
  "message": "User created successfully",
  "user": {
    "id": "...",
    "username": "testuser",
    "role": "student",
    "createdAt": "..."
  }
}
```

### 3. Register an Admin User
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": "admin"
  }'
```

### 4. Login to Get JWT Token
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "testuser",
    "role": "student"
  }
}
```

**Save the token from the response for the next step!**

### 5. Access Protected Route
Replace `YOUR_JWT_TOKEN` with the actual token from step 4:

```bash
curl -X GET http://localhost:5000/api/protected \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "message": "Protected route accessed successfully",
  "user": {
    "id": "...",
    "username": "testuser",
    "role": "student",
    "accessTime": "2024-01-01T12:00:00.000Z"
  }
}
```

### 6. Test Invalid Token
```bash
curl -X GET http://localhost:5000/api/protected \
  -H "Authorization: Bearer invalid_token"
```

Expected response:
```json
{"message": "Invalid token"}
```

### 7. Test No Token
```bash
curl -X GET http://localhost:5000/api/protected
```

Expected response:
```json
{"message": "No token provided, authorization denied"}
```

## Using Postman or Thunder Client

### Register User
- **Method**: POST
- **URL**: `http://localhost:5000/api/register`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
  ```json
  {
    "username": "testuser",
    "password": "password123",
    "role": "student"
  }
  ```

### Login
- **Method**: POST
- **URL**: `http://localhost:5000/api/login`
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
  ```json
  {
    "username": "testuser",
    "password": "password123"
  }
  ```

### Access Protected Route
- **Method**: GET
- **URL**: `http://localhost:5000/api/protected`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer YOUR_JWT_TOKEN`

## Error Scenarios to Test

1. **Register with existing username**:
   - Try registering the same username twice
   - Should return: `{"message": "User already exists with this username"}`

2. **Login with wrong password**:
   - Use correct username but wrong password
   - Should return: `{"message": "Invalid credentials"}`

3. **Login with non-existent user**:
   - Use a username that doesn't exist
   - Should return: `{"message": "Invalid credentials"}`

4. **Access protected route without token**:
   - Don't include Authorization header
   - Should return: `{"message": "No token provided, authorization denied"}`

5. **Access protected route with expired token**:
   - Wait 1 hour after login and try to access protected route
   - Should return: `{"message": "Token expired"}`

## Available Routes

- `GET /api/test` - Test API connection
- `POST /api/register` - Register new user
- `POST /api/login` - Login and get JWT token
- `GET /api/protected` - Protected route (requires JWT)

## JWT Token Structure

The JWT token contains:
```json
{
  "userId": "user_id_from_database",
  "username": "username",
  "role": "student_or_admin",
  "iat": 1234567890,
  "exp": 1234571490
}
```

Token expires in 1 hour from creation time.