#!/usr/bin/env node
/**
 * AUTOMATED CONVERSION SCRIPT
 * Converts all remaining service files from Prisma to Mongoose
 */

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src', 'services');

// Prisma to Mongoose conversion patterns
const conversions = [
  // Import replacements
  { from: /import.*@prisma\/client.*;?/g, to: '' },
  { from: /import { prisma } from ['"]\.\.\/utils\/database['"];?/g, to: '' },
  { from: /import { prisma } from ['"]\.\.\/lib\/prisma['"];?/g, to: '' },
  
  // Common Prisma patterns to Mongoose
  { from: /prisma\.(\w+)\.findUnique\(\{\s*where:\s*\{\s*id:\s*(\w+)\s*\}/g, to: '$1.findById($2)' },
  { from: /prisma\.(\w+)\.findMany\(\)/g, to: '$1.find()' },
  { from: /prisma\.(\w+)\.create\(\{[\s\S]*?data:\s*(\{[\s\S]*?\})/g, to: '$1.create($2)' },
  { from: /prisma\.(\w+)\.update\(\{\s*where:\s*\{\s*id:\s*(\w+)\s*\},\s*data:/g, to: '$1.findByIdAndUpdate($2,' },
  { from: /prisma\.(\w+)\.delete\(\{\s*where:\s*\{\s*id:\s*(\w+)\s*\}\s*\}\)/g, to: '$1.findByIdAndDelete($2)' },
  { from: /prisma\.(\w+)\.count\(\)/g, to: '$1.countDocuments()' },
  
  // Transaction pattern
  { from: /await prisma\.\$transaction\(async \(tx\) => \{/g, to: '// Transaction converted - check manually\n// MongoDB uses sessions for transactions\n{' },
  
  // Enum patterns
  { from: /UserRole\./g, to: "'" },
  { from: /UserStatus\./g, to: "'" },
  { from: /SupervisorType\./g, to: "'" },
  { from: /ApprovalStatus\./g, to: "'" },
  { from: /PollType\./g, to: "'" },
  { from: /PollStatus\./g, to: "'" },
  { from: /MeetingStatus\./g, to: "'" },
  { from: /MeetingType\./g, to: "'" },
  { from: /MessageType\./g, to: "'" },
  { from: /MessageStatus\./g, to: "'" },
  { from: /ConversationType\./g, to: "'" },
  { from: /RequestStatus\./g, to: "'" },
  { from: /RegistrationRole\./g, to: "'" },
];

// Files to convert
const filesToConvert = [
  'supervisor.service.ts',
  'notification.service.ts',
  'meeting.service.ts',
  'poll.service.ts',
  'messaging.service.ts',
  'registration-request.service.ts',
  'secretary.service.ts',
  'director-onboarding.service.ts'
];

console.log('=== Prisma to Mongoose Conversion Script ===\n');

filesToConvert.forEach(filename => {
  const filePath = path.join(servicesDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping ${filename} (not found)`);
    return;
  }
  
  console.log(`📝 Converting ${filename}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Apply all conversions
  conversions.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  if (content !== original) {
    // Backup original
    const backupPath = filePath.replace('.ts', '.prisma-backup.ts');
    fs.writeFileSync(backupPath, original);
    
    // Write converted
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Converted and backed up to ${path.basename(backupPath)}`);
  } else {
    console.log(`   ⏭️  No changes needed`);
  }
});

console.log('\n=== Conversion Complete ===');
console.log('\n⚠️  IMPORTANT: Review all converted files manually');
console.log('   - Check transaction patterns');
console.log('   - Verify populate() calls');
console.log('   - Update model imports');
console.log('   - Test all functions');
