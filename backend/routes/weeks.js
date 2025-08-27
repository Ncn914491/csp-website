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
      // Try to get from the main weeks collection first (which has the enhanced data)
      const Week = require('../models/weekModel');
      const mainWeeks = await Week.find().sort({ weekNumber: 1 });
      
      if (mainWeeks.length > 0) {
        weeks = mainWeeks;
      } else {
        // Fallback to WeeklyUpdate collection
        weeks = await WeeklyUpdate.find().sort({ weekNumber: -1 });
      }
    } else {
      weeks = localData.getWeeklyUpdates().sort((a, b) => b.weekNumber - a.weekNumber);
    }
    
    // Enhance each week with file system assets and ensure proper structure
    const enhancedWeeks = weeks.map(week => {
      const weekData = week.toObject ? week.toObject() : week;
      const assets = getWeekAssets(weekData.weekNumber);
      
      return {
        ...weekData,
        // Ensure we have all required fields
        title: weekData.title || `Week ${weekData.weekNumber}`,
        description: weekData.description || weekData.summary || `Activities for week ${weekData.weekNumber}`,
        activities: weekData.activities || weekData.summary || `Activities for week ${weekData.weekNumber}`,
        highlights: weekData.highlights || `Highlights from week ${weekData.weekNumber}`,
        files: weekData.files || [],
        pdfFiles: weekData.pdfFiles || [],
        gallery: weekData.gallery && weekData.gallery.length > 0 ? weekData.gallery : assets.gallery,
        reportURL: weekData.reportURL || assets.reportURL,
        // GridFS file access
        photos: weekData.photos || [],
        videos: weekData.videos || [],
        reportPdf: weekData.reportPdf
      };
    });
    
    res.json({
      success: true,
      count: enhancedWeeks.length,
      data: enhancedWeeks
    });
  } catch (error) {
    console.error('Error fetching weeks:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// GET single weekly update
router.get('/:id', async (req, res) => {
  try {
    let week;
    if (req.isMongoConnected) {
      // Try main weeks collection first
      const Week = require('../models/weekModel');
      week = await Week.findById(req.params.id);
      
      if (!week) {
        // Fallback to WeeklyUpdate collection
        week = await WeeklyUpdate.findById(req.params.id);
      }
    } else {
      week = localData.getWeeklyUpdates().find(w => w._id === req.params.id);
    }
    
    if (!week) {
      return res.status(404).json({ 
        success: false,
        message: 'Weekly update not found' 
      });
    }
    
    // Enhance with file system assets
    const weekData = week.toObject ? week.toObject() : week;
    const assets = getWeekAssets(weekData.weekNumber);
    
    const enhancedWeek = {
      ...weekData,
      title: weekData.title || `Week ${weekData.weekNumber}`,
      description: weekData.description || weekData.summary || `Activities for week ${weekData.weekNumber}`,
      activities: weekData.activities || weekData.summary || `Activities for week ${weekData.weekNumber}`,
      highlights: weekData.highlights || `Highlights from week ${weekData.weekNumber}`,
      files: weekData.files || [],
      pdfFiles: weekData.pdfFiles || [],
      gallery: weekData.gallery && weekData.gallery.length > 0 ? weekData.gallery : assets.gallery,
      reportURL: weekData.reportURL || assets.reportURL,
      photos: weekData.photos || [],
      videos: weekData.videos || [],
      reportPdf: weekData.reportPdf
    };
    
    res.json({
      success: true,
      data: enhancedWeek
    });
  } catch (error) {
    console.error('Error fetching week:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
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

// GET GridFS file by ID (for file access)
router.get('/file/:id', async (req, res) => {
  try {
    if (!req.isMongoConnected || !req.gfs) {
      return res.status(503).json({ 
        error: "GridFS not available",
        message: "File streaming service is currently unavailable"
      });
    }

    const mongoose = require('mongoose');
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        error: "Invalid file ID format",
        message: "Please provide a valid GridFS file ID"
      });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const file = await req.gfs.files.findOne({ _id: fileId });
    
    if (!file) {
      return res.status(404).json({ 
        error: "File not found",
        message: `No file found with ID: ${req.params.id}`
      });
    }

    // Set headers for file streaming with CORS
    res.set({
      'Content-Type': file.contentType || 'application/octet-stream',
      'Content-Length': file.length,
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    // Stream the file
    const readstream = req.gfs.createReadStream({ _id: file._id });
    
    readstream.on('error', (streamErr) => {
      console.error('GridFS stream error:', streamErr);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming file" });
      }
    });

    readstream.on('open', () => {
      console.log(`Streaming file: ${file.filename} (${file.contentType})`);
    });

    readstream.pipe(res);
  } catch (error) {
    console.error('File streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal server error while streaming file",
        message: error.message 
      });
    }
  }
});

module.exports = router;