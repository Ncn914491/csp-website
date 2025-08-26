import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SessionExpiredModal from './components/SessionExpiredModal';
import Main from './pages/Main';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import CareerGuidance from './pages/CareerGuidance';
import ScrollToTop from './components/ScrollToTop';
import AskAI from './components/AskAI';
import Sidebar from './components/Sidebar';
import WeekView from './components/WeekView';
import Groups from './pages/Groups';

function ChatbotFullView() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AskAI Career Assistant</h1>
        <p className="text-gray-600">Get personalized career guidance, exam preparation tips, and college admission advice</p>
      </div>
      <AskAI isFullView={true} />
    </div>
  );
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const { sessionExpired } = useAuth();

  // Show session expired modal when session expires
  React.useEffect(() => {
    if (sessionExpired) {
      setSessionModalOpen(true);
    }
  }, [sessionExpired]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ScrollToTop />
      
      {/* Session expired modal */}
      <SessionExpiredModal 
        isOpen={sessionModalOpen} 
        onClose={() => setSessionModalOpen(false)} 
      />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} toggleSidebar={setSidebarOpen} />
      <div className="flex-1">
        {/* Mobile hamburger menu */}
        <div className="md:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
              aria-label="Open main menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">CSP Project</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/career-guidance" 
            element={
              <ProtectedRoute>
                <CareerGuidance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/weekly-visits" 
            element={
              <ProtectedRoute>
                <WeekView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chatbot" 
            element={
              <ProtectedRoute>
                <ChatbotFullView />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups" 
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            } 
          />
        </Routes>
        {/* Floating AskAI widget present site-wide */}
        <AskAI />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
