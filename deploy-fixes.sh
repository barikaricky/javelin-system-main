#!/bin/bash
cd "$(dirname "$0")"
echo "Committing deployment fixes..."
git add apps/backend/src/server.ts apps/frontend/src/lib/api.ts DEPLOYMENT-SETUP-COMPLETE.md NETLIFY-ENV-SETUP.md
git commit -m "Fix CORS and API configuration for production deployment"
git push origin main
echo "Done! Check Railway and Netlify for auto-deployment."
