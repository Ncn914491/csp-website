const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Group = require('../models/Group');
const Message = require('../models/Message');
const jwtMiddleware = require('../jwtMiddleware');

// Create auth middleware that works with both MongoDB and local data
const auth = async (req, res, next) => {
  try {
    if (req.isMongoConnected) {
      return jwtMiddleware(req, res, next);
    } else {
      // For local data mode, skip auth for development
      req.user = { _id: 'local-user', username: 'local', role: 'student' };
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    if (req.isMongoConnected) {
      return jwtMiddleware(req, res, (err) => {
        if (err) return res.status(401).json({ message: 'Authentication failed' });
        if (req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Admin access required' });
        }
        next();
      });
    } else {
      // For local data mode, skip auth for development
      req.user = { _id: 'local-admin', username: 'admin', role: 'admin' };
      next();
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Health check endpoint for Groups service
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      service: "Groups API",
      timestamp: new Date().toISOString(),
      mongodb: req.isMongoConnected ? "connected" : "disconnected"
    };

    if (req.isMongoConnected) {
      const groupCount = await Group.countDocuments();
      const messageCount = await Message.countDocuments();
      healthStatus.groupCount = groupCount;
      healthStatus.messageCount = messageCount;
    }

    const status = req.isMongoConnected ? 200 : 503;
    res.status(status).json(healthStatus);
  } catch (err) {
    res.status(500).json({
      service: "Groups API",
      status: "error",
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Create group (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required for group operations"
      });
    }

    const { name, description, maxMembers } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: "Validation failed",
        message: "Group name is required and cannot be empty"
      });
    }

    // Check if group name already exists
    const existingGroup = await Group.findOne({ name: name.trim() });
    if (existingGroup) {
      return res.status(409).json({ 
        error: "Group already exists",
        message: `A group with the name "${name.trim()}" already exists`
      });
    }

    const groupData = {
      name: name.trim(),
      description: description?.trim() || '',
      members: []
    };

    if (maxMembers && typeof maxMembers === 'number' && maxMembers > 0) {
      groupData.maxMembers = maxMembers;
    }

    const group = await Group.create(groupData);
    
    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group
    });
  } catch (err) {
    console.error('Group creation error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation failed",
        message: err.message,
        details: Object.keys(err.errors).map(key => ({
          field: key,
          message: err.errors[key].message
        }))
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create group",
      message: err.message 
    });
  }
});

// List groups with enhanced information
router.get('/', auth, async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required"
      });
    }

    const groups = await Group.find({})
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    // Add additional information for each group
    const enrichedGroups = await Promise.all(groups.map(async (group) => {
      const groupObj = group.toObject();
      
      // Get recent message count
      const recentMessageCount = await Message.countDocuments({
        groupId: group._id,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      // Get last message
      const lastMessage = await Message.findOne({ groupId: group._id })
        .sort({ createdAt: -1 })
        .populate('userId', 'name');

      return {
        ...groupObj,
        memberCount: group.members.length,
        recentMessageCount,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          sender: lastMessage.userId?.name || 'Unknown',
          timestamp: lastMessage.createdAt
        } : null,
        isMember: group.members.some(member => 
          member._id.toString() === req.user._id.toString()
        )
      };
    }));

    res.json({
      success: true,
      count: enrichedGroups.length,
      data: enrichedGroups
    });
  } catch (err) {
    console.error('Groups listing error:', err);
    res.status(500).json({ 
      error: "Failed to list groups",
      message: err.message 
    });
  }
});

// Get single group details
router.get('/:groupId', auth, async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required"
      });
    }

    const { groupId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ 
        error: "Invalid group ID format",
        message: "Please provide a valid group ID"
      });
    }

    const group = await Group.findById(groupId)
      .populate('members', 'name email role');

    if (!group) {
      return res.status(404).json({ 
        error: "Group not found",
        message: `No group found with ID: ${groupId}`
      });
    }

    // Check if user is a member
    const userIsMember = group.members.some(member => 
      member._id.toString() === req.user._id.toString()
    );

    // Get message statistics
    const messageCount = await Message.countDocuments({ groupId: group._id });
    const recentMessageCount = await Message.countDocuments({
      groupId: group._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const groupData = {
      ...group.toObject(),
      memberCount: group.members.length,
      messageCount,
      recentMessageCount,
      userIsMember
    };

    res.json({
      success: true,
      data: groupData
    });
  } catch (err) {
    console.error('Group details error:', err);
    res.status(500).json({ 
      error: "Failed to fetch group details",
      message: err.message 
    });
  }
});

