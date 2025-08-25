const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Import models for data verification
const User = require('../backend/models/User');
const WeeklyUpdate = require('../backend/models/WeeklyUpdate');
const SchoolVisit = require('../backend/models/SchoolVisit');

const API_BASE = 'http://localhost:5000/api';
const TEST_DB = process.env.MONGO_URL.replace('cspDB', 'cspDB_integration_test');

// Test data
const studentData = {
  name: 'Integration Test Student',
  email: 'integration-student@test.com',
  password: 'testpassword123',
  role: 'student'
};

const adminData = {
  name: 'Integration Test Admin', 
  email: 'integration-admin@test.com',
  password: 'adminpassword123',
  role: 'admin'
};

const newWeeklyUpdate = {
  weekNumber: 99,
  activities: 'Integration test activities',
  highlights: 'Integration test highlights',
  gallery: ['integration-test-image.jpg'],
  report: 'integration-test-report.pdf'
};

describe('Integration Tests', () => {
  let studentToken;
  let adminToken;
  let createdUpdateId;

  beforeAll(async () => {
    // Connect to test database
    try {
      await mongoose.connect(TEST_DB);
      console.log('✅ Connected to integration test database');
      
      // Clean up any existing test data
      await User.deleteMany({ email: { $in: [studentData.email, adminData.email] } });
      await WeeklyUpdate.deleteMany({ weekNumber: newWeeklyUpdate.weekNumber });
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await User.deleteMany({ email: { $in: [studentData.email, adminData.email] } });
      await WeeklyUpdate.deleteMany({ weekNumber: newWeeklyUpdate.weekNumber });
      await mongoose.connection.close();
      console.log('✅ Integration test cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  });

  describe('Student User Flow: Signup → Login → View Reports', () => {
    test('Step 1: Student signup should succeed', async () => {
      try {
        const response = await axios.post(`${API_BASE}/auth/signup`, studentData);
        
        expect(response.status).toBe(201);
        expect(response.data.message).toBe('User registered successfully');
        expect(response.data.token).toBeDefined();
        
        console.log('✅ Student signup successful');
      } catch (error) {
        console.error('❌ Student signup failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('Step 2: Student login should succeed', async () => {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: studentData.email,
          password: studentData.password
        });
        
        expect(response.status).toBe(200);
        expect(response.data.message).toBe('Login successful');
        expect(response.data.token).toBeDefined();
        expect(response.data.user.role).toBe('student');
        
        studentToken = response.data.token;
        console.log('✅ Student login successful');
      } catch (error) {
        console.error('❌ Student login failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('Step 3: Student should be able to view weekly reports', async () => {
      try {
        const response = await axios.get(`${API_BASE}/weeks`, {
          headers: {
            Authorization: `Bearer ${studentToken}`
          }
        });
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        
        console.log(`✅ Student successfully viewed ${response.data.length} weekly reports`);
      } catch (error) {
        console.error('❌ Student view reports failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('Step 4: Student should be able to view school visits', async () => {
      try {
        const response = await axios.get(`${API_BASE}/visits`, {
          headers: {
            Authorization: `Bearer ${studentToken}`
          }
        });
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        
        console.log(`✅ Student successfully viewed ${response.data.length} school visits`);
      } catch (error) {
        console.error('❌ Student view visits failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('Step 5: Student should be able to view resources', async () => {
      try {
        const response = await axios.get(`${API_BASE}/resources`, {
          headers: {
            Authorization: `Bearer ${studentToken}`
          }
        });
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        
        console.log(`✅ Student successfully viewed ${response.data.length} resources`);
      } catch (error) {
        console.error('❌ Student view resources failed:', error.response?.data || error.message);
        throw error;
      }
    });
  });

  describe('Admin User Flow: Login → Add Weekly Update → Verify', () => {
    test('Step 1: Admin signup should succeed', async () => {
      try {
        const response = await axios.post(`${API_BASE}/auth/signup`, adminData);
        
        expect(response.status).toBe(201);
        expect(response.data.message).toBe('User registered successfully');
        expect(response.data.token).toBeDefined();
        
        console.log('✅ Admin signup successful');
      } catch (error) {
        console.error('❌ Admin signup failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('Step 2: Admin login should succeed', async () => {
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: adminData.email,
          password: adminData.password
        });
        
        expect(response.status).toBe(200);
        expect(response.data.message).toBe('Login successful');
        expect(response.data.token).toBeDefined();
        expect(response.data.user.role).toBe('admin');
        
        adminToken = response.data.token;
        console.log('✅ Admin login successful');
      } catch (error) {
        console.error('❌ Admin login failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('Step 3: Admin should be able to add new weekly update', async () => {
      try {
        const response = await axios.post(`${API_BASE}/weeks`, newWeeklyUpdate, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        expect(response.status).toBe(201);
        expect(response.data.message).toBe('Weekly update created successfully');
        expect(response.data.weeklyUpdate).toBeDefined();
        expect(response.data.weeklyUpdate.weekNumber).toBe(newWeeklyUpdate.weekNumber);
        
        createdUpdateId = response.data.weeklyUpdate._id;
        console.log('✅ Admin successfully added weekly update');
      } catch (error) {
        console.error('❌ Admin add weekly update failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('Step 4: New weekly update should appear in API response', async () => {
      try {
        const response = await axios.get(`${API_BASE}/weeks`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        
        // Find the newly created update
        const createdUpdate = response.data.find(update => 
          update.weekNumber === newWeeklyUpdate.weekNumber
        );
        
        expect(createdUpdate).toBeDefined();
        expect(createdUpdate.activities).toBe(newWeeklyUpdate.activities);
        expect(createdUpdate.highlights).toBe(newWeeklyUpdate.highlights);
        
        console.log('✅ New weekly update verified in API response');
      } catch (error) {
        console.error('❌ Weekly update verification failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('Step 5: Database should contain the new weekly update', async () => {
      try {
        const dbUpdate = await WeeklyUpdate.findOne({ 
          weekNumber: newWeeklyUpdate.weekNumber 
        });
        
        expect(dbUpdate).toBeTruthy();
        expect(dbUpdate.activities).toBe(newWeeklyUpdate.activities);
        expect(dbUpdate.highlights).toBe(newWeeklyUpdate.highlights);
        expect(dbUpdate.weekNumber).toBe(newWeeklyUpdate.weekNumber);
        
        console.log('✅ Weekly update verified in database');
      } catch (error) {
        console.error('❌ Database verification failed:', error.message);
        throw error;
      }
    });
  });

  describe('Cross-User Verification', () => {
    test('Student should be able to see admin-created weekly update', async () => {
      try {
        const response = await axios.get(`${API_BASE}/weeks`, {
          headers: {
            Authorization: `Bearer ${studentToken}`
          }
        });
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        
        // Find the update created by admin
        const adminCreatedUpdate = response.data.find(update => 
          update.weekNumber === newWeeklyUpdate.weekNumber
        );
        
        expect(adminCreatedUpdate).toBeDefined();
        expect(adminCreatedUpdate.activities).toBe(newWeeklyUpdate.activities);
        
        console.log('✅ Student can view admin-created weekly update');
      } catch (error) {
        console.error('❌ Cross-user verification failed:', error.response?.data || error.message);
        throw error;
      }
    });

    test('Student should NOT be able to create weekly updates', async () => {
      try {
        const unauthorizedUpdate = {
          weekNumber: 98,
          activities: 'Unauthorized student activities',
          highlights: 'Unauthorized student highlights',
          gallery: [],
          report: ''
        };

        const response = await axios.post(`${API_BASE}/weeks`, unauthorizedUpdate, {
          headers: {
            Authorization: `Bearer ${studentToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        // This should not succeed
        expect(response.status).not.toBe(201);
        
      } catch (error) {
        // This is expected - student should be rejected
        expect(error.response.status).toBe(403);
        expect(error.response.data.message).toBe('Access denied. Admin role required.');
        
        console.log('✅ Student correctly denied admin access');
      }
    });
  });

  describe('API Error Handling', () => {
    test('Invalid credentials should be rejected', async () => {
      try {
        await axios.post(`${API_BASE}/auth/login`, {
          email: studentData.email,
          password: 'wrongpassword'
        });
        
        // Should not reach here
        expect(false).toBe(true);
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toBe('Invalid credentials');
        
        console.log('✅ Invalid credentials correctly rejected');
      }
    });

    test('Requests without authentication should be rejected', async () => {
      try {
        await axios.post(`${API_BASE}/weeks`, newWeeklyUpdate);
        
        // Should not reach here
        expect(false).toBe(true);
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.message).toBe('Access denied. No token provided.');
        
        console.log('✅ Unauthenticated requests correctly rejected');
      }
    });

    test('Duplicate user registration should be rejected', async () => {
      try {
        // Try to register the same student again
        await axios.post(`${API_BASE}/auth/signup`, studentData);
        
        // Should not reach here
        expect(false).toBe(true);
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('already exists');
        
        console.log('✅ Duplicate registration correctly rejected');
      }
    });
  });
});

// Utility functions for expect-like assertions in Node.js
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected ${actual} to be defined`);
      }
    },
    toBeTruthy: () => {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    toContain: (expected) => {
      if (typeof actual === 'string' && !actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
      if (Array.isArray(actual) && !actual.includes(expected)) {
        throw new Error(`Expected array to contain "${expected}"`);
      }
    },
    not: {
      toBe: (expected) => {
        if (actual === expected) {
          throw new Error(`Expected ${actual} not to be ${expected}`);
        }
      }
    }
  };
}

// Run the tests
if (require.main === module) {
  console.log('🚀 Starting Integration Tests...\n');
  
  // Simple test runner
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  async function runTests() {
    try {
      // Connect to database
      await mongoose.connect(TEST_DB);
      console.log('✅ Connected to integration test database\n');
      
      // Clean up existing data
      await User.deleteMany({ email: { $in: [studentData.email, adminData.email] } });
      await WeeklyUpdate.deleteMany({ weekNumber: newWeeklyUpdate.weekNumber });
      
      let studentToken, adminToken;
      
      // Test 1: Student Signup
      totalTests++;
      try {
        const response = await axios.post(`${API_BASE}/auth/signup`, studentData);
        expect(response.status).toBe(201);
        console.log('✅ Test 1: Student signup - PASSED');
        passedTests++;
      } catch (error) {
        console.error('❌ Test 1: Student signup - FAILED:', error.message);
        failedTests++;
      }
      
      // Test 2: Student Login
      totalTests++;
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: studentData.email,
          password: studentData.password
        });
        expect(response.status).toBe(200);
        studentToken = response.data.token;
        console.log('✅ Test 2: Student login - PASSED');
        passedTests++;
      } catch (error) {
        console.error('❌ Test 2: Student login - FAILED:', error.message);
        failedTests++;
      }
      
      // Test 3: Student View Reports
      totalTests++;
      try {
        const response = await axios.get(`${API_BASE}/weeks`, {
          headers: { Authorization: `Bearer ${studentToken}` }
        });
        expect(response.status).toBe(200);
        console.log('✅ Test 3: Student view reports - PASSED');
        passedTests++;
      } catch (error) {
        console.error('❌ Test 3: Student view reports - FAILED:', error.message);
        failedTests++;
      }
      
      // Test 4: Admin Signup
      totalTests++;
      try {
        const response = await axios.post(`${API_BASE}/auth/signup`, adminData);
        expect(response.status).toBe(201);
        console.log('✅ Test 4: Admin signup - PASSED');
        passedTests++;
      } catch (error) {
        console.error('❌ Test 4: Admin signup - FAILED:', error.message);
        failedTests++;
      }
      
      // Test 5: Admin Login
      totalTests++;
      try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: adminData.email,
          password: adminData.password
        });
        expect(response.status).toBe(200);
        adminToken = response.data.token;
        console.log('✅ Test 5: Admin login - PASSED');
        passedTests++;
      } catch (error) {
        console.error('❌ Test 5: Admin login - FAILED:', error.message);
        failedTests++;
      }
      
      // Test 6: Admin Add Weekly Update
      totalTests++;
      try {
        const response = await axios.post(`${API_BASE}/weeks`, newWeeklyUpdate, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(response.status).toBe(201);
        console.log('✅ Test 6: Admin add weekly update - PASSED');
        passedTests++;
      } catch (error) {
        console.error('❌ Test 6: Admin add weekly update - FAILED:', error.message);
        failedTests++;
      }
      
      // Test 7: Verify Update in API
      totalTests++;
      try {
        const response = await axios.get(`${API_BASE}/weeks`);
        expect(response.status).toBe(200);
        const createdUpdate = response.data.find(update => 
          update.weekNumber === newWeeklyUpdate.weekNumber
        );
        expect(createdUpdate).toBeDefined();
        console.log('✅ Test 7: Verify update in API - PASSED');
        passedTests++;
      } catch (error) {
        console.error('❌ Test 7: Verify update in API - FAILED:', error.message);
        failedTests++;
      }
      
    } catch (error) {
      console.error('❌ Integration test setup failed:', error.message);
    } finally {
      // Cleanup
      try {
        await User.deleteMany({ email: { $in: [studentData.email, adminData.email] } });
        await WeeklyUpdate.deleteMany({ weekNumber: newWeeklyUpdate.weekNumber });
        await mongoose.connection.close();
      } catch (error) {
        console.error('Cleanup error:', error.message);
      }
      
      console.log('\n📊 Integration Test Results:');
      console.log(`Total Tests: ${totalTests}`);
      console.log(`✅ Passed: ${passedTests}`);
      console.log(`❌ Failed: ${failedTests}`);
      console.log(`Success Rate: ${((passedTests/totalTests)*100).toFixed(1)}%`);
      
      if (failedTests === 0) {
        console.log('\n🎉 All integration tests passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Some integration tests failed!');
        process.exit(1);
      }
    }
  }
  
  runTests().catch(error => {
    console.error('❌ Integration test runner failed:', error.message);
    process.exit(1);
  });
}
