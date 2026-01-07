const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Blue gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2563eb');
  gradient.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // White "JS" text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JS', size / 2, size / 2);
  
  // Save to public folder
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`./public/icon-${size}x${size}.png`, buffer);
  console.log(`✓ Created icon-${size}x${size}.png`);
});

console.log('\n✅ All icons created in public/ folder!');
