const express = require('express');
const router = express.Router();
const SchoolVisit = require('../models/SchoolVisit');
const localData = require('../local-data');
const { adminAuth } = require('../middleware/auth');

// GET all visits
router.get('/', async (req, res) => {
  try {
    let visits;
    if (req.isMongoConnected) {
      visits = await SchoolVisit.find().sort({ date: -1 });
    } else {
      visits = localData.getSchoolVisits().sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single visit
router.get('/:id', async (req, res) => {
  try {
    const visit = await SchoolVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create visit (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, date, description, images } = req.body;
    
    const visit = new SchoolVisit({
      title,
      date,
      description,
      images: images || []
    });

    await visit.save();
    res.status(201).json(visit);
  } catch (error) {
    res.status(400).json({ message: 'Error creating visit', error: error.message });
  }
});

// PUT update visit (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, date, description, images } = req.body;
    
    const visit = await SchoolVisit.findByIdAndUpdate(
      req.params.id,
      { title, date, description, images },
      { new: true, runValidators: true }
    );

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    res.json(visit);
  } catch (error) {
    res.status(400).json({ message: 'Error updating visit', error: error.message });
  }
});

// DELETE visit (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const visit = await SchoolVisit.findByIdAndDelete(req.params.id);
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    res.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;