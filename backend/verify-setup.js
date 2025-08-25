const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 CSP Website Backend Setup Verification\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`✅ MONGO_URL: ${process.env.MONGO_URL ? 'Configured' : '❌ Missing'}`);
console.log(`✅ JWT_SECRET: ${process.env.JWT_SECRET ? 'Configured' : '❌ Missing'}`);
console.log(`✅ PORT: ${process.env.PORT || 5000}`);

// Check models
const modelsDir = path.join(__dirname, 'models');
const models = ['User.js', 'SchoolVisit.js', 'WeeklyUpdate.js', 'Resource.js'];
console.log('\n📁 Models:');
models.forEach(model => {
  const exists = fs.existsSync(path.join(modelsDir, model));
  console.log(`${exists ? '✅' : '❌'} ${model}`);
});

// Check routes
const routesDir = path.join(__dirname, 'routes');
const routes = ['visits.js', 'weeks.js', 'resources.js', 'users.js', 'auth.js'];
console.log('\n🛣️  Routes:');
routes.forEach(route => {
  const exists = fs.existsSync(path.join(routesDir, route));
  console.log(`${exists ? '✅' : '❌'} ${route}`);
});

// Check seed and test files
console.log('\n🌱 Database Scripts:');
console.log(`${fs.existsSync(path.join(__dirname, 'seed.js')) ? '✅' : '❌'} seed.js`);
console.log(`${fs.existsSync(path.join(__dirname, 'test', 'dbTest.js')) ? '✅' : '❌'} test/dbTest.js`);

// Check data directories
const publicDir = path.join(__dirname, '..', 'public');
const cspDir = path.join(publicDir, 'csp');
console.log('\n📂 Data Directories:');
console.log(`${fs.existsSync(cspDir) ? '✅' : '❌'} /public/csp/`);

if (fs.existsSync(cspDir)) {
  const weekDirs = fs.readdirSync(cspDir).filter(name => 
    fs.statSync(path.join(cspDir, name)).isDirectory() && /week\d+/i.test(name)
  );
  console.log(`📊 Found ${weekDirs.length} week directories: ${weekDirs.join(', ')}`);
}

console.log('\n🚀 Next Steps:');
console.log('1. Ensure MongoDB Atlas IP is whitelisted');
console.log('2. Run: node seed.js (to populate database)');
console.log('3. Run: node test/dbTest.js (to verify data)');
console.log('4. Run: npm start (to start server)');