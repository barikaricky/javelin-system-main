#!/usr/bin/env node

// Test if .env file is being loaded correctly
const path = require('path');
const fs = require('fs');

console.log('\n🔍 Environment Debug Information:\n');
console.log('1. Current Working Directory:', process.cwd());
console.log('2. __dirname:', __dirname);
console.log('3. Script directory:', __dirname);

const possibleEnvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '..', '.env'),
  '/workspaces/javelin-system-main/apps/backend/.env',
];

console.log('\n📂 Checking for .env file in these locations:');
possibleEnvPaths.forEach(envPath => {
  const exists = fs.existsSync(envPath);
  console.log(`   ${exists ? '✅' : '❌'} ${envPath}`);
  if (exists) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const hasDbUrl = content.includes('DATABASE_URL');
    console.log(`      Contains DATABASE_URL: ${hasDbUrl ? '✅' : '❌'}`);
    if (hasDbUrl) {
      const match = content.match(/DATABASE_URL="([^"]+)"/);
      if (match) {
        const url = match[1].replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
        console.log(`      URL: ${url}`);
      }
    }
  }
});

console.log('\n🔧 Loading dotenv...');
require('dotenv').config();

console.log('\n📊 Environment Variables:');
console.log('   DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('   DATABASE_URL value:', process.env.DATABASE_URL ? 
  process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') : 
  'NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);

console.log('\n');
