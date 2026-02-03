# 🤖 Autonomous Voting Agent v3.0

A powerful, stealth-enabled autonomous voting bot built with Puppeteer and Node.js. Features parallel browser execution, anti-detection measures, and proxy rotation support.

![Version](https://img.shields.io/badge/version-3.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ⚡ Features

### Core Features
- **Autonomous Operation** - Runs continuously until target votes reached
- **Parallel Browser Execution** - Run 4+ browsers simultaneously for faster voting
- **Smart Button Detection** - Multiple strategies to find and click vote buttons
- **Progress Tracking** - Real-time vote count and cycle monitoring
- **Debug Screenshots** - Captures before/after click screenshots for troubleshooting

### 🎭 Anti-Detection (Stealth Mode)
- **Puppeteer Stealth Plugin** - Bypasses WebDriver detection
- **Canvas Fingerprint Randomization** - Unique fingerprint per session
- **Random User Agents** - Rotates between Chrome, Firefox, Safari
- **Random Screen Resolutions** - 1366x768, 1920x1080, 2560x1440, etc.
- **Timezone Spoofing** - Random timezones (New York, LA, London, Tokyo, Sydney)
- **Human-like Behavior** - Random delays, natural mouse movements, realistic typing
- **Incognito Sessions** - Fresh cookies every time

### 🌐 Proxy Support
- **Proxy Rotation** - Different IP for each voting cycle
- **ProxyScrape API Integration** - Auto-fetches fresh proxies (updated every second)
- **Multi-format Support** - Works with JSON and plain-text proxy lists
- **Auto-retry** - Tries next proxy if one fails
- **Fallback** - Uses direct connection if proxies unavailable

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
| `USE_PROXY` | Enable proxy rotation | `true` |
| `PROXY_API_URL` | Proxy API endpoint | See envExamples |

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEALTH VOTING CYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Fetch fresh proxies from ProxyScrape API                    │
│  2. Launch 4 parallel stealth browsers                          │
│  3. Each browser:                                                │
│     • Uses different proxy/IP                                    │
│     • Random screen resolution & timezone                        │
│     • Randomized fingerprint                                     │
│  4. Search for target user                                       │
│  5. Find "Vote" button (excludes "Most votes", "Voted", etc.)   │
│  6. Human-like mouse movement & click                            │
│  7. Verify button changed to "Voted"                             │
│  8. Wait 4 minutes (randomized)                                  │
│  9. Repeat with new proxies                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Vote Button Detection

The agent uses multiple strategies to find the correct vote button:

1. **Text Match** - Finds buttons with exactly "Vote" text
2. **Exclusion Filter** - Ignores "Most votes", "Most recent", "Random", "Voted"
3. **Size Filter** - Only clicks small buttons (< 100px width)
4. **State Verification** - Confirms button changed from "Vote" to "Voted"

## 📁 Project Structure

```
Autonomous_voting_Agent/
├── voting-agent.js      # Main bot code with stealth features
├── package.json         # Dependencies (puppeteer-extra, stealth plugin)
├── .env                 # Your config (create from envExamples)
├── envExamples          # Example configuration template
├── README.md            # Documentation
├── .gitignore           # Excludes .env, logs, screenshots
├── voting_agent.log     # Execution logs
└── debug_*.png          # Debug screenshots (before/after clicks)
```

## 🔧 Advanced Usage

### Increase Parallel Browsers
```bash
# Edit .env - more browsers = faster (uses more RAM)
PARALLEL_BROWSERS=8
```

### Enable Proxy Rotation
```bash
# Edit .env
USE_PROXY=true
PROXY_API_URL=https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all
```

### Run in Headless Mode
```bash
# Edit .env - runs in background without browser windows
HEADLESS=true
```

### Use Custom Proxy List
```bash
# Edit .env
PROXY_API_URL=
PROXY_LIST=ip1:port1,ip2:port2,ip3:port3
```

## 📝 Logs & Debugging

All activity is logged to `voting_agent.log` and console:

```
[timestamp] INFO: 🔄 STEALTH CYCLE #1
[timestamp] INFO: [W1] 🎭 Stealth browser ready (1920x1080, America/New_York)
[timestamp] INFO: [W1] 🌐 Proxy: 123.45.67.89:8080...
[timestamp] INFO: [W1] 🔍 Button BEFORE: "Vote"
[timestamp] INFO: [W1] 🔍 Button AFTER: "Voted"
[timestamp] INFO: [W1] ✅ VOTED for user1 (button changed!)
[timestamp] INFO: 📊 Cycle 1: 2/4 votes
[timestamp] INFO: 📈 Progress: ~2/300 (1%)
```

### Debug Screenshots
The agent saves screenshots for debugging:
- `debug_before_click_W1.png` - Page before clicking vote
- `debug_after_click_W1.png` - Page after clicking vote
- `debug_no_button_W1.png` - When no vote button found

## ⚠️ Known Limitations

1. **Free Proxies** - Have ~25% success rate. Consider paid proxies for better results.
2. **IP Tracking** - Most voting sites track votes by IP. Without working proxies, you can only vote once per user.
3. **Rate Limits** - 4-minute wait between cycles to avoid detection.

## 🛡️ Anti-Detection Features

| Detection Method | Bypass Technique |
|-----------------|------------------|
| WebDriver Detection | puppeteer-extra-plugin-stealth |
| Canvas Fingerprinting | Randomized canvas pixels |
| Browser Fingerprint | Random resolution, timezone, language |
| Cookie/Session Tracking | Incognito mode (fresh session) |
| Bot-like Behavior | Human-like mouse & typing delays |
| Rate Limiting | Randomized wait times (±30 sec) |
| IP Tracking | Proxy rotation per cycle |

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
