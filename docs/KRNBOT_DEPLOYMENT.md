# KRN Bot Deployment Guide

## Overview
The KRN Bot is a Cloudflare Worker that provides the AI chat functionality for the "Speak to the Manager" feature. It has been integrated into the main repository and can be deployed as a standalone worker.

## Current Setup
- The integrated krnbot is located in `/krnbot-integrated/`
- All necessary files are included in the main repository
- Can be deployed as a standalone Cloudflare Worker
- No submodule dependencies required

## Deployment Options

### Option 1: Deploy as Cloudflare Worker (Recommended)
1. Navigate to the krnbot-integrated directory:
   ```bash
   cd krnbot-integrated
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

4. Update the iframe src in `src/systems/render/pages/manager.js` to point to your deployed worker URL.

### Option 2: Local Development
1. Start the krnbot locally:
   ```bash
   cd krnbot-integrated
   npm run dev
   ```

2. The krnbot will be available at `http://localhost:8787`

3. Update the iframe src to point to the local development server.

### Option 3: Static File Serving (Legacy)
- The krnbot static files are served from `/public/krnbot/`
- This provides the UI but requires the API to be deployed separately
- The chat functionality won't work without the deployed worker
- **Note**: This is the legacy approach. Use the integrated version instead.

## Configuration
The krnbot uses the following configuration:
- **Model**: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- **Persona**: KRN, the Ascended Karen
- **API Endpoint**: `/api/chat` or `/chat`

## Troubleshooting
- If the iframe doesn't load, check that the krnbot is properly deployed
- If chat doesn't work, ensure the Cloudflare Worker is running
- Check browser console for any CSP or iframe-related errors

## Integration
The krnbot is integrated into the main app via iframe. The iframe approach provides:
- Isolated chat environment
- Full krnbot functionality
- Consistent KRN persona
- Real-time streaming responses

## Migration from Submodule
If you were previously using the krnbot submodule:

1. Remove the submodule:
   ```bash
   git submodule deinit krnbot
   git rm krnbot
   git commit -m "Remove krnbot submodule"
   ```

2. Deploy the integrated version:
   ```bash
   cd krnbot-integrated
   npm install
   npm run deploy
   ```

3. Update any references to point to the new deployed worker URL.
