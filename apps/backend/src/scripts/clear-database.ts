import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../lib/prisma';
import { logger } from '../utils/logger';

async function clearDatabase() {
  try {
    logger.info('🔄 Connecting to MongoDB...');
    await connectDB();
    
    logger.info('⚠️  WARNING: This will delete ALL data from the database!');
    logger.info('Database:', mongoose.connection.db.databaseName);
    
    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    logger.info(`📊 Found ${collections.length} collections to clear:`);
    collections.forEach(collection => {
      logger.info(`  - ${collection.collectionName}`);
    });
    
    // Drop each collection
    for (const collection of collections) {
      const count = await collection.countDocuments();
      await collection.drop();
      logger.info(`✅ Dropped ${collection.collectionName} (${count} documents)`);
    }
    
    logger.info('🎉 Database cleared successfully!');
    logger.info('💡 You can now start fresh with new data');
    
  } catch (error) {
    logger.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

// Run the script
clearDatabase();
