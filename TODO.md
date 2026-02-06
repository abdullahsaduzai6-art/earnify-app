# Fix Server Connection Error

## Issue
The server at https://earnify-server.vercel.app is not reachable, causing "Connection error - cannot reach server" in the web app.

## Root Cause
The Vercel deployment likely failed because required environment variables are missing.

## Required Environment Variables
The server requires the following environment variables (copy values from server/.env):

- MONGODB_URI
- JWT_SECRET
- ADMIN_EMAIL
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- SMTP_FROM

## Steps to Fix
1. Go to Vercel dashboard (vercel.com)
2. Select the "earnify-server" project
3. Go to Settings > Environment Variables
4. Add each of the required environment variables listed above
5. Copy the values from your local server/.env file
6. Save the environment variables
7. Redeploy the project (go to Deployments tab and trigger a new deployment)
8. After deployment completes, test the server by visiting https://earnify-server.vercel.app/health
9. If it returns {"ok": true}, the server is working
10. Test the web app to ensure API calls work

## Verification
Once fixed, the web app should be able to connect to the server without connection errors.
