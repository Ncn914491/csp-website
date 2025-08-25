# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a MERN stack Career Guidance application with a React frontend using Vite and a Node.js/Express backend with MongoDB. The application features school visits tracking, weekly updates, resources management, and an AI-powered chat assistant using the Gemini API.

## Essential Commands

### Frontend Development (React + Vite)
```bash
# Install frontend dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Backend Development (Node.js + Express)
```bash
# Navigate to backend
cd backend

# Install backend dependencies
npm install

# Start server (runs on http://localhost:5000)
npm start

# Start with auto-restart (development mode)
npm run dev

# Seed database with initial data
node seed.js

# Test MongoDB connection
node test-connection.js

# Test API endpoints
node test-endpoints.js
```

### Environment Setup
1. **Backend** - Copy `backend/.env.template` to `backend/.env` and configure:
   - `MONGO_URL` - MongoDB connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `GEMINI_API_KEY` - API key for AI chat functionality
   - `PORT` - Server port (default: 5000)

2. **Frontend** - Uses `.env` file in root:
   - `GEMINI_API_KEY` - For client-side AI features (if any)

## Architecture Overview

### Backend Architecture (`/backend`)

**Core Server** (`server.js`)
- Express server with CORS enabled
- MongoDB connection via Mongoose
- JWT-based authentication middleware
- Error handling and 404 catch-all

**API Routes Structure**
- `/api/visits` - School visits CRUD (admin protected for write operations)
- `/api/weeks` - Weekly updates management
- `/api/resources` - Career guidance resources (PDFs, videos, articles)
- `/api/users` - User registration and profile
- `/api/auth` - Login/logout endpoints
- `/api/ai` - Gemini AI integration endpoint

**Authentication Flow**
- JWT tokens stored in localStorage on frontend
- `middleware/auth.js` protects admin routes
- Roles: `admin` (full access) and `student` (read access)

**Data Models** (`/backend/models`)
- `User` - Authentication with bcrypt password hashing
- `SchoolVisit` - Title, date, description, images array
- `WeeklyUpdate` - Week number, activities, highlights
- `Resource` - Title, type (PDF/Video/Article), URL, tags

### Frontend Architecture (`/src`)

**Routing Structure** (`App.jsx`)
- `/` - Home page with school visits and weekly updates
- `/week/:weekId` - Individual week details
- `/career-guidance` - Career guidance resources
- `/admin/login` - Admin authentication
- `/admin` - Admin dashboard for content management

**Key Components**
- `Sidebar` - Navigation with responsive behavior
- `AIChat` - Floating chat widget for AI assistance
- `AuthContext` - Authentication state management
- `ErrorBoundary` - Error handling wrapper
- `LoadingSpinner` - Consistent loading states

**API Integration** (`src/utils/api.js` & `src/config.js`)
- Centralized API configuration
- Token management for authenticated requests
- Error handling for API calls

**Responsive Design**
- Mobile-first approach with Tailwind CSS
- Sidebar collapses on mobile
- Responsive wrapper components

## Development Workflow

### Adding New Features
1. **Backend**: Create model → Add route → Update server.js
2. **Frontend**: Create component → Add route in App.jsx → Connect to API
3. **Admin features**: Protect routes with auth middleware

### Database Operations
- MongoDB with Mongoose ODM
- Connection string in `MONGO_URL` environment variable
- Seed script available for initial data (`backend/seed.js`)

### Build & Deployment
- Frontend builds to `/dist` directory
- Backend runs directly via Node.js
- Vite configuration includes chunk splitting for optimization

## Key Technologies

**Frontend Stack**
- React 18 with React Router v6
- Vite for build tooling
- Tailwind CSS for styling
- Swiper for carousels
- React Icons for UI icons

**Backend Stack**
- Express.js web framework
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests
- Gemini API for AI features

## Testing & Development Tools
- ESLint configuration for code quality
- Nodemon for backend auto-restart in development
- Vite HMR for frontend hot module replacement
- Test endpoints script for API validation

## Important Notes
- Admin credentials should be created via the registration endpoint with role set to 'admin'
- AI chat requires valid Gemini API key in backend `.env`
- Frontend runs on port 3000, backend on port 5000 by default
- CORS is configured to allow all origins in development
