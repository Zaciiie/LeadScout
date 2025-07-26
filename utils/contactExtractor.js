/**
 * Utility functions for extracting contact information from text and HTML
 */

class ContactExtractor {
  constructor() {
    // Regular expressions for different contact types
    this.patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      phoneAlternative: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      name: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g
    };
  }

  /**
   * Extract email addresses from text
   * @param {string} text - Text to search for emails
   * @returns {Array} Array of unique email addresses
   */
  extractEmails(text) {
    if (!text) return [];
    const emails = text.match(this.patterns.email) || [];
    return [...new Set(emails)];
  }

  /**
   * Extract phone numbers from text
   * @param {string} text - Text to search for phone numbers
   * @returns {Array} Array of unique phone numbers
   */
  extractPhones(text) {
    if (!text) return [];
    const phones = [];
    
    // Try primary pattern first
    const primaryMatches = text.match(this.patterns.phone) || [];
    phones.push(...primaryMatches);
    
    // Try alternative pattern
    const altMatches = text.match(this.patterns.phoneAlternative) || [];
    phones.push(...altMatches);
    
    // Clean and format phone numbers
    const cleanedPhones = phones.map(phone => {
      return phone.replace(/\D/g, '').replace(/^1/, ''); // Remove non-digits and leading 1
    }).filter(phone => phone.length === 10); // Only keep 10-digit numbers
    
    return [...new Set(cleanedPhones)];
  }

  /**
   * Extract potential names from text
   * @param {string} text - Text to search for names
   * @returns {Array} Array of potential names
   */
  extractNames(text) {
    if (!text) return [];
    const names = text.match(this.patterns.name) || [];
    return [...new Set(names)];
  }

  /**
   * Parse a full name into first and last name
   * @param {string} fullName - Full name to parse
   * @returns {Object} Object with firstName and lastName
   */
  parseName(fullName) {
    if (!fullName) return { firstName: '', lastName: '' };
    
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    } else if (parts.length === 2) {
      return { firstName: parts[0], lastName: parts[1] };
    } else {
      // For names with more than 2 parts, take first as firstName and last as lastName
      return { firstName: parts[0], lastName: parts[parts.length - 1] };
    }
  }

  /**
   * Clean and normalize extracted data
   * @param {Object} data - Raw extracted data
   * @returns {Object} Cleaned data
   */
  cleanData(data) {
    const cleaned = {};
    
    // Clean strings
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        cleaned[key] = data[key].trim().replace(/\s+/g, ' ');
      } else {
        cleaned[key] = data[key];
      }
    });

    // Format phone number
    if (cleaned.phone && cleaned.phone.length === 10) {
      cleaned.phone = `(${cleaned.phone.slice(0, 3)}) ${cleaned.phone.slice(3, 6)}-${cleaned.phone.slice(6)}`;
    }

    return cleaned;
  }

  /**
   * Extract all contact information from a page's text content
   * @param {string} pageText - Full text content of the page
   * @param {string} source - Source website name
   * @returns {Array} Array of contact objects
   */
  extractAllContacts(pageText, source = '') {
    const emails = this.extractEmails(pageText);
    const phones = this.extractPhones(pageText);
    const names = this.extractNames(pageText);

    const contacts = [];

    // If we have emails, create contacts based on them
    if (emails.length > 0) {
      emails.forEach(email => {
        const contact = {
          email,
          phone: phones[0] || '',
          fullName: names[0] || '',
          source,
          scrapedAt: new Date().toISOString()
        };

        contacts.push(this.cleanData(contact));
      });
    } else if (phones.length > 0 || names.length > 0) {
      // Create contact even without email if we have phone or name
      const contact = {
        email: '',
        phone: phones[0] || '',
        fullName: names[0] || '',
        source,
        scrapedAt: new Date().toISOString()
      };

      contacts.push(this.cleanData(contact));
    }

    return contacts;
  }
}

module.exports = ContactExtractor;