import React, { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import PdfViewer from "./PdfViewer";
import PptViewer from "./PptViewer";
import { API_URL } from "../config";
import { api } from "../utils/api";

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
          src={`${API_URL}/weeks/file/${photos[currentIndex]}`}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            console.error('Failed to load image:', photos[currentIndex]);
            e.target.style.display = 'none';
            // Show error message instead
            const errorDiv = document.createElement('div');
            errorDiv.className = 'text-white text-center p-8';
            errorDiv.innerHTML = `
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>Image not available</p>
            `;
            e.target.parentNode.appendChild(errorDiv);
          }}
          crossOrigin="anonymous"
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
const PhotoGallery = ({ photos, files, weekNumber }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [loadedImages, setLoadedImages] = useState(new Set());

  const handleImageError = (photoId) => {
    setImageErrors(prev => new Set([...prev, photoId]));
  };

  const handleImageLoad = (photoId) => {
    setLoadedImages(prev => new Set([...prev, photoId]));
  };

  const openModal = (index) => {
    setCurrentPhotoIndex(index);
    setModalOpen(true);
  };

  // Handle both old format (photos array) and new format (files array)
  let photoIds = [];
  if (files && Array.isArray(files)) {
    // New format: files array with objects containing gridfsId
    photoIds = files
      .filter(file => file.contentType && file.contentType.startsWith('image/'))
      .map(file => file.gridfsId);
  } else if (photos && Array.isArray(photos)) {
    // Old format: photos array with direct IDs
    photoIds = photos;
  }

  const validPhotos = photoIds.filter(photoId => !imageErrors.has(photoId));

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
            <div className="relative overflow-hidden rounded-lg">
              {!loadedImages.has(photoId) && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <img
                src={`${API_URL}/weeks/file/${photoId}`}
                alt={`Week ${weekNumber} photo ${index + 1}`}
                className="photo w-full h-48 object-cover shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group-hover:scale-105"
                onClick={() => openModal(index)}
                onError={() => handleImageError(photoId)}
                onLoad={() => handleImageLoad(photoId)}
                loading="lazy"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
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

// Enhanced File Viewer Component (supports both PDF and PPT)
const WeekFileViewer = ({ fileId, weekNumber, title = "Weekly Report", fileType = "pdf" }) => {
  const [showViewer, setShowViewer] = useState(false);

  if (!fileId) return null;

  const fileUrl = `${API_URL}/weeks/file/${fileId}`;
  const isPpt = fileType === 'ppt' || fileType === 'pptx';
  const isPdf = fileType === 'pdf';

  return (
    <div className="p-6 bg-gray-50 border-t">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <button
          onClick={() => setShowViewer(!showViewer)}
          className={`inline-flex items-center px-6 py-3 text-white rounded-lg transition-colors duration-200 ${
            isPpt ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {showViewer ? 'Hide Viewer' : `View ${isPpt ? 'Presentation' : 'PDF'}`}
        </button>
        <a
          href={fileUrl}
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
          href={fileUrl}
          download
          className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download {isPpt ? 'PPT' : 'PDF'}
        </a>
      </div>
      
      {showViewer && (
        <div className="mt-4">
          {isPpt ? (
            <PptViewer src={fileUrl} title={title} />
          ) : (
            <PdfViewer src={fileUrl} />
          )}
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
      
      // Use the API utility instead of direct fetch
      const result = await api.getWeeks();
      const all = result.data || result || [];
      
      const careerEntry = all.find(w => Number(w.weekNumber) === 0);
      const normalWeeks = all
        .filter(w => Number(w.weekNumber) !== 0)
        .sort((a,b) => a.weekNumber - b.weekNumber);
      
      setCareer(careerEntry || null);
      setWeeks(normalWeeks);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error("Error fetching weeks:", err);
      
      let errorMessage = "Failed to load weeks";
      if (err.message.includes('Network error')) {
        errorMessage = "Network error. Please check your connection.";
      } else if (err.message.includes('404')) {
        errorMessage = "Weeks data not found. Please contact administrator.";
      } else if (err.message.includes('500')) {
        errorMessage = "Server error. Please try again later.";
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      } else {
        errorMessage = err.message || "Failed to load weeks";
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

  // Build display list for weeks 1-8 with placeholders for missing
  const displayWeeks = Array.from({ length: 8 }, (_, i) => i + 1)
    .map((n) => {
      const found = weeks.find((w) => Number(w.weekNumber) === n);
      if (found) return found;
      return {
        _id: `placeholder-${n}`,
        weekNumber: n,
        summary: 'No summary available',
        photos: [],
        reportFile: null,
        createdAt: new Date().toISOString(),
        __placeholder: true
      };
    });

  return (
    <ErrorBoundary>
      <div className="weeks-container max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Updates</h1>
          <p className="text-gray-600">Explore our weekly program activities, photos, and reports</p>
        </div>

        {/* Career Resources */}
        {career?.reportFile && (
          <div className="career-card bg-white rounded-lg shadow-lg overflow-hidden border border-orange-100">
            <div className="bg-gradient-to-r from-orange-600 to-red-700 text-white p-6">
              <h2 className="text-2xl font-bold">Career Guidance Resources</h2>
              <p className="text-orange-100 mt-2">{career.summary || 'Interactive presentation with career guidance resources.'}</p>
            </div>
            <WeekFileViewer 
              fileId={career.reportFile} 
              weekNumber={0} 
              title="Career Guidance Presentation"
              fileType="pptx"
            />
          </div>
        )}

        {/* Weeks Display */}
        {displayWeeks.map(week => (
          <div key={week._id} className="week-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Week Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">
                    {week.title || `Week ${week.weekNumber}`}
                  </h2>
                  <p className="text-blue-100 mt-2">
                    {week.description || week.summary || `Activities for week ${week.weekNumber}`}
                  </p>
                  {week.activities && week.activities !== week.summary && (
                    <p className="text-blue-100 mt-1 text-sm">
                      <strong>Activities:</strong> {week.activities}
                    </p>
                  )}
                  {week.highlights && (
                    <p className="text-blue-100 mt-1 text-sm">
                      <strong>Highlights:</strong> {week.highlights}
                    </p>
                  )}
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
            {((week.photos && week.photos.length > 0) || (week.files && week.files.length > 0)) ? (
              <PhotoGallery photos={week.photos} files={week.files} weekNumber={week.weekNumber} />
            ) : (
              <div className="p-6 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No photos available for this week</p>
              </div>
            )}

            {/* PDF Report */}
            {(week.reportFile || week.reportPdf || (week.pdfFiles && week.pdfFiles.length > 0)) ? (
              <div>
                {/* Handle old reportFile or reportPdf field */}
                {(week.reportFile || week.reportPdf) && (
                  <WeekFileViewer 
                    fileId={week.reportFile || week.reportPdf} 
                    weekNumber={week.weekNumber} 
                    title="Weekly Report"
                    fileType="pdf"
                  />
                )}
                
                {/* Handle new pdfFiles array */}
                {week.pdfFiles && week.pdfFiles.map((pdfFile, index) => (
                  <WeekFileViewer 
                    key={pdfFile.gridfsId || index}
                    fileId={pdfFile.gridfsId} 
                    weekNumber={week.weekNumber} 
                    title={pdfFile.filename || `PDF Document ${index + 1}`}
                    fileType="pdf"
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 border-t">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No report uploaded for this week</p>
              </div>
            )}
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