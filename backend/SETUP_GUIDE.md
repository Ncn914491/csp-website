# Backend Setup and Testing Guide

## 📋 Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git (optional)

## 🚀 Setup Instructions

### 1. Install Dependencies
All required dependencies are already installed, but you can run this command to ensure everything is up to date:

```bash
cd backend
npm install express mongoose cors dotenv bcryptjs jsonwebtoken
```

**Dependencies installed:**
- `express` - Web framework for Node.js
- `mongoose` - MongoDB object modeling for Node.js
- `cors` - Cross-Origin Resource Sharing middleware
- `dotenv` - Environment variable loader
- `bcryptjs` - Password hashing library
- `jsonwebtoken` - JWT token creation and verification

### 2. Configure Environment Variables

The `.env` file in the backend folder contains:

```env
PORT=5000
MONGO_URL=mongodb+srv://Ncn_381920:<db_password>@cluster0.jycikbr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_random_jwt_secret
GEMINI_API_KEY=your_gemini_api_key_here
```

**Required Updates:**
1. **MONGO_URL**: Replace `<db_password>` with your actual MongoDB Atlas password
2. **JWT_SECRET**: Replace with a secure random string (e.g., `mySecretKey123!@#$`)

**Example of properly configured .env:**
```env
PORT=5000
MONGO_URL=mongodb+srv://Ncn_381920:myActualPassword123@cluster0.jycikbr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=mySecretKey123!@#$
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start the Backend Server

```bash
cd backend
node server.js
```

**Expected Output:**
```
MongoDB connected successfully
Server running on port 5000
Test MongoDB connection at: http://localhost:5000/api/test
```

**If you see connection errors:**
- Check that your MongoDB password is correct in the MONGO_URL
- Ensure your IP address is whitelisted in MongoDB Atlas
- Verify your internet connection

## 🧪 Testing MongoDB Connection

### Method 1: Browser
Open your web browser and navigate to:
```
http://localhost:5000/api/test
```

**Expected Response:**
```json
{
  "message": "MongoDB connection successful"
}
```

### Method 2: Postman
1. Open Postman
2. Create a new GET request
3. Set URL to: `http://localhost:5000/api/test`
4. Click "Send"

### Method 3: curl (Command Line)
```bash
curl http://localhost:5000/api/test
```

### Method 4: Thunder Client (VS Code Extension)
1. Install Thunder Client extension in VS Code
2. Create new request
3. Method: GET
4. URL: `http://localhost:5000/api/test`
5. Send request

## 📊 Server Features

### Core Middleware
- ✅ **CORS enabled** - Allows cross-origin requests
- ✅ **JSON parsing** - Handles JSON request bodies
- ✅ **Environment variables** - Configured with dotenv
- ✅ **Error handling** - Global error handling middleware

### Database Connection
- ✅ **MongoDB connection** - Using Mongoose ODM
- ✅ **Connection logging** - Success and error messages
- ✅ **Graceful error handling** - Server exits on connection failure

### Available Routes
- `GET /api/test` - Test MongoDB connection
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/protected` - Protected route (requires JWT)
- `GET /api/visits` - School visits
- `GET /api/weeks` - Weekly updates
- `GET /api/resources` - Career resources
- `POST /api/ai` - AI assistant endpoint

## 🔧 Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
```
MongoDB connection error: bad auth : authentication failed
```
**Solution:** Check your MongoDB password in the MONGO_URL

**2. Server Won't Start**
```
Error: Cannot find module 'express'
```
**Solution:** Run `npm install` in the backend directory

**3. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** 
- Kill the process using port 5000, or
- Change PORT in .env file to a different number (e.g., 3001)

**4. Environment Variables Not Loading**
```
MongoDB connection error: Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"
```
**Solution:** Ensure .env file is in the backend directory and properly formatted

### Verification Checklist
- [ ] All dependencies installed (`npm install` completed successfully)
- [ ] .env file exists in backend directory
- [ ] MONGO_URL contains actual password (not `<db_password>`)
- [ ] JWT_SECRET is set to a secure string
- [ ] Server starts without errors
- [ ] `/api/test` returns success message
- [ ] MongoDB connection logs "MongoDB connected successfully"

## 🎯 Next Steps

Once the MongoDB connection is working:

1. **Test Authentication:**
   - Register a user: `POST /api/register`
   - Login: `POST /api/login`
   - Access protected route: `GET /api/protected`

2. **Test Other APIs:**
   - Create school visits, weekly updates, resources
   - Test the AI assistant endpoint

3. **Frontend Integration:**
   - Start the React frontend
   - Test full-stack functionality

## 📝 Server Configuration Summary

The server.js file includes:
- ✅ Express app setup with CORS and JSON middleware
- ✅ MongoDB connection with error handling
- ✅ Test route for connection verification
- ✅ All API routes properly configured
- ✅ Global error handling
- ✅ Detailed logging for debugging

Your backend is now ready for development and testing!