import React, { useState } from 'react';

function PdfViewer({ src }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center my-8">
        <p className="text-gray-600">No PDF available for this section.</p>
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

  // Google Docs Viewer fallback URL
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(window.location.origin + src)}&embedded=true`;

  return (
    <div className="w-full my-8">
      <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-lg" style={{ minHeight: '70vh' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {!error ? (
          <>
            <iframe
              src={src}
              className={`w-full h-[70vh] border-0 ${loading ? 'opacity-0' : 'opacity-100'}`}
              title="PDF Viewer"
              onLoad={handleLoad}
              onError={handleError}
            >
              <p>This browser does not support PDFs. Please download the PDF to view it:</p>
            </iframe>
            <div className="absolute bottom-0 left-0 right-0 bg-white p-2 border-t border-gray-200 flex justify-between items-center">
              <a 
                href={src} 
                download 
                className="text-blue-500 hover:underline flex items-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download PDF
              </a>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 h-full">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-700 mb-4">Failed to load PDF. You can try to open it in a new tab:</p>
            <a 
              href={src} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Open PDF in New Tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfViewer;
