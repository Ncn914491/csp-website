// Use production API URL or localhost for development
export const API_URL = import.meta.env.MODE === 'production' 
  ? (import.meta.env.VITE_API_URL || `${window.location.origin}/api`)
  : (import.meta.env.VITE_API_URL || "http://localhost:5000/api");
