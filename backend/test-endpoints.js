const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

const testEndpoints = async () => {
  console.log('🧪 Testing API Endpoints...\n');

  try {
    // Test visits endpoint
    console.log('📚 Testing /api/visits...');
    const visitsResponse = await fetch(`${API_BASE}/visits`);
    const visits = await visitsResponse.json();
    console.log(`✅ Found ${visits.length} school visits\n`);

    // Test weeks endpoint
    console.log('📅 Testing /api/weeks...');
    const weeksResponse = await fetch(`${API_BASE}/weeks`);
    const weeks = await weeksResponse.json();
    console.log(`✅ Found ${weeks.length} weekly updates\n`);

    // Test resources endpoint
    console.log('📄 Testing /api/resources...');
    const resourcesResponse = await fetch(`${API_BASE}/resources`);
    const resources = await resourcesResponse.json();
    console.log(`✅ Found ${resources.length} resources\n`);

    console.log('🎉 All endpoints working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Make sure the server is running with: node server.js');
  }
};

testEndpoints();