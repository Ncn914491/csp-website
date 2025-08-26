# Database Seeding Scripts

This directory contains scripts to populate the CSP website database with sample data for development and testing purposes.

## Scripts Overview

### 1. `seed-all.js` - Complete Seeding Process
Runs both database and GridFS seeding in the correct order.

```bash
npm run seed
```

### 2. `seed-database.js` - Database Data Seeding
Creates users, groups, messages, and week entries.

```bash
npm run seed:db
```

### 3. `seed-gridfs.js` - GridFS File Seeding (Legacy)
Creates sample files and uploads them to GridFS, then updates week references.

```bash
npm run seed:gridfs
```

### 4. `seed-real-files.js` - Real Files Seeding (Recommended)
Uploads all actual files from `public/csp` directory to GridFS and updates week references.

```bash
npm run seed:real-files
```

## What Gets Created

### Users
- **1 Admin User**: `admin@csp.edu` / `admin123`
- **20 Student Users**: Indian names with format `[firstname.lastname]@student.csp.edu` / `student123`
  - Examples: `aarav.sharma@student.csp.edu`, `ananya.verma@student.csp.edu`

### Groups
- **6 Groups** with realistic descriptions:
  - Web Development Enthusiasts
  - Data Science Explorers
  - Mobile App Developers
  - Cybersecurity Warriors
  - AI & Machine Learning
  - Career Guidance Hub
- Each group has 3-10 random student members
- Each group contains 5-20 sample messages

### Week Data
- **5 Weeks** of program data with enhanced summaries
- Each week includes:
  - Comprehensive summary of activities and learning objectives
  - All actual photos from `public/csp/week[X]` directories
  - All actual videos from week directories (Week 1 has 1 video)
  - Actual PDF reports from each week

### GridFS Files (Real Files from public/csp)
- **90 Photo files** (33 from week1, 20 from week2, 10 from week3, 18 from week4, 9 from week5)
- **1 Video file** (from week1)
- **5 PDF reports** (1 per week with actual content)
- **3 Career guidance files** (csp.pptx, synergyschool.jpg, synergyschoolphoto.jpg)
- **Total: 99 files (~43.66 MB)** with proper metadata for identification

## Prerequisites

1. **Environment Setup**: Ensure `.env` file exists with:
   ```
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

2. **MongoDB Connection**: Database must be accessible and running

3. **Dependencies**: Run `npm install` to ensure all packages are available

## Usage Instructions

### Quick Start (Recommended)
```bash
# Navigate to backend directory
cd backend

# Run complete seeding process
npm run seed
```

### Individual Scripts
```bash
# Seed only database data (users, groups, messages, weeks)
npm run seed:db

# Seed only GridFS files and update references (sample files)
npm run seed:gridfs

# Seed real files from public/csp directory (recommended)
npm run seed:real-files
```

### Data Management Scripts
```bash
# Verify data integrity and generate report
npm run verify:integrity

# Run data migrations to fix schema changes
npm run migrate

# Create backup of all data and files
npm run backup

# List available backups
npm run backup:list

# Restore from backup (provide backup directory path)
npm run restore <backup-directory-path>

# Generate comprehensive database summary
npm run summary
```

### Verification
After seeding, verify the data:

```bash
# Start the server
npm run dev

# Test API endpoints
curl http://localhost:5000/api/test
curl http://localhost:5000/api/gridfs-weeks
curl http://localhost:5000/api/groups
```

## Sample Data Details

### Indian Names Used
The seeder uses authentic Indian names including:
- **Male**: Aarav, Vivaan, Aditya, Vihaan, Arjun, Sai, Reyansh, Ayaan, Krishna, Ishaan
- **Female**: Ananya, Diya, Aadhya, Kavya, Arya, Myra, Anika, Saanvi, Navya, Kiara

### Professions Referenced
- Software Engineer, Data Scientist, Web Developer
- Mobile App Developer, DevOps Engineer, UI/UX Designer
- Product Manager, System Administrator, Database Administrator
- Cybersecurity Analyst, Machine Learning Engineer
- Full Stack Developer, Frontend Developer, Backend Developer, QA Engineer

### Group Chat Messages
Realistic messages including:
- Welcome messages and introductions
- Technical questions and help requests
- Project sharing and collaboration
- Study group formation
- Resource sharing and recommendations

## File Structure Created

```
backend/
├── sample-files/           # Created during GridFS seeding
│   ├── week1/
│   │   ├── photo1.jpg
│   │   ├── photo2.jpg
│   │   ├── photo3.jpg
│   │   └── report.pdf
│   ├── week2/ ... week5/   # Similar structure
│   └── career-guidance.ppt
└── scripts/
    ├── seed-all.js         # Main seeding script
    ├── seed-database.js    # Database seeding
    ├── seed-gridfs.js      # GridFS seeding
    └── README.md           # This file
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify `MONGO_URL` in `.env` file
   - Ensure MongoDB Atlas/local instance is running
   - Check network connectivity

2. **Permission Errors**
   - Ensure write permissions for `sample-files` directory
   - Check MongoDB user permissions

3. **Duplicate Key Errors**
   - Scripts clear existing data before seeding
   - If errors persist, manually clear collections

4. **GridFS Upload Failures**
   - Verify GridFS bucket configuration
   - Check available disk space
   - Ensure proper file permissions

### Manual Cleanup
If you need to manually clear data:

```javascript
// Connect to MongoDB and run:
db.users.deleteMany({});
db.groups.deleteMany({});
db.messages.deleteMany({});
db.weeks.deleteMany({});
db.fs.files.deleteMany({});
db.fs.chunks.deleteMany({});
```

## Development Notes

- All passwords are hashed using bcrypt with 10 salt rounds
- GridFS files include metadata for easy identification
- Week-to-file references are automatically updated
- Sample files are created as text placeholders (replace with actual images/PDFs in production)
- Scripts are idempotent - can be run multiple times safely

## Production Considerations

- Replace sample files with actual images and PDFs
- Use stronger passwords and proper user management
- Implement proper file validation and security
- Add file size limits and type restrictions
- Consider using cloud storage for production files