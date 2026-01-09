const mongoose = require('mongoose');

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/javelin';

async function checkData() {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📦 Collections in database:');
    collections.forEach(c => console.log(`   - ${c.name}`));
    console.log();

    // Check bits collection
    console.log('🔍 Checking "bits" collection:');
    const bitsCollection = db.collection('bits');
    const bitsCount = await bitsCollection.countDocuments();
    console.log(`   Total documents: ${bitsCount}`);
    
    if (bitsCount > 0) {
      const sampleBit = await bitsCollection.findOne({});
      console.log('   Sample document fields:');
      console.log('   ', Object.keys(sampleBit).join(', '));
      console.log('\n   First document:');
      console.log(JSON.stringify(sampleBit, null, 2));
    }
    console.log();

    // Check beats collection (old name)
    console.log('🔍 Checking "beats" collection (old):');
    const beatsCollection = db.collection('beats');
    const beatsCount = await beatsCollection.countDocuments();
    console.log(`   Total documents: ${beatsCount}`);
    console.log();

    // Check with Mongoose model
    console.log('🔍 Checking via Mongoose Beat model:');
    
    // Import the model
    const BeatSchema = new mongoose.Schema({
      bitCode: String,
      bitName: String,
      locationId: mongoose.Schema.Types.ObjectId,
      isActive: Boolean,
    }, { strict: false });
    
    const Beat = mongoose.model('Beat', BeatSchema, 'bits');
    
    const modelCount = await Beat.countDocuments();
    console.log(`   Count via model: ${modelCount}`);
    
    if (modelCount > 0) {
      const sampleFromModel = await Beat.findOne().lean();
      console.log('   Sample via model:');
      console.log(JSON.stringify(sampleFromModel, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkData();
