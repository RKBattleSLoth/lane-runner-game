# Deploying to Railway

This game can be easily deployed to Railway.app for free.

## Quick Deploy Steps

1. **Push to GitHub** (already done!)
   ```bash
   git add .
   git commit -m "Add Railway deployment files"
   git push
   ```

2. **Go to Railway.app**
   - Visit [railway.app](https://railway.app)
   - Sign in with GitHub

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `lane-runner-game` repository

4. **Railway will auto-detect**
   - Detects Node.js from `package.json`
   - Runs `npm install`
   - Runs `npm start` to launch server
   - Exposes on PORT (automatically set by Railway)

5. **Get your URL**
   - Railway generates a URL like `https://your-app.railway.app`
   - Share with friends!

## Local Testing (Optional)

Test the deployment setup locally before pushing:

```bash
npm install
npm start
```

Then visit `http://localhost:3000`

## Configuration

No additional configuration needed! Railway automatically:
- Sets `PORT` environment variable
- Builds and deploys on every push to main
- Provides HTTPS

## Troubleshooting

If deployment fails:
1. Check Railway logs in the dashboard
2. Ensure all files are committed and pushed
3. Verify Node.js version in `package.json` matches Railway (18+)
