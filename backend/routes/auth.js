const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const localData = require('../local-data');
const jwtMiddleware = require('../jwtMiddleware');

// POST /api/register - Create a new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    let existingUser, newUser;

    if (req.isMongoConnected) {
      // MongoDB operations
      existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this username' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create new user
      newUser = new User({
        username: username.trim(),
        passwordHash,
        role: role || 'student'
      });

      // Save user to database
      await newUser.save();
    } else {
      // Local data operations
      existingUser = localData.findUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this username' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create new user
      newUser = localData.addUser({
        username: username.trim(),
        passwordHash,
        role: role || 'student'
      });
    }

    // Return success response (don't include password hash)
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// POST /api/login - Verify username/password and return JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    let user;

    if (req.isMongoConnected) {
      // MongoDB operations - case insensitive search
      user = await User.findOne({ 
        username: { $regex: new RegExp(`^${username.trim()}$`, 'i') }
      });
    } else {
      // Local data operations
      user = localData.findUserByUsername(username.trim());
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Create JWT payload
    const payload = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    };

    // Sign JWT token (expires in 24 hours)
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Return token and user info
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// GET /api/protected - Protected route using JWT middleware
router.get('/protected', jwtMiddleware, async (req, res) => {
  try {
    res.json({
      message: 'Protected route accessed successfully',
      user: {
        id: req.user._id.toString(),
        username: req.user.username,
        role: req.user.role,
        accessTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Protected route error:', error);
    res.status(500).json({ message: 'Server error in protected route', error: error.message });
  }
});

module.exports = router;