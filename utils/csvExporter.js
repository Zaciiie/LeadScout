const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

class CSVExporter {
  constructor() {
    this.outputDir = config.output.directory;
    this.headers = config.output.csvHeaders;
  }

  /**
   * Ensure output directory exists
   * @param {string} source - Source name (yellowpages, manta)
   * @param {string} location - Location string (e.g., "Anchorage, AK")
   */
  async ensureOutputDir(source = null, location = null) {
    let targetDir = this.outputDir;
    
    if (source && location) {
      // Create organized folder structure: output/YellowPages/Anchorage AK/
      const sourceFolderName = this.getSourceFolderName(source);
      const locationFolderName = this.getLocationFolderName(location);
      
      targetDir = path.join(this.outputDir, sourceFolderName, locationFolderName);
    }
    
    await fs.ensureDir(targetDir);
    return targetDir;
  }

  /**
   * Get proper source folder name
   * @param {string} source - Source name
   * @returns {string} Formatted source folder name
   */
  getSourceFolderName(source) {
    switch (source.toLowerCase()) {
      case 'yellowpages':
        return 'YellowPages';
      case 'manta':
        return 'Manta';
      default:
        return source.charAt(0).toUpperCase() + source.slice(1);
    }
  }

  /**
   * Get location folder name from location string
   * @param {string} location - Location string (e.g., "Anchorage, AK")
   * @returns {string} Formatted location folder name
   */
  getLocationFolderName(location) {
    if (!location) return 'Unknown';
    
    // Parse location like "Anchorage, AK" to "Anchorage AK"
    const cleanLocation = location.replace(/[^a-zA-Z0-9,\s]/g, ''); // Remove special chars except comma and space
    const parts = cleanLocation.split(',').map(part => part.trim());
    
    if (parts.length >= 2) {
      const city = parts[0].trim();
      const state = parts[1].trim();
      return `${city} ${state}`;
    } else if (parts.length === 1) {
      return parts[0].trim();
    }
    
    return 'Unknown';
  }

