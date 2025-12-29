const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/javelin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Get the Supervisor collection
    const Supervisor = db.collection('supervisors');
    
    // Count all supervisors
    const totalCount = await Supervisor.countDocuments();
    console.log(`\n📊 Total Supervisors: ${totalCount}`);
    
    // Count by approval status
    const pending = await Supervisor.countDocuments({ approvalStatus: 'PENDING' });
    const approved = await Supervisor.countDocuments({ approvalStatus: 'APPROVED' });
    const rejected = await Supervisor.countDocuments({ approvalStatus: 'REJECTED' });
    
    console.log(`\n📋 By Status:`);
    console.log(`   - PENDING: ${pending}`);
    console.log(`   - APPROVED: ${approved}`);
    console.log(`   - REJECTED: ${rejected}`);
    
    // Get sample approved supervisors
    const approvedSupervisors = await Supervisor.find({ approvalStatus: 'APPROVED' }).limit(3).toArray();
    
    if (approvedSupervisors.length > 0) {
      console.log(`\n✅ Sample APPROVED supervisors:`);
      approvedSupervisors.forEach((sup, index) => {
        console.log(`\n${index + 1}. Supervisor ID: ${sup._id}`);
        console.log(`   - Employee ID: ${sup.employeeId}`);
        console.log(`   - Full Name: ${sup.fullName}`);
        console.log(`   - Location ID: ${sup.locationId || 'No location'}`);
        console.log(`   - Approval Status: ${sup.approvalStatus}`);
        console.log(`   - Supervisor Type: ${sup.supervisorType}`);
      });
    } else {
      console.log('\n⚠️  No APPROVED supervisors found!');
      
      // Show all supervisors
      const allSupervisors = await Supervisor.find({}).limit(5).toArray();
      if (allSupervisors.length > 0) {
        console.log(`\n📋 Sample supervisors (any status):`);
        allSupervisors.forEach((sup, index) => {
          console.log(`\n${index + 1}. Supervisor ID: ${sup._id}`);
          console.log(`   - Employee ID: ${sup.employeeId}`);
          console.log(`   - Full Name: ${sup.fullName}`);
          console.log(`   - Location ID: ${sup.locationId || 'No location'}`);
          console.log(`   - Approval Status: ${sup.approvalStatus}`);
          console.log(`   - Supervisor Type: ${sup.supervisorType}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
});
