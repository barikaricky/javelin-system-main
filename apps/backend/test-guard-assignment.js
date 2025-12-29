const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/javelin';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import the actual GuardAssignment model
const { GuardAssignment } = require('./src/models/GuardAssignment.model');
const { Operator } = require('./src/models/Operator.model');
const { Bit } = require('./src/models/Bit.model');
const { Location } = require('./src/models/Location.model');
const { Supervisor } = require('./src/models/Supervisor.model');

async function testGuardAssignment() {
  try {
    console.log('\n🧪 Testing GuardAssignment creation...\n');

    // Find an existing operator
    const operator = await Operator.findOne().lean();
    if (!operator) {
      console.log('❌ No operators found in database');
      return;
    }
    console.log('✅ Found operator:', operator.employeeId);

    // Find an existing BIT
    const bit = await Bit.findOne().lean();
    if (!bit) {
      console.log('❌ No BITs found in database');
      return;
    }
    console.log('✅ Found BIT:', bit.bitCode);

    // Find an existing location
    const location = await Location.findOne().lean();
    if (!location) {
      console.log('❌ No locations found in database');
      return;
    }
    console.log('✅ Found location:', location.locationName);

    // Find an existing supervisor
    const supervisor = await Supervisor.findOne({ approvalStatus: 'APPROVED' }).lean();
    if (!supervisor) {
      console.log('❌ No approved supervisors found in database');
      return;
    }
    console.log('✅ Found supervisor:', supervisor._id);

    // Try to create a test GuardAssignment
    console.log('\n🔹 Creating test GuardAssignment...');
    
    const testAssignment = new GuardAssignment({
      operatorId: operator._id,
      bitId: bit._id,
      locationId: location._id,
      supervisorId: supervisor._id,
      assignmentType: 'PERMANENT',
      shiftType: 'DAY',
      startDate: new Date(),
      status: 'ACTIVE',
      assignedBy: {
        userId: new mongoose.Types.ObjectId(),
        role: 'DIRECTOR',
        name: 'Test Director',
      },
      approvedBy: {
        userId: new mongoose.Types.ObjectId(),
        role: 'DIRECTOR',
        name: 'Test Director',
      },
      approvedAt: new Date(),
    });

    await testAssignment.save();
    console.log('✅ Test GuardAssignment created successfully!');
    console.log('   Assignment ID:', testAssignment._id);
    console.log('   Status:', testAssignment.status);

    // Verify it was saved
    const count = await GuardAssignment.countDocuments();
    console.log('\n📊 Total GuardAssignments in database:', count);

    // Try to fetch it
    const fetched = await GuardAssignment.findById(testAssignment._id)
      .populate('operatorId')
      .populate('bitId')
      .populate('supervisorId');
    
    if (fetched) {
      console.log('✅ Successfully fetched the assignment back');
      console.log('   Operator:', fetched.operatorId?.employeeId);
      console.log('   BIT:', fetched.bitId?.bitCode);
    }

    console.log('\n✅ GuardAssignment model is working correctly!');
    console.log('   The issue must be in the registration code not executing.\n');

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnection closed');
  }
}

testGuardAssignment();
