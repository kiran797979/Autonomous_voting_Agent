# 🤖 Autonomous Voting Agent v3.0

A powerful, stealth-enabled autonomous voting bot built with Puppeteer and Node.js. Features parallel browser execution, anti-detection measures, and proxy rotation support.

![Version](https://img.shields.io/badge/version-3.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ⚡ Features

### Core Features
- **Autonomous Operation** - Runs continuously until target votes reached
- **Parallel Browser Execution** - Run 4+ browsers simultaneously for faster voting
- **Smart Button Detection** - Multiple strategies to find vote buttons
- **Progress Tracking** - Real-time vote count and ETA

### 🎭 Anti-Detection (Stealth Mode)
- **Puppeteer Stealth Plugin** - Bypasses WebDriver detection
- **Canvas Fingerprint Randomization** - Unique fingerprint per session
- **Random User Agents** - Rotates between Chrome, Firefox, Safari
- **Random Screen Resolutions** - 1366x768, 1920x1080, 2560x1440, etc.
- **Timezone Spoofing** - Random timezones (NY, LA, London, Tokyo)
- **Human-like Behavior** - Random delays, natural mouse movements
- **Incognito Sessions** - Fresh cookies every time

### 🌐 Network Features
- **Proxy Rotation** - Different IP for each cycle
- **Proxy API Integration** - Auto-fetch fresh proxies
- **Fallback to Direct** - Uses your IP if proxies fail

## 📋 Requirements

- Node.js >= 18.0.0
- npm or yarn
- Chrome/Chromium browser

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/kiran797979/Autonomous_voting_Agent.git
cd Autonomous_voting_Agent
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
# Copy example config
cp envExamples .env

# Edit with your values
nano .env  # or use any text editor
```

### 4. Run the agent
```bash
npm start
```

## ⚙️ Configuration

Create a `.env` file based on `envExamples`:

| Variable | Description | Example |
|----------|-------------|---------|
| `WEBSITE_URL` | Target voting website | `https://example.com/browse` |
| `USERS_TO_VOTE` | Comma-separated usernames | `user1,user2,user3` |
| `TARGET_VOTES` | Stop when reached | `300` |
| `RELOAD_INTERVAL` | Wait between cycles (ms) | `240000` (4 min) |
| `PARALLEL_BROWSERS` | Simultaneous browsers | `4` |
| `HEADLESS` | Hide browser windows | `false` |
| `USE_PROXY` | Enable proxy rotation | `false` |
| `PROXY_API_URL` | Proxy API endpoint | See envExamples |

## 📊 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    STEALTH VOTING CYCLE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Browser 1 │  │Browser 2 │  │Browser 3 │  │Browser 4 │    │
│  │ User A   │  │ User B   │  │ User C   │  │ User D   │    │
│  │ 🎭 Stealth│  │ 🎭 Stealth│  │ 🎭 Stealth│  │ 🎭 Stealth│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│       ▼             ▼             ▼             ▼           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PARALLEL VOTE EXECUTION                  │  │
│  │    • Random fingerprints    • Human-like delays      │  │
│  │    • Different resolutions  • Natural mouse moves    │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│                    ⏳ Wait 4 minutes                        │
│                            │                                │
│                            ▼                                │
│                    🔄 Repeat Cycle                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
Autonomous_voting_Agent/
├── voting-agent.js    # Main bot code
├── package.json       # Dependencies
├── .env              # Your config (create from envExamples)
├── envExamples       # Example configuration
├── README.md         # This file
├── .gitignore        # Git ignore rules
└── voting_agent.log  # Execution logs
```

## 🔧 Advanced Usage

### Run More Parallel Browsers
```bash
# Edit .env
PARALLEL_BROWSERS=8
```

### Enable Proxy Rotation
```bash
# Edit .env
USE_PROXY=true
PROXY_API_URL=https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc
```

### Run in Headless Mode (Background)
```bash
# Edit .env
HEADLESS=true
```

## 📝 Logs

All activity is logged to `voting_agent.log` and console:

```
[timestamp] INFO: 🔄 STEALTH CYCLE #1
[timestamp] INFO: [W1] 🎭 Stealth browser ready (1920x1080, America/New_York)
[timestamp] INFO: [W1] 🔍 Button BEFORE: "Vote"
[timestamp] INFO: [W1] ✅ VOTED for user1 (button changed!)
[timestamp] INFO: 📊 Cycle 1: 4/4 votes
[timestamp] INFO: 📈 Progress: ~4/300 (1%)
```

## ⚠️ Disclaimer

This tool is for educational purposes only. Use responsibly and in accordance with the target website's terms of service. The authors are not responsible for any misuse.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Made with ❤️ by [kiran797979](https://github.com/kiran797979)
