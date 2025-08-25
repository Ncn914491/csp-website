# Career Guidance MERN Stack Application

A comprehensive career guidance platform built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring school visits, weekly updates, resources, and an AI-powered chat assistant.

## Features

### Backend (Node.js + Express + MongoDB)
- **Authentication**: JWT-based authentication with admin/student roles
- **School Visits**: CRUD operations for managing school visit records
- **Weekly Updates**: Track weekly activities and highlights
- **Resources**: Manage career guidance resources (PDFs, Videos, Articles)
- **AI Assistant**: Integration endpoint for Gemini AI API
- **Security**: Password hashing with bcryptjs, protected admin routes

### Frontend (React)
- **Responsive Design**: Mobile-first responsive interface
- **Dynamic Content**: Fetches data from backend APIs
- **AI Chat Widget**: Interactive chat interface for career guidance
- **Admin Dashboard**: Content management interface for admins
- **Authentication**: Login/logout functionality with context management

## Project Structure

```
├── backend/                 # Node.js Express backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication middleware
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── utils/             # Utility functions
│   └── config.js          # API configuration
└── README.md              # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account or local MongoDB installation
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy the `.env` file in the backend directory
   - Replace `<db_password>` in `MONGO_URL` with your actual MongoDB password
   - Set `JWT_SECRET` to a secure random string
   - Add your `GEMINI_API_KEY` for AI functionality

4. **Start the backend server:**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to project root:**
   ```bash
   cd ..
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - The `.env` file is already configured for local development
   - For production, update `REACT_APP_API_URL` to your backend URL

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user (protected)

### School Visits
- `GET /api/visits` - Get all visits
- `GET /api/visits/:id` - Get single visit
- `POST /api/visits` - Create visit (admin only)
- `PUT /api/visits/:id` - Update visit (admin only)
- `DELETE /api/visits/:id` - Delete visit (admin only)

### Weekly Updates
- `GET /api/weeks` - Get all weekly updates
- `GET /api/weeks/:id` - Get single update
- `POST /api/weeks` - Create update (admin only)
- `PUT /api/weeks/:id` - Update weekly update (admin only)
- `DELETE /api/weeks/:id` - Delete update (admin only)

### Resources
- `GET /api/resources` - Get all resources (with optional filtering)
- `GET /api/resources/:id` - Get single resource
- `POST /api/resources` - Create resource (admin only)
- `PUT /api/resources/:id` - Update resource (admin only)
- `DELETE /api/resources/:id` - Delete resource (admin only)

### AI Assistant
- `POST /api/ai` - Send message to AI assistant

## Usage

### For Students
1. Visit the homepage to view recent school visits and weekly updates
2. Navigate to the Career Guidance page for comprehensive career information
3. Use the AI chat widget for personalized career guidance
4. Browse resources filtered by type (PDF, Video, Article)

### For Admins
1. Access the admin login at `/admin/login`
2. Use the admin dashboard at `/admin` to:
   - Manage school visits
   - Create and edit weekly updates
   - Add career guidance resources
   - View content statistics

## Database Models

### SchoolVisit
```javascript
{
  title: String (required),
  date: Date (required),
  description: String (required),
  images: [String] (optional)
}
```

### WeeklyUpdate
```javascript
{
  weekNumber: Number (required, unique),
  activities: String (required),
  highlights: String (required)
}
```

### Resource
```javascript
{
  title: String (required),
  type: String (required, enum: ['PDF', 'Video', 'Article']),
  url: String (required),
  tags: [String]
}
```

### User
```javascript
{
  username: String (required, unique),
  passwordHash: String (required),
  role: String (required, enum: ['admin', 'student'], default: 'student')
}
```

## Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Context API** - State management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support or questions, please open an issue in the GitHub repository.