# GitHub Setup Guide

## Your Git Status ✅
- ✅ Git repository initialized
- ✅ Files committed (365 files, 117,553 lines)
- ✅ Branch: `master`
- ✅ Commit: "Initial commit: Javelin Security Management System"

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `javelin-security-system` (or your preferred name)
   - **Description**: "Javelin Security Management System - Guard assignment and operations management"
   - **Visibility**: Choose **Private** or **Public**
   - **DO NOT** initialize with README, .gitignore, or license (you already have these)

4. Click **"Create repository"**

## Step 2: Connect Your Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
cd c:/Users/user/Documents/GitHub/javelin-system-main

# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/javelin-security-system.git

# Rename branch to main (recommended)
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## Step 3: Verify Upload

Go to your repository URL: `https://github.com/YOUR_USERNAME/javelin-security-system`

You should see all your files including:
- ✅ Backend code (apps/backend/)
- ✅ Frontend code (apps/frontend/)
- ✅ Documentation (docs/, DEPLOYMENT.md)
- ✅ Configuration files (railway.json, netlify.toml)

## Step 4: Set Up GitHub Secrets (For Deployment)

If you want to use GitHub Actions for CI/CD:

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `DATABASE_URL`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `JWT_REFRESH_SECRET`: Your JWT refresh secret

## Quick Commands Reference

```bash
# Check status
git status

# Add new files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# Create a new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main
```

## Railway + Netlify Deployment from GitHub

### Railway (Backend):
1. Go to [Railway](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Select your `javelin-security-system` repository
4. Railway will auto-detect `railway.json` configuration
5. Add environment variables in Railway dashboard

### Netlify (Frontend):
1. Go to [Netlify](https://netlify.com)
2. **Add new site** → **Import from Git**
3. Select your `javelin-security-system` repository
4. Netlify will auto-detect `netlify.toml` configuration
5. Set **Base directory**: `apps/frontend`
6. Add environment variable: `VITE_API_URL=https://your-railway-app.railway.app`

## Troubleshooting

### Authentication Issues
If you get authentication errors when pushing:

**Option 1: Personal Access Token (Recommended)**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when pushing

**Option 2: SSH Key**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key and add to GitHub
cat ~/.ssh/id_ed25519.pub
```

Then update remote to use SSH:
```bash
git remote set-url origin git@github.com:YOUR_USERNAME/javelin-security-system.git
```

### Large File Errors
If you get errors about large files:

```bash
# Check file sizes
git ls-files -s | awk '{print $4}' | sort -u | while read f; do du -h "$f"; done | sort -h

# Remove large files from commit
git rm --cached path/to/large/file
git commit --amend
```

## Next Steps

1. ✅ Create GitHub repository
2. ✅ Push your code
3. ✅ Deploy backend to Railway
4. ✅ Deploy frontend to Netlify
5. ✅ Test the live application

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.
