const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/javelin';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define GuardAssignment schema
const GuardAssignmentSchema = new mongoose.Schema({
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator' },
  bitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bit' },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supervisor' },
  status: String,
  shiftType: String,
  startDate: Date,
  assignmentType: String,
  assignedBy: Object,
  approvedBy: Object,
  approvedAt: Date,
}, { timestamps: true });

const GuardAssignment = mongoose.model('GuardAssignment', GuardAssignmentSchema);

async function checkAssignments() {
  try {
    console.log('\n📊 Checking GuardAssignment records...\n');

    const assignments = await GuardAssignment.find()
      .populate('operatorId')
      .populate('bitId')
      .populate('locationId')
      .populate('supervisorId')
      .lean();

    console.log(`Total GuardAssignments: ${assignments.length}\n`);

    if (assignments.length === 0) {
      console.log('❌ No GuardAssignment records found!\n');
      console.log('This means operators are not being assigned to BITs.\n');
    } else {
      assignments.forEach((assignment, index) => {
        console.log(`--- Assignment ${index + 1} ---`);
        console.log(`ID: ${assignment._id}`);
        console.log(`Operator: ${assignment.operatorId?.userId || 'N/A'}`);
        console.log(`BIT: ${assignment.bitId?.bitName || 'N/A'} (${assignment.bitId?.bitCode || 'N/A'})`);
        console.log(`Location: ${assignment.locationId?.locationName || 'N/A'}`);
        console.log(`Supervisor: ${assignment.supervisorId?._id || 'N/A'}`);
        console.log(`Status: ${assignment.status}`);
        console.log(`Shift Type: ${assignment.shiftType}`);
        console.log(`Start Date: ${assignment.startDate}`);
        console.log(`Created: ${assignment.createdAt}\n`);
      });
    }

    // Also check operators
    const Operator = mongoose.model('Operator', new mongoose.Schema({}, { strict: false }));
    const operators = await Operator.find().populate('locationId').populate('supervisorId').lean();
    
    console.log(`\n📊 Total Operators: ${operators.length}\n`);
    
    operators.forEach((op, index) => {
      console.log(`--- Operator ${index + 1} ---`);
      console.log(`ID: ${op._id}`);
      console.log(`Employee ID: ${op.employeeId}`);
      console.log(`Location ID: ${op.locationId?._id || op.locationId || 'N/A'}`);
      console.log(`Location Name: ${op.locationId?.locationName || 'N/A'}`);
      console.log(`Supervisor ID: ${op.supervisorId || 'N/A'}`);
      console.log(`Shift Type: ${op.shiftType || 'N/A'}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

checkAssignments();
