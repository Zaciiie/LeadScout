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

      // Re-number all records with continuous numbering
      const renumberedData = this.renumberRecords(allData);

      if (separateSheets && Object.keys(sheetData).length > 1) {
        // Create separate sheets for each source with continuous numbering
        let currentNumber = 1;
        Object.keys(sheetData).forEach(source => {
          const sourceData = this.renumberRecords(sheetData[source], currentNumber);
          currentNumber += sourceData.length;
          
          const worksheet = XLSX.utils.json_to_sheet(sourceData);
          this.formatWorksheet(worksheet);
          XLSX.utils.book_append_sheet(workbook, worksheet, this.sanitizeSheetName(source));
          console.log(`📄 Created sheet "${source}" with ${sourceData.length} records`);
        });

        // Also create a combined sheet with continuous numbering
        const combinedWorksheet = XLSX.utils.json_to_sheet(renumberedData);
        this.formatWorksheet(combinedWorksheet);
        XLSX.utils.book_append_sheet(workbook, combinedWorksheet, 'All_Combined');
        console.log(`📄 Created combined sheet with ${renumberedData.length} records`);
      } else {
        // Single sheet with all data and continuous numbering
        const worksheet = XLSX.utils.json_to_sheet(renumberedData);
        this.formatWorksheet(worksheet);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
        console.log(`📄 Created single sheet with ${renumberedData.length} records`);
      }

      // Save XLSX file in the appropriate location folder
      let outputPath;
      if (csvFiles.length > 0) {
        // Extract location from the first CSV file to determine where to save
        const firstFile = csvFiles[0];
        const location = this.extractLocationFromFilePath(firstFile);
        
        if (location.city !== 'Unknown') {
          if (pattern && pattern !== 'all') {
            // For specific sources (yellowpages, manta), save in source/location folder
            const sourceFolderName = this.getSourceFolderName(pattern);
            const locationFolderName = `${location.city} ${location.state}`;
            const targetDir = path.join(this.outputDir, sourceFolderName, locationFolderName);
            await fs.ensureDir(targetDir);
            outputPath = path.join(targetDir, outputFileName);
          } else {
            // For 'all' sources, determine the primary source and save in that location
            const primarySource = this.determinePrimarySource(csvFiles);
            const sourceFolderName = this.getSourceFolderName(primarySource);
            const locationFolderName = `${location.city} ${location.state}`;
            const targetDir = path.join(this.outputDir, sourceFolderName, locationFolderName);
            await fs.ensureDir(targetDir);
            outputPath = path.join(targetDir, outputFileName);
          }
        } else {
          // Fallback to root directory if location can't be determined
          outputPath = path.join(this.outputDir, outputFileName);
        }
      } else {
        // No CSV files found, save in root directory
        outputPath = path.join(this.outputDir, outputFileName);
      }
      
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
   * Extract location from a single CSV file path
   * @param {string} filePath - CSV file path
   * @returns {Object} Location info {city, state}
   */
  extractLocationFromFilePath(filePath) {
    const fileName = path.basename(filePath);
    // Look for pattern like "yellowpages_Anchorage_AK_contacts_Page1.csv"
    const match = fileName.match(/(?:yellowpages|manta)_([^_]+)_([^_]+)_contacts/);
    if (match) {
      return {
        city: match[1],
        state: match[2]
      };
    }
    return { city: 'Unknown', state: 'XX' };
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
   * Determine primary source from CSV files (for 'all' merges)
   * Priority: YellowPages > Manta > Others
   * @param {Array} csvFiles - Array of CSV file paths
   * @returns {string} Primary source name
   */
  determinePrimarySource(csvFiles) {
    const sources = csvFiles.map(file => {
      const fileName = path.basename(file);
      if (fileName.toLowerCase().includes('yellowpages')) return 'yellowpages';
      if (fileName.toLowerCase().includes('manta')) return 'manta';
      return 'unknown';
    });

    // Priority order: yellowpages first, then manta
    if (sources.includes('yellowpages')) return 'yellowpages';
    if (sources.includes('manta')) return 'manta';
    return 'yellowpages'; // Default fallback
  }

  /**
   * Renumber records with continuous numbering
   * @param {Array} records - Array of record objects
   * @param {number} startNumber - Starting number (default: 1)
   * @returns {Array} Records with updated numbering
   */
  renumberRecords(records, startNumber = 1) {
    return records.map((record, index) => {
      const newRecord = { ...record };
      
      // Update various possible number fields
      if ('No.' in newRecord) {
        newRecord['No.'] = startNumber + index;
      }
      if ('no' in newRecord) {
        newRecord['no'] = startNumber + index;
      }
      if ('number' in newRecord) {
        newRecord['number'] = startNumber + index;
      }
      if ('Number' in newRecord) {
        newRecord['Number'] = startNumber + index;
      }
      if ('S.No' in newRecord) {
        newRecord['S.No'] = startNumber + index;
      }
      if ('Sr.No' in newRecord) {
        newRecord['Sr.No'] = startNumber + index;
      }
      if ('ID' in newRecord) {
        newRecord['ID'] = startNumber + index;
      }
      if ('id' in newRecord) {
        newRecord['id'] = startNumber + index;
      }
      
      return newRecord;
    });
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