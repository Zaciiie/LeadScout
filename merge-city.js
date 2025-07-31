#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const XLSXMerger = require('./utils/xlsxMerger');

const program = new Command();

// ASCII Art Banner
const banner = `
╔══════════════════════════════════════════════════════════════╗
║                    City-Specific CSV Merger                 ║
║              Merge CSV files by city directory              ║
╚══════════════════════════════════════════════════════════════╝
`;

console.log(chalk.cyan(banner));

program
  .name('city-merger')
  .description('Merge CSV files from specific city directories')
  .version('1.0.0');

// City merge command
program
  .command('merge')
  .description('Merge CSV files from a specific city directory')
  .option('-c, --city <cityPath>', 'Path to city directory (e.g., "output/YellowPages/Talkeetna AK")')
  .option('-o, --output <filename>', 'Output XLSX filename (optional - will auto-generate if not provided)')
  .option('-p, --pattern <pattern>', 'Filter pattern (yellowpages, manta, or all)', 'yellowpages')
  .action(async (options) => {
    if (!options.city) {
      console.error(chalk.red('❌ Please specify a city directory path using --city option'));
      console.log(chalk.yellow('Example: node merge-city.js merge --city "output/YellowPages/Talkeetna AK"'));
      process.exit(1);
    }

    // Resolve the full path
    const cityPath = path.resolve(options.city);
    
    // Check if directory exists
    if (!fs.existsSync(cityPath)) {
      console.error(chalk.red(`❌ Directory not found: ${cityPath}`));
      process.exit(1);
    }

    console.log(chalk.green('🏙️ Starting city-specific CSV merge...'));
    console.log(chalk.gray(`City directory: ${cityPath}`));
    console.log(chalk.gray(`Pattern filter: ${options.pattern}`));
    if (options.output) {
      console.log(chalk.gray(`Output filename: ${options.output}`));
    }
    console.log('');

    const merger = new XLSXMerger();
    
    try {
      const outputPath = await merger.mergeCityFiles(cityPath, {
        outputFileName: options.output,
        pattern: options.pattern
      });

      if (outputPath) {
        console.log(chalk.green('\n🎉 City merge completed successfully!'));
        console.log(chalk.cyan(`📁 Excel file created: ${outputPath}`));
      } else {
        console.log(chalk.yellow('⚠️ No files were merged (no CSV files found or no data)'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error during city merge:'), error.message);
      process.exit(1);
    }
  });

// Dynamic city merge command - finds city folder automatically
program
  .command('city')
  .description('Merge CSV files for any city (automatically finds the folder)')
  .argument('<cityName>', 'City name to search for (e.g., "Talkeetna", "Anchorage")')
  .option('-o, --output <filename>', 'Output XLSX filename (optional)')
  .option('-s, --source <source>', 'Source directory (YellowPages or Manta)', 'YellowPages')
  .action(async (cityName, options) => {
    console.log(chalk.green(`🔍 Searching for ${cityName} in ${options.source} directories...`));
    
    const outputDir = path.resolve('output');
    const sourceDir = path.join(outputDir, options.source);
    
    if (!fs.existsSync(sourceDir)) {
      console.error(chalk.red(`❌ Source directory not found: ${sourceDir}`));
      process.exit(1);
    }

    try {
      // Find city directory that contains the city name
      const cityDirs = await fs.readdir(sourceDir, { withFileTypes: true });
      let foundCityPath = null;
      let foundCityName = null;

      for (const dir of cityDirs) {
        if (dir.isDirectory()) {
          const dirName = dir.name.toLowerCase();
          const searchName = cityName.toLowerCase();
          
          // Check if directory name contains the city name
          if (dirName.includes(searchName)) {
            foundCityPath = path.join(sourceDir, dir.name);
            foundCityName = dir.name;
            break;
          }
        }
      }

      if (!foundCityPath) {
        console.error(chalk.red(`❌ No directory found containing "${cityName}" in ${options.source}`));
        console.log(chalk.yellow('Available directories:'));
        
        for (const dir of cityDirs) {
          if (dir.isDirectory()) {
            console.log(chalk.gray(`  • ${dir.name}`));
          }
        }
        process.exit(1);
      }

      console.log(chalk.green(`✅ Found city directory: ${foundCityName}`));
      console.log(chalk.gray(`📁 Path: ${foundCityPath}`));
      console.log('');

      const merger = new XLSXMerger();
      
      const outputPath = await merger.mergeCityFiles(foundCityPath, {
        outputFileName: options.output,
        pattern: options.source.toLowerCase()
      });

      if (outputPath) {
        console.log(chalk.green(`\n🎉 ${foundCityName} merge completed successfully!`));
        console.log(chalk.cyan(`📁 Excel file created: ${outputPath}`));
      } else {
        console.log(chalk.yellow('⚠️ No files were merged (no CSV files found or no data)'));
      }

    } catch (error) {
      console.error(chalk.red(`❌ Error during ${cityName} merge:`), error.message);
      process.exit(1);
    }
  });

// List available cities command
program
  .command('list')
  .description('List available city directories')
  .action(async () => {
    console.log(chalk.green('📋 Available city directories:'));
    console.log('');

    const outputDir = path.resolve('output');
    
    if (!fs.existsSync(outputDir)) {
      console.log(chalk.yellow('⚠️ Output directory not found'));
      return;
    }

    try {
      const sources = await fs.readdir(outputDir, { withFileTypes: true });
      
      for (const source of sources) {
        if (source.isDirectory()) {
          const sourcePath = path.join(outputDir, source.name);
          console.log(chalk.cyan(`📁 ${source.name}/`));
          
          const cities = await fs.readdir(sourcePath, { withFileTypes: true });
          for (const city of cities) {
            if (city.isDirectory()) {
              const cityPath = path.join(sourcePath, city.name);
              const csvFiles = await fs.readdir(cityPath);
              const csvCount = csvFiles.filter(file => file.endsWith('.csv')).length;
              
              console.log(chalk.gray(`   └── ${city.name} (${csvCount} CSV files)`));
            }
          }
          console.log('');
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Error listing directories:'), error.message);
    }
  });

// Add a default command that works like: node merge-city.js CityName
program
  .argument('[cityName]', 'City name to merge (optional - if provided, will merge that city)')
  .action(async (cityName) => {
    if (cityName) {
      // If a city name is provided as argument, merge that city
      console.log(chalk.green(`🔍 Searching for ${cityName} in YellowPages directories...`));
      
      const outputDir = path.resolve('output');
      const sourceDir = path.join(outputDir, 'YellowPages');
      
      if (!fs.existsSync(sourceDir)) {
        console.error(chalk.red(`❌ YellowPages directory not found: ${sourceDir}`));
        process.exit(1);
      }

      try {
        // Find city directory that contains the city name
        const cityDirs = await fs.readdir(sourceDir, { withFileTypes: true });
        let foundCityPath = null;
        let foundCityName = null;

        for (const dir of cityDirs) {
          if (dir.isDirectory()) {
            const dirName = dir.name.toLowerCase();
            const searchName = cityName.toLowerCase();
            
            // Check if directory name contains the city name
            if (dirName.includes(searchName)) {
              foundCityPath = path.join(sourceDir, dir.name);
              foundCityName = dir.name;
              break;
            }
          }
        }

        if (!foundCityPath) {
          console.error(chalk.red(`❌ No directory found containing "${cityName}" in YellowPages`));
          console.log(chalk.yellow('Available directories:'));
          
          for (const dir of cityDirs) {
            if (dir.isDirectory()) {
              console.log(chalk.gray(`  • ${dir.name}`));
            }
          }
          process.exit(1);
        }

        console.log(chalk.green(`✅ Found city directory: ${foundCityName}`));
        console.log(chalk.gray(`📁 Path: ${foundCityPath}`));
        console.log('');

        const merger = new XLSXMerger();
        
        const outputPath = await merger.mergeCityFiles(foundCityPath, {
          pattern: 'yellowpages'
        });

        if (outputPath) {
          console.log(chalk.green(`\n🎉 ${foundCityName} merge completed successfully!`));
          console.log(chalk.cyan(`📁 Excel file created: ${outputPath}`));
        } else {
          console.log(chalk.yellow('⚠️ No files were merged (no CSV files found or no data)'));
        }

      } catch (error) {
        console.error(chalk.red(`❌ Error during ${cityName} merge:`), error.message);
        process.exit(1);
      }
    } else {
      // No city name provided, show help
      program.help();
    }
  });

program.parse();