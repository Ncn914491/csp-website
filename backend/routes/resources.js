const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const localData = require('../local-data');
const { adminAuth } = require('../middleware/auth');

// GET all resources
router.get('/', async (req, res) => {
  try {
    const { type, tags } = req.query;
    let resources;
    
    if (req.isMongoConnected) {
      let filter = {};
      
      if (type) {
        filter.type = type;
      }
      
      if (tags) {
        filter.tags = { $in: tags.split(',') };
      }
      
      resources = await Resource.find(filter).sort({ createdAt: -1 });
    } else {
      resources = localData.getResources();
      
      // Apply filters for local data
      if (type) {
        resources = resources.filter(r => r.type === type);
      }
      
      if (tags) {
        const tagArray = tags.split(',');
        resources = resources.filter(r => 
          r.tags && r.tags.some(tag => tagArray.includes(tag))
        );
      }
      
      resources.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single resource
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create resource (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, type, url, tags } = req.body;
    
    const resource = new Resource({
      title,
      type,
      url,
      tags: tags || []
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    res.status(400).json({ message: 'Error creating resource', error: error.message });
  }
});

// PUT update resource (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, type, url, tags } = req.body;
    
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { title, type, url, tags },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    res.status(400).json({ message: 'Error updating resource', error: error.message });
  }
});

// DELETE resource (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;