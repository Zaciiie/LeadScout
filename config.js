module.exports = {
  // Browser configuration
  browser: {
    headless: true, // Set to false for debugging
    defaultViewport: null, // Use random viewport sizes
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor',
      '--disable-web-security',
      '--disable-features=site-per-process',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ],
    ignoreDefaultArgs: ['--enable-automation'],
    ignoreHTTPSErrors: true
  },

  // Scraping mode: 'fast' or 'stealth'
  mode: 'fast', // Change to 'stealth' for more human-like behavior with longer delays
  
  // Scraping delays (in milliseconds) - optimized for speed
  delays: {
    fast: {
      pageLoad: 2000,
      betweenRequests: 1000,
      scrollDelay: 1000,
      humanDelay: 500,
      listingDelay: 250 // Delay between processing listings
    },
    stealth: {
      pageLoad: 5000,
      betweenRequests: 3000,
      scrollDelay: 2000,
      humanDelay: 1500,
      listingDelay: 1000 // Longer delay for stealth mode
    }
  },

  // Output configuration
  output: {
    directory: './output',
    csvHeaders: [
      'sno',
      'businessName',
      'website',
      'address',
      'email',
      'phone',
      'source',
      'scrapedAt'
    ]
  },

  // User agents for rotation (more recent and varied)
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  ],

  // Random viewport sizes to mimic different devices
  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1600, height: 900 }
  ]
};