/**
 * Clear all collections in the database
 * Usage: node scripts/clear-database.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.DATABASE_URL);
    
    console.log('Connected! Getting all collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections`);
    
    for (const collection of collections) {
      const name = collection.name;
      console.log(`Clearing collection: ${name}...`);
      await mongoose.connection.db.collection(name).deleteMany({});
      const count = await mongoose.connection.db.collection(name).countDocuments();
      console.log(`  ✓ ${name} cleared (${count} documents remaining)`);
    }
    
    console.log('\n✅ All collections cleared successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
