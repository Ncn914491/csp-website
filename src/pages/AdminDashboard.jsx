import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AdminDashboard() {
  const [visits, setVisits] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [resources, setResources] = useState([]);
  const [activeTab, setActiveTab] = useState('weeks');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form data for adding/editing weekly updates
  const [weekFormData, setWeekFormData] = useState({
    weekNumber: '',
    activities: '',
    highlights: '',
    summary: '',
    photoGallery: []
  });
  
  const [photoInput, setPhotoInput] = useState({ url: '', caption: '' });
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/auth');
    } else {
      fetchData();
    }
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [visitsRes, weeksRes, resourcesRes] = await Promise.all([
        fetch('http://localhost:5000/api/visits', { headers }),
        fetch('http://localhost:5000/api/weeks', { headers }),
        fetch('http://localhost:5000/api/resources', { headers })
      ]);

      setVisits(await visitsRes.json());
      setWeeks(await weeksRes.json());
      setResources(await resourcesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddPhoto = () => {
    if (photoInput.url) {
      setWeekFormData(prev => ({
        ...prev,
        photoGallery: [...prev.photoGallery, { ...photoInput }]
      }));
      setPhotoInput({ url: '', caption: '' });
    }
  };

  const handleRemovePhoto = (index) => {
    setWeekFormData(prev => ({
      ...prev,
      photoGallery: prev.photoGallery.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitWeek = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingItem 
        ? `http://localhost:5000/api/weeks/${editingItem._id}`
        : 'http://localhost:5000/api/weeks';
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(weekFormData)
      });

      if (response.ok) {
        await fetchData();
        resetForm();
        setShowAddModal(false);
        alert(editingItem ? 'Weekly update updated successfully!' : 'Weekly update added successfully!');
      } else {
        const error = await response.json();
        alert('Error: ' + error.message);
      }
    } catch (error) {
      console.error('Error submitting week:', error);
      alert('Failed to submit weekly update');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setWeekFormData({
      weekNumber: item.weekNumber,
      activities: item.activities,
      highlights: item.highlights,
      summary: item.summary || '',
      photoGallery: item.photoGallery || []
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/${type}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchData();
        alert('Item deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const resetForm = () => {
    setWeekFormData({
      weekNumber: '',
      activities: '',
      highlights: '',
      summary: '',
      photoGallery: []
    });
    setPhotoInput({ url: '', caption: '' });
    setEditingItem(null);
  };

  const stats = [
    { label: 'School Visits', count: visits.length, icon: '🏫', color: 'from-blue-400 to-blue-600' },
    { label: 'Weekly Updates', count: weeks.length, icon: '📅', color: 'from-purple-400 to-purple-600' },
    { label: 'Resources', count: resources.length, icon: '📚', color: 'from-green-400 to-green-600' },
    { label: 'Students Reached', count: '1000+', icon: '🎓', color: 'from-orange-400 to-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/30 border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚡</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.username}
              </span>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
              >
                Main Page
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="backdrop-blur-lg bg-white/60 rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 rounded-2xl`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{stat.icon}</span>
                  <span className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.count}
                  </span>
                </div>
                <p className="text-gray-700 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="backdrop-blur-lg bg-white/60 rounded-2xl border border-white/20 shadow-xl">
          <div className="flex border-b border-gray-200">
            {['weeks', 'visits', 'resources'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 font-medium capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab === 'weeks' ? 'Weekly Updates' : tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Add Button */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Manage {activeTab === 'weeks' ? 'Weekly Updates' : activeTab}
              </h2>
              {activeTab === 'weeks' && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  + Add Weekly Update
                </button>
              )}
            </div>

            {/* Weekly Updates List */}
            {activeTab === 'weeks' && (
              <div className="space-y-4">
                {weeks.map((week) => (
                  <div key={week._id} className="bg-white/50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Week {week.weekNumber}
                        </h3>
                        <p className="text-gray-600 mt-1">{week.summary || week.highlights}</p>
                        <p className="text-sm text-gray-500 mt-2">{week.activities}</p>
                        {week.photoGallery && week.photoGallery.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            {week.photoGallery.slice(0, 4).map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo.url}
                                alt={photo.caption}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ))}
                            {week.photoGallery.length > 4 && (
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
                                +{week.photoGallery.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(week)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(week._id, 'weeks')}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* School Visits List */}
            {activeTab === 'visits' && (
              <div className="space-y-4">
                {visits.map((visit) => (
                  <div key={visit._id} className="bg-white/50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{visit.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(visit.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 mt-2">{visit.description}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(visit._id, 'visits')}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resources List */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div key={resource._id} className="bg-white/50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{resource.title}</h3>
                        <p className="text-sm text-gray-500">{resource.type}</p>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {resource.url}
                        </a>
                      </div>
                      <button
                        onClick={() => handleDelete(resource._id, 'resources')}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Weekly Update Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingItem ? 'Edit' : 'Add'} Weekly Update
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

              <form onSubmit={handleSubmitWeek} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Week Number
                  </label>
                  <input
                    type="number"
                    required
                    value={weekFormData.weekNumber}
                    onChange={(e) => setWeekFormData({ ...weekFormData, weekNumber: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Summary
                  </label>
                  <input
                    type="text"
                    required
                    value={weekFormData.summary}
                    onChange={(e) => setWeekFormData({ ...weekFormData, summary: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Brief summary of the week"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activities
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={weekFormData.activities}
                    onChange={(e) => setWeekFormData({ ...weekFormData, activities: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Describe the activities conducted"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Highlights
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={weekFormData.highlights}
                    onChange={(e) => setWeekFormData({ ...weekFormData, highlights: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    placeholder="Key highlights and achievements"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo Gallery
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={photoInput.url}
                        onChange={(e) => setPhotoInput({ ...photoInput, url: e.target.value })}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="Photo URL"
                      />
                      <input
                        type="text"
                        value={photoInput.caption}
                        onChange={(e) => setPhotoInput({ ...photoInput, caption: e.target.value })}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        placeholder="Caption"
                      />
                      <button
                        type="button"
                        onClick={handleAddPhoto}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Add
                      </button>
                    </div>
                    
                    {weekFormData.photoGallery.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {weekFormData.photoGallery.map((photo, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={photo.url}
                              alt={photo.caption}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1 text-xs rounded-b-lg">
                              {photo.caption}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingItem ? 'Update' : 'Add')} Weekly Update
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
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

export default AdminDashboard;
