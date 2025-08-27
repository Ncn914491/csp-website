const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing API endpoints...\n');

    // Test 1: Health check
    try {
      const response = await axios.get(`${API_BASE}/groups/health`);
      console.log('✅ Groups health check:', response.data);
    } catch (error) {
      console.log('❌ Groups health check failed:', error.message);
    }

    // Test 2: Login with student credentials
    try {
      const loginResponse = await axios.post(`${API_BASE}/login`, {
        username: 'student1',
        password: 'password123'
      });
      console.log('✅ Student login successful');
      
      const token = loginResponse.data.token;
      console.log('✅ Token received');

      // Test 3: Access protected route
      try {
        const protectedResponse = await axios.get(`${API_BASE}/protected`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Protected route access:', protectedResponse.data.user);
      } catch (error) {
        console.log('❌ Protected route failed:', error.response?.data || error.message);
      }

      // Test 4: List groups
      try {
        const groupsResponse = await axios.get(`${API_BASE}/groups`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Groups list:', groupsResponse.data.count, 'groups found');
      } catch (error) {
        console.log('❌ Groups list failed:', error.response?.data || error.message);
      }

      // Test 5: Get weeks data
      try {
        const weeksResponse = await axios.get(`${API_BASE}/weeks`);
        console.log('✅ Weeks data:', weeksResponse.data.count || 0, 'weeks found');
      } catch (error) {
        console.log('❌ Weeks data failed:', error.response?.data || error.message);
      }

    } catch (error) {
      console.log('❌ Student login failed:', error.response?.data || error.message);
    }

    // Test 6: Login with admin credentials
    try {
      const adminLoginResponse = await axios.post(`${API_BASE}/login`, {
        username: 'admin',
        password: 'admin123'
      });
      console.log('✅ Admin login successful');
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();