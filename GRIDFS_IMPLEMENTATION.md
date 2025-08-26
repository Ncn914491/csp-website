# GridFS Implementation for CSP Website

This document describes the GridFS implementation that moves weekly photos, PDF reports, and career resources from the local `/csp` folder into MongoDB Atlas using GridFS.

## Overview

GridFS is a specification for storing and retrieving files that exceed the BSON-document size limit of 16 MB. It divides files into chunks and stores each chunk as a separate document.

## Implementation Components

### 1. Backend Dependencies

The following packages were installed:

```bash
npm install multer multer-gridfs-storage gridfs-stream
```

- **multer**: Middleware for handling multipart/form-data (file uploads)
- **multer-gridfs-storage**: Storage engine for multer that stores files in GridFS
- **gridfs-stream**: Node.js GridFS streaming library

### 2. Database Schema

#### Week Model (`backend/models/weekModel.js`)
```javascript
const weekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true, unique: true },
  summary: { type: String, required: true },
  photos: [{ type: String }], // GridFS file IDs
  reportPdf: { type: String } // GridFS file ID
}, {
  timestamps: true
});
```

### 3. Server Configuration

#### GridFS Setup (`backend/server.js`)
- GridFS connection initialization after MongoDB connection
- Multer storage configuration with GridFS
- File naming convention: `timestamp-originalname`
- Bucket name: "uploads"

### 4. API Routes

#### GridFS Week Routes (`backend/routes/weekRoutes.js`)
- **POST `/api/gridfs-weeks/add`**: Upload week with photos and PDF
- **GET `/api/gridfs-weeks`**: Fetch all weeks
- **GET `/api/gridfs-weeks/:id`**: Fetch specific week
- **GET `/api/gridfs-weeks/file/:id`**: Serve file by GridFS ID
- **DELETE `/api/gridfs-weeks/:id`**: Delete week and associated files

### 5. Frontend Components

#### WeekView Component (`src/components/WeekView.jsx`)
- Displays weeks with photo galleries
- PDF download/preview links
- Responsive grid layout
- Error handling for missing files

#### GridFS Admin Component (`src/components/GridFSWeekAdmin.jsx`)
- File upload form with validation
- Multiple photo upload (max 10)
- Single PDF upload
- File management interface

## File Structure

```
backend/
├── models/
│   └── weekModel.js          # Week schema for GridFS
├── routes/
│   └── weekRoutes.js         # GridFS week routes
└── server.js                 # GridFS configuration

src/
├── components/
│   ├── WeekView.jsx          # Display weeks component
│   └── GridFSWeekAdmin.jsx   # Admin upload component

test/
├── gridfs.test.js            # GridFS functionality tests

migrate-to-gridfs.js          # Migration script
```

## MongoDB Atlas Collections

After implementation, the following collections will be created:

1. **`weeks`**: Week documents with file references
2. **`uploads.files`**: File metadata (filename, contentType, etc.)
3. **`uploads.chunks`**: File chunks (actual file data)

## Usage Instructions

### 1. Migration from Local Files

Run the migration script to move existing files from `/csp` to GridFS:

```bash
node migrate-to-gridfs.js
```

This script will:
- Scan the `/csp` directory for week folders
- Upload images and PDFs to GridFS
- Create week documents in MongoDB
- Generate reports on migration status

### 2. Admin Panel Integration

Add the GridFS admin component to your admin dashboard:

```jsx
import GridFSWeekAdmin from '../components/GridFSWeekAdmin';

// In your admin dashboard render:
<GridFSWeekAdmin />
```

### 3. Frontend Display

Use the WeekView component to display weeks:

```jsx
import WeekView from '../components/WeekView';

// In your component render:
<WeekView />
```

### 4. Testing

Run the test suite to verify GridFS functionality:

```bash
node test/gridfs.test.js
```

## API Examples

### Upload a Week

```javascript
const formData = new FormData();
formData.append('weekNumber', '1');
formData.append('summary', 'Week 1 activities');
formData.append('photos', photoFile1);
formData.append('photos', photoFile2);
formData.append('reportPdf', pdfFile);

const response = await fetch('/api/gridfs-weeks/add', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Fetch Weeks

```javascript
const response = await fetch('/api/gridfs-weeks');
const weeks = await response.json();
```

### Get File URL

```javascript
// For displaying images or PDFs
const fileUrl = `/api/gridfs-weeks/file/${fileId}`;
```

## Advantages of GridFS

1. **Scalability**: Handles files larger than MongoDB's 16MB document limit
2. **Efficient Storage**: Automatically chunks large files
3. **Metadata Storage**: Stores file metadata alongside chunks
4. **Streaming Support**: Supports file streaming for better performance
5. **Backup Integration**: Files are backed up with database backups
6. **No File System Dependencies**: Eliminates local file storage requirements

## Security Considerations

1. **Authentication**: Admin-only upload routes require JWT authentication
2. **File Validation**: Accepts only specific file types (images, PDFs)
3. **File Size Limits**: Configurable upload size limits
4. **Content Type Validation**: Validates MIME types

## Performance Considerations

1. **Chunk Size**: Default 255KB chunks for optimal performance
2. **Indexing**: GridFS automatically indexes file metadata
3. **Streaming**: Files are streamed rather than loaded into memory
4. **CDN Integration**: Can be integrated with CDN for global distribution

## Troubleshooting

### Common Issues

1. **Connection Errors**: Ensure MongoDB Atlas connection string is correct
2. **File Upload Failures**: Check file size limits and MIME types
3. **Missing Files**: Verify GridFS collections exist in MongoDB Atlas
4. **CORS Issues**: Ensure CORS is configured for file uploads

### Debug Commands

```bash
# Check GridFS collections in MongoDB
db.uploads.files.find()
db.uploads.chunks.find()

# Test server connection
curl http://localhost:5000/api/test

# Test GridFS endpoint
curl http://localhost:5000/api/gridfs-weeks
```

## Environment Variables

Ensure these variables are set in your `.env` file:

```env
MONGO_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

## Deployment Notes

1. **Memory**: Ensure sufficient RAM for file processing
2. **Disk Space**: MongoDB Atlas handles storage automatically
3. **Network**: Consider upload timeouts for large files
4. **Monitoring**: Monitor GridFS collections size and performance

## Future Enhancements

1. **Image Optimization**: Automatic image compression/resizing
2. **Video Support**: Extend to support video files
3. **File Versioning**: Track file versions and changes
4. **Bulk Operations**: Batch file uploads and operations
5. **Search Integration**: Full-text search across file metadata

## Support

For issues or questions regarding the GridFS implementation:

1. Check MongoDB Atlas logs
2. Review server console for GridFS errors
3. Test with the provided test suite
4. Verify file permissions and network connectivity
