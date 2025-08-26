import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SessionExpiredModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLoginRedirect = () => {
    logout();
    onClose();
    navigate('/auth');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Session Expired
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Your session has expired for security reasons. Please log in again to continue.
          </p>
          
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleLoginRedirect}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Log In Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;