const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/javelin')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Check BITs collection
    const bitsCount = await mongoose.connection.db.collection('bits').countDocuments();
    console.log('📊 Total BITs in database:', bitsCount);
    
    if (bitsCount > 0) {
      const bits = await mongoose.connection.db.collection('bits').find({}).limit(10).toArray();
      console.log('\n🎯 Sample BITs:');
      bits.forEach((bit, i) => {
        console.log(`\n  BIT ${i + 1}:`);
        console.log('    _id:', bit._id);
        console.log('    bitName:', bit.bitName);
        console.log('    bitCode:', bit.bitCode);
        console.log('    locationId:', bit.locationId);
        console.log('    isActive:', bit.isActive);
      });
    } else {
      console.log('\n⚠️ No BITs found in database!');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
