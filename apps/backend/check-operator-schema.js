const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/jevelin_db';

console.log('🔍 Checking Operator schema and guarantor data...\n');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Get the Operator collection
    const operators = await mongoose.connection.db.collection('operators')
      .find({})
      .limit(5)
      .toArray();
    
    console.log(`📊 Total operators found: ${operators.length}\n`);
    
    if (operators.length === 0) {
      console.log('ℹ️  No operators registered yet.\n');
    } else {
      operators.forEach((operator, index) => {
        console.log(`Operator ${index + 1}:`);
        console.log(`  Employee ID: ${operator.employeeId}`);
        console.log(`  Location: ${operator.locationId || 'Not assigned'}`);
        console.log(`  Shift Type: ${operator.shiftType || 'Not set'}`);
        console.log(`  Approval Status: ${operator.approvalStatus || 'Not set'}`);
        
        // Check guarantors
        if (operator.guarantors && operator.guarantors.length > 0) {
          console.log(`  Guarantors: ${operator.guarantors.length} found`);
          operator.guarantors.forEach((guarantor, gIndex) => {
            console.log(`    Guarantor ${gIndex + 1}:`);
            console.log(`      Name: ${guarantor.name}`);
            console.log(`      Phone: ${guarantor.phone}`);
            console.log(`      Address: ${guarantor.address}`);
            console.log(`      Photo: ${guarantor.photo ? 'Yes (base64 data)' : 'No'}`);
            if (guarantor.photo) {
              const photoSize = (guarantor.photo.length * 3) / 4 / 1024; // KB
              console.log(`      Photo Size: ${photoSize.toFixed(2)} KB`);
            }
          });
        } else {
          console.log(`  Guarantors: ⚠️  None found (schema may need update)`);
        }
        
        // Check other fields
        console.log(`  Documents: ${operator.documents?.length || 0}`);
        console.log(`  Previous Experience: ${operator.previousExperience || 'Not provided'}`);
        console.log(`  Medical Fitness: ${operator.medicalFitness ? 'Yes' : 'No'}`);
        console.log('---');
      });
    }
    
    // Check schema definition
    console.log('\n📋 Checking schema definition...');
    const collections = await mongoose.connection.db.listCollections({ name: 'operators' }).toArray();
    if (collections.length > 0) {
      console.log('✅ Operators collection exists');
      
      // Check if there are any documents with guarantors field
      const withGuarantors = await mongoose.connection.db.collection('operators')
        .countDocuments({ guarantors: { $exists: true } });
      const withoutGuarantors = await mongoose.connection.db.collection('operators')
        .countDocuments({ guarantors: { $exists: false } });
      
      console.log(`\n📊 Guarantor Data Status:`);
      console.log(`  Operators WITH guarantors field: ${withGuarantors}`);
      console.log(`  Operators WITHOUT guarantors field: ${withoutGuarantors}`);
      
      if (withoutGuarantors > 0) {
        console.log(`\n⚠️  ${withoutGuarantors} operators need schema migration`);
        console.log('   Old operators may not have guarantor data stored.');
      }
    } else {
      console.log('ℹ️  Operators collection does not exist yet');
    }
    
    console.log('\n✅ Schema check complete');
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => { 
    console.error('❌ Error:', err.message); 
    process.exit(1); 
  });
