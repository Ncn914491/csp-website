import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { motion } from 'framer-motion';

function Main() {
  const [schoolVisits, setSchoolVisits] = useState([]);
  const [weeklyUpdates, setWeeklyUpdates] = useState([]);
  const [resources, setResources] = useState([]);
  const [expandedBoxes, setExpandedBoxes] = useState({});
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [visitsData, weeksData, resourcesData] = await Promise.all([
        api.getVisits(),
        api.getWeeks(),
        api.getResources()
      ]);

      setSchoolVisits(visitsData);
      setWeeklyUpdates(weeksData);
      setResources(resourcesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const toggleBox = (boxId) => {
    setExpandedBoxes(prev => ({
      ...prev,
      [boxId]: !prev[boxId]
    }));
  };

  const statisticsData = [
    {
      id: 'schools',
      title: 'Schools Visited',
      count: schoolVisits.length || '5+',
      color: 'from-blue-400 to-blue-600',
      icon: '🏫',
      details: schoolVisits.map(visit => ({
        name: visit.title,
        date: new Date(visit.date).toLocaleDateString(),
        description: visit.description
      }))
    },
    {
      id: 'members',
      title: 'Team Members',
      count: '11',
      color: 'from-purple-400 to-purple-600',
      icon: '👥',
      details: [
        { name: 'Project Lead', role: 'Coordination & Strategy' },
        { name: 'Content Team (3)', role: 'Material Development' },
        { name: 'Outreach Team (4)', role: 'School Coordination' },
        { name: 'Technical Team (3)', role: 'Platform Development' }
      ]
    },
    {
      id: 'visits',
      title: 'Total Visits',
      count: '15+',
      color: 'from-green-400 to-green-600',
      icon: '📍',
      details: [
        { name: 'January 2024', count: '5 visits' },
        { name: 'February 2024', count: '7 visits' },
        { name: 'March 2024', count: '3 visits' }
      ]
    },
    {
      id: 'students',
      title: 'Students Reached',
      count: '1000+',
      color: 'from-orange-400 to-orange-600',
      icon: '🎓',
      details: [
        { name: 'Class 10', count: '300 students' },
        { name: 'Class 11', count: '400 students' },
        { name: 'Class 12', count: '300+ students' }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/30 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Career Guidance Portal
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, {user.username}
                  </span>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
                    >
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:shadow-lg transform hover:scale-105 transition-all font-medium"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Animation */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Empowering Students for
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Better Futures</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive career guidance program reaching schools across the region with expert counseling and resources
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statisticsData.map((stat) => (
            <div key={stat.id} className="relative group">
              {/* Glass Card */}
              <div className="backdrop-blur-lg bg-white/60 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 rounded-2xl`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl">{stat.icon}</span>
                    <button
                      onClick={() => toggleBox(stat.id)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <svg className={`w-6 h-6 transform transition-transform ${expandedBoxes[stat.id] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  <h3 className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                    {stat.count}
                  </h3>
                  <p className="text-gray-700 font-medium">{stat.title}</p>
                  
                  {/* Dropdown Details */}
                  {expandedBoxes[stat.id] && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 animate-fade-in">
                      {stat.details.map((detail, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="font-medium text-gray-700">{detail.name}</div>
                          <div className="text-gray-500">
                            {detail.date || detail.role || detail.count}
                          </div>
                          {detail.description && (
                            <div className="text-gray-500 text-xs mt-1">{detail.description.substring(0, 100)}...</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Reports Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Weekly Progress Reports
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weeklyUpdates.map((week) => (
            <div
              key={week._id}
              onClick={() => setSelectedWeek(week)}
              className="backdrop-blur-lg bg-white/60 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Week {week.weekNumber}</h3>
                <span className="text-2xl">📅</span>
              </div>
              
              <p className="text-gray-600 mb-2 font-medium">{week.summary || week.highlights}</p>
              <p className="text-sm text-gray-500">{week.activities.substring(0, 100)}...</p>
              
              {week.photoGallery && week.photoGallery.length > 0 && (
                <div className="mt-4 flex gap-2">
                  {week.photoGallery.slice(0, 3).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo.url}
                      alt={photo.caption}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ))}
                  {week.photoGallery.length > 3 && (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-sm">
                      +{week.photoGallery.length - 3}
                    </div>
                  )}
                </div>
              )}
              
              <button className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Full Report →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Week Modal */}
      {selectedWeek && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedWeek(null)}>
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Week {selectedWeek.weekNumber} Report</h2>
                <button
                  onClick={() => setSelectedWeek(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Summary</h3>
                  <p className="text-gray-600">{selectedWeek.summary || selectedWeek.highlights}</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Activities</h3>
                  <p className="text-gray-600">{selectedWeek.activities}</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Highlights</h3>
                  <p className="text-gray-600">{selectedWeek.highlights}</p>
                </div>
                
                {selectedWeek.photoGallery && selectedWeek.photoGallery.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Photo Gallery</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedWeek.photoGallery.map((photo, idx) => (
                        <div key={idx} className="group relative">
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-48 object-cover rounded-lg shadow-lg"
                          />
                          {photo.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-sm">{photo.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default Main;
