import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import PdfViewer from '../components/PdfViewer';

const CareerGuidance = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [careerFiles, setCareerFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadResources();
    loadCareerFiles();
  }, []);

  const loadResources = async () => {
    try {
      const data = await api.getResources();
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCareerFiles = async () => {
    try {
      setFilesLoading(true);
      setFilesError(null);
      
      // Fetch weeks data to find career guidance files (week 0)
      const response = await axios.get('/api/weeks');
      const result = response.data || {};
      const weeks = result.data || result || [];
      
      // Find career guidance entries (weekNumber 0 or specific career files)
      const careerEntries = weeks.filter(week => 
        week.weekNumber === 0 || 
        (week.summary && week.summary.toLowerCase().includes('career'))
      );
      
      setCareerFiles(careerEntries);
      
      // Auto-select first file if available
      if (careerEntries.length > 0 && (careerEntries[0].reportFile || careerEntries[0].reportPdf)) {
        setSelectedFile(careerEntries[0]);
      }
    } catch (error) {
      console.error('Error loading career files:', error);
      setFilesError('Failed to load career guidance files');
    } finally {
      setFilesLoading(false);
    }
  };

  const filteredResources = selectedType === 'all' 
    ? resources 
    : resources.filter(resource => resource.type === selectedType);

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Career Guidance Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive career guidance, resources, and pathways to help you make informed decisions about your future
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Career Overview', icon: '📊' },
                { id: 'documents', label: 'Career Documents', icon: '📄' },
                { id: 'paths', label: 'Career Paths', icon: '🛤️' },
                { id: 'resources', label: 'Additional Resources', icon: '📚' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-blue-100">Career Options</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                <div className="text-3xl font-bold">15+</div>
                <div className="text-green-100">Major Streams</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
                <div className="text-3xl font-bold">100+</div>
                <div className="text-purple-100">Top Colleges</div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
                <div className="text-3xl font-bold">₹50L+</div>
                <div className="text-orange-100">Max Package</div>
              </div>
            </div>
            {/* Career Overview Summary */}
            <section className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Career Guidance Overview</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">After 10th Grade</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Continue to 11th/12th (Academic)</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>ITI Trade Courses (1-2 years)</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Polytechnic Diploma (3 years)</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>Vocational Training Programs</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">After 12th Grade</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Engineering (B.Tech/B.E.)</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Medical (MBBS/BDS)</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Commerce (B.Com/BBA/CA)</li>
                    <li className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>Arts & Humanities</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Career Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {filesLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner size="large" />
                <p className="text-gray-600 mt-4">Loading career guidance documents...</p>
              </div>
            ) : filesError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Documents</h3>
                <p className="text-red-600 mb-4">{filesError}</p>
                <button
                  onClick={loadCareerFiles}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* Document Selection */}
                {careerFiles.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Career Guidance Documents</h2>
                    
                    {/* File Selection */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">Available Documents</h3>
                      <div className="grid gap-4">
                        {careerFiles.map((file, index) => (
                          <div 
                            key={file._id} 
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedFile?._id === file._id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedFile(file)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {file.summary || `Career Guidance Document ${index + 1}`}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Created: {new Date(file.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {(file.reportFile || file.reportPdf) && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                    PDF
                                  </span>
                                )}
                                {file.photos && file.photos.length > 0 && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {file.photos.length} Images
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Document Viewer */}
                    {selectedFile && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-800">Document Viewer</h3>
                          <div className="flex space-x-2">
                            {(selectedFile.reportFile || selectedFile.reportPdf) && (
                              <>
                                <button
                                  onClick={() => setShowViewer(!showViewer)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  {showViewer ? 'Hide Viewer' : 'Show Viewer'}
                                </button>
                                <a
                                  href={`/api/gridfs/${selectedFile.reportFile || selectedFile.reportPdf}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  Open in New Tab
                                </a>
                                <a
                                  href={`/api/gridfs/${selectedFile.reportFile || selectedFile.reportPdf}`}
                                  download
                                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                  Download
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        {showViewer && (selectedFile.reportFile || selectedFile.reportPdf) && (
                          <div className="border rounded-lg overflow-hidden">
                            <PdfViewer src={`/api/gridfs/${selectedFile.reportFile || selectedFile.reportPdf}`} />
                          </div>
                        )}

                        {/* Images from the career file */}
                        {selectedFile.photos && selectedFile.photos.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-lg font-semibold mb-3 text-gray-800">Related Images</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {selectedFile.photos.map((photoId, index) => (
                                <div key={photoId} className="relative group">
                                  <img
                                    src={`/api/gridfs/${photoId}`}
                                    alt={`Career guidance image ${index + 1}`}
                                    className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => window.open(`/api/gridfs/${photoId}`, '_blank')}
                                    onError={(e) => {
                                      e.target.src = '/placeholder-image.jpg';
                                      e.target.alt = 'Image not available';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {careerFiles.length === 0 && (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Career Documents Available</h3>
                    <p className="text-gray-500">Career guidance documents will appear here when uploaded by administrators.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Career Paths Tab */}
        {activeTab === 'paths' && (
          <div className="space-y-8">
            {/* Career Paths After 10th */}
            <section className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Career Paths After 10th Grade</h2>
        <p className="mb-4">
          After Class 10, Indian students typically either continue academic studies (move to 11th grade) or pursue vocational/trade education. 
          Vocational courses and diplomas offer hands-on skills in fields like electrician, plumber, fitter, computer applications, and hospitality. 
          These programs (often 1–3 years long) prepare students for immediate employment or further technical studies.
        </p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">Course/Path</th>
                <th className="py-2 px-4 border text-left">Duration</th>
                <th className="py-2 px-4 border text-left">Eligibility</th>
                <th className="py-2 px-4 border text-left">Typical Careers</th>
                <th className="py-2 px-4 border text-left">Starting Salary (approx.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border">10th → 11th/12th (any stream)</td>
                <td className="py-2 px-4 border">2 years</td>
                <td className="py-2 px-4 border">10th pass</td>
                <td className="py-2 px-4 border">Continue school; choose stream (Science, Commerce, Arts)</td>
                <td className="py-2 px-4 border">School continuation</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 border">ITI Trade (Electrician, etc.)</td>
                <td className="py-2 px-4 border">1-2 years</td>
                <td className="py-2 px-4 border">10th pass</td>
                <td className="py-2 px-4 border">Electrician, Plumber, Welder, Fitter in industry or govt.</td>
                <td className="py-2 px-4 border">₹10-20K/month</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border">Polytechnic Diploma</td>
                <td className="py-2 px-4 border">3 years</td>
                <td className="py-2 px-4 border">10th pass</td>
                <td className="py-2 px-4 border">Technician or engineer in Mechanical, Civil, etc.</td>
                <td className="py-2 px-4 border">₹15-25K/month</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Example Career Path:</h3>
          <p className="text-blue-700">After 10th → ITI (2 years) → Junior Technician job (e.g., Govt. PSU) → Progressive promotions or further studies (e.g., 2nd year B.Tech lateral entry).</p>
        </div>
      </section>

      {/* Career Paths After 12th */}
      <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Career Paths After 12th Grade</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 text-blue-600">Science Stream (PCM/PCB)</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Engineering & Technology</h4>
              <p>12th (PCM) → JEE/MHT-CET → B.E./B.Tech (4 years) in fields like Computer Science, Mechanical, etc.</p>
              <p className="mt-2 text-sm text-gray-600">Average starting salary: ~₹9.1 LPA</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Medicine & Allied Health</h4>
              <p>12th (PCB) → NEET → MBBS (5.5 years) → House Surgeon → MD/MS (3 years)</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹3-6 LPA, up to ₹15+ LPA for specialists</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 text-blue-600">Commerce Stream</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Business & Finance</h4>
              <p>B.Com/BBA (3 years) → MBA or professional courses (CA, CS, CFA)</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹2-4 LPA, up to ₹15+ LPA with experience</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Chartered Accountancy (CA)</h4>
              <p>12th → CA Foundation → IPCC → Articleship → CA Final</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹6-8 LPA in Big 4 firms</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2 text-blue-600">Arts and Humanities Stream</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold">Law (LLB)</h4>
              <p>12th → 5-year BA LLB or 3-year LLB after graduation</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹5-8 LPA</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold">Design & Media</h4>
              <p>Degrees from NIFT, NID, or journalism schools</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹3-6 LPA</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold">Hotel & Hospitality</h4>
              <p>BHM or diplomas in hotel management</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹2-4 LPA + service charges</p>
            </div>
          </div>
        </div>
      </section>

      {/* Government and Public Sector Careers */}
      <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Government and Public Sector Careers</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-blue-800">Civil Services (IAS, IPS, IFS)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Requires graduation and UPSC Civil Services Exam</li>
              <li>IAS officer starts at ₹56,100 basic pay (~₹70k total with allowances)</li>
              <li>Prestigious administrative roles with excellent career growth</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-blue-800">Banking Sector (Public)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>IBPS/SBI exams for Probationary Officers (PO) and Clerks</li>
              <li>New SBI PO's take-home: ~₹42,000 basic (~₹7-8 LPA total)</li>
              <li>Promotion to Manager/Chief Manager (₹15-20 LPA)</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-blue-800">Public Sector Undertakings (PSUs)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Recruit engineering graduates via GATE or campus</li>
              <li>Examples: BHEL, ONGC, IOCL, DRDO, ISRO</li>
              <li>Starting salary: ₹9-10 LPA (including allowances)</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-blue-800">Teaching</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Government school teachers: B.Ed + TET/CTET</li>
              <li>College lecturers: NET/SLET required</li>
              <li>Starting salary: ₹30-40K/month (schools), ~₹6-7 LPA (colleges)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Example Career Roadmaps */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Example Career Roadmaps</h2>
        
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h3 className="font-semibold text-lg text-green-800">Software Engineer</h3>
            <p className="text-green-700">12th (PCM) → B.Tech in CS → Internship → Software Developer (₹4-6 LPA) → Senior Dev/Architect (₹15-20 LPA)</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-lg text-blue-800">Doctor</h3>
            <p className="text-blue-700">12th (PCB) → NEET → MBBS (5.5 yrs) → House Surgeon → MD (3 yrs) → Specialist/Consultant (₹12-18 LPA+)</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <h3 className="font-semibold text-lg text-purple-800">Civil Services (IAS/IPS)</h3>
            <p className="text-purple-700">12th → B.A. (Economics) → UPSC Prelims/Mains → IAS (₹70k entry) → District Collector → State Secretary</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <h3 className="font-semibold text-lg text-yellow-800">Technical Diploma to Engineer</h3>
            <p className="text-yellow-700">10th → Polytechnic Diploma (3 yrs) → Junior Engineer (₹3-4 LPA) → B.Tech lateral entry → Chief Engineer (₹10-15 LPA)</p>
          </div>
            </div>
          </section>
        </div>
      )}

      {/* Additional Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {!loading && resources.length > 0 ? (
            <section className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Additional Career Resources</h2>
          
          {/* Filter Buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Resources
            </button>
            {['PDF', 'Video', 'Article'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type}s
              </button>
            ))}
          </div>

          {/* Resources Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource._id} className="bg-gray-50 p-4 rounded-lg border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{resource.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    resource.type === 'PDF' ? 'bg-red-100 text-red-800' :
                    resource.type === 'Video' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {resource.type}
                  </span>
                </div>
                
                {resource.tags.length > 0 && (
                  <div className="mb-3">
                    {resource.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded mr-1 mb-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Resource
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>

              {filteredResources.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No resources found for the selected type.
                </div>
              )}
            </section>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Additional Resources Available</h3>
              <p className="text-gray-500">Additional career resources will appear here when available.</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">Important Note</h4>
            <p className="text-blue-700 text-sm leading-relaxed">
              Salaries mentioned are approximate and can vary based on location, organization, and individual performance. 
              Always research current market trends and consult with career counselors for the most up-to-date information. 
              Career paths are flexible, and many professionals successfully transition between different fields throughout their careers.
            </p>
          </div>
        </div>
      </div>
    </div>
  </ErrorBoundary>
  );
};

export default CareerGuidance;
