const BaseScraper = require('./baseScraper');

class YellowPagesScraper extends BaseScraper {
  constructor() {
    super('yellowpages');
    this.baseUrl = 'https://www.yellowpages.com';
    this.processedBusinesses = new Set(); // Track processed businesses to avoid duplicates
  }

  /**
   * Build search URL for Yellow Pages
   * @param {string} searchTerm - What to search for
   * @param {string} location - Where to search
   * @param {number} page - Page number (optional)
   * @returns {string} Complete search URL
   */
  buildSearchUrl(searchTerm, location, page = 1) {
    const encodedTerm = encodeURIComponent(searchTerm);
    const encodedLocation = encodeURIComponent(location);
    let url = `${this.baseUrl}/search?search_terms=${encodedTerm}&geo_location_terms=${encodedLocation}`;
    
    if (page > 1) {
      url += `&page=${page}`;
    }
    
    return url;
  }

  /**
   * Extract business information from a business listing
   * @param {Object} businessElement - Puppeteer element handle
   * @returns {Object} Business information
   */
  async extractBusinessInfo(businessElement) {
    try {
      const businessInfo = await businessElement.evaluate(element => {
        const data = {};
        
        // Business name (clean any numbering)
        const nameElement = element.querySelector('.business-name, .n, h3 a, .listing-name');
        let businessName = nameElement ? nameElement.textContent.trim() : '';
        
        // Remove any leading numbers and dots (e.g., "1. Business Name" -> "Business Name")
        businessName = businessName.replace(/^\d+\.\s*/, '');
        
        data.businessName = businessName;
        
        // Phone number
        const phoneElement = element.querySelector('.phones, .phone, [class*="phone"]');
        data.phone = phoneElement ? phoneElement.textContent.trim() : '';
        
        // Address
        const addressElement = element.querySelector('.street-address, .adr, .address');
        data.address = addressElement ? addressElement.textContent.trim() : '';
        
        // Website
        const websiteElement = element.querySelector('a[href*="http"], .website');
        data.website = websiteElement ? websiteElement.href || websiteElement.textContent.trim() : '';
        
        // Get all text content for contact extraction
        data.fullText = element.textContent || element.innerText || '';
        
        return data;
      });
      
      return businessInfo;
    } catch (error) {
      console.error('Error extracting business info:', error);
      return {};
    }
  }

