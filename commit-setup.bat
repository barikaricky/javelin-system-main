@echo off
echo Committing Netlify setup guide...
cd /d "%~dp0"
git add NETLIFY-ENV-SETUP.md
git commit -m "Add Netlify environment setup guide"
git push origin main
echo Done!
pause
