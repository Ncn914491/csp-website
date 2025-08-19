import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import weeksData from '../data/weeks';
import ImageSlider from '../components/ImageSlider';
import PdfViewer from '../components/PdfViewer';

function WeekPage() {
  const { weekId } = useParams();
  const navigate = useNavigate();
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const normalize = (id) => String(id);
    const foundWeek = weeksData.find(w => normalize(w.id) === normalize(weekId));
    if (!foundWeek) {
      setError('Week not found');
      setWeek(null);
    } else {
      setWeek(foundWeek);
      setError(null);
    }
    setLoading(false);
  }, [weekId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !week) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Week Not Found</h2>
        <p className="text-gray-600 mb-4">Sorry, we couldn't find the week you're looking for.</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">{week.title}</h1>
      </div>

      {/* Image Slider - full width box with slideshow */}
      {week.images && week.images.length > 0 && (
        <div className="w-full rounded-lg overflow-hidden shadow-lg bg-white">
          <ImageSlider images={week.images} />
        </div>
      )}

      {/* Description */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Week Summary</h2>
        <div className="text-gray-700 whitespace-pre-line">{week.description}</div>
      </div>

      {/* PDF viewer for first 4 weeks only, blank otherwise */}
      {week.pdf ? (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Detailed Report (PDF)</h3>
          <PdfViewer src={week.pdf} />
        </div>
      ) : null}
    </div>
  );
}

export default WeekPage;
