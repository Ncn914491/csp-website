const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const SchoolVisit = require('../models/SchoolVisit');
const WeeklyUpdate = require('../models/WeeklyUpdate');
const Resource = require('../models/Resource');

describe('Backend Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const testDb = process.env.MONGO_URL.replace('cspDB', 'cspDB_test');
    await mongoose.connect(testDb);
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /test/ } });
    await SchoolVisit.deleteMany({ title: { $regex: /test/i } });
    await WeeklyUpdate.deleteMany({ weekNumber: { $in: [99, 100] } });
    await Resource.deleteMany({ title: { $regex: /test/i } });
    
    // Close database connection
    await mongoose.connection.close();
  });

  describe('MongoDB Connection', () => {
    test('should connect to MongoDB successfully', () => {
      expect(mongoose.connection.readyState).toBe(1);
    });

    test('should use correct database name', () => {
      expect(mongoose.connection.name).toBe('cspDB_test');
    });
  });

  describe('Database Models', () => {
    test('should create and retrieve a User', async () => {
      const userData = {
        name: 'Test User',
        email: 'testuser@backend.test',
        password: 'hashedpassword123',
        role: 'student'
      };

      const user = new User(userData);
      await user.save();

      const foundUser = await User.findOne({ email: userData.email });
      expect(foundUser).toBeTruthy();
      expect(foundUser.name).toBe(userData.name);
      expect(foundUser.email).toBe(userData.email);
      expect(foundUser.role).toBe(userData.role);
    });

    test('should create and retrieve a SchoolVisit', async () => {
      const visitData = {
        title: 'Test School Visit',
        date: new Date(),
        description: 'Test description for school visit',
        images: ['test-image1.jpg', 'test-image2.jpg']
      };

      const visit = new SchoolVisit(visitData);
      await visit.save();

      const foundVisit = await SchoolVisit.findOne({ title: visitData.title });
      expect(foundVisit).toBeTruthy();
      expect(foundVisit.title).toBe(visitData.title);
      expect(foundVisit.description).toBe(visitData.description);
      expect(foundVisit.images).toEqual(visitData.images);
    });

    test('should create and retrieve a WeeklyUpdate', async () => {
      const updateData = {
        weekNumber: 99,
        activities: 'Test activities for the week',
        highlights: 'Test highlights for the week',
        gallery: ['test-gallery1.jpg', 'test-gallery2.jpg'],
        report: 'test-report.pdf'
      };

      const update = new WeeklyUpdate(updateData);
      await update.save();

      const foundUpdate = await WeeklyUpdate.findOne({ weekNumber: updateData.weekNumber });
      expect(foundUpdate).toBeTruthy();
      expect(foundUpdate.weekNumber).toBe(updateData.weekNumber);
      expect(foundUpdate.activities).toBe(updateData.activities);
      expect(foundUpdate.highlights).toBe(updateData.highlights);
      expect(foundUpdate.gallery).toEqual(updateData.gallery);
      expect(foundUpdate.report).toBe(updateData.report);
    });

    test('should create and retrieve a Resource', async () => {
      const resourceData = {
        title: 'Test Resource',
        type: 'PDF',
        url: 'test-resource.pdf',
        tags: ['test', 'resource', 'backend']
      };

      const resource = new Resource(resourceData);
      await resource.save();

      const foundResource = await Resource.findOne({ title: resourceData.title });
      expect(foundResource).toBeTruthy();
      expect(foundResource.title).toBe(resourceData.title);
      expect(foundResource.type).toBe(resourceData.type);
      expect(foundResource.url).toBe(resourceData.url);
      expect(foundResource.tags).toEqual(resourceData.tags);
    });
  });

  describe('Data Validation', () => {
    test('should require all required fields for User', async () => {
      const incompleteUser = new User({
        name: 'Incomplete User'
        // Missing email, password, role
      });

      try {
        await incompleteUser.save();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toContain('email');
        expect(error.message).toContain('password');
      }
    });

    test('should require all required fields for SchoolVisit', async () => {
      const incompleteVisit = new SchoolVisit({
        title: 'Incomplete Visit'
        // Missing date, description
      });

      try {
        await incompleteVisit.save();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toContain('date');
        expect(error.message).toContain('description');
      }
    });

    test('should require unique weekNumber for WeeklyUpdate', async () => {
      // Create first update
      const update1 = new WeeklyUpdate({
        weekNumber: 100,
        activities: 'First activities',
        highlights: 'First highlights'
      });
      await update1.save();

      // Try to create duplicate weekNumber
      const update2 = new WeeklyUpdate({
        weekNumber: 100,
        activities: 'Second activities',
        highlights: 'Second highlights'
      });

      try {
        await update2.save();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe(11000); // Duplicate key error
      }
    });

    test('should validate Resource type enum', async () => {
      const invalidResource = new Resource({
        title: 'Invalid Resource',
        type: 'InvalidType',
        url: 'test-url.txt',
        tags: ['test']
      });

      try {
        await invalidResource.save();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.message).toContain('enum');
      }
    });
  });

  describe('Data Queries', () => {
    beforeAll(async () => {
      // Create test data for queries
      await SchoolVisit.create([
        {
          title: 'Query Test Visit 1',
          date: new Date('2024-01-01'),
          description: 'First test visit',
          images: ['image1.jpg']
        },
        {
          title: 'Query Test Visit 2',
          date: new Date('2024-02-01'),
          description: 'Second test visit',
          images: ['image2.jpg', 'image3.jpg']
        }
      ]);
    });

    test('should find all school visits', async () => {
      const visits = await SchoolVisit.find();
      expect(visits.length).toBeGreaterThanOrEqual(2);
      
      const testVisits = visits.filter(v => v.title.includes('Query Test'));
      expect(testVisits.length).toBe(2);
    });

    test('should find resources by type', async () => {
      // First create some test resources
      await Resource.create([
        {
          title: 'Test PDF Resource',
          type: 'PDF',
          url: 'test.pdf',
          tags: ['test']
        },
        {
          title: 'Test Video Resource',
          type: 'Video',
          url: 'test.mp4',
          tags: ['test']
        }
      ]);

      const pdfResources = await Resource.find({ type: 'PDF' });
      const videoResources = await Resource.find({ type: 'Video' });
      
      expect(pdfResources.length).toBeGreaterThanOrEqual(1);
      expect(videoResources.length).toBeGreaterThanOrEqual(1);
      
      // Verify all PDFs are actually PDF type
      pdfResources.forEach(resource => {
        expect(resource.type).toBe('PDF');
      });
    });
  });
});
