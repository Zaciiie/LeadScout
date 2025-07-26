const BaseScraper = require('./baseScraper');

class MantaScraper extends BaseScraper {
  constructor() {
    super('manta');
    this.baseUrl = 'https://www.manta.com';
  }

  /**
   * Build search URL for Manta
   * @param {string} searchTerm - What to search for
   * @param {string} location - Where to search
   * @returns {string} Complete search URL
   */
  buildSearchUrl(searchTerm, location) {
    const encodedTerm = encodeURIComponent(searchTerm);
    const encodedLocation = encodeURIComponent(location);
    return `${this.baseUrl}/search?search=${encodedTerm}&location=${encodedLocation}`;
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
        
        // Business name
        const nameSelectors = [
          '.company-name a',
          '.business-name',
          'h3 a',
          '.listing-title a',
          '.company-title'
        ];
        
        for (const selector of nameSelectors) {
          const nameElement = element.querySelector(selector);
          if (nameElement) {
            let businessName = nameElement.textContent.trim();
            
            // Remove any leading numbers and dots (e.g., "1. Business Name" -> "Business Name")
            businessName = businessName.replace(/^\d+\.\s*/, '');
            
            data.businessName = businessName;
            data.businessUrl = nameElement.href || '';
            break;
          }
        }
        
        // Phone number
        const phoneSelectors = [
          '.phone-number',
          '.contact-phone',
          '[class*="phone"]',
          '.business-phone'
        ];
        
        for (const selector of phoneSelectors) {
          const phoneElement = element.querySelector(selector);
          if (phoneElement) {
            data.phone = phoneElement.textContent.trim();
            break;
          }
        }
        
        // Address
        const addressSelectors = [
          '.address',
          '.business-address',
          '.location',
          '.street-address'
        ];
        
        for (const selector of addressSelectors) {
          const addressElement = element.querySelector(selector);
          if (addressElement) {
            data.address = addressElement.textContent.trim();
            break;
          }
        }
        
        // Website
        const websiteSelectors = [
          '.website a',
          '.business-website a',
          'a[href*="http"]:not([href*="manta.com"])'
        ];
        
        for (const selector of websiteSelectors) {
          const websiteElement = element.querySelector(selector);
          if (websiteElement && websiteElement.href) {
            data.website = websiteElement.href;
            break;
          }
        }
        
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
      console.log('🔍 Looking for hidden email addresses in Manta...');
      
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
        '.business-info a',
        '.company-info a'
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
        '.info-toggle',
        '.show-more',
        '.contact-toggle'
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
   * Scrape detailed information from a business profile page
   * @param {string} businessUrl - URL of the business profile
   * @returns {Object} Detailed contact information
   */
  async scrapeBusinessProfile(businessUrl) {
    try {
      if (!businessUrl || businessUrl.includes('manta.com') === false) {
        return {};
      }

      const profilePage = await this.browser.newPage();
      await profilePage.goto(businessUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      
      const profileDetails = await profilePage.evaluate(() => {
        const data = {};
        
        // Contact person name
        const contactSelectors = [
          '.contact-name',
          '.owner-name',
          '.principal-name',
          '.executive-name',
          '[class*="contact"] [class*="name"]'
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
          '.email',
          '.contact-email',
          '[class*="email"]'
        ];
        
        for (const selector of emailSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            data.email = element.href ? element.href.replace('mailto:', '') : element.textContent.trim();
            break;
          }
        }
        
        // Additional phone numbers
        const phoneElements = document.querySelectorAll('.phone, [class*="phone"]');
        const phones = [];
        phoneElements.forEach(el => {
          const phone = el.textContent.trim();
          if (phone && !phones.includes(phone)) {
            phones.push(phone);
          }
        });
        data.phones = phones;
        
        // Business description for additional contact extraction
        const descriptionSelectors = [
          '.business-description',
          '.company-description',
          '.about',
          '.description'
        ];
        
        for (const selector of descriptionSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            data.description = element.textContent.trim();
            break;
          }
        }
        
        // Get full page text for extraction
        data.fullText = document.body.textContent || document.body.innerText || '';
        
        return data;
      });
      
      await profilePage.close();
      return profileDetails;
    } catch (error) {
      console.error(`Error scraping business profile from ${businessUrl}:`, error.message);
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

    let allContacts = [];
    
    // Extract hidden email from More Info sections
    const hiddenEmail = await this.extractHiddenEmail(businessElement);
    
    // Extract contacts from the listing text
    const listingContacts = this.contactExtractor.extractAllContacts(businessInfo.fullText, this.sourceName);
    allContacts.push(...listingContacts);
    
    // If we have a business URL, scrape the profile page for more details
    if (businessInfo.businessUrl) {
      try {
        const profileDetails = await this.scrapeBusinessProfile(businessInfo.businessUrl);
        
        if (profileDetails.fullText) {
          const profileContacts = this.contactExtractor.extractAllContacts(profileDetails.fullText, this.sourceName);
          
          // Merge profile contacts with listing contacts
          profileContacts.forEach(profileContact => {
            // Check if this contact already exists
            const existingContact = allContacts.find(c => 
              c.email === profileContact.email || 
              (c.phone === profileContact.phone && profileContact.phone)
            );
            
            if (!existingContact) {
              allContacts.push(profileContact);
            } else {
              // Merge additional information
              Object.keys(profileContact).forEach(key => {
                if (!existingContact[key] && profileContact[key]) {
                  existingContact[key] = profileContact[key];
                }
              });
            }
          });
        }
        
        // Add contact name from profile if found
        if (profileDetails.contactName) {
          const parsedName = this.contactExtractor.parseName(profileDetails.contactName);
          allContacts.forEach(contact => {
            if (!contact.firstName && !contact.lastName) {
              contact.firstName = parsedName.firstName;
              contact.lastName = parsedName.lastName;
              contact.fullName = profileDetails.contactName;
            }
          });
        }
        
        // Add email from profile if found
        if (profileDetails.email) {
          allContacts.forEach(contact => {
            if (!contact.email) {
              contact.email = profileDetails.email;
            }
          });
        }
        
      } catch (error) {
        console.error('Error processing business profile:', error.message);
      }
    }
    
    // If no contacts found from text, create one from available info
    if (allContacts.length === 0 && (businessInfo.businessName || businessInfo.phone)) {
      allContacts.push({
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

    // Enhance all contacts with business information and hidden email (excluding fullName)
    return allContacts.map(contact => {
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
      
      // Remove fullName and related fields if they exist
      delete enhancedContact.fullName;
      delete enhancedContact.firstName;
      delete enhancedContact.lastName;
      
      return enhancedContact;
    });
  }

  /**
   * Check if there's a next page
   * @returns {boolean} True if next page exists
   */
  async hasNextPage() {
    return await this.elementExists('.pagination .next, .next-page, a[aria-label="Next"]');
  }

  /**
   * Navigate to next page
   * @returns {boolean} True if successfully navigated
   */
  async goToNextPage() {
    try {
      const nextButton = await this.page.$('.pagination .next, .next-page, a[aria-label="Next"]');
      if (nextButton) {
        await nextButton.click();
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
        await this.delay();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error navigating to next page:', error.message);
      return false;
    }
  }

  /**
   * Main scraping method for Manta
   * @param {Object} options - Scraping options
   * @param {string} options.searchTerm - What to search for
   * @param {string} options.location - Where to search
   * @param {number} options.maxPages - Maximum pages to scrape
   */
  async scrape(options = {}) {
    const { searchTerm = 'restaurants', location = 'New York, NY', maxPages = 5 } = options;
    
    try {
      await this.init();
      
      const searchUrl = this.buildSearchUrl(searchTerm, location);
      const success = await this.navigateToUrl(searchUrl);
      
      if (!success) {
        throw new Error('Failed to load search results');
      }

      let currentPage = 1;
      
      while (currentPage <= maxPages) {
        console.log(`📄 Scraping page ${currentPage} of ${maxPages}`);
        
        // Wait for search results to load
        await this.waitForElement('.search-results, .company-listing, .business-listing', 5000);
        
        // Get all business listings on current page
        const businessListings = await this.page.$$('.company-listing, .business-listing, .search-result-item');
        
        if (businessListings.length === 0) {
          console.log('⚠️ No business listings found on this page');
          break;
        }

        console.log(`🏢 Found ${businessListings.length} business listings`);

        // Process each business listing
        for (let i = 0; i < businessListings.length; i++) {
          try {
            const contacts = await this.processBusinessListing(businessListings[i]);
            this.addContacts(contacts);
            
            // Small delay between processing listings
            await this.page.waitForTimeout(1000);
          } catch (error) {
            console.error(`Error processing listing ${i + 1}:`, error.message);
          }
        }

        // Check if there's a next page and navigate to it
        if (currentPage < maxPages && await this.hasNextPage()) {
          const navigated = await this.goToNextPage();
          if (!navigated) {
            console.log('❌ Could not navigate to next page');
            break;
          }
          currentPage++;
        } else {
          break;
        }
      }

      console.log(`✅ Scraping completed. Total contacts found: ${this.scrapedContacts.length}`);
      
      // Export contacts to CSV
      const csvPath = await this.exportContacts();
      return csvPath;

    } catch (error) {
      console.error('❌ Scraping error:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// If running directly
if (require.main === module) {
  const scraper = new MantaScraper();
  
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

module.exports = MantaScraper;