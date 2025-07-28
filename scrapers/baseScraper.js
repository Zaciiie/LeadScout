const puppeteer = require('puppeteer');
const config = require('../config');
const ContactExtractor = require('../utils/contactExtractor');
const CSVExporter = require('../utils/csvExporter');

class BaseScraper {
  constructor(sourceName) {
    this.sourceName = sourceName;
    this.browser = null;
    this.page = null;
    this.contactExtractor = new ContactExtractor();
    this.csvExporter = new CSVExporter();
    this.scrapedContacts = [];
  }

  /**
   * Initialize browser and page with anti-detection measures
   */
  async init() {
    console.log(`🚀 Initializing ${this.sourceName} scraper with stealth mode...`);
    
    this.browser = await puppeteer.launch(config.browser);
    this.page = await this.browser.newPage();
    
    // Set random user agent
    const userAgent = config.userAgents[Math.floor(Math.random() * config.userAgents.length)];
    await this.page.setUserAgent(userAgent);
    console.log(`🎭 Using User Agent: ${userAgent}`);
    
    // Set random viewport
    const viewport = config.viewports[Math.floor(Math.random() * config.viewports.length)];
    await this.page.setViewport(viewport);
    console.log(`📱 Using Viewport: ${viewport.width}x${viewport.height}`);
    
    // Advanced anti-detection measures
    await this.page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Mock plugins to look like a real browser
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin},
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          },
          {
            0: {type: "application/pdf", suffixes: "pdf", description: "", enabledPlugin: Plugin},
            description: "",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            length: 1,
            name: "Chrome PDF Viewer"
          }
        ],
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Mock platform
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32',
      });
      
      // Mock hardwareConcurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4,
      });
      
      // Mock deviceMemory
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // Mock chrome object
      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {}
      };
      
      // Override getContext to avoid WebGL detection
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          const context = getContext.call(this, contextType, contextAttributes);
          if (context) {
            const getParameter = context.getParameter;
            context.getParameter = function(parameter) {
              if (parameter === 37445) {
                return 'Intel Inc.';
              }
              if (parameter === 37446) {
                return 'Intel(R) Iris(TM) Graphics 6100';
              }
              return getParameter.call(this, parameter);
            };
          }
          return context;
        }
        return getContext.call(this, contextType, contextAttributes);
      };
    });
    
    // Set realistic headers
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    });
    
    console.log(`✅ ${this.sourceName} scraper initialized with stealth mode`);
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log(`🔒 ${this.sourceName} scraper closed`);
    }
  }

  /**
   * Navigate to URL with human-like behavior
   * @param {string} url - URL to navigate to
   */
  async navigateToUrl(url) {
    try {
      console.log(`🌐 Navigating to: ${url}`);
      
      // Add random delay before navigation (simulate thinking time) - reduced for speed
      const preNavDelay = 500 + Math.random() * 1000; // 0.5-1.5 seconds (reduced from 1-3 seconds)
      console.log(`⏳ Pre-navigation delay: ${Math.round(preNavDelay)}ms`);
      await this.page.waitForTimeout(preNavDelay);
      
      // Navigate with realistic options
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Simulate human behavior after page load
      await this.simulateHumanBehavior();
      
      // Wait for page to fully load
      const currentDelays = config.delays[config.mode] || config.delays.fast;
      await this.page.waitForTimeout(currentDelays.pageLoad);
      
      return true;
    } catch (error) {
      console.error(`❌ Error navigating to ${url}:`, error.message);
      return false;
    }
  }

  /**
   * Simulate human-like behavior on the page (optimized for speed)
   */
  async simulateHumanBehavior() {
    try {
      // Reduced mouse movements for speed
      const moves = 1 + Math.floor(Math.random() * 2); // 1-2 moves (reduced from 2-4)
      for (let i = 0; i < moves; i++) {
        const x = Math.random() * 1200;
        const y = Math.random() * 800;
        await this.page.mouse.move(x, y);
        await this.page.waitForTimeout(50 + Math.random() * 100); // Reduced delay
      }
      
      // Minimal scrolling for speed
      const scrolls = 1; // Fixed to 1 scroll (reduced from 1-2)
      for (let i = 0; i < scrolls; i++) {
        const scrollY = Math.random() * 300; // Reduced scroll distance
        await this.page.evaluate((y) => {
          window.scrollBy(0, y);
        }, scrollY);
        await this.page.waitForTimeout(200 + Math.random() * 300); // Reduced delay
      }
      
      // Scroll back to top
      await this.page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      
      console.log(`🤖 Simulated human behavior: ${moves} mouse moves, ${scrolls} scrolls`);
    } catch (error) {
      console.log('⚠️ Error simulating human behavior:', error.message);
    }
  }

  /**
   * Wait for element with timeout
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.log(`⚠️ Element not found: ${selector}`);
      return false;
    }
  }

  /**
   * Scroll page to load more content
   */
  async scrollPage() {
    await this.page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    
    const currentDelays = config.delays[config.mode] || config.delays.fast;
    await this.page.waitForTimeout(currentDelays.scrollDelay);
  }

  /**
   * Extract text content from page
   * @returns {string} Page text content
   */
  async getPageText() {
    return await this.page.evaluate(() => {
      return document.body.innerText || document.body.textContent || '';
    });
  }

  /**
   * Extract contact information from current page
   * @param {Object} additionalData - Additional data to include with contacts
   * @returns {Array} Array of contact objects
   */
  async extractContactsFromPage(additionalData = {}) {
    const pageText = await this.getPageText();
    const contacts = this.contactExtractor.extractAllContacts(pageText, this.sourceName);
    
    // Add additional data to each contact
    return contacts.map(contact => ({
      ...contact,
      ...additionalData
    }));
  }

  /**
   * Add contacts to the scraped contacts array
   * @param {Array} contacts - Array of contact objects
   */
  addContacts(contacts) {
    if (contacts && contacts.length > 0) {
      this.scrapedContacts.push(...contacts);
      console.log(`📝 Added ${contacts.length} contacts (Total: ${this.scrapedContacts.length})`);
    }
  }

  /**
   * Export all scraped contacts to CSV
   * @param {number} pageNumber - Optional page number for filename
   * @param {string} location - Optional location string for filename
   * @returns {string} Path to exported CSV file
   */
  async exportContacts(pageNumber = null, location = null) {
    if (this.scrapedContacts.length === 0) {
      console.log('⚠️ No contacts to export');
      return null;
    }

    return await this.csvExporter.exportContacts(this.scrapedContacts, this.sourceName, pageNumber, location);
  }

  /**
   * Handle pagination - to be implemented by child classes
   * @returns {boolean} True if more pages available
   */
  async hasNextPage() {
    return false;
  }

  /**
   * Navigate to next page - to be implemented by child classes
   * @returns {boolean} True if successfully navigated to next page
   */
  async goToNextPage() {
    return false;
  }

  /**
   * Main scraping method - to be implemented by child classes
   * @param {Object} options - Scraping options
   */
  async scrape(options = {}) {
    throw new Error('scrape() method must be implemented by child class');
  }

  /**
   * Add delay between requests
   */
  async delay() {
    const currentDelays = config.delays[config.mode] || config.delays.fast;
    await this.page.waitForTimeout(currentDelays.betweenRequests);
  }

  /**
   * Take screenshot for debugging
   * @param {string} filename - Screenshot filename
   */
  async takeScreenshot(filename) {
    if (!config.browser.headless) {
      const screenshotPath = `./screenshots/${filename}_${Date.now()}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
    }
  }

  /**
   * Get current page URL
   * @returns {string} Current URL
   */
  async getCurrentUrl() {
    return await this.page.url();
  }

  /**
   * Check if element exists on page
   * @param {string} selector - CSS selector
   * @returns {boolean} True if element exists
   */
  async elementExists(selector) {
    try {
      const element = await this.page.$(selector);
      return element !== null;
    } catch (error) {
      return false;
    }
  }
}

module.exports = BaseScraper;