# Backend Setup Instructions

## Dependencies
All required dependencies are already installed:
- mongoose
- express
- cors
- dotenv

## Environment Configuration
1. Copy `.env.template` to `.env`
2. Update `MONGO_URL` with your MongoDB connection string
3. Set other environment variables as needed

## Running the Backend
```bash
# Start the server
node server.js

# Or for development with auto-restart
npm run dev
```

## Testing MongoDB Connection
Once the server is running, test the MongoDB connection by visiting:
- **Browser**: http://localhost:5000/api/test
- **Postman**: GET http://localhost:5000/api/test

Expected response:
```json
{
  "message": "MongoDB connection successful"
}
```

## Server Output
When starting successfully, you should see:
```
MongoDB connected successfully
Server running on port 5000
Test MongoDB connection at: http://localhost:5000/api/test
```