import cron from 'node-cron';
import { companyDocumentService } from '../services/companyDocument.service';
import { logger } from '../utils/logger';

export const initializeCronJobs = () => {
  // Check for expiring documents every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('🔔 Running daily document expiry check...');
    try {
      const result = await companyDocumentService.checkExpiringDocuments();
      logger.info(`✅ Document expiry check completed: ${result.notified} notifications sent`);
    } catch (error) {
      logger.error('❌ Error checking expiring documents:', error);
    }
  });

  logger.info('✅ Cron jobs initialized');
};
