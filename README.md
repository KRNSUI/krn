# 🪙 Karen on SUI - FlexNetJSX Application

A modular, fully functional, no-Node.js web application for Karen on SUI on the SUI blockchain, built using the **FlexNetJSX** framework.

[![Buy on Blast.fun](https://img.shields.io/badge/Buy-KRN%20on%20Blast.fun-6ee7ff?style=for-the-badge&logo=coinbase)](https://blast.fun/token/0x76ff24af704e0b6d6a121ab23e5ea9e8343c29a0c50f664ab0f01b2f2858c758?ref=Aemon)
[![Sui Explorer](https://img.shields.io/badge/View%20on-Suiscan-blue?style=for-the-badge&logo=sui)](https://suiscan.xyz/mainnet/coin/0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN/txs)
![Cloudflare Pages](https://img.shields.io/badge/Hosted%20on-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## 🌐 Website
👉 [Anonymous Complaint Platform](https://krn.fuck-out.com)

- Submit Complaints anonymously with enhanced features
- Advanced complaint feed with pagination and sorting
- Real-time star and flag interactions
- Integrated live chart of the $KRN token on SUI
- AI-powered chat with KRN Bot

## 🚀 Quick Start

### For Users
1. Visit [krn.fuck-out.com](https://krn.fuck-out.com)
2. Connect your SUI wallet
3. Submit complaints or interact with existing ones
4. Use the enhanced feed features (sort, filter, star, flag)

### For Developers
1. Clone the repository
2. Deploy the enhanced database schema: `./migrations/deploy_enhanced_schema.sh`
3. Deploy the KRN Bot: `cd krnbot-integrated && npm run deploy`
4. Deploy the main application: `wrangler deploy`

See [docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md) for detailed migration instructions.

## 💸 Buy $KRN
You can purchase $KRN on **Blast.fun**:  
[Buy KRN on Blast.fun →](https://blast.fun/token/0x76ff24af704e0b6d6a121ab23e5ea9e8343c29a0c50f664ab0f01b2f2858c758?ref=Aemon)

Token Address (Sui mainnet):  
```
0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN
```

## 📊 Token Info
- **Name:** KRN  
- **Chain:** Sui mainnet  
- **Explorer:** [View on Suiscan](https://suiscan.xyz/mainnet/coin/0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN/txs)

---

## 🏗️ FlexNetJSX Architecture Overview

This application implements the **FlexNetJSX** functional programming architecture with the following core principles:

- **Functions as Primary Operations** - Pure functions throughout
- **Immutable State Management** - No direct state mutations
- **Functional Composition** - Function composition and currying
- **Zero Dependencies** - No external frameworks or build tools
- **Browser Native Implementation** - Runs directly in modern browsers

## 🚀 Features

### Enhanced Complaint System
The platform now features a comprehensive complaint management system with:
- **Advanced Pagination** - Newer/Older navigation with cursor-based pagination
- **Multiple Sort Options** - Sort by newest, oldest, most starred, most flagged
- **Content Filtering** - Show/hide flagged content
- **Real-time Interactions** - Star and flag complaints with instant updates
- **User State Tracking** - Remember which complaints users have interacted with
- **Content Moderation** - Automatic flagging and filtering system
- **Performance Optimized** - Database indexes and efficient queries

### Core Functionality
- ✅ **SUI Wallet Integration** - Connect to SUI blockchain wallets
- ✅ **KRN Token Management** - Balance checking and transactions
- ✅ **Enhanced Anonymous Content System** - Post complaints with advanced features
- ✅ **Content Moderation** - Built-in filtering and flagging system
- ✅ **Advanced User Interactions** - Star, flag, and moderate content
- ✅ **DAO-Controlled Router** - Transparent token distribution
- ✅ **AI Chat Integration** - KRN-powered LLM chat with integrated KRN Bot
- ✅ **Community Governance** - KRN token-based voting system
- ✅ **Karen Lore** - Mythological origin story and platform identity

### User Experience
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Theme Support** - Light and dark themes
- ✅ **Real-time Updates** - Live balance and state updates
- ✅ **Enhanced Feed** - Pagination, sorting, and filtering
- ✅ **Interactive Elements** - Star, flag, and reveal functionality
- ✅ **Error Handling** - Comprehensive error boundaries
- ✅ **Loading States** - Smooth user experience

### Page Organization
- 🏠 **Home** - Karen lore and platform overview
- 📊 **About** - KRN token chart, holders, and platform information
- 🤖 **Speak to the Manager** - AI chat integration with krnbot
- 📝 **File a Complaint** - Anonymous complaint form and feed
- 🗳️ **Vote** - Community moderation through KRN token voting

## 📁 Project Structure

```
krn-token-app/
├── index.html              # Main application entry point
├── README.md               # Project documentation
├── package.json            # Project configuration
├── .gitmodules             # Git submodules configuration
│
├── public/                 # Public assets
│   └── styles.css          # Unified CSS (includes mobile styles)
│
├── src/                    # FlexNetJSX source code
│   ├── index.js            # Application entry point
│   ├── core/               # Core framework
│   │   ├── types/          # Type system (Maybe, Either, Result)
│   │   ├── functions/      # Core functions
│   │   └── utils/          # Core utilities
│   │       ├── chart.js    # KRN token chart functionality
│   │       ├── feed_enhanced.js # Enhanced feed and complaint system
│   │       ├── censor.js   # Content censoring
│   │       └── stars.js    # Star/favorite system
│   └── systems/            # Application systems
│       ├── render/         # Rendering system
│       │   ├── jsx.js      # Virtual DOM and JSX implementation
│       │   ├── App.js      # Main application component
│       │   ├── WalletConnect.js # Wallet connection component
│       │   ├── ContentFeed.js   # Content feed component
│       │   └── pages/      # Page components
│       │       ├── home.js      # Home page
│       │       ├── about.js     # About page
│       │       ├── manager.js   # Manager page (krnbot)
│       │       ├── entitlements.js # File a Complaint page
│       │       ├── vote.js      # Voting page
│       │       └── index.js     # Page exports
│       ├── state/          # State management
│       ├── wallet/         # SUI wallet integration
│       │   ├── sui.js      # SUI wallet system
│       │   └── slush.js    # SUI wallet utilities
│       └── router/         # Routing system
│
├── krnbot/                 # AI Chat submodule
│   ├── src/                # Cloudflare Workers AI
│   └── public/             # krnbot public interface
│
├── api/                   # Cloudflare Workers API endpoints
│   ├── bb.js              # KRN token data API
│   ├── complaints.js      # Complaints management
│   ├── submit.js          # Complaint submission
│   ├── stars/             # Star/favorite system
│   │   ├── index.js
│   │   ├── toggle.js
│   │   └── user.js
│   ├── chain-txs.js       # Blockchain transactions
│   ├── diag.js           # Diagnostics
│   └── status.js         # System status
│
├── contracts/              # SUI Move contracts
└── migrations/             # Database migrations
```

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- SUI Wallet extension (optional, for full functionality)

### Local Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/KRNSUI/krn-token-app.git
   cd krn-token-app
   ```

2. **Initialize submodules**
   ```bash
   git submodule update --init --recursive
   ```

3. **Start local server**
   ```bash
   # Using Python
   python3 -m http.server 8080
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8080
   ```

4. **Open in browser**
   ```
   http://localhost:8080
   ```

### Production Deployment
The application is designed for deployment on **Cloudflare Pages**:

1. **Connect repository** to Cloudflare Pages
2. **Set build settings**:
   - Build command: (none required)
   - Build output directory: `/`
   - Root directory: `/`
3. **Configure environment variables** (if needed)
4. **Deploy**

The application will be available at your Cloudflare Pages URL.
│   ├── public/             # Chat interface
│   └── README.md           # Bot documentation
│
├── contracts/              # Smart contracts
│   └── krn_router.move     # SUI Move router contract
│
├── api/                   # Cloudflare Workers API endpoints
│   ├── bb.js              # KRN token data API
│   ├── complaints.js      # Complaints management
│   ├── submit.js          # Complaint submission
│   ├── stars/             # Star/favorite system
│   ├── chain-txs.js       # Blockchain transactions
│   ├── diag.js           # Diagnostics
│   └── status.js         # System status
│
└── migrations/             # Database migrations
    ├── schema.sql          # Main schema
    ├── stars.sql           # Stars table
    └── ...                 # Other migrations
```

## 🤖 KRN Bot Integration

The application includes the **krnbot** submodule for AI chat functionality:

### Features
- **KRN-Powered Chat** - Users pay KRN for AI chat tokens
- **Cloudflare Workers AI** - Powered by LLM models
- **Streaming Responses** - Real-time chat experience
- **Token Packs** - Predefined chat token amounts

### Integration
```bash
# Initialize submodule
git submodule update --init --recursive

# Update submodule
git submodule update --remote krnbot
```

### Usage
1. Connect SUI wallet with KRN balance
2. Navigate to AI Chat page
3. Purchase token pack with KRN
4. Start chatting with AI
5. Tokens consumed per message/response

## 🛠️ FlexNetJSX Core Systems

### 1. Type System (`src/core/types/index.js`)

Implements functional programming types:

```javascript
// Maybe type for optional values
const maybeValue = Maybe.Just(42);
const maybeResult = maybeValue.map(x => x * 2);

// Either type for error handling
const eitherResult = Either.Right("success");
const eitherError = Either.Left("error");

// Result type for operations
const result = Result.Success(data);
const failure = Result.Failure(error);
```

### 2. State Management (`src/systems/state/index.js`)

Immutable state with functional updates:

```javascript
// Create store
const store = createStore(initialState);

// Subscribe to changes
store.subscribe(state => {
  console.log('State updated:', state);
});

// Update state functionally
store.update(prevState => ({
  ...prevState,
  user: { ...prevState.user, isConnected: true }
}));
```

### 3. SUI Wallet Integration (`src/systems/wallet/sui.js`)

Handles SUI blockchain interactions:

```javascript
// Connect wallet
const result = await WalletManager.connect();

// Get KRN balance
const balance = await KRNTokenManager.getKRBalance(address);

// Execute KRN transaction
const txResult = await KRNTokenManager.executeKRTransaction(
  action, itemId, amount
);
```

### 4. Router System (`src/systems/router/router.js`)

Functional routing with guards:

```javascript
// Route with wallet requirement
const protectedRoute = requireWallet({
  path: '/feed',
  component: 'FeedPage'
});

// Route with KRN balance requirement
const paidRoute = requireKRNBalance(1)({
  path: '/bot',
  component: 'BotPage'
});
```

## 🎯 User Flow

### 1. First Visit
- User sees landing page with "Connect Wallet" CTA
- No content visible until wallet is connected
- Clear explanation of Karen on SUI features

### 2. Wallet Connection
- User clicks "Connect Wallet"
- SUI Wallet extension opens
- On successful connection:
  - User state updates to connected
  - KRN and SUI balances are fetched
  - Content becomes visible
  - Navigation expands

### 3. Content Consumption
- **Censored Content**: Shows placeholder, requires KRN to view
- **Uncensored Content**: Fully visible
- **Filter Controls**: All, Censored, Uncensored

### 4. Token-Powered Actions
- **Star/Unstar**: Costs 1 KRN
- **Flag Content**: Costs 1 KRN
- **View Censored**: Costs 1 KRN
- **AI Chat**: Requires KRN balance

### 5. KRN Purchase Flow
- When insufficient KRN:
  - Modal appears with Blast.Fun link
  - User redirected to purchase KRN
  - Return to app with updated balance
  - Action retries automatically

## 🔧 Technical Implementation

### FlexNetJSX Components

```javascript
// Functional component with hooks
const WalletConnect = ({ onConnect, onDisconnect }) => {
  const [state, setState] = useState({
    isConnected: false,
    address: null,
    krnBalance: 0
  });

  useEffect(() => {
    const unsubscribe = subscribe((appState) => {
      setState({
        isConnected: selectIsConnected(appState),
        address: selectUserAddress(appState),
        krnBalance: selectKRNBalance(appState)
      });
    });
    return unsubscribe;
  }, []);

  return createElement('div', { className: 'wallet-connect' },
    // Component JSX
  );
};
```

### State Management Pattern

```javascript
// Selectors for state access
const selectIsConnected = (state) => state.user.isConnected;
const selectKRNBalance = (state) => state.user.balance.KRN;

// Actions for state updates
const userActions = {
  connectWallet: (address) => (state) => ({
    ...state,
    user: {
      ...state.user,
      isConnected: true,
      address
    }
  })
};

// Dispatch actions
dispatch(userActions.connectWallet(address));
```

### SUI Move Contract Integration

```move
// Router contract for KRN distribution
public entry fun pay<KRN>(
    cfg: &Config, 
    seller: address, 
    action: u8, 
    item: vector<u8>, 
    mut krn: coin::Coin<KRN>, 
    ctx: &mut TxContext
) {
    // Split KRN tokens:
    // - 30% to company wallet
    // - 5% to developer wallet  
    // - 5% to burn vault
    // - 60% to community integrity fund
}
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- SUI Wallet extension installed
- KRN tokens for actions (purchase on Blast.Fun)

### Installation

1. **Clone the repository with submodules**
   ```bash
   git clone --recursive <repository-url>
   cd krn-token-app
   
   # Or clone and then init submodules
   git clone <repository-url>
   cd krn-token-app
   git submodule update --init --recursive
   ```

2. **Serve the application**
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npm start
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000/krn-app.html
   ```

### Development

The application is built with zero build tools - just edit the JavaScript files and refresh the browser:

```bash
# Edit source files
vim src/systems/render/App.js

# Refresh browser to see changes
```

## 🔒 Security Features

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline';
               connect-src 'self' https://fullnode.mainnet.sui.io:443;">
```

### XSS Prevention
- Input validation and sanitization
- Content escaping in components
- CSP headers for script protection

### Wallet Security
- Secure SUI wallet integration
- Transaction signing verification
- Balance validation before actions

## 📊 Token Economics

### KRN Token Distribution
When users spend KRN for actions:

- **30%** → Company Treasury
- **5%** → Developer Fund  
- **5%** → Burn (deflationary)
- **60%** → Community Integrity Fund

### Action Costs
- **Star/Unstar**: 1 KRN
- **Flag Content**: 1 KRN
- **View Censored**: 1 KRN
- **AI Chat**: Variable (based on token packs)

## 🔗 External Integrations

### SUI Blockchain
- **Network**: SUI Mainnet
- **Token**: KRN Token
- **Explorer**: SuiScan
- **Wallet**: SUI Wallet Extension

### Blast.Fun
- **KRN Purchase**: Direct link to Blast.Fun
- **Token Address**: `0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN`

### Social Links
- **GitHub**: https://github.com/KRNSUI
- **Twitter**: https://x.com/KRNonsui
- **Telegram**: https://t.me/+_o-Osjl6_-g1ZTEx

## 🧪 Testing

### Manual Testing
1. **Wallet Connection**: Test with and without SUI Wallet
2. **Balance Updates**: Verify KRN balance polling
3. **Content Actions**: Test favorite, unfavorite, flag
4. **KRN Transactions**: Verify blockchain transactions
5. **Error Handling**: Test with insufficient KRN
6. **AI Chat**: Test KRN-powered chat functionality

### Browser Compatibility
- ✅ Chrome (latest)
- ✅ Firefox (latest)  
- ✅ Safari (latest)
- ✅ Edge (latest)

## 🚧 Future Enhancements

### Planned Features
- [ ] **Content Categories** - Organized complaint types
- [ ] **User Profiles** - Anonymous profile system
- [ ] **Moderation Tools** - Advanced flagging system
- [ ] **Analytics Dashboard** - Content and token metrics
- [ ] **Mobile App** - Native mobile application

### Technical Improvements
- [ ] **Service Worker** - Offline support
- [ ] **PWA Features** - Installable app
- [ ] **Performance Optimization** - Virtual scrolling
- [ ] **Accessibility** - WCAG compliance
- [ ] **Internationalization** - Multi-language support

## 🤝 Contributing

### Development Guidelines
1. **Functional Programming** - Use pure functions
2. **Immutable State** - Never mutate state directly
3. **Type Safety** - Use Maybe, Either, Result types
4. **Error Handling** - Comprehensive error boundaries
5. **Testing** - Test all user flows

### Code Style
- Use ES6+ features
- Prefer functional composition
- Document complex functions
- Follow FlexNetJSX patterns

## ⚖️ Disclaimer
All submissions are **user-generated** and reflect the opinions of individual users only.  
The KRN project and its maintainers:

- Do **not** endorse or verify any submitted content.  
- Are **not liable** for user-submitted material.  
- Reserve the right to remove unlawful or harmful submissions.  

**By using this platform, you agree not to post personally identifiable information (PII), unlawful, or defamatory content.**

## 📄 License

MIT License © 2025 KRN Contributors

## 🙏 Acknowledgments

- **FlexNetJSX Framework** - Functional JavaScript architecture
- **SUI Blockchain** - High-performance blockchain platform
- **Karen on SUI Community** - Anonymous complaints ecosystem
- **Blast.Fun** - Token trading platform
- **Cloudflare Workers AI** - AI chat functionality

---

**Built with ❤️ using FlexNetJSX for the Karen on SUI community**

