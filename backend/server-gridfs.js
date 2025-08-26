const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const localData = require('./local-data');
const Grid = require('gridfs-stream');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Week = require('./models/weekModel');
// Ensure we load env from backend/.env when running from project root
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving
// Note: Remove local /csp static to enforce GridFS-only serving
app.use('/public', express.static(path.join(__dirname, '../public')));

// Global variables
let gfs, upload, gridfsBucket;

// Initialize MongoDB and GridFS
const initializeDB = async () => {
	try {
		const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
		if (!mongoUri) {
			throw new Error('Missing MONGO_URI/MONGO_URL');
		}
		await mongoose.connect(mongoUri);
		console.log('✅ MongoDB connected successfully');

		// Wait for connection to be ready
		const conn = mongoose.connection;
		await new Promise((resolve, reject) => {
			if (conn.readyState === 1 && conn.db) return resolve();
			conn.once('open', resolve);
			conn.once('error', reject);
		});

		gfs = Grid(conn.db, mongoose.mongo);
		gfs.collection('uploads');
		gridfsBucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
		
		// Configure GridFS Storage
		const storage = new GridFsStorage({
			url: mongoUri,
			file: (req, file) => ({
				filename: `${Date.now()}-${file.originalname}`,
				bucketName: 'uploads'
			})
		});
		
		upload = multer({ storage });
		console.log('✅ GridFS configured successfully');
		
		// Attach helpers middleware so downstream routes can use GridFS
		app.use((req, res, next) => {
			req.isMongoConnected = true;
			req.gfs = gfs;
			req.upload = upload;
			next();
		});
		
		return true;
	} catch (error) {
		console.error('❌ Database initialization failed:', error.message);
		return false;
	}
};

// Routes
app.get('/api/test', (req, res) => {
	res.json({ message: 'MongoDB connection successful' });
});

// GridFS Week Routes
app.get('/api/gridfs-weeks', async (req, res) => {
	try {
		if (!gfs) {
			return res.status(503).json({ error: 'GridFS not initialized' });
		}
		
		const weeks = await Week.find({}).sort({ weekNumber: -1 });
		res.json(weeks);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Auth
const { adminAuth } = require('./middleware/auth');

app.post('/api/gridfs-weeks/add', adminAuth, (req, res) => {
	if (!upload || !gfs) {
		return res.status(503).json({ error: 'GridFS not available' });
	}

	const uploadFields = upload.fields([
		{ name: 'photos', maxCount: 10 },
		{ name: 'reportPdf', maxCount: 1 }
	]);

	uploadFields(req, res, async (err) => {
		if (err) {
			return res.status(500).json({ error: err.message });
		}

		try {
			if (!req.files || !req.files['photos'] || !req.files['reportPdf']) {
				return res.status(400).json({ error: 'Photos and reportPdf are required' });
			}

			const photoIds = req.files['photos'].map(file => file.id.toString());
			const reportId = req.files['reportPdf'][0].id.toString();

			const newWeek = new Week({
				weekNumber: req.body.weekNumber,
				summary: req.body.summary,
				photos: photoIds,
				reportPdf: reportId
			});

			await newWeek.save();
			res.json({ message: 'Week added successfully', data: newWeek });
		} catch (err) {
			res.status(500).json({ error: err.message });
		}
	});
});

const isValidObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id).toString() === id;
  } catch (_) {
    return false;
  }
};

app.get('/api/gridfs-weeks/file/:id', async (req, res) => {
	try {
		if (!gridfsBucket) {
			return res.status(503).json({ error: 'GridFS not available' });
		}

		const { id } = req.params;
		if (!isValidObjectId(id)) {
			return res.status(400).json({ error: 'Invalid file id' });
		}
		const filesColl = mongoose.connection.db.collection('uploads.files');
		const file = await filesColl.findOne({ _id: new mongoose.Types.ObjectId(id) });
		if (!file) {
			return res.status(404).json({ error: 'File not found' });
		}

		res.set('Content-Type', file.contentType);
		res.set('Content-Disposition', `inline; filename="${file.filename}"`);

		const readstream = gridfsBucket.openDownloadStream(file._id);
		readstream.on('error', (err) => {
			res.status(500).json({ error: err.message });
		});
		readstream.pipe(res);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get single week by id
app.get('/api/gridfs-weeks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid week id' });
    }
    const week = await Week.findById(id);
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }
    res.json(week);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a week and associated GridFS files
app.delete('/api/gridfs-weeks/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid week id' });
    }
    const week = await Week.findById(id);
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }

    if (!gridfsBucket) {
      return res.status(503).json({ error: 'GridFS not available' });
    }

    const allIds = [
      ...(Array.isArray(week.photos) ? week.photos : []),
      ...(week.reportPdf ? [week.reportPdf] : [])
    ];

    for (const fileId of allIds) {
      if (isValidObjectId(fileId)) {
        try {
          await gridfsBucket.delete(new mongoose.Types.ObjectId(fileId));
        } catch (_) {
          // ignore individual delete errors
        }
      }
    }

    await Week.deleteOne({ _id: id });
    res.json({ message: 'Week and associated files deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import other route handlers
const visitsRoutes = require('./routes/visits');
const weeksRoutes = require('./routes/weeks');
const resourcesRoutes = require('./routes/resources');
const usersRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const groupsRoutes = require('./routes/groups');

// Use other routes
app.use('/api/visits', visitsRoutes);
app.use('/api/weeks', weeksRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', authRoutes);
app.use('/api/groups', groupsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
	res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
	const dbInitialized = await initializeDB();
	if (!dbInitialized) {
		console.log('🔄 Falling back to local data store for development...');
		await localData.initializeData();
	}
	
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
		console.log(`Test connection at: http://localhost:${PORT}/api/test`);
		console.log(`Test GridFS at: http://localhost:${PORT}/api/gridfs-weeks`);
	});
};

startServer();
