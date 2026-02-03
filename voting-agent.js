const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const winston = require('winston');
require('dotenv').config();

// Add stealth plugin to bypass bot detection
puppeteer.use(StealthPlugin());

// ============ LOGGER SETUP ============
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) =>
      `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || 'voting_agent.log' }),
    new winston.transports.Console()
  ]
});

// ============ CONFIG ============
const CONFIG = {
  websiteUrl: process.env.WEBSITE_URL,
  usersToVote: process.env.USERS_TO_VOTE.split(',').map(u => u.trim()),
  targetVotes: parseInt(process.env.TARGET_VOTES),
  reloadInterval: parseInt(process.env.RELOAD_INTERVAL),
  headless: process.env.HEADLESS === 'true',
  useProxy: process.env.USE_PROXY === 'true',
  proxyApiUrl: process.env.PROXY_API_URL || '',
  proxies: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',').map(p => p.trim()).filter(p => p) : [],
  parallelBrowsers: parseInt(process.env.PARALLEL_BROWSERS) || 4,
};

// ============ STEALTH CONFIG ============
const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 }
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

const TIMEZONES = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];
const LANGUAGES = ['en-US', 'en-GB', 'en-AU', 'en-CA'];

// ============ VOTE TRACKER ============
const voteTracker = {
  currentVotes: 0,
  cycleCount: 0,
  startTime: new Date(),
  proxyIndex: 0
};

// ============ RANDOM HELPERS ============
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ============ FETCH PROXIES FROM API ============
async function fetchProxiesFromApi() {
  if (!CONFIG.proxyApiUrl) return [];

  try {
    logger.info(`🌐 Fetching fresh proxies from API...`);
    const response = await fetch(CONFIG.proxyApiUrl);
    const text = await response.text();

    let proxies = [];

    // Try to parse as JSON first (GeoNode format)
    try {
      const data = JSON.parse(text);
      if (data && data.data && Array.isArray(data.data)) {
        for (const proxy of data.data) {
          if (proxy.ip && proxy.port) {
            proxies.push(`${proxy.ip}:${proxy.port}`);
          }
        }
      }
    } catch {
      // If not JSON, treat as plain text list (ProxyScrape format)
      // Each line is ip:port
      proxies = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes(':'));
    }

    logger.info(`✅ Loaded ${proxies.length} proxies from API`);
    return proxies.slice(0, 100); // Limit to first 100 for efficiency
  } catch (error) {
    logger.error(`❌ Failed to fetch proxies from API: ${error.message}`);
    return [];
  }
}

function getNextProxy() {
  if (!CONFIG.useProxy || CONFIG.proxies.length === 0) return null;
  const proxy = CONFIG.proxies[voteTracker.proxyIndex];
  voteTracker.proxyIndex = (voteTracker.proxyIndex + 1) % CONFIG.proxies.length;
  return proxy;
}

// ============ STEALTH BROWSER WORKER ============
class StealthBrowserWorker {
  constructor(workerId, user) {
    this.workerId = workerId;
    this.user = user;
    this.browser = null;
    this.page = null;
  }

  async init(proxy = null) {
    const resolution = getRandomItem(SCREEN_RESOLUTIONS);
    const timezone = getRandomItem(TIMEZONES);
    const language = getRandomItem(LANGUAGES);

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      `--window-size=${resolution.width},${resolution.height}`,
      '--disable-extensions',
      '--disable-plugins-discovery',
      '--disable-dev-shm-usage',
      `--lang=${language}`,
      '--incognito' // Fresh session every time!
    ];

    if (proxy) {
      args.push(`--proxy-server=${proxy}`);
    }

    this.browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: args,
      ignoreDefaultArgs: ['--enable-automation']
    });

    // Create incognito context for clean cookies
    const context = await this.browser.createIncognitoBrowserContext();
    this.page = await context.newPage();

    // Set random viewport
    await this.page.setViewport({
      width: resolution.width,
      height: resolution.height,
      deviceScaleFactor: Math.random() > 0.5 ? 1 : 2
    });

    // Set random user agent
    await this.page.setUserAgent(getRandomItem(USER_AGENTS));

    // Randomize timezone
    await this.page.emulateTimezone(timezone);

    // Override navigator properties to appear more human
    await this.page.evaluateOnNewDocument(() => {
      // Randomize canvas fingerprint
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (type) {
        if (type === 'image/png' && this.width > 0 && this.height > 0) {
          const context = this.getContext('2d');
          const imageData = context.getImageData(0, 0, this.width, this.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] ^= (Math.random() * 2) | 0;
          }
          context.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.apply(this, arguments);
      };

      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ]
      });

      // Mock webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

      // Mock languages
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

      // Mock hardware concurrency (random CPU cores)
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => Math.floor(Math.random() * 8) + 4 });

      // Mock device memory
      Object.defineProperty(navigator, 'deviceMemory', { get: () => [4, 8, 16][Math.floor(Math.random() * 3)] });
    });

    logger.info(`[W${this.workerId}] 🎭 Stealth browser ready (${resolution.width}x${resolution.height}, ${timezone})`);
  }

  async navigate() {
    try {
      // Random delay before navigation (human behavior)
      await new Promise(r => setTimeout(r, randomDelay(500, 1500)));

      await this.page.goto(CONFIG.websiteUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Random scroll (human behavior)
      await this.page.evaluate(() => {
        window.scrollBy(0, Math.random() * 200);
      });

      await new Promise(r => setTimeout(r, randomDelay(1000, 2000)));
      return true;
    } catch (error) {
      logger.warn(`[W${this.workerId}] ❌ Nav failed: ${error.message}`);
      return false;
    }
  }

  async searchAndVote() {
    try {
      // Wait with random delay (human behavior)
      await new Promise(r => setTimeout(r, randomDelay(500, 1000)));

      // Search for user
      const searchSelector = 'input[placeholder*="Search"], input[type="search"], input[type="text"]';
      await this.page.waitForSelector(searchSelector, { timeout: 10000 });

      // Human-like mouse movement before click
      const searchBox = await this.page.$(searchSelector);
      const box = await searchBox.boundingBox();
      await this.page.mouse.move(
        box.x + box.width / 2 + (Math.random() * 10 - 5),
        box.y + box.height / 2 + (Math.random() * 5 - 2.5)
      );
      await new Promise(r => setTimeout(r, randomDelay(100, 300)));

      await this.page.click(searchSelector);
      await new Promise(r => setTimeout(r, randomDelay(200, 400)));

      // Clear and type with human-like speed
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('A');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Backspace');

      // Type with random delays between characters
      for (const char of this.user) {
        await this.page.keyboard.type(char);
        await new Promise(r => setTimeout(r, randomDelay(50, 150)));
      }

      // Wait for search results with random delay
      await new Promise(r => setTimeout(r, randomDelay(2000, 3500)));

      // Random scroll
      await this.page.evaluate(() => window.scrollBy(0, 200 + Math.random() * 200));
      await new Promise(r => setTimeout(r, randomDelay(400, 800)));

      // Find vote button
      const voteButtonFound = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));

        // Strategy 1: Text is exactly "Vote" (not "Voted", "Most votes", etc.)
        let voteBtn = buttons.find(btn => {
          const text = btn.textContent.toLowerCase().trim();
          // Exclude filter/sort buttons
          if (text.includes('most') || text.includes('recent') || text.includes('random')) return false;
          if (text.includes('voted')) return false;
          // Must be exactly "vote" or start with "vote" 
          return text === 'vote' || text.startsWith('vote ');
        });

        // Strategy 2: Look for upvote arrow buttons (SVG with small parent)
        if (!voteBtn) {
          voteBtn = buttons.find(btn => {
            const text = btn.textContent.toLowerCase().trim();
            // Exclude navigation/filter buttons
            if (text.includes('menu') || text.includes('close') || text.includes('submit')) return false;
            if (text.includes('most') || text.includes('recent') || text.includes('random')) return false;
            if (text.includes('all') || text.includes('category')) return false;
            // Small button with just a number (vote count) or arrow icon
            const hasOnlyNumber = /^\d+$/.test(text);
            const isSmallButton = btn.offsetWidth < 100;
            return isSmallButton && (hasOnlyNumber || (btn.querySelector('svg') && text.length < 10));
          });
        }

        if (voteBtn) {
          voteBtn.setAttribute('data-vote-target', 'true');
          return true;
        }
        return false;
      });

      if (!voteButtonFound) {
        logger.warn(`[W${this.workerId}] ⚠️  No vote button for ${this.user}`);
        // Take debug screenshot
        await this.page.screenshot({ path: `debug_no_button_W${this.workerId}.png` });
        return false;
      }

      // Human-like click on vote button
      const voteButton = await this.page.$('[data-vote-target="true"]');
      if (voteButton) {
        const btnBox = await voteButton.boundingBox();

        // Log button details BEFORE click
        const buttonInfoBefore = await this.page.evaluate(() => {
          const btn = document.querySelector('[data-vote-target="true"]');
          return {
            text: btn.textContent.trim(),
            className: btn.className,
            tag: btn.tagName,
            innerHTML: btn.innerHTML.substring(0, 200)
          };
        });
        logger.info(`[W${this.workerId}] 🔍 Button BEFORE: "${buttonInfoBefore.text}" (${buttonInfoBefore.tag}.${buttonInfoBefore.className})`);

        // Take screenshot BEFORE click
        await this.page.screenshot({ path: `debug_before_click_W${this.workerId}.png` });

        // Move mouse to button with slight randomness
        await this.page.mouse.move(
          btnBox.x + btnBox.width / 2 + (Math.random() * 6 - 3),
          btnBox.y + btnBox.height / 2 + (Math.random() * 4 - 2),
          { steps: randomDelay(5, 15) }
        );

        await new Promise(r => setTimeout(r, randomDelay(100, 250)));

        // Try multiple click methods
        // Method 1: Mouse click
        await this.page.mouse.down();
        await new Promise(r => setTimeout(r, randomDelay(50, 150)));
        await this.page.mouse.up();

        // Method 2: Also try direct click
        await voteButton.click();

        // Method 3: Also try JavaScript click
        await this.page.evaluate(() => {
          const btn = document.querySelector('[data-vote-target="true"]');
          if (btn) {
            btn.click();
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        });

        // Wait for vote to register
        await new Promise(r => setTimeout(r, randomDelay(2000, 3000)));

        // Log button details AFTER click
        const buttonInfoAfter = await this.page.evaluate(() => {
          const btn = document.querySelector('[data-vote-target="true"]');
          if (!btn) return { text: 'BUTTON GONE', changed: true };
          return {
            text: btn.textContent.trim(),
            className: btn.className,
            changed: false
          };
        });
        logger.info(`[W${this.workerId}] 🔍 Button AFTER: "${buttonInfoAfter.text}"`);

        // Check if button state changed
        if (buttonInfoBefore.text !== buttonInfoAfter.text) {
          logger.info(`[W${this.workerId}] ✅ VOTED for ${this.user} (button changed!)`);
        } else {
          logger.warn(`[W${this.workerId}] ⚠️ CLICKED but button UNCHANGED for ${this.user}`);
        }

        // Take screenshot AFTER click  
        await this.page.screenshot({ path: `debug_after_click_W${this.workerId}.png` });

        // Remove marker
        await this.page.evaluate(() => {
          const btn = document.querySelector('[data-vote-target="true"]');
          if (btn) btn.removeAttribute('data-vote-target');
        });

        return true;
      }
      return false;
    } catch (error) {
      logger.warn(`[W${this.workerId}] ❌ Vote error: ${error.message}`);
      return false;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// ============ PARALLEL STEALTH VOTING ENGINE ============
async function runStealthVoting() {
  logger.info('╔═══════════════════════════════════════════════════════════════╗');
  logger.info('║    V0 STEALTH VOTING AGENT v3.0 - ANTI-DETECTION MODE 🎭     ║');
  logger.info('╚═══════════════════════════════════════════════════════════════╝');

  logger.info(`📋 Target users: ${CONFIG.usersToVote.join(', ')}`);
  logger.info(`🎯 Target votes: ${CONFIG.targetVotes}`);
  logger.info(`⚡ Parallel browsers: ${CONFIG.parallelBrowsers}`);
  logger.info(`🎭 Stealth features: Canvas randomization, fingerprint spoofing, human-like behavior`);

  // Fetch proxies
  if (CONFIG.useProxy && CONFIG.proxies.length === 0 && CONFIG.proxyApiUrl) {
    const apiProxies = await fetchProxiesFromApi();
    if (apiProxies.length > 0) {
      CONFIG.proxies = apiProxies;
    }
  }

  if (CONFIG.useProxy && CONFIG.proxies.length > 0) {
    logger.info(`🌐 Proxy rotation: ${CONFIG.proxies.length} proxies`);
  }

  let cycleCount = 0;

  while (voteTracker.currentVotes < CONFIG.targetVotes) {
    cycleCount++;
    logger.info(`\n${'═'.repeat(70)}`);
    logger.info(`🔄 STEALTH CYCLE #${cycleCount} - ${new Date().toLocaleString()}`);
    logger.info(`${'═'.repeat(70)}`);

    const workers = CONFIG.usersToVote.map((user, idx) => new StealthBrowserWorker(idx + 1, user));
    let successCount = 0;

    for (let i = 0; i < workers.length; i += CONFIG.parallelBrowsers) {
      const batch = workers.slice(i, i + CONFIG.parallelBrowsers);
      logger.info(`\n⚡ Batch ${Math.floor(i / CONFIG.parallelBrowsers) + 1}: ${batch.length} stealth browsers...`);

      const results = await Promise.all(batch.map(async (worker) => {
        try {
          const proxy = getNextProxy();
          if (proxy) logger.info(`[W${worker.workerId}] 🌐 Proxy: ${proxy.substring(0, 20)}...`);

          await worker.init(proxy);
          const navSuccess = await worker.navigate();

          if (navSuccess) {
            const voteSuccess = await worker.searchAndVote();
            await worker.close();
            return voteSuccess;
          }

          await worker.close();
          return false;
        } catch (error) {
          logger.warn(`[W${worker.workerId}] ❌ Error: ${error.message}`);
          try { await worker.close(); } catch { }
          return false;
        }
      }));

      successCount += results.filter(r => r).length;

      // Random delay between batches (anti-rate-limit)
      if (i + CONFIG.parallelBrowsers < workers.length) {
        await new Promise(r => setTimeout(r, randomDelay(2000, 4000)));
      }
    }

    logger.info(`\n📊 Cycle ${cycleCount}: ${successCount}/${CONFIG.usersToVote.length} votes`);
    voteTracker.currentVotes += successCount;

    const progress = Math.round((voteTracker.currentVotes / CONFIG.targetVotes) * 100);
    logger.info(`📈 Progress: ~${voteTracker.currentVotes}/${CONFIG.targetVotes} (${progress}%)`);

    if (voteTracker.currentVotes >= CONFIG.targetVotes) {
      logger.info(`\n${'🎉'.repeat(20)}`);
      logger.info(`🎉 TARGET REACHED!`);
      logger.info(`${'🎉'.repeat(20)}`);
      break;
    }

    // Randomized wait (anti-pattern-detection)
    const waitTime = CONFIG.reloadInterval + randomDelay(-30000, 30000);
    const waitMinutes = (waitTime / 60000).toFixed(1);
    logger.info(`\n⏳ Waiting ${waitMinutes} min (randomized) before next cycle...`);
    await new Promise(r => setTimeout(r, waitTime));
  }

  const elapsedMs = new Date() - voteTracker.startTime;
  const hours = Math.floor(elapsedMs / 3600000);
  const minutes = Math.floor((elapsedMs % 3600000) / 60000);
  logger.info(`\n⏱️  Total time: ${hours}h ${minutes}m`);
  logger.info('✅ Stealth Voting Agent completed!');
}

// ============ START ============
runStealthVoting().catch(error => {
  logger.error(`❌ Fatal error: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});
