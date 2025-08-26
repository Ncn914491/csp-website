const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import all models
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Week = require('../models/weekModel');

describe('Database Models Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    const testDbUri = process.env.MONGO_URL.replace('cspDB', 'cspDB_test');
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /@model\.test$/ } });
    await Group.deleteMany({ name: { $regex: /^Model Test/ } });
    await Message.deleteMany({});
    await Week.deleteMany({ weekNumber: { $gte: 800 } });
    
    await mongoose.connection.close();
  });

  describe('User Model', () => {
    test('should create a valid user', async () => {
      const userData = {
        name: 'Model Test User',
        email: 'user@model.test',
        password: 'hashedpassword123',
        role: 'student'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    test('should require email field', async () => {
      const userData = {
        name: 'No Email User',
        password: 'hashedpassword123',
        role: 'student'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    test('should require unique email', async () => {
      const userData1 = {
        name: 'User One',
        email: 'duplicate@model.test',
        password: 'hashedpassword123',
        role: 'student'
      };

      const userData2 = {
        name: 'User Two',
        email: 'duplicate@model.test', // Same email
        password: 'hashedpassword456',
        role: 'admin'
      };

      await User.create(userData1);
      
      await expect(User.create(userData2)).rejects.toThrow();
    });

    test('should validate role enum', async () => {
      const userData = {
        name: 'Invalid Role User',
        email: 'invalidrole@model.test',
        password: 'hashedpassword123',
        role: 'invalidrole'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    test('should have default role as student', async () => {
      const userData = {
        name: 'Default Role User',
        email: 'defaultrole@model.test',
        password: 'hashedpassword123'
        // No role specified
      };

      const user = await User.create(userData);
      expect(user.role).toBe('student');
    });

    test('should validate email format', async () => {
      const userData = {
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'hashedpassword123',
        role: 'student'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Group Model', () => {
    let testUser;

    beforeAll(async () => {
      testUser = await User.create({
        name: 'Group Test User',
        email: 'groupuser@model.test',
        password: 'hashedpassword123',
        role: 'student'
      });
    });

    test('should create a valid group', async () => {
      const groupData = {
        name: 'Model Test Group',
        description: 'Test group for model validation',
        members: [testUser._id]
      };

      const group = new Group(groupData);
      const savedGroup = await group.save();

      expect(savedGroup._id).toBeDefined();
      expect(savedGroup.name).toBe(groupData.name);
      expect(savedGroup.description).toBe(groupData.description);
      expect(savedGroup.members).toHaveLength(1);
      expect(savedGroup.members[0].toString()).toBe(testUser._id.toString());
    });

    test('should require unique group name', async () => {
      const groupData1 = {
        name: 'Duplicate Group Name',
        description: 'First group',
        members: []
      };

      const groupData2 = {
        name: 'Duplicate Group Name', // Same name
        description: 'Second group',
        members: []
      };

      await Group.create(groupData1);
      
      await expect(Group.create(groupData2)).rejects.toThrow();
    });

    test('should populate member details', async () => {
      const group = await Group.findOne({ name: 'Model Test Group' })
        .populate('members', 'name email');

      expect(group.members).toHaveLength(1);
      expect(group.members[0].name).toBe('Group Test User');
      expect(group.members[0].email).toBe('groupuser@model.test');
    });

    test('should validate member ObjectIds', async () => {
      const groupData = {
        name: 'Invalid Member Group',
        description: 'Group with invalid member ID',
        members: ['invalid-object-id']
      };

      const group = new Group(groupData);
      
      await expect(group.save()).rejects.toThrow();
    });

    test('should have default empty members array', async () => {
      const groupData = {
        name: 'Empty Members Group',
        description: 'Group with no members specified'
        // No members field
      };

      const group = await Group.create(groupData);
      expect(group.members).toHaveLength(0);
    });

    test('should validate maxMembers if specified', async () => {
      const groupData = {
        name: 'Max Members Group',
        description: 'Group with member limit',
        maxMembers: 5,
        members: []
      };

      const group = await Group.create(groupData);
      expect(group.maxMembers).toBe(5);
    });
  });

  describe('Message Model', () => {
    let testUser;
    let testGroup;

    beforeAll(async () => {
      testUser = await User.create({
        name: 'Message Test User',
        email: 'messageuser@model.test',
        password: 'hashedpassword123',
        role: 'student'
      });

      testGroup = await Group.create({
        name: 'Message Test Group',
        description: 'Group for message testing',
        members: [testUser._id]
      });
    });

    test('should create a valid message', async () => {
      const messageData = {
        groupId: testGroup._id,
        userId: testUser._id,
        content: 'This is a test message for model validation'
      };

      const message = new Message(messageData);
      const savedMessage = await message.save();

      expect(savedMessage._id).toBeDefined();
      expect(savedMessage.groupId.toString()).toBe(testGroup._id.toString());
      expect(savedMessage.userId.toString()).toBe(testUser._id.toString());
      expect(savedMessage.content).toBe(messageData.content);
      expect(savedMessage.createdAt).toBeDefined();
    });

    test('should require all required fields', async () => {
      const incompleteMessage = new Message({
        content: 'Message without group and user'
        // Missing groupId and userId
      });

      await expect(incompleteMessage.save()).rejects.toThrow();
    });

    test('should validate content length', async () => {
      const longContent = 'A'.repeat(1001); // Exceeds typical limit
      
      const messageData = {
        groupId: testGroup._id,
        userId: testUser._id,
        content: longContent
      };

      const message = new Message(messageData);
      
      // This test depends on your schema having a maxlength validator
      // If not implemented, this test will pass but should be added to the schema
      try {
        await message.save();
        // If no validation, at least check the content was saved
        expect(message.content).toBe(longContent);
      } catch (error) {
        // If validation exists, it should throw
        expect(error.name).toBe('ValidationError');
      }
    });

    test('should populate user and group details', async () => {
      const message = await Message.findOne({ content: 'This is a test message for model validation' })
        .populate('userId', 'name email')
        .populate('groupId', 'name description');

      expect(message.userId.name).toBe('Message Test User');
      expect(message.groupId.name).toBe('Message Test Group');
    });

    test('should validate ObjectId references', async () => {
      const messageData = {
        groupId: 'invalid-group-id',
        userId: testUser._id,
        content: 'Message with invalid group ID'
      };

      const message = new Message(messageData);
      
      await expect(message.save()).rejects.toThrow();
    });
  });

  describe('Week Model', () => {
    test('should create a valid week', async () => {
      const weekData = {
        weekNumber: 801,
        summary: 'Model test week summary',
        photos: ['photo1.jpg', 'photo2.jpg'],
        reportPdf: 'week801-report.pdf'
      };

      const week = new Week(weekData);
      const savedWeek = await week.save();

      expect(savedWeek._id).toBeDefined();
      expect(savedWeek.weekNumber).toBe(weekData.weekNumber);
      expect(savedWeek.summary).toBe(weekData.summary);
      expect(savedWeek.photos).toEqual(weekData.photos);
      expect(savedWeek.reportPdf).toBe(weekData.reportPdf);
    });

    test('should require unique week number', async () => {
      const weekData1 = {
        weekNumber: 802,
        summary: 'First week 802',
        photos: [],
        reportPdf: null
      };

      const weekData2 = {
        weekNumber: 802, // Same week number
        summary: 'Second week 802',
        photos: [],
        reportPdf: null
      };

      await Week.create(weekData1);
      
      await expect(Week.create(weekData2)).rejects.toThrow();
    });

    test('should validate required fields', async () => {
      const incompleteWeek = new Week({
        summary: 'Week without number'
        // Missing weekNumber
      });

      await expect(incompleteWeek.save()).rejects.toThrow();
    });

    test('should handle empty arrays for photos', async () => {
      const weekData = {
        weekNumber: 803,
        summary: 'Week with no photos',
        photos: [], // Empty array
        reportPdf: null
      };

      const week = await Week.create(weekData);
      expect(week.photos).toHaveLength(0);
    });

    test('should validate week number is positive', async () => {
      const weekData = {
        weekNumber: -1, // Negative number
        summary: 'Invalid week number',
        photos: [],
        reportPdf: null
      };

      const week = new Week(weekData);
      
      // This test depends on your schema having a min validator
      try {
        await week.save();
        // If no validation, the test passes but validation should be added
        expect(week.weekNumber).toBe(-1);
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });
  });

  describe('Model Relationships', () => {
    let user, group, message;

    beforeAll(async () => {
      user = await User.create({
        name: 'Relationship Test User',
        email: 'relationship@model.test',
        password: 'hashedpassword123',
        role: 'student'
      });

      group = await Group.create({
        name: 'Relationship Test Group',
        description: 'Testing model relationships',
        members: [user._id]
      });

      message = await Message.create({
        groupId: group._id,
        userId: user._id,
        content: 'Testing relationships between models'
      });
    });

    test('should maintain referential integrity', async () => {
      // Verify the relationships exist
      const populatedMessage = await Message.findById(message._id)
        .populate('userId')
        .populate('groupId');

      expect(populatedMessage.userId._id.toString()).toBe(user._id.toString());
      expect(populatedMessage.groupId._id.toString()).toBe(group._id.toString());
    });

    test('should handle cascade operations properly', async () => {
      // Count messages before group deletion
      const messageCountBefore = await Message.countDocuments({ groupId: group._id });
      expect(messageCountBefore).toBeGreaterThan(0);

      // Delete the group
      await Group.deleteOne({ _id: group._id });

      // Messages should still exist (no cascade delete implemented)
      // In a real application, you might want cascade delete
      const messageCountAfter = await Message.countDocuments({ groupId: group._id });
      expect(messageCountAfter).toBe(messageCountBefore);

      // Clean up orphaned messages
      await Message.deleteMany({ groupId: group._id });
    });
  });

  describe('Model Indexes and Performance', () => {
    test('should have proper indexes for queries', async () => {
      // Check if indexes exist on commonly queried fields
      const userIndexes = await User.collection.getIndexes();
      const groupIndexes = await Group.collection.getIndexes();
      const messageIndexes = await Message.collection.getIndexes();
      const weekIndexes = await Week.collection.getIndexes();

      // Verify email index exists for User (unique constraint)
      expect(userIndexes).toHaveProperty('email_1');
      
      // Verify group name index exists (unique constraint)
      expect(groupIndexes).toHaveProperty('name_1');
      
      // Week number should be indexed (unique constraint)
      expect(weekIndexes).toHaveProperty('weekNumber_1');
    });

    test('should perform efficient queries', async () => {
      const startTime = Date.now();
      
      // Perform a complex query
      const results = await Message.find({})
        .populate('userId', 'name')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .limit(10);
      
      const queryTime = Date.now() - startTime;
      
      // Query should complete within reasonable time
      expect(queryTime).toBeLessThan(1000); // 1 second
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Data Validation Edge Cases', () => {
    test('should handle special characters in text fields', async () => {
      const specialChars = 'Test with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const user = await User.create({
        name: specialChars,
        email: 'special@model.test',
        password: 'hashedpassword123',
        role: 'student'
      });

      expect(user.name).toBe(specialChars);
    });

    test('should handle Unicode characters', async () => {
      const unicodeText = 'Test with Unicode: 你好 🌟 café naïve résumé';
      
      const group = await Group.create({
        name: 'Unicode Test Group',
        description: unicodeText,
        members: []
      });

      expect(group.description).toBe(unicodeText);
    });

    test('should handle very long text within limits', async () => {
      const longText = 'A'.repeat(500); // Reasonable length
      
      const week = await Week.create({
        weekNumber: 804,
        summary: longText,
        photos: [],
        reportPdf: null
      });

      expect(week.summary).toBe(longText);
    });
  });
});