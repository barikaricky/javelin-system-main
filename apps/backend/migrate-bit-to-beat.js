/**
 * MongoDB Migration Script: Bit → Beat
 * This script renames collections and updates field names from "bit" to "beat"
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/javelin';

async function migrate() {
  try {
    console.log('🔄 Starting Bit → Beat migration...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Step 1: Rename 'bits' collection to 'beats'
    console.log('📦 Step 1: Renaming collections...');
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (collectionNames.includes('bits')) {
        await db.collection('bits').rename('beats');
        console.log('  ✅ Renamed: bits → beats');
      } else if (collectionNames.includes('beats')) {
        console.log('  ℹ️  Collection "beats" already exists, skipping');
      } else {
        console.log('  ⚠️  No "bits" collection found');
      }
      
      // Rename 'bitexpenses' to 'beatexpenses'
      if (collectionNames.includes('bitexpenses')) {
        await db.collection('bitexpenses').rename('beatexpenses');
        console.log('  ✅ Renamed: bitexpenses → beatexpenses');
      } else if (collectionNames.includes('beatexpenses')) {
        console.log('  ℹ️  Collection "beatexpenses" already exists, skipping');
      } else {
        console.log('  ⚠️  No "bitexpenses" collection found');
      }
    } catch (error) {
      console.error('  ❌ Error renaming collections:', error.message);
    }
    
    console.log('\n📝 Step 2: Updating field names in beats collection...');
    try {
      const beatsCollection = db.collection('beats');
      const beatsCount = await beatsCollection.countDocuments();
      
      if (beatsCount > 0) {
        // Update bitCode → beatCode
        const result1 = await beatsCollection.updateMany(
          { bitCode: { $exists: true } },
          { $rename: { bitCode: 'beatCode' } }
        );
        console.log(`  ✅ Updated ${result1.modifiedCount} documents: bitCode → beatCode`);
        
        // Update bitName → beatName
        const result2 = await beatsCollection.updateMany(
          { bitName: { $exists: true } },
          { $rename: { bitName: 'beatName' } }
        );
        console.log(`  ✅ Updated ${result2.modifiedCount} documents: bitName → beatName`);
      } else {
        console.log('  ℹ️  No documents in beats collection');
      }
    } catch (error) {
      console.error('  ❌ Error updating beats fields:', error.message);
    }
    
    console.log('\n📝 Step 3: Updating field names in beatexpenses collection...');
    try {
      const beatExpensesCollection = db.collection('beatexpenses');
      const expensesCount = await beatExpensesCollection.countDocuments();
      
      if (expensesCount > 0) {
        // Update bitId → beatId
        const result1 = await beatExpensesCollection.updateMany(
          { bitId: { $exists: true } },
          { $rename: { bitId: 'beatId' } }
        );
        console.log(`  ✅ Updated ${result1.modifiedCount} documents: bitId → beatId`);
        
        // Update bitName → beatName
        const result2 = await beatExpensesCollection.updateMany(
          { bitName: { $exists: true } },
          { $rename: { bitName: 'beatName' } }
        );
        console.log(`  ✅ Updated ${result2.modifiedCount} documents: bitName → beatName`);
      } else {
        console.log('  ℹ️  No documents in beatexpenses collection');
      }
    } catch (error) {
      console.error('  ❌ Error updating beatexpenses fields:', error.message);
    }
    
    console.log('\n📝 Step 4: Updating references in other collections...');
    try {
      // Update operators collection
      const operatorsCollection = db.collection('operators');
      const operatorsResult = await operatorsCollection.updateMany(
        { bitId: { $exists: true } },
        { $rename: { bitId: 'beatId' } }
      );
      if (operatorsResult.modifiedCount > 0) {
        console.log(`  ✅ Updated ${operatorsResult.modifiedCount} operators: bitId → beatId`);
      }
      
      // Update guardassignments collection
      const assignmentsCollection = db.collection('guardassignments');
      const assignmentsResult = await assignmentsCollection.updateMany(
        { bitId: { $exists: true } },
        { $rename: { bitId: 'beatId' } }
      );
      if (assignmentsResult.modifiedCount > 0) {
        console.log(`  ✅ Updated ${assignmentsResult.modifiedCount} guard assignments: bitId → beatId`);
      }
      
      // Update reports collection
      const reportsCollection = db.collection('reports');
      const reportsResult = await reportsCollection.updateMany(
        { bitId: { $exists: true } },
        { $rename: { bitId: 'beatId' } }
      );
      if (reportsResult.modifiedCount > 0) {
        console.log(`  ✅ Updated ${reportsResult.modifiedCount} reports: bitId → beatId`);
      }
      
      // Update locations collection (totalBits → totalBeats)
      const locationsCollection = db.collection('locations');
      const locationsResult = await locationsCollection.updateMany(
        { totalBits: { $exists: true } },
        { $rename: { totalBits: 'totalBeats' } }
      );
      if (locationsResult.modifiedCount > 0) {
        console.log(`  ✅ Updated ${locationsResult.modifiedCount} locations: totalBits → totalBeats`);
      }
    } catch (error) {
      console.error('  ❌ Error updating references:', error.message);
    }
    
    console.log('\n🎉 Migration completed successfully!\n');
    console.log('Summary:');
    console.log('  ✅ Collections renamed: bits → beats, bitexpenses → beatexpenses');
    console.log('  ✅ Field names updated: bitCode → beatCode, bitName → beatName, bitId → beatId');
    console.log('  ✅ References updated in operators, guardassignments, reports, locations\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrate();
