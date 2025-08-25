# MERN CSP Website Setup Instructions

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment is already configured** - `.env` file contains:
   - MongoDB connection string
   - JWT secret
   - Gemini API key

4. **Seed the database:**
   ```bash
   node seed.js
   ```

5. **Start the backend server:**
   ```bash
   node server.js
   ```
   
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to project root:**
   ```bash
   cd ..
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend:**
   ```bash
   npm start
   ```
   
   Frontend will run on `http://localhost:5173`

## 🧪 Testing

### Test Backend API Endpoints

With the backend server running, test the endpoints:

```bash
# In backend directory
node test-endpoints.js
```

Or manually test in browser/Postman:
- GET `http://localhost:5000/api/visits` - School visits
- GET `http://localhost:5000/api/weeks` - Weekly updates  
- GET `http://localhost:5000/api/resources` - Resources
- GET `http://localhost:5000/api/test` - MongoDB connection test

### Test Frontend Features

1. **AI Chat Widget:**
   - Click the chat icon (bottom right)
   - Send a career-related message
   - Verify response from Gemini AI

2. **Data Display:**
   - Check if school visits are displayed
   - Verify weekly updates are shown
   - Confirm resources are loaded

## 📊 Database Collections

The seeding script populates:

### SchoolVisit Collection
- 5 school visits with images from `/csp/week1-5/` folders
- Each visit has title, date, description, and image arrays

### WeeklyUpdate Collection  
- 5 weekly updates with activities and highlights
- Week numbers 1-5 with comprehensive descriptions

### Resource Collection
- 5 PDF resources from CSP weeks
- Career guidance manual
- Proper categorization with tags

## 🤖 AI Chat Features

### Updated Chatbot Component
- **Custom Icons:** Uses `/chatbot-icon.svg` instead of React icons
- **Backend Integration:** Connects to `/api/ai` endpoint (not direct Gemini API)
- **Icon Buttons:** Minimize/maximize/close use emoji icons
- **Loading States:** Shows typing indicator during API calls
- **Error Handling:** Graceful fallback for API failures

### AI Route (`/api/ai`)
- Integrates with Gemini API using environment variable
- Career guidance system prompt
- Proper error handling and response formatting

## 🔧 Troubleshooting

### Backend Issues
- Ensure MongoDB connection string is correct in `.env`
- Verify Gemini API key is valid
- Check if port 5000 is available

### Frontend Issues  
- Ensure backend is running on port 5000
- Check browser console for API errors
- Verify React dev server is on port 5173

### Database Issues
- Run `node seed.js` to repopulate data
- Check MongoDB Atlas connection
- Verify network access in MongoDB Atlas

## 📁 Project Structure

```
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   ├── seed.js          # Database seeding
│   └── server.js        # Main server
├── src/
│   ├── components/      # React components
│   │   ├── Chatbot.jsx  # Updated AI chat widget
│   │   └── Chatbot.css  # Chat styling with animations
│   ├── utils/api.js     # API utility functions
│   └── pages/           # Page components
└── public/csp/          # CSP data (images, PDFs)
```

## ✅ Success Indicators

- Backend: "MongoDB connected successfully" + "Server running on port 5000"
- Database: Seeding script shows "✅ Database seeded successfully!"
- API Test: All endpoints return data arrays
- Frontend: Chat widget loads with custom icon
- AI: Chat responses come from Gemini API via backend