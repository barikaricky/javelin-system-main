import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/jevelin_db';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return;
  }

  try {
    logger.info(`🔄 Connecting to database...`);
    logger.info(`📍 Connection URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`); // Log URI with masked password
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased to 10 seconds for Atlas
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    await mongoose.connect(MONGODB_URI, options);

    isConnected = true;
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

// For backward compatibility, export mongoose connection
export const db = mongoose.connection;