// Join group
router.post('/:groupId/join', auth, async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required"
      });
    }

    const { groupId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ 
        error: "Invalid group ID format",
        message: "Please provide a valid group ID"
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        error: "Group not found",
        message: `No group found with ID: ${groupId}`
      });
    }

    const userId = req.user._id;
    const isAlreadyMember = group.members.some(m => m.toString() === userId.toString());

    if (isAlreadyMember) {
      return res.status(409).json({ 
        error: "Already a member",
        message: "You are already a member of this group"
      });
    }

    // Check if group has reached maximum capacity
    if (group.maxMembers && group.members.length >= group.maxMembers) {
      return res.status(409).json({ 
        error: "Group is full",
        message: `This group has reached its maximum capacity of ${group.maxMembers} members`
      });
    }

    group.members.push(userId);
    await group.save();

    res.json({
      success: true,
      message: "Successfully joined the group",
      data: {
        groupId: group._id,
        groupName: group.name,
        memberCount: group.members.length
      }
    });
  } catch (err) {
    console.error('Join group error:', err);
    res.status(500).json({ 
      error: "Failed to join group",
      message: err.message 
    });
  }
});

// Leave group
router.post('/:groupId/leave', auth, async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required"
      });
    }

    const { groupId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ 
        error: "Invalid group ID format",
        message: "Please provide a valid group ID"
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        error: "Group not found",
        message: `No group found with ID: ${groupId}`
      });
    }

    const userId = req.user._id.toString();
    const isMember = group.members.some(m => m.toString() === userId);

    if (!isMember) {
      return res.status(409).json({ 
        error: "Not a member",
        message: "You are not a member of this group"
      });
    }

    group.members = group.members.filter(m => m.toString() !== userId);
    await group.save();

    res.json({
      success: true,
      message: "Successfully left the group",
      data: {
        groupId: group._id,
        groupName: group.name,
        memberCount: group.members.length
      }
    });
  } catch (err) {
    console.error('Leave group error:', err);
    res.status(500).json({ 
      error: "Failed to leave group",
      message: err.message 
    });
  }
});

// Delete group (admin)
router.delete('/:groupId', adminAuth, async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required"
      });
    }

    const { groupId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ 
        error: "Invalid group ID format",
        message: "Please provide a valid group ID"
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        error: "Group not found",
        message: `No group found with ID: ${groupId}`
      });
    }

    // Count messages before deletion
    const messageCount = await Message.countDocuments({ groupId });
    
    // Delete all messages associated with the group
    await Message.deleteMany({ groupId });
    
    // Delete the group
    await Group.deleteOne({ _id: groupId });

    res.json({
      success: true,
      message: "Group deleted successfully",
      data: {
        deletedGroup: {
          id: group._id,
          name: group.name,
          memberCount: group.members.length
        },
        deletedMessages: messageCount
      }
    });
  } catch (err) {
    console.error('Delete group error:', err);
    res.status(500).json({ 
      error: "Failed to delete group",
      message: err.message 
    });
  }
});

// List messages for a group (members only)
router.get('/:groupId/messages', auth, async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required"
      });
    }

    const { groupId } = req.params;

    // Validate ObjectId format
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ 
        error: "Invalid group ID format",
        message: "Please provide a valid group ID"
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        error: "Group not found",
        message: `No group found with ID: ${groupId}`
      });
    }

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ 
        error: "Access denied",
        message: "You must be a group member to view messages"
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get messages with pagination
    const messages = await Message.find({ groupId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments({ groupId });
    const totalPages = Math.ceil(totalMessages / limit);

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ 
      error: "Failed to fetch messages",
      message: err.message 
    });
  }
});

// Send message to a group (members only)
router.post('/:groupId/messages', auth, async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required"
      });
    }

    const { groupId } = req.params;
    const { content } = req.body;

    // Validate ObjectId format
    if (!isValidObjectId(groupId)) {
      return res.status(400).json({ 
        error: "Invalid group ID format",
        message: "Please provide a valid group ID"
      });
    }

    // Validate message content
    if (!content || !content.trim()) {
      return res.status(400).json({ 
        error: "Validation failed",
        message: "Message content is required and cannot be empty"
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({ 
        error: "Validation failed",
        message: "Message content cannot exceed 1000 characters"
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        error: "Group not found",
        message: `No group found with ID: ${groupId}`
      });
    }

    const isMember = group.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ 
        error: "Access denied",
        message: "You must be a group member to send messages"
      });
    }

    const message = await Message.create({ 
      groupId, 
      userId: req.user._id, 
      content: content.trim() 
    });

    // Populate user information for the response
    await message.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message
    });
  } catch (err) {
    console.error('Send message error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation failed",
        message: err.message
      });
    }
    
    res.status(500).json({ 
      error: "Failed to send message",
      message: err.message 
    });
  }
});

module.exports = router;


