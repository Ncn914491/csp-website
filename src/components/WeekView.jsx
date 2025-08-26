import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import PdfViewer from "./PdfViewer";

// Photo Gallery Modal Component
const PhotoModal = ({ isOpen, onClose, photos, currentIndex, onNavigate }) => {
  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
    if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos.length]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {photos.length > 1 && (
          <>
            <button
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={currentIndex === photos.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        
        <img
          src={`/api/gridfs-weeks/file/${photos[currentIndex]}`}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg';
            e.target.alt = 'Image not available';
          }}
        />
        
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Photo Gallery Component
const PhotoGallery = ({ photos, weekNumber }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState(new Set());

  const handleImageError = (photoId) => {
    setImageErrors(prev => new Set([...prev, photoId]));
  };

  const openModal = (index) => {
    setCurrentPhotoIndex(index);
    setModalOpen(true);
  };

  const validPhotos = photos.filter(photoId => !imageErrors.has(photoId));

  if (validPhotos.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>No photos available for this week</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Photo Gallery</h3>
      <div className="photos-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {validPhotos.map((photoId, index) => (
          <div key={photoId} className="photo-container group relative">
            <img
              src={`/api/gridfs-weeks/file/${photoId}`}
              alt={`Week ${weekNumber} photo ${index + 1}`}
              className="photo w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group-hover:scale-105"
              onClick={() => openModal(index)}
              onError={() => handleImageError(photoId)}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
      
      <PhotoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        photos={validPhotos}
        currentIndex={currentPhotoIndex}
        onNavigate={setCurrentPhotoIndex}
      />
    </div>
  );
};

// Enhanced PDF Viewer Component
const WeekPdfViewer = ({ pdfId, weekNumber, title = "Weekly Report" }) => {
  const [showViewer, setShowViewer] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  if (!pdfId) return null;

  return (
    <div className="p-6 bg-gray-50 border-t">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <button
          onClick={() => setShowViewer(!showViewer)}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {showViewer ? 'Hide Viewer' : 'View PDF'}
        </button>
        <a
          href={`/api/gridfs-weeks/file/${pdfId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open in New Tab
        </a>
        <a
          href={`/api/gridfs-weeks/file/${pdfId}`}
          download
          className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </a>
      </div>
      
      {showViewer && (
        <div className="mt-4">
          <PdfViewer src={`/api/gridfs-weeks/file/${pdfId}`} />
        </div>
      )}
    </div>
  );
};

export default function WeekView() {
  const [weeks, setWeeks] = useState([]);
  const [career, setCareer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchWeeks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await axios.get("/api/gridfs-weeks", {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const all = response.data || [];
      const careerEntry = all.find(w => Number(w.weekNumber) === 0);
      const normalWeeks = all.filter(w => Number(w.weekNumber) !== 0).sort((a,b) => a.weekNumber - b.weekNumber);
      
      setCareer(careerEntry || null);
      setWeeks(normalWeeks);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching weeks:", err);
      
      let errorMessage = "Failed to load weeks";
      if (err.name === 'AbortError') {
        errorMessage = "Request timed out. Please check your connection.";
      } else if (err.response?.status === 404) {
        errorMessage = "Weeks data not found. Please contact administrator.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchWeeks();
  };

  useEffect(() => {
    fetchWeeks();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="large" />
        <p className="text-gray-600 mt-4">Loading weekly updates...</p>
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">Retry attempt {retryCount}</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Weeks</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reload Page
            </button>
          </div>
          {retryCount > 2 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Multiple retry attempts failed. Please check your internet connection or contact support.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">No Weeks Available</h2>
        <p className="text-gray-500">No weeks have been uploaded yet.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="weeks-container max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Updates</h1>
          <p className="text-gray-600">Explore our weekly program activities, photos, and reports</p>
        </div>

        {/* Career Resources */}
        {career?.reportPdf && (
          <div className="career-card bg-white rounded-lg shadow-lg overflow-hidden border border-blue-100">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
              <h2 className="text-2xl font-bold">Career Resources</h2>
              <p className="text-purple-100 mt-2">{career.summary || 'Downloadable PDF with guidance resources.'}</p>
            </div>
            <WeekPdfViewer 
              pdfId={career.reportPdf} 
              weekNumber={0} 
              title="Career Guidance Resources"
            />
          </div>
        )}

        {/* Weeks Display */}
        {weeks.map(week => (
          <div key={week._id} className="week-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Week Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">Week {week.weekNumber}</h2>
                  <p className="text-blue-100 mt-2">{week.summary}</p>
                </div>
                <div className="text-right text-blue-100 text-sm">
                  <p>Created</p>
                  <p className="font-medium">
                    {new Date(week.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Photos Gallery */}
            {week.photos && week.photos.length > 0 ? (
              <PhotoGallery photos={week.photos} weekNumber={week.weekNumber} />
            ) : (
              <div className="p-6 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No photos available for this week</p>
              </div>
            )}

            {/* PDF Report */}
            <WeekPdfViewer 
              pdfId={week.reportPdf} 
              weekNumber={week.weekNumber} 
              title="Weekly Report"
            />
          </div>
        ))}

        {/* Empty State */}
        {weeks.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Weeks Available</h3>
              <p className="text-gray-500 mb-4">No weekly updates have been uploaded yet.</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
