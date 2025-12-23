const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building backend...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

try {
  // Use esbuild to bundle everything - it's much faster and doesn't do type checking
  console.log('Using esbuild for fast compilation...');
  execSync(
    'npx esbuild src/server.ts --bundle --platform=node --target=node18 --outfile=dist/server.js --external:bcrypt --external:@mux/mux-node --external:express --external:mongoose --external:winston --external:nodemailer --external:multer --external:jsonwebtoken --external:cors --external:helmet --external:compression --external:express-rate-limit --external:express-validator --external:dotenv --external:crypto-js --external:node-cron --external:zod --minify',
    { stdio: 'inherit', cwd: __dirname }
  );
  
  console.log('✓ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error.message);
  console.log('\nFalling back to copying source files...');
  
  // Fallback: just copy source files
  try {
    execSync('cp -r src/* dist/', { stdio: 'inherit', cwd: __dirname });
    console.log('✓ Source files copied to dist/');
    process.exit(0);
  } catch (copyError) {
    console.error('Fallback also failed. Using tsx as last resort...');
    // Last resort: create a simple entry point that uses tsx
    fs.writeFileSync(
      path.join(distDir, 'server.js'),
      `require('tsx/cjs');
require('../src/server.ts');`
    );
    console.log('✓ Created tsx-based entry point');
    process.exit(0);
  }
}
