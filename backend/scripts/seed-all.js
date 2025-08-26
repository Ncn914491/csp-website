const DatabaseSeeder = require('./seed-database');
const RealFilesSeeder = require('./seed-real-files');

class CompleteSeedingProcess {
  async runFullSeeding() {
    console.log('🚀 Starting complete database seeding process...\n');
    
    try {
      // Step 1: Seed database with users, groups, messages, and weeks
      console.log('📊 Phase 1: Database Seeding');
      console.log('=' .repeat(50));
      const dbSeeder = new DatabaseSeeder();
      await dbSeeder.seed();
      
      console.log('\n⏳ Waiting 2 seconds before real files seeding...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Seed GridFS with real files from public/csp and update week references
      console.log('📁 Phase 2: Real Files Seeding from public/csp');
      console.log('=' .repeat(50));
      const realFilesSeeder = new RealFilesSeeder();
      await realFilesSeeder.seed();
      
      console.log('\n🎉 Complete seeding process finished successfully!');
      console.log('\n📋 What was created:');
      console.log('   ✅ Users (admin + students with Indian names)');
      console.log('   ✅ Groups with realistic descriptions');
      console.log('   ✅ Sample messages in group chats');
      console.log('   ✅ Week data with enhanced summaries');
      console.log('   ✅ All real photos, videos, and PDFs from public/csp');
      console.log('   ✅ Career guidance files uploaded');
      console.log('   ✅ Week-to-file references updated with real files');
      
      console.log('\n🔐 Login Information:');
      console.log('   Admin: admin@csp.edu / admin123');
      console.log('   Students: [firstname.lastname]@student.csp.edu / student123');
      console.log('   Example: aarav.sharma@student.csp.edu / student123');
      
      console.log('\n🌐 Next Steps:');
      console.log('   1. Start your backend server: npm run dev');
      console.log('   2. Test API endpoints: http://localhost:5000/api/test');
      console.log('   3. View weeks: http://localhost:5000/api/gridfs-weeks');
      console.log('   4. Start your frontend and test the application');
      
    } catch (error) {
      console.error('\n❌ Seeding process failed:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }
}

// Run complete seeding if this file is executed directly
if (require.main === module) {
  const seeder = new CompleteSeedingProcess();
  seeder.runFullSeeding().catch(console.error);
}

module.exports = CompleteSeedingProcess;