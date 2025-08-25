const express = require('express');
const router = express.Router();
const WeeklyUpdate = require('../models/WeeklyUpdate');
const localData = require('../local-data');
const { adminAuth } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Helper function to get photos and PDF for a week
const getWeekAssets = (weekNumber) => {
  const weekFolder = path.join(__dirname, '../../csp', `week${weekNumber}`);
  const assets = {
    gallery: [],
    reportURL: ''
  };

  try {
    // Check if week folder exists
    if (fs.existsSync(weekFolder)) {
      // Get all image files from the week folder
      const files = fs.readdirSync(weekFolder);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const pdfExtensions = ['.pdf'];

      files.forEach(file => {
        const fileExt = path.extname(file).toLowerCase();
        const filePath = `/csp/week${weekNumber}/${file}`;

        if (imageExtensions.includes(fileExt)) {
          assets.gallery.push({
            url: filePath,
            caption: path.basename(file, fileExt).replace(/[_-]/g, ' ')
          });
        } else if (pdfExtensions.includes(fileExt)) {
          assets.reportURL = filePath;
        }
      });
    }
  } catch (error) {
    console.error(`Error reading assets for week ${weekNumber}:`, error.message);
  }

  return assets;
};

// GET all weekly updates
router.get('/', async (req, res) => {
  try {
    let weeks;
    if (req.isMongoConnected) {
      weeks = await WeeklyUpdate.find().sort({ weekNumber: -1 });
    } else {
      weeks = localData.getWeeklyUpdates().sort((a, b) => b.weekNumber - a.weekNumber);
    }
    
    // Enhance each week with file system assets
    const enhancedWeeks = weeks.map(week => {
      const weekData = week.toObject ? week.toObject() : week;
      const assets = getWeekAssets(weekData.weekNumber);
      
      return {
        ...weekData,
        gallery: weekData.gallery && weekData.gallery.length > 0 ? weekData.gallery : assets.gallery,
        reportURL: weekData.reportURL || assets.reportURL
      };
    });
    
    res.json(enhancedWeeks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single weekly update
router.get('/:id', async (req, res) => {
  try {
    let week;
    if (req.isMongoConnected) {
      week = await WeeklyUpdate.findById(req.params.id);
    } else {
      week = localData.getWeeklyUpdates().find(w => w._id === req.params.id);
    }
    
    if (!week) {
      return res.status(404).json({ message: 'Weekly update not found' });
    }
    
    // Enhance with file system assets
    const weekData = week.toObject ? week.toObject() : week;
    const assets = getWeekAssets(weekData.weekNumber);
    
    const enhancedWeek = {
      ...weekData,
      gallery: weekData.gallery && weekData.gallery.length > 0 ? weekData.gallery : assets.gallery,
      reportURL: weekData.reportURL || assets.reportURL
    };
    
    res.json(enhancedWeek);
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