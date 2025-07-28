const BaseScraper = require('./baseScraper');
const config = require('../config');

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
      // Get the element's index or unique identifier to re-query it safely
      const businessInfo = await this.page.evaluate((element) => {
        // Make sure element is still valid
        if (!element || !element.isConnected) {
          return {};
        }
        
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
      }, businessElement);
      
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
      
      // Look for email patterns in onclick attributes or data attributes first (safest approach)
      const emailFromAttributes = await this.page.evaluate((element) => {
        // Make sure element is still valid
        if (!element || !element.isConnected) {
          return null;
        }
        
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
      }, businessElement);
      
      if (emailFromAttributes) {
        console.log(`✅ Found email via attributes: ${emailFromAttributes}`);
        return emailFromAttributes;
      }
      
      // Look for direct mailto links in the business element
      const directEmail = await this.page.evaluate((element) => {
        // Make sure element is still valid
        if (!element || !element.isConnected) {
          return null;
        }
        
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
        
        for (const selector of moreInfoSelectors) {
          const emailLink = element.querySelector(selector);
          if (emailLink && emailLink.href && emailLink.href.startsWith('mailto:')) {
            const email = emailLink.href.replace('mailto:', '').split('?')[0].trim();
            if (email && email.includes('@')) {
              return email;
            }
          }
        }
        return null;
      }, businessElement);
      
      if (directEmail) {
        console.log(`✅ Found email via direct mailto: ${directEmail}`);
        return directEmail;
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
    try {
      // Validate element handle before processing
      const isValid = await this.page.evaluate((element) => {
        return element && element.isConnected && element.nodeType === Node.ELEMENT_NODE;
      }, businessElement);
      
      if (!isValid) {
        console.log('⚠️ Skipping invalid or disconnected element');
        return [];
      }
      
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
    } catch (error) {
      console.error('Error processing business listing:', error.message);
      return [];
    }
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
      // Strategy 1: Wait for automatic bypass (Cloudflare usually auto-completes) - reduced wait time
      console.log('⏳ Strategy 1: Waiting for automatic bypass...');
      await this.page.waitForTimeout(5000); // Wait 5 seconds (reduced from 10)
      
      let currentTitle = await this.page.title();
      if (!currentTitle.includes('Attention Required') && !currentTitle.includes('Cloudflare') && !currentTitle.includes('Just a moment')) {
        console.log('✅ Strategy 1 successful: Automatic bypass completed');
        return true;
      }
      
      // Strategy 2: Refresh the page
      console.log('🔄 Strategy 2: Refreshing page...');
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(4000); // Reduced from 8000
      
      currentTitle = await this.page.title();
      if (!currentTitle.includes('Attention Required') && !currentTitle.includes('Cloudflare') && !currentTitle.includes('Just a moment')) {
        console.log('✅ Strategy 2 successful: Page refresh worked');
        return true;
      }
      
      // Strategy 3: Wait longer and try again
      console.log('⏳ Strategy 3: Extended wait...');
      await this.page.waitForTimeout(8000); // Wait 8 more seconds (reduced from 15)
      
      currentTitle = await this.page.title();
      if (!currentTitle.includes('Attention Required') && !currentTitle.includes('Cloudflare') && !currentTitle.includes('Just a moment')) {
        console.log('✅ Strategy 3 successful: Extended wait worked');
        return true;
      }
      
      // Strategy 4: Try navigating to the URL again with longer delays
      console.log('🔄 Strategy 4: Re-navigating with longer delays...');
      const pageUrl = this.buildSearchUrl(searchTerm, location, pageNumber);
      
      // Add extra delay before re-navigation
      await this.page.waitForTimeout(2000); // Reduced from 5000
      
      await this.page.goto(pageUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000  // Reduced from 45000
      });
      
      // Wait after navigation
      await this.page.waitForTimeout(6000); // Reduced from 12000
      
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
      await this.page.waitForTimeout(3000); // Reduced from 8000
      
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
        csvPath = await this.csvExporter.exportContacts(this.scrapedContacts, this.sourceName, pageNumber, location);
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
        await this.waitForElement(selector, 2000); // Reduced from 3000
        console.log(`✅ Found results with selector: ${selector}`);
        resultsLoaded = true;
        break;
      } catch (error) {
        console.log(`⚠️ Selector ${selector} not found, trying next...`);
      }
    }
    
    if (!resultsLoaded) {
      console.log('⚠️ No standard selectors found, waiting additional 2 seconds...'); // Reduced from 5 seconds
      await this.page.waitForTimeout(2000);
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

    // Process each business listing with optimized approach
    console.log(`🔄 Processing ${businessListings.length} business listings...`);
    let processedCount = 0;
    let newContactsCount = 0;
    
    // Process in smaller batches for better performance
    const batchSize = 5;
    for (let batchStart = 0; batchStart < businessListings.length; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, businessListings.length);
      const batch = [];
      
      // Re-query elements for this batch to avoid stale element issues
      const currentBusinessListings = await this.page.$$(usedSelector);
      
      for (let i = batchStart; i < batchEnd; i++) {
        if (i >= currentBusinessListings.length) {
          console.log(`⚠️ Element ${i + 1} no longer available, skipping...`);
          continue;
        }
        
        batch.push(this.processBusinessListing(currentBusinessListings[i]).catch(error => {
          console.error(`❌ Error processing listing ${i + 1}:`, error.message);
          return [];
        }));
      }
      
      // Process batch in parallel
      const batchResults = await Promise.all(batch);
      
      // Add all contacts from this batch
      for (const contacts of batchResults) {
        if (contacts.length > 0) {
          this.addContacts(contacts);
          newContactsCount += contacts.length;
          processedCount++;
        }
      }
      
      // Show progress
      console.log(`📊 Progress: ${Math.min(batchEnd, businessListings.length)}/${businessListings.length} listings processed`);
      // Small delay between batches
      if (batchEnd < businessListings.length) {
      
        const currentDelays = config.delays[config.mode] || config.delays.fast;
        await this.page.waitForTimeout(currentDelays.listingDelay);
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