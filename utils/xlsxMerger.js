const XLSX = require('xlsx');
const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const config = require('../config');

class XLSXMerger {
  constructor() {
    this.outputDir = config.output.directory;
  }

  /**
   * Read CSV file and return data as array of objects
   * @param {string} filePath - Path to CSV file
   * @returns {Promise<Array>} Array of contact objects
   */
  async readCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ File not found: ${filePath}`);
        resolve([]);
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          console.log(`✅ Read ${results.length} records from ${path.basename(filePath)}`);
          resolve(results);
        })
        .on('error', (error) => {
          console.error(`❌ Error reading ${filePath}:`, error.message);
          reject(error);
        });
    });
  }

  /**
   * Get all CSV files from output directory (including subfolders)
   * @param {string} pattern - Optional pattern to filter files (e.g., 'yellowpages', 'manta')
   * @returns {Array} Array of CSV file paths
   */
  async getCSVFiles(pattern = null) {
    try {
      await fs.ensureDir(this.outputDir);
      const csvFiles = [];
      
      // Function to recursively search for CSV files
      const searchDirectory = async (dirPath) => {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dirPath, item.name);
          
          if (item.isDirectory()) {
            // Recursively search subdirectories
            await searchDirectory(fullPath);
          } else if (item.isFile() && item.name.endsWith('.csv')) {
            // Add CSV file to list
            csvFiles.push(fullPath);
          }
        }
      };
      
      // Search the main output directory and all subdirectories
      await searchDirectory(this.outputDir);
      
      // Apply pattern filter if specified
      if (pattern) {
        return csvFiles.filter(file => {
          const fileName = path.basename(file);
          return fileName.toLowerCase().includes(pattern.toLowerCase());
        });
      }
      
      return csvFiles;
    } catch (error) {
      console.error('❌ Error reading output directory:', error.message);
      return [];
    }
  }

  /**
   * Merge multiple CSV files into one XLSX file
   * @param {Object} options - Merge options
   * @param {string} options.outputFileName - Name for the output XLSX file
   * @param {string} options.pattern - Optional pattern to filter CSV files
   * @param {boolean} options.separateSheets - Whether to create separate sheets for each source
   * @returns {string} Path to created XLSX file
   */
  async mergeToXLSX(options = {}) {
    const {
      outputFileName = 'merged_contacts.xlsx',
      pattern = null,
      separateSheets = false
    } = options;

    try {
      console.log('🔍 Looking for CSV files to merge...');
      const csvFiles = await this.getCSVFiles(pattern);
      
      if (csvFiles.length === 0) {
        console.log('⚠️ No CSV files found to merge');
        return null;
      }

      console.log(`📁 Found ${csvFiles.length} CSV files:`);
      csvFiles.forEach(file => console.log(`  • ${path.basename(file)}`));

      // Read all CSV files
      const allData = [];
      const sheetData = {};

      for (const csvFile of csvFiles) {
        const data = await this.readCSVFile(csvFile);
        
        if (data.length > 0) {
          // Add source file info to each record
          const fileName = path.basename(csvFile, '.csv');
          const enhancedData = data.map(record => ({
            ...record,
            sourceFile: fileName
          }));

          allData.push(...enhancedData);

          // If separate sheets, organize by source
          if (separateSheets) {
            const source = this.extractSourceFromFileName(fileName);
            if (!sheetData[source]) {
              sheetData[source] = [];
            }
            sheetData[source].push(...enhancedData);
          }
        }
      }

      if (allData.length === 0) {
        console.log('⚠️ No data found in CSV files');
        return null;
      }

      console.log(`📊 Total records to merge: ${allData.length}`);

      // Create workbook
      const workbook = XLSX.utils.book_new();

      if (separateSheets && Object.keys(sheetData).length > 1) {
        // Create separate sheets for each source
        Object.keys(sheetData).forEach(source => {
          const worksheet = XLSX.utils.json_to_sheet(sheetData[source]);
          this.formatWorksheet(worksheet);
          XLSX.utils.book_append_sheet(workbook, worksheet, this.sanitizeSheetName(source));
          console.log(`📄 Created sheet "${source}" with ${sheetData[source].length} records`);
        });

        // Also create a combined sheet
        const combinedWorksheet = XLSX.utils.json_to_sheet(allData);
        this.formatWorksheet(combinedWorksheet);
        XLSX.utils.book_append_sheet(workbook, combinedWorksheet, 'All_Combined');
        console.log(`📄 Created combined sheet with ${allData.length} records`);
      } else {
        // Single sheet with all data
        const worksheet = XLSX.utils.json_to_sheet(allData);
        this.formatWorksheet(worksheet);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
        console.log(`📄 Created single sheet with ${allData.length} records`);
      }

      // Save XLSX file
      const outputPath = path.join(this.outputDir, outputFileName);
      XLSX.writeFile(workbook, outputPath);

      console.log(`✅ Successfully merged ${csvFiles.length} CSV files into XLSX`);
      console.log(`📁 Output file: ${outputPath}`);
      console.log(`📊 Total records: ${allData.length}`);

      return outputPath;

    } catch (error) {
      console.error('❌ Error merging CSV files to XLSX:', error.message);
      throw error;
    }
  }

  /**
   * Extract source name from filename
   * @param {string} fileName - CSV filename
   * @returns {string} Source name
   */
  extractSourceFromFileName(fileName) {
    if (fileName.includes('yellowpages')) return 'YellowPages';
    if (fileName.includes('manta')) return 'Manta';
    if (fileName.includes('test')) return 'Test';
    
    // Extract first part before underscore
    const parts = fileName.split('_');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }

  /**
   * Sanitize sheet name for Excel compatibility
   * @param {string} name - Sheet name
   * @returns {string} Sanitized sheet name
   */
  sanitizeSheetName(name) {
    // Excel sheet names can't contain: \ / ? * [ ]
    // and must be 31 characters or less
    return name.replace(/[\\\/\?\*\[\]]/g, '_').substring(0, 31);
  }

  /**
   * Format worksheet with proper column widths and styling
   * @param {Object} worksheet - XLSX worksheet object
   */
  formatWorksheet(worksheet) {
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Set column widths
    const colWidths = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
      const headerText = headerCell ? headerCell.v : '';
      
      // Set width based on header content
      let width = 15; // default width
      if (headerText.toLowerCase().includes('business')) width = 25;
      if (headerText.toLowerCase().includes('address')) width = 30;
      if (headerText.toLowerCase().includes('website')) width = 25;
      if (headerText.toLowerCase().includes('email')) width = 25;
      if (headerText.toLowerCase().includes('phone')) width = 15;
      if (headerText.toLowerCase().includes('source')) width = 15;
      if (headerText.toLowerCase().includes('scraped')) width = 20;
      
      colWidths.push({ wch: width });
    }
    
    worksheet['!cols'] = colWidths;
  }

  /**
   * Extract location from CSV filenames
   * @param {Array} csvFiles - Array of CSV file paths
   * @returns {Object} Location info {city, state}
   */
  extractLocationFromFiles(csvFiles) {
    for (const filePath of csvFiles) {
      const fileName = path.basename(filePath);
      // Look for pattern like "yellowpages_Anchorage_AK_contacts_Page1.csv"
      const match = fileName.match(/(?:yellowpages|manta)_([^_]+)_([^_]+)_contacts/);
      if (match) {
        return {
          city: match[1],
          state: match[2]
        };
      }
    }
    return { city: 'Unknown', state: 'XX' };
  }

  /**
   * Merge specific source files
   * @param {string} source - Source name ('yellowpages', 'manta', or 'all')
   * @param {boolean} separateSheets - Whether to create separate sheets
   * @returns {string} Path to created XLSX file
   */
  async mergeBySource(source = 'all', separateSheets = false) {
    // Get CSV files to extract location info
    const csvFiles = await this.getCSVFiles();
    const location = this.extractLocationFromFiles(csvFiles);
    
    let outputFileName, pattern;

    switch (source.toLowerCase()) {
      case 'yellowpages':
        outputFileName = `Final_${location.city}_${location.state}_YellowPages_Data.xlsx`;
        pattern = 'yellowpages';
        break;
      case 'manta':
        outputFileName = `Final_${location.city}_${location.state}_Manta_Data.xlsx`;
        pattern = 'manta';
        break;
      case 'all':
      default:
        outputFileName = `Final_${location.city}_${location.state}_Data.xlsx`;
        pattern = null;
        break;
    }

    return await this.mergeToXLSX({
      outputFileName,
      pattern,
      separateSheets
    });
  }

  /**
   * Get statistics about CSV files in output directory
   * @returns {Object} Statistics object
   */
  async getStatistics() {
    try {
      const csvFiles = await this.getCSVFiles();
      const stats = {
        totalFiles: csvFiles.length,
        sources: {},
        totalRecords: 0,
        files: []
      };

      for (const csvFile of csvFiles) {
        const data = await this.readCSVFile(csvFile);
        const fileName = path.basename(csvFile);
        const source = this.extractSourceFromFileName(fileName);
        
        if (!stats.sources[source]) {
          stats.sources[source] = { files: 0, records: 0 };
        }
        
        stats.sources[source].files++;
        stats.sources[source].records += data.length;
        stats.totalRecords += data.length;
        
        stats.files.push({
          name: fileName,
          source: source,
          records: data.length,
          path: csvFile
        });
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting statistics:', error.message);
      return null;
    }
  }
}

module.exports = XLSXMerger;