import bcrypt from 'bcryptjs';
import { prisma } from '../utils/database';

async function checkAndCreateUser() {
  try {
    console.log('🔍 Checking database for users...\n');

    // Check all users
    const users = await prisma.user.findMany();
    
    console.log(`📊 Total users in database: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('👥 Existing users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} - ${user.role} (${user.firstName} ${user.lastName})`);
        console.log(`   Has password: ${!!user.passwordHash}`);
        console.log(`   Status: ${user.status || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No users found in database!\n');
      console.log('Creating a test director account...\n');
      
      const password = 'director123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const director = await prisma.user.create({
        data: {
          email: 'director@jevelin.com',
          firstName: 'John',
          lastName: 'Director',
          passwordHash: hashedPassword,
          role: 'DIRECTOR',
          employeeId: 'DIR-001',
          status: 'ACTIVE',
        },
      });
      
      console.log('✅ Director account created successfully!');
      console.log('📧 Email:', director.email);
      console.log('🔑 Password:', password);
      console.log('👤 Role:', director.role);
      console.log('\n🎉 You can now login with these credentials!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateUser();
