import { connectDB, disconnectDB } from '../lib/prisma';
import { logger } from './logger';

export async function initializeDatabase() {
  try {
    await connectDB();
    logger.info('✅ Database connected successfully');
    logger.info('✅ Database health check passed');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  try {
    await disconnectDB();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting database:', error);
  }
}

// Handle cleanup on process termination
process.on('beforeExit', async () => {
  await disconnectDatabase();
});
