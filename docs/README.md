# KRN Documentation

Welcome to the KRN (Karen) documentation. This repository contains the complete anonymous complaints platform built on the Sui blockchain.

## 📚 Documentation Index

### Core Documentation
- **[Main README](../README.md)** - Project overview and quick start
- **[Enhanced Complaints System](../ENHANCED_COMPLAINTS_README.md)** - Complete guide to the enhanced complaint system
- **[Whitepaper](whitepaper.md)** - Technical whitepaper and project vision

### Deployment Guides
- **[KRN Bot Deployment](KRNBOT_DEPLOYMENT.md)** - How to deploy the integrated KRN Bot
- **[KRN Bot Integration Summary](KRNBOT_INTEGRATION_SUMMARY.md)** - Summary of the KRN Bot integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account with Workers AI enabled
- Wrangler CLI: `npm install -g wrangler`

### 1. Clone and Setup
```bash
git clone <repository-url>
cd stars
npm install
```

### 2. Deploy Enhanced Database Schema
```bash
chmod +x migrations/deploy_enhanced_schema.sh
./migrations/deploy_enhanced_schema.sh
```

### 3. Deploy KRN Bot (Optional)
```bash
cd krnbot-integrated
npm install
npm run deploy
```

### 4. Deploy Main Application
```bash
wrangler deploy
```

## 🏗️ Architecture

### Enhanced Complaint System
- **Database**: Cloudflare D1 with enhanced schema
- **API**: Enhanced endpoints with pagination, sorting, and filtering
- **Frontend**: Modern UI with real-time interactions
- **Moderation**: Built-in content filtering and flagging system

### KRN Bot Integration
- **AI Chat**: Cloudflare Workers AI powered chat interface
- **KRN Persona**: Fiery, entitled AI assistant
- **Real-time Streaming**: Server-Sent Events for live responses

### Key Features
- ✅ Anonymous complaint submissions
- ✅ User interactions (stars/flags)
- ✅ Content moderation
- ✅ Pagination and sorting
- ✅ AI-powered chat support
- ✅ Mobile responsive design
- ✅ Real-time updates

## 📁 Project Structure

```
stars/
├── api/                          # API endpoints
│   ├── complaints_enhanced.js    # Enhanced complaints API
│   ├── submit_enhanced.js        # Enhanced submission API
│   └── krnbot.js                 # KRN Bot API
├── krnbot-integrated/            # Integrated KRN Bot
│   ├── src/                      # Worker source code
│   ├── public/                   # Static assets
│   └── package.json              # Bot dependencies
├── migrations/                   # Database migrations
│   ├── enhanced_schema.sql       # Enhanced database schema
│   └── deploy_enhanced_schema.sh # Schema deployment script
├── src/                          # Frontend source code
│   ├── core/utils/               # Utility functions
│   │   ├── feed_enhanced.js      # Enhanced feed component
│   │   └── censor.js             # Content moderation
│   └── systems/                  # System components
├── docs/                         # Documentation
└── public/                       # Static assets
```

## 🔧 Configuration

### Environment Variables
- `KRN_DB` - D1 database binding
- `AI` - Workers AI binding (for KRN Bot)

### Database Schema
The enhanced schema includes:
- `complaints` - Main complaints table with counts
- `stars` - User star interactions
- `flags` - Content moderation flags
- `user_sessions` - User activity tracking

## 🚀 Deployment

### Production Deployment
1. **Deploy Database Schema**
   ```bash
   ./migrations/deploy_enhanced_schema.sh
   ```

2. **Deploy KRN Bot** (if using integrated version)
   ```bash
   cd krnbot-integrated
   npm run deploy
   ```

3. **Deploy Main Application**
   ```bash
   wrangler deploy
   ```

### Development
```bash
wrangler dev
```

## 📊 Monitoring

### Logs
- Application logs are available in Cloudflare Workers dashboard
- Database queries can be monitored via D1 dashboard

### Metrics
- Complaint submission volume
- User engagement (stars/flags)
- Content moderation activity
- AI chat usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the KRN ecosystem.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting sections in the documentation
2. Review Cloudflare Workers documentation
3. Check the enhanced complaints README for specific issues

---

**Built with ❤️ for the KRN community**
