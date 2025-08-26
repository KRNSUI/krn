# 🪙 $KRN — Anonymous Complaint Platform on Sui

[![Buy on Blast.fun](https://img.shields.io/badge/Buy-KRN%20on%20Blast.fun-6ee7ff?style=for-the-badge&logo=coinbase)](https://blast.fun/token/0x76ff24af704e0b6d6a121ab23e5ea9e8343c29a0c50f664ab0f01b2f2858c758?ref=Aemon)
[![Sui Explorer](https://img.shields.io/badge/View%20on-Suiscan-blue?style=for-the-badge&logo=sui)](https://suiscan.xyz/mainnet/coin/0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN/txs)
![Cloudflare Pages](https://img.shields.io/badge/Hosted%20on-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**KRN** is a revolutionary decentralized platform built on the Sui blockchain that transforms the traditional complaint system into a transparent, incentivized, and community-driven ecosystem.

## 🌟 Key Features

- **Anonymous Complaints** — Submit complaints without names, emails, or tracking
- **Stars Economy** — Revolutionary dynamic pricing engagement system
- **Slush Wallet Integration** — Native Sui blockchain wallet support
- **Dynamic Pricing** — Escalating costs that prevent spam and reward commitment
- **Community Moderation** — Economic incentives for quality content

---

## 🌐 Website
👉 [Anonymous Complaint Platform](https://dirtystuff.org)

- Submit complaints anonymously with zero personal data collection
- View recent complaints in a public feed
- Engage with the innovative Stars system
- Connect your Slush wallet for full functionality
- Live chart of $KRN token activity on Sui

---

## ⭐ Stars System: Revolutionary Engagement

The KRN Stars system introduces world-first dynamic pricing mechanics:

### Adding Stars (Favoriting)
- **1st star on a post:** 1 KRN
- **2nd star on same post:** 2 KRN
- **3rd star on same post:** 3 KRN
- **Formula:** `Cost = Star Position`

### Removing Your Own Stars
- **Remove 1st own star:** 2 KRN
- **Remove 2nd own star:** 4 KRN
- **Remove 3rd own star:** 6 KRN
- **Formula:** `Cost = Star Position × 2`

### Removing Others' Stars (Moderation)
- **Cost = Total Stars on Post × 2**
- Prevents abuse and incentivizes quality content

---

## 💸 Buy $KRN
Purchase $KRN on **Blast.fun**:  
[Buy KRN on Blast.fun →](https://blast.fun/token/0x76ff24af704e0b6d6a121ab23e5ea9e8343c29a0c50f664ab0f01b2f2858c758?ref=Aemon)

**Token Address (Sui mainnet):**
```
0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN
```

---

## 📊 Token Info
- **Name:** KRN Token
- **Symbol:** $KRN
- **Chain:** Sui mainnet
- **Explorer:** [View on Suiscan](https://suiscan.xyz/mainnet/coin/0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN/txs)

---

## 🏗️ Technical Architecture

### Frontend
- **Vanilla HTML, CSS, JavaScript** — No build process or bundlers
- **ES6 Modules** — Modern JavaScript with dynamic imports
- **Responsive Design** — Mobile-first approach
- **Real-time Updates** — Live complaint feed and star counts
- **Progressive Enhancement** — Works without JavaScript, enhanced with it

### Backend
- **Cloudflare Pages** — Static hosting
- **Cloudflare Workers** — Serverless functions
- **Cloudflare D1** — SQLite database for complaints and stars
- **Edge Computing** — Global performance

### Blockchain Integration
- **Sui Network** — High-performance Layer 1
- **Slush Wallet** — Native wallet integration
- **Move Language** — Smart contract support

---

## 🚀 Quick Deploy (Cloudflare Pages)

### 1. Setup Repository
1. Push this folder to a **public GitHub repository**
2. Fork or clone this project

### 2. Cloudflare Pages Setup
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages**
2. Click **Create a project** → **Connect to Git**
3. Select your repository
4. **Build settings:**
   - Framework preset: **None**
   - Build command: *leave empty*
   - Build output directory: `/` (root)

### 3. Database Configuration
1. After first build, go to your Pages project
2. **Settings → Functions:**
   - Enable **Functions**
   - Under **D1 Databases**, click **Add binding:**
     - Binding name: `KRN_DB`
     - Database: create new (e.g., `krn-db`)

### 4. Initialize Database
1. Go to **D1 → your database → Query**
2. Paste and run the contents of `migrations/schema.sql`
3. Run the stars table creation: `migrations/stars.sql`

### 5. Environment Variables
Ensure your D1 database binding is properly configured in the Cloudflare Pages Functions settings.

---

## 🛠️ Local Development

### Prerequisites
- Modern web browser with ES6 module support
- Python 3 (for simple local server)
- Cloudflare account (for deployment and database management)

### Option 1: Simple Local Server (Recommended)
```bash
python3 -m http.server 8000
```
Then visit [http://localhost:8000](http://localhost:8000)

**Note:** Due to ES6 modules, you'll need to serve from a local server - opening the HTML file directly won't work.

### Option 2: Cloudflare Browser D1 Explorer (Recommended)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **D1**
2. Create a new database (e.g., `krn-db`)
3. Click on your database → **Query**
4. Copy and paste the contents of `migrations/schema.sql` → **Run**
5. Copy and paste the contents of `migrations/stars.sql` → **Run**

**No CLI tools needed!** Everything can be done through the browser interface.

---

## 📁 Project Structure

```
krn/
├── functions/           # Cloudflare Workers functions
│   ├── stars/          # Stars system backend
│   ├── submit.js       # Complaint submission
│   └── complaints.js   # Complaint retrieval
├── public/             # Frontend assets
│   ├── stars.js        # Stars system frontend
│   ├── slush.js        # Wallet integration
│   ├── feed.js         # Complaint feed
│   └── styles.css      # Styling
├── migrations/         # Database schemas
├── docs/               # Documentation
│   ├── whitepaper.md   # Project whitepaper
│   └── README.md       # Documentation index
├── index.html          # Main application
└── README.md           # This file
```

---

## 🔧 API Endpoints

- `POST /submit` — Submit new complaint
- `GET /complaints` — Retrieve complaints with pagination
- `POST /stars/toggle` — Add/remove stars
- `GET /stars` — Get star counts for posts
- `GET /stars/user` — Get user's star status

---

## 📚 Documentation

- **[Whitepaper](./docs/whitepaper.md)** — Complete project overview and tokenomics
- **[Documentation Index](./docs/README.md)** — All available docs and guides

---

## ⚖️ Disclaimer

All submissions are **user-generated** and reflect the opinions of individual users only.  
The KRN project and its maintainers:

- Do **not** endorse or verify any submitted content
- Are **not liable** for user-submitted material
- Reserve the right to remove unlawful or harmful submissions

**By using this platform, you agree not to post personally identifiable information (PII), unlawful, or defamatory content.**

---

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
5. Join our community discussions

---

## 📞 Community & Support

- **Website:** [dirtystuff.org](https://dirtystuff.org)
- **GitHub:** [github.com/KRNSUI](https://github.com/KRNSUI)
- **Twitter:** [@KRNonsui](https://twitter.com/KRNonsui)
- **Telegram:** [t.me/+_o-Osjl6_-g1ZTEx](https://t.me/+_o-Osjl6_-g1ZTEx)

---

## 📜 License

MIT License © 2025 KRN Contributors

---

## 🎉 What Makes KRN Special

KRN isn't just another complaint platform—it's a **revolutionary economic model** that:

- **Rewards Quality** — Escalating costs prevent spam
- **Incentivizes Moderation** — High costs for removing others' content
- **Creates Scarcity** — Limited star positions increase value
- **Builds Community** — Economic alignment between users and platform

**Join the revolution. Voice your complaints. Earn your stars. Build the future with KRN.**

---

*"In the chaos of Web3's endless lines and broken promises, there rose a figure—not a woman but an archetype: the eternal complainer, the seeker of managers, the voice that would not be silenced. From that voice, $KRN was born."*

**$KRN on $SUI - Anonymous Complaint Revolution**