  /**
   * Format address to ensure proper comma placement
   * @param {string} address - Raw address string
   * @returns {string} Formatted address with proper commas
   */
  formatAddress(address) {
    if (!address || typeof address !== 'string') return '';
    
    // Clean the address
    let formatted = address.trim();
    
    // Handle specific patterns like "3300 Arctic Blvd Ste 102Anchorage, AK 99503"
    // Pattern: [Street] [Suite/Unit][City], [State] [ZIP]
    
    // First, handle the case where suite/unit is directly connected to city name
    // Look for pattern: Ste/Suite/Unit/Apt followed by number/letter then directly connected to city
    const suitePattern = /^(.+?)\s+((?:Ste|Suite|Unit|Apt|#)\s*\w+)([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/;
    const suiteMatch = formatted.match(suitePattern);
    
    if (suiteMatch) {
      const streetPart = suiteMatch[1].trim();
      const suitePart = suiteMatch[2].trim();
      const cityPart = suiteMatch[3].trim();
      const statePart = suiteMatch[4].trim();
      const zipPart = suiteMatch[5] ? suiteMatch[5].trim() : '';
      
      // Format: Street, Suite, City, State ZIP
      formatted = `${streetPart}, ${suitePart}, ${cityPart}, ${statePart}${zipPart ? ' ' + zipPart : ''}`;
      return formatted;
    }
    
    // Handle case where there's no comma between suite and city
    // Pattern: [Street] [Suite/Unit][City] [State] [ZIP]
    const noCommaPattern = /^(.+?)\s+((?:Ste|Suite|Unit|Apt|#)\s*\w+)([A-Z][a-zA-Z\s]+)\s+([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/;
    const noCommaMatch = formatted.match(noCommaPattern);
    
    if (noCommaMatch) {
      const streetPart = noCommaMatch[1].trim();
      const suitePart = noCommaMatch[2].trim();
      const cityPart = noCommaMatch[3].trim();
      const statePart = noCommaMatch[4].trim();
      const zipPart = noCommaMatch[5] ? noCommaMatch[5].trim() : '';
      
      // Format: Street, Suite, City, State ZIP
      formatted = `${streetPart}, ${suitePart}, ${cityPart}, ${statePart}${zipPart ? ' ' + zipPart : ''}`;
      return formatted;
    }
    
    // Handle simple case: [Street][City], [State] [ZIP] (no suite)
    const simplePattern = /^(.+?)([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/;
    const simpleMatch = formatted.match(simplePattern);
    
    if (simpleMatch) {
      const streetPart = simpleMatch[1].trim();
      const cityPart = simpleMatch[2].trim();
      const statePart = simpleMatch[3].trim();
      const zipPart = simpleMatch[4] ? simpleMatch[4].trim() : '';
      
      // Add comma before city if not present
      if (!streetPart.endsWith(',')) {
        formatted = `${streetPart}, ${cityPart}, ${statePart}${zipPart ? ' ' + zipPart : ''}`;
      }
      return formatted;
    }
    
    // Handle case without existing comma: [Street] [City] [State] [ZIP]
    const basicPattern = /^(.+?)\s+([A-Z][a-zA-Z\s]+)\s+([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/;
    const basicMatch = formatted.match(basicPattern);
    
    if (basicMatch) {
      const streetPart = basicMatch[1].trim();
      const cityPart = basicMatch[2].trim();
      const statePart = basicMatch[3].trim();
      const zipPart = basicMatch[4] ? basicMatch[4].trim() : '';
      
      // Format: Street, City, State ZIP
      formatted = `${streetPart}, ${cityPart}, ${statePart}${zipPart ? ' ' + zipPart : ''}`;
      return formatted;
    }
    
    // If no pattern matches, return original
    return formatted;
  }

  /**
   * Generate filename with timestamp or page number
   * @param {string} source - Source website name
   * @param {number} pageNumber - Optional page number for filename
   * @param {string} location - Optional location string (e.g., "Anchorage, AK")
   * @returns {string} Generated filename
   */
  generateFilename(source, pageNumber = null, location = null) {
    let locationPart = '';
    
    if (location) {
      // Parse location like "Anchorage, AK" to "Anchorage_AK"
      const cleanLocation = location.replace(/[^a-zA-Z0-9,\s]/g, ''); // Remove special chars except comma and space
      const parts = cleanLocation.split(',').map(part => part.trim());
      if (parts.length >= 2) {
        const city = parts[0].replace(/\s+/g, ''); // Remove spaces from city
        const state = parts[1].replace(/\s+/g, ''); // Remove spaces from state
        locationPart = `_${city}_${state}`;
      } else if (parts.length === 1) {
        locationPart = `_${parts[0].replace(/\s+/g, '')}`;
      }
    }
    
    if (pageNumber !== null) {
      return `${source}${locationPart}_contacts_Page${pageNumber}.csv`;
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${source}${locationPart}_contacts_${timestamp}.csv`;
  }

  /**
   * Export contacts to CSV file
   * @param {Array} contacts - Array of contact objects
   * @param {string} source - Source website name
   * @param {number} pageNumber - Optional page number for filename
   * @param {string} location - Optional location string (e.g., "Anchorage, AK")
   * @returns {string} Path to created CSV file
   */
  async exportContacts(contacts, source, pageNumber = null, location = null) {
    // Create organized directory structure
    const targetDir = await this.ensureOutputDir(source, location);

    if (!contacts || contacts.length === 0) {
      console.log('No contacts to export');
      return null;
    }

    const filename = this.generateFilename(source, pageNumber, location);
    const filepath = path.join(targetDir, filename);

    // Prepare CSV headers
    const csvHeaders = this.headers.map(header => ({
      id: header,
      title: header.charAt(0).toUpperCase() + header.slice(1)
    }));

    // Create CSV writer
    const csvWriter = createCsvWriter({
      path: filepath,
      header: csvHeaders
    });

    // Ensure all contacts have all required fields and add serial numbers
    const normalizedContacts = contacts.map((contact, index) => {
      const normalized = {};
      this.headers.forEach(header => {
        if (header === 'sno') {
          normalized[header] = index + 1; // Add serial number starting from 1
        } else if (header === 'address') {
          normalized[header] = this.formatAddress(contact[header] || '');
        } else {
          normalized[header] = contact[header] || '';
        }
      });
      return normalized;
    });

    try {
      await csvWriter.writeRecords(normalizedContacts);
      console.log(`✅ Exported ${contacts.length} contacts to ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('❌ Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Append contacts to existing CSV file
   * @param {Array} contacts - Array of contact objects
   * @param {string} filepath - Path to existing CSV file
   */
  async appendContacts(contacts, filepath) {
    if (!contacts || contacts.length === 0) {
      return;
    }

    // Check if file exists
    const fileExists = await fs.pathExists(filepath);
    
    if (!fileExists) {
      throw new Error(`CSV file does not exist: ${filepath}`);
    }

    // Read existing contacts to get the current count for serial numbering
    const existingContacts = await this.readContacts(filepath);
    const startingSerialNumber = existingContacts.length + 1;

    // Prepare CSV headers (for append mode, we don't include headers)
    const csvHeaders = this.headers.map(header => ({
      id: header,
      title: header.charAt(0).toUpperCase() + header.slice(1)
    }));

    // Create CSV writer in append mode
    const csvWriter = createCsvWriter({
      path: filepath,
      header: csvHeaders,
      append: true
    });

    // Ensure all contacts have all required fields and continue serial numbering
    const normalizedContacts = contacts.map((contact, index) => {
      const normalized = {};
      this.headers.forEach(header => {
        if (header === 'sno') {
          normalized[header] = startingSerialNumber + index; // Continue serial numbering
        } else if (header === 'address') {
          normalized[header] = this.formatAddress(contact[header] || '');
        } else {
          normalized[header] = contact[header] || '';
        }
      });
      return normalized;
    });

    try {
      await csvWriter.writeRecords(normalizedContacts);
      console.log(`✅ Appended ${contacts.length} contacts to ${filepath}`);
    } catch (error) {
      console.error('❌ Error appending to CSV:', error);
      throw error;
    }
  }

  /**
   * Read existing CSV file and return contacts
   * @param {string} filepath - Path to CSV file
   * @returns {Array} Array of contact objects
   */
  async readContacts(filepath) {
    try {
      const fileExists = await fs.pathExists(filepath);
      if (!fileExists) {
        return [];
      }

      const csvContent = await fs.readFile(filepath, 'utf8');
      const lines = csvContent.split('\n');
      
      if (lines.length <= 1) {
        return []; // Empty file or only headers
      }

      // Parse CSV manually (simple implementation)
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const contacts = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const contact = {};
        
        headers.forEach((header, index) => {
          contact[header.toLowerCase()] = values[index] || '';
        });

        contacts.push(contact);
      }

      return contacts;
    } catch (error) {
      console.error('❌ Error reading CSV file:', error);
      return [];
    }
  }
}

module.exports = CSVExporter;