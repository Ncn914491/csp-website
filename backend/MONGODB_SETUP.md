# MongoDB Setup Guide

## Current Status

The project is configured with MongoDB Atlas but requires IP whitelisting to connect. The application has fallback mechanisms to use local data when MongoDB is unavailable.

## Environment Variables Setup

The `.env` file is already configured with:
```
MONGO_URL=mongodb+srv://Ncn_381920:Ncn914491@cluster0.jycikbr.mongodb.net/cspDB
JWT_SECRET=csp_secure_jwt_secret_key_2024_career_guidance_project_random_string_12345
```

## MongoDB Atlas Connection

To connect to MongoDB Atlas:

1. **Whitelist Your IP Address:**
   - Go to MongoDB Atlas dashboard
   - Navigate to Network Access
   - Add your current IP address to the whitelist
   - Or add `0.0.0.0/0` for access from anywhere (less secure)

2. **Verify Connection:**
   ```bash
   node test/dbTest.js
   ```

3. **Seed the Database:**
   ```bash
   node seed.js
   ```

## Database Schema

### Models Created:
- **User**: name, email, password (hashed), role (student/admin)
- **SchoolVisit**: title, date, description, images (array of URLs)
- **WeeklyUpdate**: weekNumber, activities, highlights, gallery (array of URLs), report (PDF URL)
- **Resource**: title, type (PDF/Video/Article), url, tags

## Sample Data

The seed script will create:
- 2 sample users (admin and student)
- School visits from images in `/public/csp/week*` folders
- Weekly updates for each week folder found
- Resources from PDF files in week folders and `career.pdf`

## API Endpoints

All endpoints are working with fallback to local data:

- `GET /api/visits` - Get all school visits
- `GET /api/weeks` - Get all weekly updates  
- `GET /api/resources` - Get all resources
- `GET /api/users/me` - Get current user (protected)

## Testing

Run the database test to verify connectivity:
```bash
cd backend
node test/dbTest.js
```

## Fallback Behavior

If MongoDB connection fails, the application automatically falls back to local data stored in `local-data.js`, ensuring the frontend continues to work during development.