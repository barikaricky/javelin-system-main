/**
 * MongoDB Rollback Script: Beat → Bit
 * This script reverts the Beat migration back to Bit
 * Use only if you need to rollback the migration
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/javelin';

async function rollback() {
  try {
    console.log('🔄 Starting Beat → Bit rollback...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Step 1: Rename collections back
    console.log('📦 Step 1: Reverting collection names...');
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (collectionNames.includes('beats')) {
        await db.collection('beats').rename('bits');
        console.log('  ✅ Reverted: beats → bits');
      } else {
        console.log('  ⚠️  No "beats" collection found');
      }
      
      if (collectionNames.includes('beatexpenses')) {
        await db.collection('beatexpenses').rename('bitexpenses');
        console.log('  ✅ Reverted: beatexpenses → bitexpenses');
      } else {
        console.log('  ⚠️  No "beatexpenses" collection found');
      }
    } catch (error) {
      console.error('  ❌ Error reverting collections:', error.message);
    }
    
    console.log('\n📝 Step 2: Reverting field names in bits collection...');
    try {
      const bitsCollection = db.collection('bits');
      const bitsCount = await bitsCollection.countDocuments();
      
      if (bitsCount > 0) {
        const result1 = await bitsCollection.updateMany(
          { beatCode: { $exists: true } },
          { $rename: { beatCode: 'bitCode' } }
        );
        console.log(`  ✅ Reverted ${result1.modifiedCount} documents: beatCode → bitCode`);
        
        const result2 = await bitsCollection.updateMany(
          { beatName: { $exists: true } },
          { $rename: { beatName: 'bitName' } }
        );
        console.log(`  ✅ Reverted ${result2.modifiedCount} documents: beatName → bitName`);
      }
    } catch (error) {
      console.error('  ❌ Error reverting bits fields:', error.message);
    }
    
    console.log('\n📝 Step 3: Reverting field names in bitexpenses collection...');
    try {
      const bitExpensesCollection = db.collection('bitexpenses');
      const expensesCount = await bitExpensesCollection.countDocuments();
      
      if (expensesCount > 0) {
        const result1 = await bitExpensesCollection.updateMany(
          { beatId: { $exists: true } },
          { $rename: { beatId: 'bitId' } }
        );
        console.log(`  ✅ Reverted ${result1.modifiedCount} documents: beatId → bitId`);
        
        const result2 = await bitExpensesCollection.updateMany(
          { beatName: { $exists: true } },
          { $rename: { beatName: 'bitName' } }
        );
        console.log(`  ✅ Reverted ${result2.modifiedCount} documents: beatName → bitName`);
      }
    } catch (error) {
      console.error('  ❌ Error reverting bitexpenses fields:', error.message);
    }
    
    console.log('\n📝 Step 4: Reverting references in other collections...');
    try {
      const operatorsCollection = db.collection('operators');
      const operatorsResult = await operatorsCollection.updateMany(
        { beatId: { $exists: true } },
        { $rename: { beatId: 'bitId' } }
      );
      if (operatorsResult.modifiedCount > 0) {
        console.log(`  ✅ Reverted ${operatorsResult.modifiedCount} operators: beatId → bitId`);
      }
      
      const assignmentsCollection = db.collection('guardassignments');
      const assignmentsResult = await assignmentsCollection.updateMany(
        { beatId: { $exists: true } },
        { $rename: { beatId: 'bitId' } }
      );
      if (assignmentsResult.modifiedCount > 0) {
        console.log(`  ✅ Reverted ${assignmentsResult.modifiedCount} guard assignments: beatId → bitId`);
      }
      
      const reportsCollection = db.collection('reports');
      const reportsResult = await reportsCollection.updateMany(
        { beatId: { $exists: true } },
        { $rename: { beatId: 'bitId' } }
      );
      if (reportsResult.modifiedCount > 0) {
        console.log(`  ✅ Reverted ${reportsResult.modifiedCount} reports: beatId → bitId`);
      }
      
      const locationsCollection = db.collection('locations');
      const locationsResult = await locationsCollection.updateMany(
        { totalBeats: { $exists: true } },
        { $rename: { totalBeats: 'totalBits' } }
      );
      if (locationsResult.modifiedCount > 0) {
        console.log(`  ✅ Reverted ${locationsResult.modifiedCount} locations: totalBeats → totalBits`);
      }
    } catch (error) {
      console.error('  ❌ Error reverting references:', error.message);
    }
    
    console.log('\n🎉 Rollback completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run rollback
rollback();
