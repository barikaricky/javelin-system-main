const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/javelin', {});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  console.log('✅ Connected to MongoDB\n');
  
  try {
    const Supervisor = db.collection('supervisors');
    const Location = db.collection('locations');
    
    // Get the first active location
    const location = await Location.findOne({ isActive: true });
    
    if (!location) {
      console.log('❌ No active location found in database!');
      console.log('Please create a location first before assigning supervisors.');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`📍 Found location: ${location.locationName} (${location.locationCode})`);
    console.log(`   Location ID: ${location._id}\n`);
    
    // Get all supervisors without a location
    const supervisorsWithoutLocation = await Supervisor.find({
      $or: [
        { locationId: null },
        { locationId: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${supervisorsWithoutLocation.length} supervisors without a location\n`);
    
    if (supervisorsWithoutLocation.length === 0) {
      console.log('✅ All supervisors already have locations assigned!');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    // Ask for confirmation
    console.log('Will assign the following supervisors to this location:');
    supervisorsWithoutLocation.forEach((sup, index) => {
      console.log(`${index + 1}. ${sup.fullName} (${sup.employeeId}) - ${sup.supervisorType}`);
    });
    
    console.log(`\n🔄 Updating ${supervisorsWithoutLocation.length} supervisors...\n`);
    
    // Update all supervisors without location
    const result = await Supervisor.updateMany(
      {
        $or: [
          { locationId: null },
          { locationId: { $exists: false } }
        ]
      },
      {
        $set: { locationId: location._id }
      }
    );
    
    console.log(`✅ Successfully updated ${result.modifiedCount} supervisors!`);
    console.log(`   All supervisors are now assigned to: ${location.locationName}\n`);
    
    // Verify the update
    const updatedSupervisors = await Supervisor.find({
      locationId: location._id
    }).toArray();
    
    console.log('📋 Supervisors now assigned to this location:');
    updatedSupervisors.forEach((sup, index) => {
      console.log(`${index + 1}. ${sup.fullName} (${sup.employeeId})`);
      console.log(`   - Type: ${sup.supervisorType}`);
      console.log(`   - Status: ${sup.approvalStatus}`);
      console.log(`   - Location ID: ${sup.locationId}`);
    });
    
    console.log('\n✅ Done! Supervisors will now appear in the dropdown when you select this location.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
});
