const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/javelin')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // First, let's see all admin users and their current status
    console.log('=== Checking all ADMIN users ===');
    const adminsBefore = await mongoose.connection.db.collection('users').find({ role: 'ADMIN' }).toArray();
    console.log(`Found ${adminsBefore.length} admin user(s):\n`);
    adminsBefore.forEach(admin => {
      console.log(`  - ${admin.firstName} ${admin.lastName} (${admin.email})`);
      console.log(`    Status: ${admin.status || 'NOT SET'}`);
      console.log(`    ID: ${admin._id}\n`);
    });
    
    // Update all users with ADMIN role to ACTIVE status (regardless of current status)
    console.log('=== Updating admin users ===');
    const result = await mongoose.connection.db.collection('users').updateMany(
      { role: 'ADMIN' },
      { $set: { status: 'ACTIVE' } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} admin user(s) to ACTIVE status\n`);
    
    // Show updated admin users
    console.log('=== After update ===');
    const adminsAfter = await mongoose.connection.db.collection('users').find({ role: 'ADMIN' }).toArray();
    adminsAfter.forEach(admin => {
      console.log(`  - ${admin.firstName} ${admin.lastName} (${admin.email}) - Status: ${admin.status}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
