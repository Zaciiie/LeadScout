#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const YellowPagesScraper = require('./scrapers/yellowpages');
const MantaScraper = require('./scrapers/manta');
const XLSXMerger = require('./utils/xlsxMerger');

const program = new Command();

// ASCII Art Banner
const banner = `
╔══════════════════════════════════════════════════════════════╗
║                    Web Scraper Tool                         ║
║              Contact Information Extractor                  ║
║                                                              ║
║  Extract names, emails, and phone numbers from:             ║
║  • Yellow Pages                                              ║
║  • Manta Business Directory                                  ║
╚══════════════════════════════════════════════════════════════╝
`;

console.log(chalk.cyan(banner));

program
  .name('web-scraper')
  .description('Extract contact information from business directories')
  .version('1.0.0');

// Yellow Pages scraping command
program
  .command('yellowpages')
  .alias('yp')
  .description('Scrape contact information from Yellow Pages')
  .option('-s, --search <term>', 'Search term (e.g., "restaurants", "dentists")', 'restaurants')
  .option('-l, --location <location>', 'Location to search in', 'New York, NY')
  .option('-p, --pages <pages>', 'Page number(s) to scrape (single: "5" or multiple: "1,2,3,4,5")', '1')
  .action(async (options) => {
    console.log(chalk.yellow('🟡 Starting Yellow Pages scraper...'));
    console.log(chalk.gray(`Search: ${options.search}`));
    console.log(chalk.gray(`Location: ${options.location}`));
    
    // Parse page numbers (handle both single and comma-separated)
    const pageNumbers = options.pages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p > 0);
    
    if (pageNumbers.length === 0) {
      console.error(chalk.red('❌ Invalid page numbers provided'));
      process.exit(1);
    }
    
    console.log(chalk.gray(`Pages: ${pageNumbers.join(', ')}`));
    console.log('');

    const csvPaths = [];
    let totalContacts = 0;
    
    try {
      for (let i = 0; i < pageNumbers.length; i++) {
        const pageNumber = pageNumbers[i];
        console.log(chalk.cyan(`\n📄 Processing page ${pageNumber} (${i + 1}/${pageNumbers.length})...`));
        
        // Create a new scraper instance for each page to avoid contact accumulation
        const scraper = new YellowPagesScraper();
        
        const csvPath = await scraper.scrape({
          searchTerm: options.search,
          location: options.location,
          pageNumber: pageNumber
        });
        
        if (csvPath) {
          csvPaths.push(csvPath);
          console.log(chalk.green(`✅ Page ${pageNumber} completed: ${csvPath}`));
          
          // Get contact count from this page
          totalContacts += scraper.scrapedContacts.length;
        } else {
          console.log(chalk.yellow(`⚠️ No contacts found on page ${pageNumber}`));
        }
        
        // Add delay between pages to be respectful
        if (i < pageNumbers.length - 1) {
          console.log(chalk.gray('⏳ Waiting 3 seconds before next page...'));
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Summary
      console.log(chalk.green(`\n🎉 Scraping completed!`));
      console.log(chalk.green(`📊 Total pages processed: ${pageNumbers.length}`));
      console.log(chalk.green(`📄 CSV files created: ${csvPaths.length}`));
      console.log(chalk.green(`👥 Total contacts found: ${totalContacts}`));
      
      if (csvPaths.length > 0) {
        console.log(chalk.cyan('\n📁 Created files:'));
        csvPaths.forEach(path => console.log(chalk.gray(`  • ${path}`)));
      }
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Manta scraping command
program
  .command('manta')
  .alias('m')
  .description('Scrape contact information from Manta')
  .option('-s, --search <term>', 'Search term (e.g., "restaurants", "dentists")', 'restaurants')
  .option('-l, --location <location>', 'Location to search in', 'New York, NY')
  .option('-p, --pages <pages>', 'Maximum number of pages to scrape (single: "5" or range: "1-5")', '5')
  .action(async (options) => {
    console.log(chalk.blue('🔵 Starting Manta scraper...'));
    console.log(chalk.gray(`Search: ${options.search}`));
    console.log(chalk.gray(`Location: ${options.location}`));
    
    // Parse max pages (handle single number or range)
    let maxPages = 5;
    if (options.pages.includes('-')) {
      const [start, end] = options.pages.split('-').map(p => parseInt(p.trim()));
      maxPages = Math.max(end - start + 1, 1);
    } else {
      maxPages = parseInt(options.pages) || 5;
    }
    
    console.log(chalk.gray(`Max Pages: ${maxPages}`));
    console.log('');

    const scraper = new MantaScraper();
    
    try {
      const csvPath = await scraper.scrape({
        searchTerm: options.search,
        location: options.location,
        maxPages: maxPages
      });
      
      if (csvPath) {
        console.log(chalk.green(`\n🎉 Success! Results exported to: ${csvPath}`));
      } else {
        console.log(chalk.yellow('\n⚠️ No contacts found to export'));
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Both sites scraping command
program
  .command('both')
  .alias('all')
  .description('Scrape contact information from both Yellow Pages and Manta')
  .option('-s, --search <term>', 'Search term (e.g., "restaurants", "dentists")', 'restaurants')
  .option('-l, --location <location>', 'Location to search in', 'New York, NY')
  .option('-p, --page <number>', 'Specific page number to scrape', '1')
  .action(async (options) => {
    console.log(chalk.magenta('🟣 Starting scraping from both sites...'));
    console.log(chalk.gray(`Search: ${options.search}`));
    console.log(chalk.gray(`Location: ${options.location}`));
    console.log(chalk.gray(`Page: ${options.page}`));
    console.log('');

    const results = [];

    // Scrape Yellow Pages (single page approach)
    try {
      console.log(chalk.yellow('🟡 Starting Yellow Pages...'));
      const ypScraper = new YellowPagesScraper();
      const ypCsvPath = await ypScraper.scrape({
        searchTerm: options.search,
        location: options.location,
        pageNumber: parseInt(options.page)
      });
      if (ypCsvPath) {
        results.push(`Yellow Pages: ${ypCsvPath}`);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Yellow Pages error: ${error.message}`));
    }

    console.log(''); // Empty line

    // Scrape Manta (multi-page approach)
    try {
      console.log(chalk.blue('🔵 Starting Manta...'));
      const mantaScraper = new MantaScraper();
      const mantaCsvPath = await mantaScraper.scrape({
        searchTerm: options.search,
        location: options.location,
        maxPages: parseInt(options.page) // Use page number as max pages for now
      });
      if (mantaCsvPath) {
        results.push(`Manta: ${mantaCsvPath}`);
      }
    } catch (error) {
      console.error(chalk.red(`❌ Manta error: ${error.message}`));
    }

    // Show results
    console.log(chalk.green('\n🎉 Scraping completed!'));
    if (results.length > 0) {
      console.log(chalk.green('\nResults exported to:'));
      results.forEach(result => {
        console.log(chalk.green(`  • ${result}`));
      });
    } else {
      console.log(chalk.yellow('⚠️ No results were exported'));
    }
  });

// Merge CSV files to XLSX command
program
  .command('merge')
  .alias('xlsx')
  .description('Merge all CSV files into one XLSX file')
  .option('-s, --source <source>', 'Filter by source (yellowpages, manta, or all)', 'all')
  .option('-o, --output <filename>', 'Output XLSX filename', 'merged_contacts.xlsx')
  .option('--separate-sheets', 'Create separate sheets for each source', false)
  .option('--stats', 'Show statistics about CSV files before merging', false)
  .action(async (options) => {
    console.log(chalk.green('📊 Starting CSV to XLSX merge process...'));
    console.log(chalk.gray(`Source filter: ${options.source}`));
    console.log(chalk.gray(`Output file: ${options.output}`));
    console.log(chalk.gray(`Separate sheets: ${options.separateSheets ? 'Yes' : 'No'}`));
    console.log('');

    const merger = new XLSXMerger();
    
    try {
      // Show statistics if requested
      if (options.stats) {
        console.log(chalk.cyan('📈 Getting CSV file statistics...'));
        const stats = await merger.getStatistics();
        
        if (stats) {
          console.log(chalk.green(`\n📁 Found ${stats.totalFiles} CSV files with ${stats.totalRecords} total records:`));
          
          // Show by source
          Object.keys(stats.sources).forEach(source => {
            const sourceStats = stats.sources[source];
            console.log(chalk.blue(`  • ${source}: ${sourceStats.files} files, ${sourceStats.records} records`));
          });
          
          // Show individual files
          console.log(chalk.gray('\nIndividual files:'));
          stats.files.forEach(file => {
            console.log(chalk.gray(`  • ${file.name} (${file.records} records)`));
          });
          console.log('');
        } else {
          console.log(chalk.yellow('⚠️ Could not get statistics'));
        }
      }
      
      // Perform merge
      const xlsxPath = await merger.mergeBySource(options.source, options.separateSheets);
      
      if (xlsxPath) {
        console.log(chalk.green(`\n🎉 Success! XLSX file created: ${xlsxPath}`));
      } else {
        console.log(chalk.yellow('\n⚠️ No CSV files found to merge'));
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Merge CSV files to XLSX command
program
  .command('merge')
  .alias('xlsx')
  .description('Merge all CSV files into one XLSX file')
  .option('-s, --source <source>', 'Filter by source (yellowpages, manta, or all)', 'all')
  .option('-o, --output <filename>', 'Output XLSX filename', 'merged_contacts.xlsx')
  .option('--separate-sheets', 'Create separate sheets for each source', false)
  .option('--stats', 'Show statistics about CSV files before merging', false)
  .action(async (options) => {
    console.log(chalk.green('📊 Starting CSV to XLSX merge process...'));
    console.log(chalk.gray(`Source filter: ${options.source}`));
    console.log(chalk.gray(`Output file: ${options.output}`));
    console.log(chalk.gray(`Separate sheets: ${options.separateSheets ? 'Yes' : 'No'}`));
    console.log('');

    const merger = new XLSXMerger();
    
    try {
      // Show statistics if requested
      if (options.stats) {
        console.log(chalk.cyan('📈 Getting CSV file statistics...'));
        const stats = await merger.getStatistics();
        
        if (stats) {
          console.log(chalk.green(`\n📁 Found ${stats.totalFiles} CSV files with ${stats.totalRecords} total records:`));
          
          // Show by source
          Object.keys(stats.sources).forEach(source => {
            const sourceStats = stats.sources[source];
            console.log(chalk.blue(`  • ${source}: ${sourceStats.files} files, ${sourceStats.records} records`));
          });
          
          // Show individual files
          console.log(chalk.gray('\nIndividual files:'));
          stats.files.forEach(file => {
            console.log(chalk.gray(`  • ${file.name} (${file.records} records)`));
          });
          console.log('');
        } else {
          console.log(chalk.yellow('⚠️ Could not get statistics'));
        }
      }
      
      // Perform merge
      const xlsxPath = await merger.mergeBySource(options.source, options.separateSheets);
      
      if (xlsxPath) {
        console.log(chalk.green(`\n🎉 Success! XLSX file created: ${xlsxPath}`));
      } else {
        console.log(chalk.yellow('\n⚠️ No CSV files found to merge'));
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Interactive mode command
program
  .command('interactive')
  .alias('i')
  .description('Run in interactive mode')
  .action(async () => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    };

    try {
      console.log(chalk.cyan('\n🔄 Interactive Mode'));
      console.log(chalk.gray('Answer the following questions to configure your scraping:\n'));

      const searchTerm = await question('What would you like to search for? (e.g., restaurants, dentists): ');
      const location = await question('Where should we search? (e.g., New York, NY): ');
      
      console.log('\nWhich site(s) would you like to scrape?');
      console.log('1. Yellow Pages only (single page)');
      console.log('2. Manta only (multiple pages)');
      console.log('3. Both sites');
      
      const siteChoice = await question('\nEnter your choice (1-3): ');
      
      let pageNumber, maxPages;
      if (siteChoice === '1') {
        pageNumber = await question('Which page number would you like to scrape? (default: 1): ') || '1';
      } else if (siteChoice === '2') {
        maxPages = await question('How many pages would you like to scrape? (default: 3): ') || '3';
      } else if (siteChoice === '3') {
        pageNumber = await question('Which Yellow Pages page number? (default: 1): ') || '1';
        maxPages = await question('How many Manta pages? (default: 3): ') || '3';
      }

      rl.close();

      console.log(chalk.cyan('\n🚀 Starting scraping with your settings...'));
      console.log(chalk.gray(`Search: ${searchTerm || 'restaurants'}`));
      console.log(chalk.gray(`Location: ${location || 'New York, NY'}`));
      if (pageNumber) console.log(chalk.gray(`Yellow Pages Page: ${pageNumber}`));
      if (maxPages) console.log(chalk.gray(`Manta Max Pages: ${maxPages}`));
      console.log('');

      const results = [];

      if (siteChoice === '1' || siteChoice === '3') {
        try {
          console.log(chalk.yellow('🟡 Starting Yellow Pages...'));
          const ypScraper = new YellowPagesScraper();
          const ypCsvPath = await ypScraper.scrape({
            searchTerm: searchTerm || 'restaurants',
            location: location || 'New York, NY',
            pageNumber: parseInt(pageNumber) || 1
          });
          if (ypCsvPath) {
            results.push(`Yellow Pages: ${ypCsvPath}`);
          }
        } catch (error) {
          console.error(chalk.red(`❌ Yellow Pages error: ${error.message}`));
        }
      }

      if (siteChoice === '2' || siteChoice === '3') {
        if (siteChoice === '3') console.log(''); // Empty line
        try {
          console.log(chalk.blue('🔵 Starting Manta...'));
          const mantaScraper = new MantaScraper();
          const mantaCsvPath = await mantaScraper.scrape({
            searchTerm: searchTerm || 'restaurants',
            location: location || 'New York, NY',
            maxPages: parseInt(maxPages) || 3
          });
          if (mantaCsvPath) {
            results.push(`Manta: ${mantaCsvPath}`);
          }
        } catch (error) {
          console.error(chalk.red(`❌ Manta error: ${error.message}`));
        }
      }

      // Show results
      console.log(chalk.green('\n🎉 Scraping completed!'));
      if (results.length > 0) {
        console.log(chalk.green('\nResults exported to:'));
        results.forEach(result => {
          console.log(chalk.green(`  • ${result}`));
        });
      } else {
        console.log(chalk.yellow('⚠️ No results were exported'));
      }

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      rl.close();
      process.exit(1);
    }
  });

// Show help if no command provided
if (process.argv.length <= 2) {
  program.help();
}

program.parse(process.argv);