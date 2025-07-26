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
   */
  async ensureOutputDir() {
    await fs.ensureDir(this.outputDir);
  }

  /**
   * Generate filename with timestamp
   * @param {string} source - Source website name
   * @returns {string} Generated filename
   */
  generateFilename(source) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${source}_contacts_${timestamp}.csv`;
  }

  /**
   * Export contacts to CSV file
   * @param {Array} contacts - Array of contact objects
   * @param {string} source - Source website name
   * @returns {string} Path to created CSV file
   */
  async exportContacts(contacts, source) {
    await this.ensureOutputDir();

    if (!contacts || contacts.length === 0) {
      console.log('No contacts to export');
      return null;
    }

    const filename = this.generateFilename(source);
    const filepath = path.join(this.outputDir, filename);

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