import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Main from './pages/Main';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import CareerGuidance from './pages/CareerGuidance';
import ScrollToTop from './components/ScrollToTop';
import AskAI from './components/AskAI';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/career-guidance" element={<CareerGuidance />} />
        </Routes>
        
        {/* AskAI Chatbot */}
        <AskAI />
      </div>
    </AuthProvider>
  );
}

export default App;
