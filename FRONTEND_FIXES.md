# Frontend Environment Variable Fixes

## Issue Resolved
Fixed `Uncaught ReferenceError: process is not defined at config.js:1` error in React frontend.

## Root Cause
The frontend was using `process.env` which is not available in browser environments. Since this is a **Vite** project, it should use `import.meta.env` instead.

## Changes Made

### 1. Updated `src/config.js`
```javascript
// Before (broken):
export const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_VERCEL_URL || window.location.origin
  : process.env.REACT_APP_API_URL || "http://localhost:5000";

// After (fixed):
export const API_URL = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_VERCEL_URL || window.location.origin
  : import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

### 2. Updated Environment Variables
- **Frontend `.env`**: Changed from `REACT_APP_*` to `VITE_*` prefix
- **Frontend variables** (safe to expose to browser):
  - `VITE_API_URL=http://localhost:5000/api`
  - `VITE_VERCEL_URL=https://your-domain.vercel.app`

### 3. Updated `.env.example`
Separated frontend and backend environment variables with clear security comments.

### 4. Fixed API Calls
- **Fixed double `/api` prefix issue** in `src/utils/api.js`
- **Updated AskAI component** to use `API_URL` from config instead of hardcoded URL

### 5. Security Improvements
- **Removed GEMINI_API_KEY from frontend** - it was being exposed via vite.config.js
- **Ensured sensitive data stays backend-only**: JWT_SECRET, MongoDB credentials, API keys

### 6. Deployment Configuration
- **Updated vercel.json**: Fixed build output directory from `build` to `dist` for Vite
- **Updated deployment guide**: Documented proper environment variable setup for Vercel

## Framework Detection Summary
✅ **Framework**: Vite (confirmed by `vite.config.js` and `"dev": "vite"` script)  
✅ **Environment Variables**: Using `import.meta.env.VITE_*` (Vite standard)  
✅ **Build Output**: `dist/` folder (Vite default)  
✅ **Security**: Sensitive keys kept server-side only  

## Testing Results
✅ **Dev Server**: Starts without errors on `http://localhost:3000/`  
✅ **Build**: Completes successfully with optimized assets  
✅ **API Integration**: All API calls use dynamic URL configuration  
✅ **Deployment Ready**: Vercel configuration updated for Vite

## Next Steps
The frontend now properly loads without the `process is not defined` error and is ready for both development and production deployment on Vercel.
