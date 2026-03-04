# Backend Restart Script for TemOS

## Issue: CORS Policy Error

The error you're seeing:
```
Access to XMLHttpRequest at 'https://aistartupidea.onrender.com/api/generate' 
from origin 'https://aistartupidea-seven.vercel.app' has been blocked by CORS policy
```

This happens because the backend server needs to be restarted after updating the `.env` file.

## Solution

### Option 1: Restart Local Backend (if running locally)

1. Stop the current backend process (Ctrl+C if running)
2. Run the backend again:
   ```bash
   cd backend
   npm run dev
   ```

### Option 2: Redeploy to Render (if deployed)

If your backend is deployed on Render.com:

1. Go to your Render dashboard
2. Find your service
3. Click "Manual Deploy" → "Clear Build Cache & Deploy"
4. Or simply push a new commit to trigger auto-deploy

### Option 3: Verify Environment Variables on Render

1. Go to Render dashboard
2. Navigate to your service
3. Click "Environment" tab
4. Ensure `ALLOWED_ORIGINS` is set to:
   ```
   http://localhost:5173,https://aistartupidea-seven.vercel.app
   ```
5. Save changes and redeploy

## Verification

After restarting, test the backend:

1. Open browser console on your frontend
2. Try to generate ideas again
3. You should see in the backend logs:
   ```
   --- CORS Configuration ---
   Allowed Origins: ['http://localhost:5173', 'https://aistartupidea-seven.vercel.app']
   ```

## Additional Notes

- The `.env` file in the backend folder already has the correct configuration
- Changes to `.env` only take effect after server restart
- Make sure your Render deployment has the same environment variables
