#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const XLSXMerger = require('./utils/xlsxMerger');

const program = new Command();

// ASCII Art Banner
const banner = `
╔══════════════════════════════════════════════════════════════╗
║                    CSV to XLSX Merger                       ║
║              Merge all CSV files into Excel                 ║
╚══════════════════════════════════════════════════════════════╝
`;

console.log(chalk.green(banner));

program
  .name('csv-merger')
  .description('Merge CSV files into XLSX format')
  .version('1.0.0');

// Main merge command
program
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

// Stats only command
program
  .command('stats')
  .description('Show statistics about CSV files without merging')
  .action(async () => {
    console.log(chalk.cyan('📈 Getting CSV file statistics...'));
    
    const merger = new XLSXMerger();
    
    try {
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
      } else {
        console.log(chalk.yellow('⚠️ Could not get statistics'));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Show help if no arguments provided
if (process.argv.length <= 2) {
  console.log(chalk.cyan('Usage Examples:'));
  console.log(chalk.gray('  node merge.js                           # Merge all CSV files'));
  console.log(chalk.gray('  node merge.js --stats                   # Show stats and merge'));
  console.log(chalk.gray('  node merge.js -s yellowpages            # Merge only Yellow Pages files'));
  console.log(chalk.gray('  node merge.js --separate-sheets         # Create separate sheets per source'));
  console.log(chalk.gray('  node merge.js -o my_contacts.xlsx       # Custom output filename'));
  console.log(chalk.gray('  node merge.js stats                     # Show stats only'));
  console.log('');
}

program.parse(process.argv);