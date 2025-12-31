const mongoose = require('mongoose');

// Define the schema exactly as in the updated model
const SupervisorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
  salary: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  address: String,
  dateOfEmployment: Date,
  fullName: {
    type: String,
    required: true,
  },
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  supervisorType: {
    type: String,
    enum: ['GENERAL_SUPERVISOR', 'SUPERVISOR', 'FIELD_SUPERVISOR', 'SHIFT_SUPERVISOR', 'AREA_SUPERVISOR'],
    default: 'SUPERVISOR',
  },
}, { timestamps: true });

const Supervisor = mongoose.model('Supervisor', SupervisorSchema);

async function testQuery() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://ricky:Living57754040@jevelin.r874qws.mongodb.net/jevelin_db');
    console.log('✅ Connected!\n');

    // Test 1: Direct collection query
    console.log('📊 Test 1: Direct collection query');
    const directCount = await mongoose.connection.db.collection('supervisors').countDocuments();
    console.log(`   Found ${directCount} supervisors in collection\n`);

    // Test 2: Mongoose model query without populate
    console.log('📊 Test 2: Mongoose model query (no populate)');
    const supervisors = await Supervisor.find({}).lean();
    console.log(`   Found ${supervisors.length} supervisors`);
    if (supervisors.length > 0) {
      console.log('   First supervisor:', JSON.stringify(supervisors[0], null, 2));
    }
    console.log('');

    // Test 3: With approvalStatus filter
    console.log('📊 Test 3: Query with approvalStatus=APPROVED');
    const approved = await Supervisor.find({ approvalStatus: 'APPROVED' }).lean();
    console.log(`   Found ${approved.length} approved supervisors`);
    if (approved.length > 0) {
      console.log('   First approved:', JSON.stringify(approved[0], null, 2));
    }
    console.log('');

    // Test 4: With populate
    console.log('📊 Test 4: Query with populate');
    const populated = await Supervisor.find({ approvalStatus: 'APPROVED' })
      .populate({
        path: 'userId',
        select: 'email phoneNumber firstName lastName status',
      })
      .populate('locationId')
      .lean();
    console.log(`   Found ${populated.length} supervisors with populated data`);
    if (populated.length > 0) {
      console.log('   First populated:', JSON.stringify(populated[0], null, 2));
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testQuery();
