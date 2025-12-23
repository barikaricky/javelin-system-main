import bcrypt from 'bcryptjs';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

async function fixUserPasswords() {
  try {
    logger.info('Starting password fix script...');

    // Find all users without passwordHash
    const usersWithoutPassword = await prisma.user.findMany({
      where: {
        passwordHash: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    logger.info(`Found ${usersWithoutPassword.length} users without passwords`);

    if (usersWithoutPassword.length === 0) {
      logger.info('No users need password fixes');
      return;
    }

    // Set a temporary password for each user
    const tempPassword = 'TempPass123!'; // Users will need to reset this
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    for (const user of usersWithoutPassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });

      logger.info(`Set temporary password for user: ${user.email}`);
    }

    logger.info('Password fix complete!');
    logger.info('IMPORTANT: All affected users should reset their passwords.');
    logger.info(`Temporary password for all users: ${tempPassword}`);
  } catch (error) {
    logger.error('Error fixing user passwords:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixUserPasswords()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });
