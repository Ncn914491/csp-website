const express = require("express");
const mongoose = require("mongoose");
const Week = require("../models/weekModel");
const { adminAuth } = require("../middleware/auth");

const router = express.Router();

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Health check endpoint for GridFS weeks service
router.get("/health", async (req, res) => {
  try {
    const healthStatus = {
      service: "GridFS Weeks API",
      timestamp: new Date().toISOString(),
      mongodb: req.isMongoConnected ? "connected" : "disconnected",
      gridfs: req.gfs ? "available" : "unavailable"
    };

    if (req.isMongoConnected) {
      // Check database connectivity
      const weekCount = await Week.countDocuments();
      healthStatus.weekCount = weekCount;
      
      if (req.gfs) {
        // Check GridFS connectivity
        const fileCount = await req.gfs.files.countDocuments();
        healthStatus.gridfsFileCount = fileCount;
      }
    }

    const status = req.isMongoConnected && req.gfs ? 200 : 503;
    res.status(status).json(healthStatus);
  } catch (err) {
    res.status(500).json({
      service: "GridFS Weeks API",
      status: "error",
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Upload week data (Admin only)
router.post("/add", (req, res) => {
  if (!req.isMongoConnected || !req.upload) {
    return res.status(503).json({ 
      error: "GridFS not available",
      message: "MongoDB connection and GridFS are required for file uploads"
    });
  }

  // Use the upload middleware from server.js
  const uploadFields = req.upload.fields([
    { name: "photos", maxCount: 10 }, 
    { name: "reportPdf", maxCount: 1 }
  ]);

  uploadFields(req, res, async (err) => {
    if (err) {
      console.error('File upload error:', err);
      
      // Handle specific multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: "File too large",
          message: "One or more files exceed the maximum allowed size"
        });
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          error: "Too many files",
          message: "Maximum 10 photos and 1 PDF allowed"
        });
      }
      
      return res.status(500).json({ 
        error: "File upload failed",
        message: err.message 
      });
    }

    try {
      // Validate required fields
      if (!req.body.weekNumber || !req.body.summary) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "weekNumber and summary are required"
        });
      }

      if (!req.files || !req.files["photos"] || !req.files["reportPdf"]) {
        return res.status(400).json({ 
          error: "Missing required files",
          message: "Both photos and reportPdf files are required"
        });
      }

      // Validate week number is unique
      const existingWeek = await Week.findOne({ weekNumber: req.body.weekNumber });
      if (existingWeek) {
        return res.status(409).json({ 
          error: "Week already exists",
          message: `Week ${req.body.weekNumber} already exists in the database`
        });
      }

      const photoIds = req.files["photos"].map(file => file.id.toString());
      const reportId = req.files["reportPdf"][0].id.toString();

      const newWeek = new Week({
        weekNumber: parseInt(req.body.weekNumber),
        summary: req.body.summary,
        photos: photoIds,
        reportPdf: reportId
      });

      await newWeek.save();
      
      res.status(201).json({ 
        success: true,
        message: "Week added successfully", 
        data: newWeek,
        filesUploaded: {
          photos: photoIds.length,
          reportPdf: 1
        }
      });
    } catch (err) {
      console.error('Week creation error:', err);
      
      // Handle mongoose validation errors
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
        error: "Failed to create week",
        message: err.message 
      });
    }
  });
});

// Fetch all weeks with enhanced error handling
router.get("/", async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required for week data"
      });
    }

    const weeks = await Week.find({}).sort({ weekNumber: 1 });
    
    // Validate GridFS references for each week
    const validatedWeeks = weeks.map(week => {
      const weekObj = week.toObject();
      
      // Ensure photos array exists and contains valid ObjectIds
      weekObj.photos = weekObj.photos.filter(photoId => isValidObjectId(photoId));
      
      // Validate reportPdf ObjectId
      if (weekObj.reportPdf && !isValidObjectId(weekObj.reportPdf)) {
        weekObj.reportPdf = null;
      }
      
      return weekObj;
    });

    res.json({
      success: true,
      count: validatedWeeks.length,
      data: validatedWeeks
    });
  } catch (err) {
    console.error('Error fetching weeks:', err);
    res.status(500).json({ 
      error: "Failed to fetch weeks",
      message: err.message 
    });
  }
});

// Fetch single week by ID with validation
router.get("/:id", async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required"
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ 
        error: "Invalid week ID format",
        message: "Please provide a valid week ID"
      });
    }

    const week = await Week.findById(req.params.id);
    if (!week) {
      return res.status(404).json({ 
        error: "Week not found",
        message: `No week found with ID: ${req.params.id}`
      });
    }

    // Validate GridFS references
    const weekObj = week.toObject();
    weekObj.photos = weekObj.photos.filter(photoId => isValidObjectId(photoId));
    
    if (weekObj.reportPdf && !isValidObjectId(weekObj.reportPdf)) {
      weekObj.reportPdf = null;
    }

    res.json({
      success: true,
      data: weekObj
    });
  } catch (err) {
    console.error('Error fetching week:', err);
    res.status(500).json({ 
      error: "Failed to fetch week",
      message: err.message 
    });
  }
});

