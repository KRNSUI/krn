# KRN Bot - Integrated Chat Application

This is the integrated version of the KRN Bot chat application, designed to be deployed as a Cloudflare Worker. It provides the "Speak to the Manager" functionality with the KRN persona.

## Features

- **AI Chat Interface**: Real-time chat with KRN, the Ascended Karen
- **Streaming Responses**: Server-Sent Events (SSE) for real-time message streaming
- **KRN Persona**: Fiery, entitled, theatrically aggrieved AI assistant
- **Modern UI**: Beautiful orange-themed interface with animated backdrop
- **Mobile Responsive**: Works on all device sizes

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers AI enabled
- Wrangler CLI installed: `npm install -g wrangler`

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

### Development

For local development:

```bash
npm run dev
```

The application will be available at `http://localhost:8787`

## Configuration

### Wrangler Configuration

The `wrangler.jsonc` file contains the worker configuration:

- **Name**: `krnbot-integrated`
- **AI Binding**: Uses Cloudflare Workers AI
- **Assets**: Serves static files from `./public`
- **Compatibility**: Node.js compatibility enabled

### AI Model

The bot uses the `@cf/meta/llama-3.3-70b-instruct-fp8-fast` model by default.

### KRN Persona

The bot is configured with the KRN persona:
- Fiery, entitled, theatrically aggrieved
- Sharp, witty, eye-rolling responses
- Sizzling orange-glow confidence
- Respects boundaries and laws

## API Endpoints

- `GET /` - Serves the chat interface
- `POST /api/chat` or `POST /chat` - Chat API endpoint
- `OPTIONS /api/chat` - CORS preflight

### Chat API

Send a POST request to `/api/chat` with:

```json
{
  "messages": [
    {"role": "user", "content": "Hello KRN!"}
  ],
  "temperature": 0.3,
  "max_tokens": 1024
}
```

The response is a Server-Sent Events stream.

## Integration

This integrated version can be:

1. **Deployed as a standalone worker** and accessed via iframe
2. **Integrated into the main application** by copying the files
3. **Used as a subdomain** (e.g., `krnbot.yourdomain.com`)

## File Structure

```
krnbot-integrated/
├── src/
│   ├── index.ts          # Main worker logic
│   └── types.ts          # TypeScript definitions
├── public/
│   ├── index.html        # Chat interface
│   └── chat.js           # Frontend JavaScript
├── package.json          # Dependencies and scripts
├── wrangler.jsonc        # Cloudflare configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Troubleshooting

### Common Issues

1. **AI Binding Error**: Ensure Workers AI is enabled in your Cloudflare account
2. **CORS Issues**: The worker includes CORS headers, but check if your domain is allowed
3. **Streaming Not Working**: Verify the AI model is available and your account has credits

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:

```bash
wrangler dev --env DEBUG=true
```

## Security

- Content Security Policy (CSP) is enforced
- CORS is properly configured
- No sensitive data is stored
- Input validation and sanitization

## License

This project is part of the $KRN ecosystem.
