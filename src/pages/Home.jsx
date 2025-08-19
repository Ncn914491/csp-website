import React from 'react';
import { Link } from 'react-router-dom';
import weeksData from '../data/weeks';

function Home() {
  // Determine the latest week by numeric ordering
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
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            {latestWeek && (
              <Link
                to={`/week/${latestWeek.id}`}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors duration-200"
              >
                View Latest Week
              </Link>
            )}
            <a
              href="#career-guidance"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-700 bg-opacity-60 hover:bg-opacity-70 transition-colors duration-200"
            >
              Career Resources
            </a>
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

      {/* All Weeks Grid */}
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

      {/* Career Guidance Section */}
      <section id="career-guidance" className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Career Guidance Resources</h2>
          <p className="mt-1 text-gray-600">Explore career paths after 10th standard in India.</p>
        </div>
        <div className="p-6">
          {/* Simple flow-chart style using boxes */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800">Science (PCM/PCB)</h3>
              <ul className="mt-2 text-sm text-blue-900 list-disc list-inside">
                <li>Engineering, Architecture</li>
                <li>Medicine, Pharmacy</li>
                <li>Pure Sciences, Research</li>
                <li>Defense, Aviation</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800">Commerce</h3>
              <ul className="mt-2 text-sm text-green-900 list-disc list-inside">
                <li>CA, CMA, CS</li>
                <li>B.Com, BBA, MBA</li>
                <li>Banking, Finance, Marketing</li>
                <li>Entrepreneurship</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800">Arts/Humanities</h3>
              <ul className="mt-2 text-sm text-purple-900 list-disc list-inside">
                <li>Law, Civil Services</li>
                <li>Psychology, Sociology, Economics</li>
                <li>Media, Design, Languages</li>
                <li>Hotel Mgmt, Travel & Tourism</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">PDF removed due to issues. We’ve provided a quick overview instead.</p>
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
