import React, { useState, useEffect } from 'react';

function PdfViewer({ src, title = "Document" }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewerType, setViewerType] = useState('direct');
  const [fileType, setFileType] = useState('unknown');

  useEffect(() => {
    if (src) {
      // Detect file type from URL or extension
      const url = src.toLowerCase();
      if (url.includes('.pdf')) {
        setFileType('pdf');
      } else if (url.includes('.ppt') || url.includes('.pptx')) {
        setFileType('powerpoint');
      } else if (url.includes('.doc') || url.includes('.docx')) {
        setFileType('word');
      } else {
        setFileType('unknown');
      }
    }
  }, [src]);

  if (!src) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center my-8">
        <p className="text-gray-600">No document available for this section.</p>
      </div>
    );
  }

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return (
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'powerpoint':
        return (
          <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm6 6a1 1 0 01-1 1H7a1 1 0 110-2h2a1 1 0 011 1zm-1 3a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getViewerUrl = () => {
    // Handle GridFS URLs and regular URLs
    let fullUrl;
    if (src.startsWith('http')) {
      fullUrl = src;
    } else if (src.startsWith('/api/')) {
      fullUrl = `${window.location.origin}${src}`;
    } else {
      fullUrl = src;
    }
    
    switch (viewerType) {
      case 'office':
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`;
      case 'google':
        return `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`;
      case 'direct':
      default:
        return src;
    }
  };

  const switchViewer = (type) => {
    setViewerType(type);
    setError(false);
    setLoading(true);
  };

  return (
    <div className="w-full my-8">
      <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-lg" style={{ minHeight: '70vh' }}>
        {/* Header with file info and viewer options */}
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getFileIcon()}
            <span className="text-sm font-medium text-gray-700">{title}</span>
            <span className="text-xs text-gray-500 uppercase">{fileType}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Viewer switcher for non-PDF files */}
            {fileType !== 'pdf' && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => switchViewer('direct')}
                  className={`px-2 py-1 text-xs rounded ${
                    viewerType === 'direct' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Direct
                </button>
                <button
                  onClick={() => switchViewer('office')}
                  className={`px-2 py-1 text-xs rounded ${
                    viewerType === 'office' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Office
                </button>
                <button
                  onClick={() => switchViewer('google')}
                  className={`px-2 py-1 text-xs rounded ${
                    viewerType === 'google' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Google
                </button>
              </div>
            )}
            
            <a 
              href={src} 
              download 
              className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
              title="Download file"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading document...</p>
            </div>
          </div>
        )}
        
        {!error ? (
          <iframe
            src={getViewerUrl()}
            className={`w-full border-0 ${loading ? 'opacity-0' : 'opacity-100'}`}
            style={{ height: 'calc(70vh - 60px)' }}
            title={`${title} Viewer`}
            onLoad={handleLoad}
            onError={handleError}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          >
            <p>This browser does not support document viewing. Please download the file to view it.</p>
          </iframe>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 h-full">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Unable to display document</h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              The document couldn't be loaded in the viewer. You can download it or try a different viewer.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href={src} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in New Tab
              </a>
              
              <a 
                href={src} 
                download
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download File
              </a>
            </div>

            {/* Alternative viewers for non-PDF files */}
            {fileType !== 'pdf' && viewerType === 'direct' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-3">Try alternative viewers:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => switchViewer('office')}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    Office Online Viewer
                  </button>
                  <button
                    onClick={() => switchViewer('google')}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    Google Docs Viewer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfViewer;
