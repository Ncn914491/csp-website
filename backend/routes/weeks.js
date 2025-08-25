const express = require('express');
const router = express.Router();
const WeeklyUpdate = require('../models/WeeklyUpdate');
const localData = require('../local-data');
const { adminAuth } = require('../middleware/auth');

// GET all weekly updates
router.get('/', async (req, res) => {
  try {
    let weeks;
    if (req.isMongoConnected) {
      weeks = await WeeklyUpdate.find().sort({ weekNumber: -1 });
    } else {
      weeks = localData.getWeeklyUpdates().sort((a, b) => b.weekNumber - a.weekNumber);
    }
    res.json(weeks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single weekly update
router.get('/:id', async (req, res) => {
  try {
    const week = await WeeklyUpdate.findById(req.params.id);
    if (!week) {
      return res.status(404).json({ message: 'Weekly update not found' });
    }
    res.json(week);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create weekly update (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { weekNumber, activities, highlights } = req.body;
    
    const week = new WeeklyUpdate({
      weekNumber,
      activities,
      highlights
    });

    await week.save();
    res.status(201).json(week);
  } catch (error) {
    res.status(400).json({ message: 'Error creating weekly update', error: error.message });
  }
});

// PUT update weekly update (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { weekNumber, activities, highlights } = req.body;
    
    const week = await WeeklyUpdate.findByIdAndUpdate(
      req.params.id,
      { weekNumber, activities, highlights },
      { new: true, runValidators: true }
    );

    if (!week) {
      return res.status(404).json({ message: 'Weekly update not found' });
    }

    res.json(week);
  } catch (error) {
    res.status(400).json({ message: 'Error updating weekly update', error: error.message });
  }
});

// DELETE weekly update (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const week = await WeeklyUpdate.findByIdAndDelete(req.params.id);
    
    if (!week) {
      return res.status(404).json({ message: 'Weekly update not found' });
    }

    res.json({ message: 'Weekly update deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;