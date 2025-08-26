import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { api } from '../utils/api';
import weeksData from '../data/weeks';

function Home() {
  const [visits, setVisits] = useState([]);
  const [weeklyUpdates, setWeeklyUpdates] = useState([]);
  const [gridfsWeeks, setGridfsWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWeeks: 0,
    totalPhotos: 0,
    totalReports: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [visitsData, weeksData, gridfsData] = await Promise.all([
        api.getVisits().catch(() => []),
        api.getWeeks().catch(() => []),
        fetchGridfsWeeks().catch(() => [])
      ]);
      
      setVisits(visitsData.slice(0, 3)); // Show latest 3 visits
      setWeeklyUpdates(weeksData.slice(0, 3)); // Show latest 3 weeks
      setGridfsWeeks(gridfsData.slice(0, 6)); // Show latest 6 GridFS weeks
      
      // Calculate stats
      const totalPhotos = gridfsData.reduce((sum, week) => sum + (week.photos?.length || 0), 0);
      const totalReports = gridfsData.filter(week => week.reportPdf).length;
      
      setStats({
        totalWeeks: gridfsData.length,
        totalPhotos,
        totalReports
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGridfsWeeks = async () => {
    try {
      const response = await axios.get('/api/gridfs-weeks');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching GridFS weeks:', error);
      return [];
    }
  };

  // Determine the latest week by numeric ordering (fallback to static data)
  const toNumber = (id) => Number(String(id).replace('week', ''));
  const latestWeek = [...weeksData].sort((a, b) => toNumber(b.id) - toNumber(a.id))[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl overflow-hidden mb-12">
        <div className="px-8 py-12 md:py-16 lg:py-20 max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Community Service Project
          </h1>
          <p className="mt-3 text-xl text-blue-100">
            Documenting our journey, sharing our progress, and making a difference in the community.
          </p>
          
          {/* Stats Section */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalWeeks}</div>
              <div className="text-sm text-blue-100">Weeks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalPhotos}</div>
              <div className="text-sm text-blue-100">Photos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.totalReports}</div>
              <div className="text-sm text-blue-100">Reports</div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/weekly-visits"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors duration-200"
            >
              View All Weeks
            </Link>
            <Link
              to="/career-guidance"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-700 bg-opacity-60 hover:bg-opacity-70 transition-colors duration-200"
            >
              Career Guidance
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Week Preview */}
      {latestWeek && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Latest Update</h2>
            <Link to={`/week/${weeksData[0].id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all weeks →
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="md:flex">
              {latestWeek.images && latestWeek.images.length > 0 && (
                <div className="md:flex-shrink-0 md:w-1/3">
                  <img 
                    className="h-48 w-full object-cover md:h-full md:w-96" 
                    src={latestWeek.images[0]} 
                    alt={latestWeek.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e5e7eb"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M21 5v6.59l-3-3.01-4 4.01-4-4-4 4-3-3.01L3 11.59V5h18zm-3 6.42l3 3.01V19H5v-6.07l3 2.98 4-4 4 4 3-3.01z"/></svg>';
                    }}
                  />
                </div>
              )}
              <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold">
                  {latestWeek.title}
                </div>
                <p className="mt-2 text-gray-600 line-clamp-3">
                  {latestWeek.description}
                </p>
                <div className="mt-4">
                  <Link
                    to={`/week/${latestWeek.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Read more →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* School Visits Section */}
      {!loading && visits.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent School Visits</h2>
            <Link to="/school-visits" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all visits →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visits.map((visit) => (
              <div key={visit._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-48 bg-gray-100 overflow-hidden">
                  {visit.images && visit.images.length > 0 ? (
                    <img
                      src={visit.images[0]}
                      alt={visit.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e5e7eb"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/></svg>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{visit.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(visit.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">{visit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GridFS Weekly Updates */}
      {!loading && gridfsWeeks.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Weekly Updates</h2>
            <Link to="/weekly-visits" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all weeks →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridfsWeeks.map((week) => (
              <div key={week._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                {/* Week Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Week {week.weekNumber}</h3>
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                      {new Date(week.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Photo Preview */}
                {week.photos && week.photos.length > 0 && (
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    <img
                      src={`/api/gridfs-weeks/file/${week.photos[0]}`}
                      alt={`Week ${week.weekNumber} preview`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full hidden items-center justify-center bg-gray-100 text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Content */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                    {week.summary}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {week.photos?.length || 0} photos
                    </span>
                    {week.reportPdf && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Report
                      </span>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <Link
                    to="/weekly-visits"
                    className="block w-full text-center px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Legacy Weekly Updates from API */}
      {!loading && weeklyUpdates.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Legacy Updates</h2>
            <Link to="/weekly-updates" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all updates →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeklyUpdates.map((week) => (
              <div key={week._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Week {week.weekNumber}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(week.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Activities</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{week.activities}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Highlights</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{week.highlights}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Weeks Grid (Static Data) */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Weekly Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weeksData.map((week) => (
            <Link
              key={week.id}
              to={`/week/${week.id}`}
              className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="h-48 bg-gray-100 overflow-hidden">
                {week.images && week.images.length > 0 ? (
                  <img
                    src={week.images[0]}
                    alt={week.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e5e7eb"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M21 5v6.59l-3-3.01-4 4.01-4-4-4 4-3-3.01L3 11.59V5h18zm-3 6.42l3 3.01V19H5v-6.07l3 2.98 4-4 4 4 3-3.01z"/></svg>';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {week.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {week.description}
                </p>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <span className="inline-flex items-center">
                    <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    {week.images?.length || 0} photos
                  </span>
                  <span className="mx-2">•</span>
                  <span>View Report</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>


      {/* About Section */}
      <section className="bg-gray-50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Project</h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          This website documents our Community Service Project (CSP) journey, showcasing our weekly activities, 
          progress reports, and the impact we're making in our community. Each week, we share photos, 
          detailed reports, and reflections on our experiences.
        </p>
        <div className="mt-6">
          <Link
            to={`/week/${weeksData[0].id}`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Start Exploring
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
