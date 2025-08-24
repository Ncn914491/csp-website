import React from 'react';
import { NavLink } from 'react-router-dom';
import weeksData from '../data/weeks';

function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <aside 
      className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-30 md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Sidebar"
    >
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">CSP Project</h2>
          <button 
            onClick={() => toggleSidebar(false)}
            className="md:hidden text-gray-400 hover:text-white focus:outline-none"
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
            onClick={() => toggleSidebar(false)}
          >
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </NavLink>
          
          <NavLink
            to="/career-guidance"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
            onClick={() => toggleSidebar(false)}
          >
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Career Guidance
          </NavLink>
          
          <div className="px-3 pt-4 pb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Weekly Reports
            </h3>
          </div>
          
          {weeksData.map((week) => (
            <NavLink
              key={week.id}
              to={`/week/${week.id}`}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
              onClick={() => toggleSidebar(false)}
            >
              <span className="w-6 h-6 mr-3 inline-flex items-center justify-center">
                {String(week.id).replace('week', '')}
              </span>
              {week.title}
            </NavLink>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Community Service Project © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
