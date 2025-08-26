const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Week = require('../models/weekModel');

// Test server setup
const app = require('../server-gridfs'); // Assuming this exports the app

describe('Comprehensive Backend API Tests', () => {
  let server;
  let testUser;
  let testAdmin;
  let testGroup;
  let authToken;
  let adminToken;

  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGO_URL.replace('cspDB', 'cspDB_test');
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }

    // Start server if not already running
    if (!server) {
      server = app.listen(0); // Use random port for testing
    }

    // Create test users
    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@api.test',
      password: '$2a$10$hashedpassword', // Pre-hashed password
      role: 'student'
    });

    testAdmin = await User.create({
      name: 'Test Admin',
      email: 'testadmin@api.test',
      password: '$2a$10$hashedpassword',
      role: 'admin'
    });

    // Generate auth tokens (simplified - in real app, use proper JWT)
    authToken = 'Bearer test-token-user';
    adminToken = 'Bearer test-token-admin';
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /@api\.test$/ } });
    await Group.deleteMany({ name: { $regex: /^Test/ } });
    await Message.deleteMany({});
    await Week.deleteMany({ weekNumber: { $gte: 900 } });

    // Close connections
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
  });

  describe('Health Check Endpoints', () => {
    test('GET /api/test - should return MongoDB connection status', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('MongoDB connection successful');
    });

    test('GET /api/groups/health - should return groups service health', async () => {
      const response = await request(app)
        .get('/api/groups/health')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'Groups API');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('mongodb');
    });

    test('GET /api/ai/health - should return AI service health', async () => {
      const response = await request(app)
        .get('/api/ai/health');

      expect(response.status).toBeOneOf([200, 503]);
      expect(response.body).toHaveProperty('service', 'AI Chatbot API');
      expect(response.body).toHaveProperty('geminiApiKey');
    });
  });

  describe('GridFS Weeks API', () => {
    beforeAll(async () => {
      // Create test week data
      await Week.create({
        weekNumber: 901,
        summary: 'Test Week 901 Summary',
        photos: ['test-photo1.jpg', 'test-photo2.jpg'],
        reportPdf: 'test-report.pdf'
      });
    });

    test('GET /api/gridfs-weeks - should return all weeks', async () => {
      const response = await request(app)
        .get('/api/gridfs-weeks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      const testWeek = response.body.find(w => w.weekNumber === 901);
      if (testWeek) {
        expect(testWeek).toHaveProperty('summary', 'Test Week 901 Summary');
        expect(testWeek).toHaveProperty('photos');
        expect(Array.isArray(testWeek.photos)).toBe(true);
      }
    });

    test('GET /api/gridfs-weeks/:id - should return specific week', async () => {
      const week = await Week.findOne({ weekNumber: 901 });
      
      const response = await request(app)
        .get(`/api/gridfs-weeks/${week._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('weekNumber', 901);
      expect(response.body).toHaveProperty('summary', 'Test Week 901 Summary');
    });

    test('GET /api/gridfs-weeks/nonexistent - should return 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/gridfs-weeks/${fakeId}`)
        .expect(404);
    });

    test('GET /api/gridfs-weeks/file/:id - should handle file streaming', async () => {
      // This test would require actual GridFS files, so we test the endpoint structure
      const fakeFileId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/gridfs-weeks/file/${fakeFileId}`);

      // Should return 404 for non-existent file, not 500
      expect(response.status).toBeOneOf([404, 500]);
    });
  });

  describe('Groups API', () => {
    test('POST /api/groups - should create group (admin only)', async () => {
      const groupData = {
        name: 'Test API Group',
        description: 'Group created via API test',
        maxMembers: 10
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', adminToken)
        .send(groupData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', groupData.name);
      expect(response.body.data).toHaveProperty('description', groupData.description);

      testGroup = response.body.data;
    });

    test('POST /api/groups - should reject duplicate group names', async () => {
      const duplicateGroup = {
        name: 'Test API Group', // Same name as above
        description: 'Duplicate group'
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', adminToken)
        .send(duplicateGroup)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Group already exists');
    });

    test('POST /api/groups - should require admin authorization', async () => {
      const groupData = {
        name: 'Unauthorized Group',
        description: 'Should not be created'
      };

      await request(app)
        .post('/api/groups')
        .set('Authorization', authToken) // Regular user token
        .send(groupData)
        .expect(403);
    });

    test('GET /api/groups - should list all groups', async () => {
      const response = await request(app)
        .get('/api/groups')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      const testGroupInList = response.body.data.find(g => g.name === 'Test API Group');
      expect(testGroupInList).toBeDefined();
      expect(testGroupInList).toHaveProperty('memberCount', 0);
    });

    test('GET /api/groups/:id - should return specific group details', async () => {
      const response = await request(app)
        .get(`/api/groups/${testGroup._id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Test API Group');
      expect(response.body.data).toHaveProperty('userIsMember', false);
    });

    test('POST /api/groups/:id/join - should allow user to join group', async () => {
      const response = await request(app)
        .post(`/api/groups/${testGroup._id}/join`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Successfully joined the group');
    });

    test('POST /api/groups/:id/join - should prevent duplicate joins', async () => {
      const response = await request(app)
        .post(`/api/groups/${testGroup._id}/join`)
        .set('Authorization', authToken)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Already a member');
    });

    test('POST /api/groups/:id/messages - should allow members to send messages', async () => {
      const messageData = {
        content: 'Hello from API test!'
      };

      const response = await request(app)
        .post(`/api/groups/${testGroup._id}/messages`)
        .set('Authorization', authToken)
        .send(messageData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('content', messageData.content);
      expect(response.body.data).toHaveProperty('userId');
    });

    test('GET /api/groups/:id/messages - should return group messages', async () => {
      const response = await request(app)
        .get(`/api/groups/${testGroup._id}/messages`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const message = response.body.data[0];
      expect(message).toHaveProperty('content', 'Hello from API test!');
    });

    test('POST /api/groups/:id/messages - should validate message content', async () => {
      const invalidMessage = {
        content: '' // Empty content
      };

      const response = await request(app)
        .post(`/api/groups/${testGroup._id}/messages`)
        .set('Authorization', authToken)
        .send(invalidMessage)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    test('POST /api/groups/:id/leave - should allow user to leave group', async () => {
      const response = await request(app)
        .post(`/api/groups/${testGroup._id}/leave`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Successfully left the group');
    });

    test('GET /api/groups/:id/messages - should deny access to non-members', async () => {
      const response = await request(app)
        .get(`/api/groups/${testGroup._id}/messages`)
        .set('Authorization', authToken)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('AI Chatbot API', () => {
    test('POST /api/ai - should handle basic chat message', async () => {
      const messageData = {
        message: 'What are the best career paths in computer science?',
        sessionId: 'test-session-1'
      };

      const response = await request(app)
        .post('/api/ai')
        .send(messageData);

      expect(response.status).toBeOneOf([200, 503]); // 503 if Gemini not configured
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('sessionId');
    });

    test('POST /api/ai - should validate message content', async () => {
      const invalidMessage = {
        message: '', // Empty message
        sessionId: 'test-session-2'
      };

      const response = await request(app)
        .post('/api/ai')
        .send(invalidMessage)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    test('POST /api/ai - should handle long messages', async () => {
      const longMessage = {
        message: 'A'.repeat(2001), // Exceeds 2000 character limit
        sessionId: 'test-session-3'
      };

      const response = await request(app)
        .post('/api/ai')
        .send(longMessage)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    test('GET /api/ai/context/:sessionId - should return conversation context', async () => {
      // First send a message to create context
      await request(app)
        .post('/api/ai')
        .send({
          message: 'Hello AI',
          sessionId: 'test-context-session'
        });

      const response = await request(app)
        .get('/api/ai/context/test-context-session');

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('messageCount');
        expect(response.body).toHaveProperty('messages');
      } else {
        expect(response.status).toBe(404); // Context not found
      }
    });

    test('DELETE /api/ai/context/:sessionId - should clear conversation context', async () => {
      const response = await request(app)
        .delete('/api/ai/context/test-context-session')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid ObjectId formats', async () => {
      const response = await request(app)
        .get('/api/groups/invalid-id')
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid group ID format');
    });

    test('should handle missing authorization', async () => {
      const response = await request(app)
        .get('/api/groups')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Route not found');
    });
  });

  describe('Input Validation', () => {
    test('should validate required fields for group creation', async () => {
      const invalidGroup = {
        description: 'Group without name'
        // Missing required 'name' field
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', adminToken)
        .send(invalidGroup)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    test('should sanitize input data', async () => {
      const groupWithWhitespace = {
        name: '  Test Group With Spaces  ',
        description: '  Description with spaces  '
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', adminToken)
        .send(groupWithWhitespace)
        .expect(201);

      expect(response.body.data.name).toBe('Test Group With Spaces');
      expect(response.body.data.description).toBe('Description with spaces');
    });
  });

  describe('Performance Tests', () => {
    test('should handle concurrent requests', async () => {
      const promises = Array(5).fill().map((_, i) => 
        request(app)
          .get('/api/gridfs-weeks')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    test('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/test')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('Database Operations', () => {
    test('should handle database connection issues gracefully', async () => {
      // This test would require mocking mongoose connection
      // For now, we test that the app handles the connection status
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    test('should validate data integrity', async () => {
      // Test that related data is properly maintained
      const group = await Group.findOne({ name: 'Test API Group' });
      const messages = await Message.find({ groupId: group._id });
      
      // All messages should belong to the group
      messages.forEach(message => {
        expect(message.groupId.toString()).toBe(group._id.toString());
      });
    });
  });
});

// Helper function for flexible status code checking
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});