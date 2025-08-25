# Deployment Guide for CSP Website

## Vercel Deployment Setup

### Prerequisites
1. Vercel account
2. MongoDB Atlas database (or other MongoDB instance)
3. Environment variables configured

### Environment Variables
Set the following environment variables in your Vercel dashboard:

**Backend/Server Variables (keep secret):**
```
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret  
GEMINI_API_KEY=your_google_gemini_api_key
NODE_ENV=production
```

**Frontend Variables (safe to expose):**
```
VITE_API_URL=/api
VITE_VERCEL_URL=https://your-domain.vercel.app
```

### Deployment Steps

1. **Connect Repository to Vercel**
   - Import your GitHub repository to Vercel
   - Vercel will auto-detect it as a Vite project

2. **Configure Build Settings**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all required variables listed above

4. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - First deployment may take 2-3 minutes

### File Structure for Deployment
```
├── api/
│   └── index.js          # Serverless function entry point
├── backend/
│   ├── routes/           # API route handlers
│   ├── models/           # Database models
│   └── middleware/       # Auth and other middleware
├── src/                  # React frontend source
├── vercel.json           # Vercel configuration
└── package.json          # Combined dependencies
```

### API Routes
All backend API routes are accessible at:
- Production: `https://your-domain.vercel.app/api/*`
- Development: `http://localhost:5000/api/*`

### Troubleshooting

1. **Build Failures**
   - Check that all dependencies are in the main `package.json`
   - Verify environment variables are set correctly

2. **API Connection Issues**
   - Ensure MongoDB connection string is correct
   - Check that JWT_SECRET is set in production

3. **Serverless Function Timeout**
   - Functions timeout after 30 seconds (configured in vercel.json)
   - Optimize database queries if needed

### Local Development
```bash
# Install dependencies
npm install

# Start development servers
npm run dev          # Frontend only
npm run start        # Both frontend and backend
```

### Production Testing
After deployment, test these endpoints:
- `GET /api/test` - MongoDB connection test
- `GET /api/visits` - School visits data
- `GET /api/weeks` - Weekly updates
- `POST /api/login` - Authentication
