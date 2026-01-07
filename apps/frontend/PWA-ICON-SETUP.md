# PWA Icon Generator Instructions

To create icons for your PWA, you'll need to create PNG images in the following sizes:

## Required Sizes:
- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px (for iOS)
- 192x192px
- 384x384px
- 512x512px

## Quick Setup:

1. **Use your company logo** (logo.jpeg in frontend root)

2. **Online Icon Generator** (Easiest):
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload your logo
   - Download all sizes
   - Place in `/apps/frontend/public/`

3. **Or use ImageMagick** (Command line):
   ```bash
   # Install ImageMagick first
   # Then run for each size:
   convert logo.jpeg -resize 72x72 public/icon-72x72.png
   convert logo.jpeg -resize 96x96 public/icon-96x96.png
   convert logo.jpeg -resize 128x128 public/icon-128x128.png
   convert logo.jpeg -resize 144x144 public/icon-144x144.png
   convert logo.jpeg -resize 152x152 public/icon-152x152.png
   convert logo.jpeg -resize 192x192 public/icon-192x192.png
   convert logo.jpeg -resize 384x384 public/icon-384x384.png
   convert logo.jpeg -resize 512x512 public/icon-512x512.png
   ```

4. **Or create placeholder icons temporarily**:
   - Create simple colored squares for testing
   - Replace with proper logo later

## File Naming:
All icons should be named exactly as shown above and placed in:
`/apps/frontend/public/`

Example:
- `/apps/frontend/public/icon-72x72.png`
- `/apps/frontend/public/icon-192x192.png`
- etc.
