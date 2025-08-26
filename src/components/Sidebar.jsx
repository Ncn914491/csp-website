import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Sidebar({ isOpen, toggleSidebar }) {
  const { user, isAdmin, logout } = useAuth();
  const sidebarRef = useRef(null);
  const firstFocusableRef = useRef(null);

  // Handle keyboard navigation and focus management
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        toggleSidebar(false);
      }
    };

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
        toggleSidebar(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      // Focus the first focusable element when sidebar opens
      setTimeout(() => {
        if (firstFocusableRef.current) {
          firstFocusableRef.current.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, toggleSidebar]);

  const handleNavClick = () => {
    toggleSidebar(false);
  };

  const handleLogout = () => {
    logout();
    toggleSidebar(false);
  };

  return (
    <aside 
      ref={sidebarRef}
      className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-30 md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Main navigation"
      role="navigation"
    >
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">CSP Project</h2>
          <button 
            ref={firstFocusableRef}
            onClick={() => toggleSidebar(false)}
            className="md:hidden text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 rounded-md p-1"
            aria-label="Close sidebar"
            tabIndex={isOpen ? 0 : -1}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1" role="navigation" aria-label="Main navigation">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
            onClick={handleNavClick}
            tabIndex={isOpen ? 0 : -1}
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
          >
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </NavLink>

          <NavLink
            to="/career-guidance"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
            onClick={handleNavClick}
            tabIndex={isOpen ? 0 : -1}
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
          >
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Career Guidance
          </NavLink>

          <NavLink
            to="/weekly-visits"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
            onClick={handleNavClick}
            tabIndex={isOpen ? 0 : -1}
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
          >
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-6H3v6a2 2 0 002 2z" />
            </svg>
            Weekly Visits
          </NavLink>

          <NavLink
            to="/chatbot"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
            onClick={handleNavClick}
            tabIndex={isOpen ? 0 : -1}
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
          >
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v7a2 2 0 01-2 2h-6l-4 3v-3H7a2 2 0 01-2-2v-2" />
            </svg>
            Chatbot Full View
          </NavLink>

          <NavLink
            to="/groups"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
            onClick={handleNavClick}
            tabIndex={isOpen ? 0 : -1}
            aria-current={({ isActive }) => isActive ? 'page' : undefined}
          >
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 11a4 4 0 10-8 0 4 4 0 008 0zm6 0a4 4 0 10-8 0 4 4 0 008 0z" />
            </svg>
            Groups
          </NavLink>

          {/* Admin-only navigation items */}
          {isAdmin() && (
            <>
              <div className="border-t border-gray-700 my-2 pt-2">
                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Admin
                </p>
              </div>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
                onClick={handleNavClick}
                tabIndex={isOpen ? 0 : -1}
                aria-current={({ isActive }) => isActive ? 'page' : undefined}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Dashboard
              </NavLink>
            </>
          )}
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          {user && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
                tabIndex={isOpen ? 0 : -1}
              >
                <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400">
            Community Service Project © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