  /**
   * Extract email addresses from More Info sections and mailto links
   * @param {Object} businessElement - Puppeteer element handle for the business listing
   * @returns {string} Email address if found, empty string otherwise
   */
  async extractHiddenEmail(businessElement) {
    try {
      console.log('🔍 Looking for hidden email addresses...');
      
      // Look for "More Info", "Contact Info", or similar expandable sections
      const moreInfoSelectors = [
        'a[href*="mailto:"]',
        'button[onclick*="mailto:"]',
        '.more-info a',
        '.contact-info a',
        '.additional-info a',
        '[class*="more"] a',
        '[class*="contact"] a',
        '[class*="email"] a',
        'a[title*="email"]',
        'a[title*="Email"]',
        '.info-section a',
        '.business-info a'
      ];
      
      // First, try to find direct mailto links
      for (const selector of moreInfoSelectors) {
        try {
          const emailLink = await businessElement.$(selector);
          if (emailLink) {
            const href = await emailLink.evaluate(el => el.href);
            if (href && href.startsWith('mailto:')) {
              const email = href.replace('mailto:', '').split('?')[0].trim();
              if (email && email.includes('@')) {
                console.log(`✅ Found email via direct mailto: ${email}`);
                return email;
              }
            }
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      // Look for expandable "More Info" sections that might contain email
      const expandableSelectors = [
        '.more-info',
        '.additional-info',
        '.contact-details',
        '.business-details',
        '[class*="more"]',
        '[class*="expand"]',
        '.info-toggle'
      ];
      
      for (const selector of expandableSelectors) {
        try {
          const expandableSection = await businessElement.$(selector);
          if (expandableSection) {
            // Try to click/expand the section
            try {
              await expandableSection.click();
              await this.page.waitForTimeout(1000); // Wait for expansion
              
              // Now look for email links in the expanded content
              const emailLink = await businessElement.$('a[href*="mailto:"]');
              if (emailLink) {
                const href = await emailLink.evaluate(el => el.href);
                if (href && href.startsWith('mailto:')) {
                  const email = href.replace('mailto:', '').split('?')[0].trim();
                  if (email && email.includes('@')) {
                    console.log(`✅ Found email via expanded section: ${email}`);
                    return email;
                  }
                }
              }
            } catch (clickError) {
              // Section might not be clickable, continue
            }
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      // Look for email patterns in onclick attributes or data attributes
      const emailFromAttributes = await businessElement.evaluate(element => {
        const allElements = element.querySelectorAll('*');
        for (const el of allElements) {
          // Check onclick attributes
          const onclick = el.getAttribute('onclick');
          if (onclick && onclick.includes('mailto:')) {
            const match = onclick.match(/mailto:([^'"?\s]+)/);
            if (match && match[1] && match[1].includes('@')) {
              return match[1];
            }
          }
          
          // Check data attributes
          for (const attr of el.attributes) {
            if (attr.value && attr.value.includes('mailto:')) {
              const match = attr.value.match(/mailto:([^'"?\s]+)/);
              if (match && match[1] && match[1].includes('@')) {
                return match[1];
              }
            }
          }
        }
        return null;
      });
      
      if (emailFromAttributes) {
        console.log(`✅ Found email via attributes: ${emailFromAttributes}`);
        return emailFromAttributes;
      }
      
      console.log('❌ No hidden email found');
      return '';
      
    } catch (error) {
      console.error('Error extracting hidden email:', error.message);
      return '';
    }
  }

  /**
   * Scrape a single business listing page for detailed contact info
   * @param {string} businessUrl - URL of the business listing
   * @returns {Object} Detailed contact information
   */
  async scrapeBusinessDetails(businessUrl) {
    try {
      const detailPage = await this.browser.newPage();
      await detailPage.goto(businessUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      
      const details = await detailPage.evaluate(() => {
        const data = {};
        
        // Try to find contact person name
        const contactSelectors = [
          '.contact-name',
          '.owner-name', 
          '.manager-name',
          '[class*="contact"]',
          '[class*="owner"]'
        ];
        
        for (const selector of contactSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            data.contactName = element.textContent.trim();
            break;
          }
        }
        
        // Email
        const emailSelectors = [
          'a[href^="mailto:"]',
          '[class*="email"]',
          '.contact-email'
        ];
        
        for (const selector of emailSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            data.email = element.href ? element.href.replace('mailto:', '') : element.textContent.trim();
            break;
          }
        }
        
        // Get full page text for extraction
        data.fullText = document.body.textContent || document.body.innerText || '';
        
        return data;
      });
      
      await detailPage.close();
      return details;
    } catch (error) {
      console.error(`Error scraping business details from ${businessUrl}:`, error.message);
      return {};
    }
  }

  /**
   * Process a single business listing
   * @param {Object} businessElement - Puppeteer element handle
   * @returns {Array} Array of contact objects
   */
  async processBusinessListing(businessElement) {
    const businessInfo = await this.extractBusinessInfo(businessElement);
    
    if (!businessInfo.businessName && !businessInfo.phone) {
      return [];
    }

    // Create a unique identifier for this business to avoid duplicates
    const businessId = `${businessInfo.businessName || 'unknown'}_${businessInfo.phone || 'no-phone'}_${businessInfo.address || 'no-address'}`;
    
    if (this.processedBusinesses.has(businessId)) {
      console.log(`⏭️ Skipping duplicate business: ${businessInfo.businessName || 'Unknown'}`);
      return [];
    }
    
    this.processedBusinesses.add(businessId);

    // Extract hidden email from More Info sections
    const hiddenEmail = await this.extractHiddenEmail(businessElement);
    
    // Extract contacts from the listing text
    const contacts = this.contactExtractor.extractAllContacts(businessInfo.fullText, this.sourceName);
    
    // If no contacts found from text, create one from available info
    if (contacts.length === 0 && (businessInfo.businessName || businessInfo.phone)) {
      contacts.push({
        sno: '', // Will be filled by CSV exporter
        businessName: businessInfo.businessName || '',
        website: businessInfo.website || '',
        address: businessInfo.address || '',
        email: hiddenEmail || '',
        phone: businessInfo.phone || '',
        source: this.sourceName,
        scrapedAt: new Date().toISOString()
      });
    }

    // Enhance contacts with business information and hidden email (excluding fullName)
    return contacts.map(contact => {
      const enhancedContact = {
        sno: '', // Will be filled by CSV exporter
        businessName: contact.businessName || businessInfo.businessName || '',
        website: contact.website || businessInfo.website || '',
        address: contact.address || businessInfo.address || '',
        email: contact.email || hiddenEmail || '',
        phone: contact.phone || businessInfo.phone || '',
        source: contact.source || this.sourceName,
        scrapedAt: contact.scrapedAt || new Date().toISOString()
      };
      
      // Remove fullName if it exists
      delete enhancedContact.fullName;
      delete enhancedContact.firstName;
      delete enhancedContact.lastName;
      
      return enhancedContact;
    });
  }

  /**
   * Handle protection pages with multiple bypass strategies
   * @param {number} pageNumber - Current page number
   * @param {string} searchTerm - Search term for re-navigation
   * @param {string} location - Location for re-navigation
   * @returns {boolean} True if successfully bypassed
   */
  async handleProtectionPage(pageNumber, searchTerm, location) {
    console.log(`🔧 Attempting to bypass protection page for page ${pageNumber}...`);
    
    try {
      // Strategy 1: Wait for automatic bypass (Cloudflare usually auto-completes)
      console.log('⏳ Strategy 1: Waiting for automatic bypass...');
      await this.page.waitForTimeout(10000); // Wait 10 seconds
      
      let currentTitle = await this.page.title();
      if (!currentTitle.includes('Attention Required') && !currentTitle.includes('Cloudflare') && !currentTitle.includes('Just a moment')) {
        console.log('✅ Strategy 1 successful: Automatic bypass completed');
        return true;
      }
      
      // Strategy 2: Refresh the page
      console.log('🔄 Strategy 2: Refreshing page...');
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(8000);
      
      currentTitle = await this.page.title();
      if (!currentTitle.includes('Attention Required') && !currentTitle.includes('Cloudflare') && !currentTitle.includes('Just a moment')) {
        console.log('✅ Strategy 2 successful: Page refresh worked');
        return true;
      }
      
      // Strategy 3: Wait longer and try again
      console.log('⏳ Strategy 3: Extended wait...');
      await this.page.waitForTimeout(15000); // Wait 15 more seconds
      
      currentTitle = await this.page.title();
      if (!currentTitle.includes('Attention Required') && !currentTitle.includes('Cloudflare') && !currentTitle.includes('Just a moment')) {
        console.log('✅ Strategy 3 successful: Extended wait worked');
        return true;
      }
      
      // Strategy 4: Try navigating to the URL again with longer delays
      console.log('🔄 Strategy 4: Re-navigating with longer delays...');
      const pageUrl = this.buildSearchUrl(searchTerm, location, pageNumber);
      
      // Add extra delay before re-navigation
      await this.page.waitForTimeout(5000);
      
      await this.page.goto(pageUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 45000 
      });
      
      // Longer wait after navigation
      await this.page.waitForTimeout(12000);
      
      currentTitle = await this.page.title();
      if (!currentTitle.includes('Attention Required') && !currentTitle.includes('Cloudflare') && !currentTitle.includes('Just a moment')) {
        console.log('✅ Strategy 4 successful: Re-navigation worked');
        return true;
      }
      
      console.log('❌ All bypass strategies failed');
      return false;
      
    } catch (error) {
      console.error('❌ Error handling protection page:', error.message);
      return false;
    }
  }

  /**
   * Main scraping method for Yellow Pages - scrape a specific page
   * @param {Object} options - Scraping options
   * @param {string} options.searchTerm - What to search for
   * @param {string} options.location - Where to search
   * @param {number} options.pageNumber - Specific page number to scrape (default: 1)
   */
  async scrape(options = {}) {
    const { searchTerm = 'restaurants', location = 'New York, NY', pageNumber = 1 } = options;
    
    try {
      await this.init();
      
      console.log(`📄 Scraping page ${pageNumber} for "${searchTerm}" in "${location}"`);
      
      // Build URL for the specific page
      const pageUrl = this.buildSearchUrl(searchTerm, location, pageNumber);
      console.log(`🔗 Generated URL: ${pageUrl}`);
      
      // Navigate to the page
      const success = await this.navigateToUrl(pageUrl);
      if (!success) {
        throw new Error(`Failed to load page ${pageNumber}`);
      }
      
      // Check if page loaded successfully and handle protection pages
      const pageTitle = await this.page.title();
      if (pageTitle.includes('Attention Required') || pageTitle.includes('Cloudflare') || pageTitle.includes('Just a moment')) {
        console.log(`🛡️ Protection page detected: "${pageTitle}"`);
        
        // Try to bypass protection page
        const bypassed = await this.handleProtectionPage(pageNumber, searchTerm, location);
        if (!bypassed) {
          throw new Error('Could not bypass protection page');
        }
      }
      
      // Wait for page to fully load before processing
      console.log('⏳ Waiting for page to fully load...');
      await this.page.waitForTimeout(8000);
      
      // Process the page
      const pageResults = await this.scrapePage();
      
      if (pageResults.businessCount === 0) {
        console.log(`⚠️ No business listings found on page ${pageNumber}`);
    console.log('This could mean:');
        console.log('- The page number is beyond available results');
            console.log('- No results exist for this search');
        console.log('- The page structure has changed');
        return null;
      }
      
      console.log(`✅ Page ${pageNumber} completed: ${pageResults.processedCount} businesses processed, ${pageResults.newContactsCount} new contacts found`);
      console.log(`📊 Total contacts found: ${this.scrapedContacts.length}`);
      
      // Export contacts to CSV
      let csvPath = null;
      if (pageResults.newContactsCount > 0) {
        console.log('💾 Creating CSV file with results...');
        csvPath = await this.csvExporter.exportContacts(this.scrapedContacts, this.sourceName);
        console.log(`📄 CSV file created: ${csvPath}`);
      } else {
      console.log('⚠️ No contacts found to export');
        }
      
      console.log(`✅ Scraping completed successfully!`);
      return csvPath;

    } catch (error) {
      console.error('❌ Scraping error:', error);
      throw error;
    } finally {
      await this.close();
    }
  }

  /**
   * Scrape a single page and return results
   * @returns {Object} Page scraping results
   */
  async scrapePage() {
    console.log('🔍 Looking for search results...');
    
    const waitSelectors = [
      '.search-results',
      '.result', 
      '.organic',
      '.listing',
      '.business-listing',
      '.srp-listing',
      '[class*="result"]',
      '[class*="listing"]'
    ];
    
    let resultsLoaded = false;
    for (const selector of waitSelectors) {
      try {
        await this.waitForElement(selector, 3000);
        console.log(`✅ Found results with selector: ${selector}`);
        resultsLoaded = true;
        break;
      } catch (error) {
        console.log(`⚠️ Selector ${selector} not found, trying next...`);
      }
    }
    
    if (!resultsLoaded) {
      console.log('⚠️ No standard selectors found, waiting additional 5 seconds...');
      await this.page.waitForTimeout(5000);
    }
    
    // Get all business listings on current page
    const businessSelectors = [
      '.search-results .result',
      '.organic .result', 
      '.listing',
      '.result',
      '.business-listing',
      '.srp-listing',
      '[data-listing]',
      '[class*="result"]',
      '[class*="listing"]',
      '[class*="business"]',
      '.info',
      '.info-section',
      '.business-card'
    ];
    
    let businessListings = [];
    let usedSelector = '';
    
    for (const selector of businessSelectors) {
      businessListings = await this.page.$$(selector);
      if (businessListings.length > 0) {
        console.log(`🎯 Found ${businessListings.length} business listings using selector: ${selector}`);
        usedSelector = selector;
        break;
      }
    }
    
    if (businessListings.length === 0) {
      console.log('⚠️ No business listings found with standard selectors');
      return { businessCount: 0, processedCount: 0, newContactsCount: 0 };
    }

    console.log(`🏢 Found ${businessListings.length} business listings`);

    // Process each business listing
    console.log(`🔄 Processing ${businessListings.length} business listings...`);
    let processedCount = 0;
    let newContactsCount = 0;
    
    for (let i = 0; i < businessListings.length; i++) {
      try {
        const contacts = await this.processBusinessListing(businessListings[i]);
        if (contacts.length > 0) {
          this.addContacts(contacts);
          newContactsCount += contacts.length;
          processedCount++;
        }
        
        // Show progress every 10 listings
        if ((i + 1) % 10 === 0) {
          console.log(`📊 Progress: ${i + 1}/${businessListings.length} listings processed`);
        }
        
        // Random human-like delay between processing listings
        const randomDelay = 500 + Math.random() * 1500; // 0.5-2 seconds
        await this.page.waitForTimeout(randomDelay);
      } catch (error) {
        console.error(`❌ Error processing listing ${i + 1}:`, error.message);
      }
    }
    
    return {
      businessCount: businessListings.length,
      processedCount,
      newContactsCount
    };
  }
}

// If running directly
if (require.main === module) {
  const scraper = new YellowPagesScraper();
  
  // Example usage
  scraper.scrape({
    searchTerm: 'restaurants',
    location: 'New York, NY',
    maxPages: 3
  }).then(csvPath => {
    if (csvPath) {
      console.log(`🎉 Results exported to: ${csvPath}`);
    }
  }).catch(error => {
    console.error('Scraping failed:', error);
  });
}

module.exports = YellowPagesScraper;