// Fetch single file by ID with robust streaming
router.get("/file/:id", async (req, res) => {
  try {
    if (!req.isMongoConnected || !req.gfs) {
      return res.status(503).json({ 
        error: "GridFS not available",
        message: "File streaming service is currently unavailable"
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
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

    // Set comprehensive headers for file streaming
    res.set({
      'Content-Type': file.contentType || 'application/octet-stream',
      'Content-Length': file.length,
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': file._id.toString(),
      'Last-Modified': file.uploadDate.toUTCString(),
      'Accept-Ranges': 'bytes'
    });

    // Handle range requests for large files (improved implementation)
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
      
      // Validate range values
      if (start >= file.length || end >= file.length || start > end) {
        return res.status(416).json({ 
          error: "Range not satisfiable",
          message: "Requested range is invalid for this file"
        });
      }
      
      const chunksize = (end - start) + 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Content-Length': chunksize
      });

      // Create read stream with range
      const readstream = req.gfs.createReadStream({ 
        _id: file._id,
        range: { startPos: start, endPos: end }
      });
      
      // Handle stream errors
      readstream.on('error', (streamErr) => {
        console.error('GridFS range stream error:', streamErr);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file range" });
        }
      });

      readstream.pipe(res);
    } else {
      // Stream entire file
      const readstream = req.gfs.createReadStream({ _id: file._id });
      
      // Handle stream errors
      readstream.on('error', (streamErr) => {
        console.error('GridFS stream error:', streamErr);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      // Handle successful stream completion
      readstream.on('end', () => {
        console.log(`File ${file.filename} streamed successfully`);
      });

      readstream.pipe(res);
    }
  } catch (err) {
    console.error('File streaming error:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal server error while streaming file",
        message: err.message 
      });
    }
  }
});

// Delete week by ID (Admin only)
router.delete("/:id", async (req, res) => {
  try {
    if (!req.isMongoConnected) {
      return res.status(503).json({ 
        error: "Database service unavailable",
        message: "MongoDB connection required for delete operations"
      });
    }

    // Validate ObjectId format
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ 
        error: "Invalid week ID format",
        message: "Please provide a valid week ID"
      });
    }

    const week = await Week.findById(req.params.id);
    if (!week) {
      return res.status(404).json({ 
        error: "Week not found",
        message: `No week found with ID: ${req.params.id}`
      });
    }

    let deletedFiles = { photos: 0, reportPdf: 0 };
    let failedDeletions = [];

    // Delete associated files from GridFS
    if (req.gfs) {
      // Delete photos
      for (const photoId of week.photos) {
        try {
          const photoObjectId = new mongoose.Types.ObjectId(photoId);
          await req.gfs.files.deleteOne({ _id: photoObjectId });
          await req.gfs.chunks.deleteMany({ files_id: photoObjectId });
          deletedFiles.photos++;
        } catch (fileErr) {
          console.error(`Error deleting photo ${photoId}:`, fileErr.message);
          failedDeletions.push({ type: 'photo', id: photoId, error: fileErr.message });
        }
      }

      // Delete report PDF
      if (week.reportPdf) {
        try {
          const reportObjectId = new mongoose.Types.ObjectId(week.reportPdf);
          await req.gfs.files.deleteOne({ _id: reportObjectId });
          await req.gfs.chunks.deleteMany({ files_id: reportObjectId });
          deletedFiles.reportPdf = 1;
        } catch (fileErr) {
          console.error(`Error deleting report PDF ${week.reportPdf}:`, fileErr.message);
          failedDeletions.push({ type: 'reportPdf', id: week.reportPdf, error: fileErr.message });
        }
      }
    }

    // Delete week document
    await Week.findByIdAndDelete(req.params.id);
    
    const response = {
      success: true,
      message: "Week deleted successfully",
      deletedWeek: {
        id: week._id,
        weekNumber: week.weekNumber,
        summary: week.summary
      },
      filesDeleted: deletedFiles
    };

    if (failedDeletions.length > 0) {
      response.warnings = {
        message: "Some files could not be deleted",
        failedDeletions
      };
    }

    res.json(response);
  } catch (err) {
    console.error('Week deletion error:', err);
    res.status(500).json({ 
      error: "Failed to delete week",
      message: err.message 
    });
  }
});

module.exports = router;
