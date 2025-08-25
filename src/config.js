// Use Vercel domain in production, localhost for development
export const API_URL = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_VERCEL_URL || window.location.origin
  : import.meta.env.VITE_API_URL || "http://localhost:5000/api";
