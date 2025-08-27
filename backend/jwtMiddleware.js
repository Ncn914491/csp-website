const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');

const jwtMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);
    
    if (!token || token.trim() === '') {
      return res.status(401).json({ 
        message: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded.userId || !decoded.username) {
      return res.status(401).json({ 
        message: 'Invalid token payload',
        code: 'INVALID_PAYLOAD'
      });
    }
    
    if (req.isMongoConnected) {
      // MongoDB mode - validate ObjectId and find user
      if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
        return res.status(401).json({ 
          message: 'Invalid user ID in token',
          code: 'INVALID_USER_ID'
        });
      }
      
      // Find user by ID from token
      const user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (!user) {
        return res.status(401).json({ 
          message: 'User not found. Token may be invalid.',
          code: 'USER_NOT_FOUND'
        });
      }

      // Attach user info to request object
      req.user = {
        _id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      };
    } else {
      // Local data mode - create user object from token
      req.user = {
        _id: decoded.userId,
        username: decoded.username,
        role: decoded.role || 'student'
      };
    }
    
    next();
  } catch (error) {
    console.error('JWT Middleware Error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token signature',
        code: 'INVALID_SIGNATURE'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'CastError') {
      return res.status(401).json({ 
        message: 'Invalid token format',
        code: 'CAST_ERROR'
      });
    } else {
      return res.status(401).json({ 
        message: 'Token verification failed',
        code: 'VERIFICATION_FAILED',
        error: error.message
      });
    }
  }
};

module.exports = jwtMiddleware;