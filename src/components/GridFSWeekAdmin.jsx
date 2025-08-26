import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function GridFSWeekAdmin() {
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    weekNumber: '',
    summary: '',
    photos: null,
    reportPdf: null
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchWeeks();
  }, []);

  const fetchWeeks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/gridfs-weeks');
      setWeeks(response.data);
    } catch (error) {
      console.error('Error fetching weeks:', error);
      alert('Failed to load weeks');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.weekNumber) {
      newErrors.weekNumber = 'Week number is required';
    } else if (formData.weekNumber < 1) {
      newErrors.weekNumber = 'Week number must be positive';
    }
    
    if (!formData.summary.trim()) {
      newErrors.summary = 'Summary is required';
    }
    
    if (!editingWeek && !formData.photos) {
      newErrors.photos = 'At least one photo is required';
    }
    
    if (!editingWeek && !formData.reportPdf) {
      newErrors.reportPdf = 'Report PDF is required';
    }

    if (formData.photos && formData.photos.length > 10) {
      newErrors.photos = 'Maximum 10 photos allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const submitFormData = new FormData();
      
      submitFormData.append('weekNumber', formData.weekNumber);
      submitFormData.append('summary', formData.summary);
      
      // Add photos
      if (formData.photos) {
        for (let i = 0; i < formData.photos.length; i++) {
          submitFormData.append('photos', formData.photos[i]);
        }
      }
      
      // Add PDF
      if (formData.reportPdf) {
        submitFormData.append('reportPdf', formData.reportPdf);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      };

      if (editingWeek) {
        // Update logic would go here - for now we'll just show an alert
        alert('Edit functionality not implemented yet - please delete and re-add');
      } else {
        const response = await axios.post('/api/gridfs-weeks/add', submitFormData, config);
        alert('Week added successfully!');
        await fetchWeeks();
        resetForm();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error submitting week:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit week';
      alert('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (weekId) => {
    if (!window.confirm('Are you sure you want to delete this week? This will also delete all associated files.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/gridfs-weeks/${weekId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      alert('Week deleted successfully!');
      await fetchWeeks();
    } catch (error) {
      console.error('Error deleting week:', error);
      alert('Failed to delete week');
    }
  };

  const resetForm = () => {
    setFormData({
      weekNumber: '',
      summary: '',
      photos: null,
      reportPdf: null
    });
    setErrors({});
    setEditingWeek(null);
  };

  const handleFileChange = (e, type) => {
    const files = e.target.files;
    if (type === 'photos') {
      setFormData(prev => ({ ...prev, photos: files }));
    } else if (type === 'reportPdf') {
      setFormData(prev => ({ ...prev, reportPdf: files[0] }));
    }
    
    // Clear errors for this field
    if (errors[type]) {
      setErrors(prev => ({ ...prev, [type]: '' }));
    }
  };

  return (
    <div className="gridfs-week-admin p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">GridFS Weekly Updates</h2>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
        >
          + Add GridFS Week
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      )}

      {/* Weeks List */}
      <div className="space-y-4">
        {weeks.map((week) => (
          <div key={week._id} className="bg-white/50 rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Week {week.weekNumber}
                </h3>
                <p className="text-gray-600 mb-3">{week.summary}</p>
                
                {/* File Info */}
                <div className="flex gap-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {week.photos?.length || 0} photos
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {week.reportPdf ? 'PDF available' : 'No PDF'}
                  </span>
                </div>
                
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(week.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleDelete(week._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {weeks.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No GridFS weeks found. Add your first one!
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingWeek ? 'Edit' : 'Add'} GridFS Week
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Week Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Week Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.weekNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekNumber: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${errors.weekNumber ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
                  />
                  {errors.weekNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.weekNumber}</p>
                  )}
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Summary *
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={formData.summary}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${errors.summary ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
                    placeholder="Describe what happened this week..."
                  />
                  {errors.summary && (
                    <p className="text-red-500 text-sm mt-1">{errors.summary}</p>
                  )}
                </div>

                {/* Photos Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photos * (max 10 files)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'photos')}
                    className={`w-full px-4 py-2 rounded-lg border ${errors.photos ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Select multiple image files (JPG, PNG, etc.)
                  </p>
                  {formData.photos && (
                    <p className="text-sm text-green-600 mt-1">
                      {formData.photos.length} file(s) selected
                    </p>
                  )}
                  {errors.photos && (
                    <p className="text-red-500 text-sm mt-1">{errors.photos}</p>
                  )}
                </div>

                {/* PDF Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report PDF *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'reportPdf')}
                    className={`w-full px-4 py-2 rounded-lg border ${errors.reportPdf ? 'border-red-500' : 'border-gray-300'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Select a PDF file containing the detailed report
                  </p>
                  {formData.reportPdf && (
                    <p className="text-sm text-green-600 mt-1">
                      File selected: {formData.reportPdf.name}
                    </p>
                  )}
                  {errors.reportPdf && (
                    <p className="text-red-500 text-sm mt-1">{errors.reportPdf}</p>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none"
                  >
                    {loading ? 'Uploading...' : (editingWeek ? 'Update' : 'Add') + ' Week'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
