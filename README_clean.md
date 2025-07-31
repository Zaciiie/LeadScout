# 🔍 Yellow Pages Business Scraper

A powerful Node.js web scraping tool designed to extract business contact information from Yellow Pages. This tool helps gather structured business data including contact details, addresses, and websites for lead generation and market research purposes.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install
npm install xlsx csv-parser

# 2. Scrape Yellow Pages
node index.js yellowpages --search "restaurants" --location "Talkeetna, AK" --pages 1

# 3. Merge city-specific CSV files to Excel
node merge-city.js Talkeetna

# 4. Check your output folder for results!
# File created: output/YellowPages/Talkeetna AK/Final_Talkeetna_AK_Data.xlsx
```

### Alternative: Global Merge
```bash
# Merge all CSV files across all cities
node index.js merge --stats --separate-sheets
```

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [CSV to XLSX Merger](#csv-to-xlsx-merger)
- [City-Specific CSV Merger](#city-specific-csv-merger)
- [Speed Optimizations](#speed-optimizations)
- [Configuration](#configuration)
- [Output Format](#output-format)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Legal Notice](#legal-notice)

## ✨ Features

### 🎯 **Yellow Pages Support**
- **Single-page targeted scraping**
- **Multi-page scraping with page ranges**
- **Comprehensive business data extraction**

### 📊 **Smart Data Extraction**
- Business names and contact information
- Phone numbers and email addresses
- Physical addresses and websites
- Hidden email extraction from "More Info" sections
- Automatic duplicate detection and removal

### 🚀 **Advanced Capabilities**
- **Interactive Mode**: User-friendly command-line interface
- **Command Line Mode**: Automated scripting support
- **Pagination Support**: Handle multiple pages of results
- **Rate Limiting**: Respectful scraping with built-in delays
- **Error Handling**: Robust error recovery and logging

### 📈 **Export Options**
- CSV format with customizable columns
- XLSX (Excel) merger for combining multiple CSV files
- Serial numbering and organized data structure
- Timestamped output files
- Append mode for continuous data collection
- Separate sheets for different sources in Excel files

## 🛠 Tech Stack

### **Core Technologies**
- **Node.js** - Runtime environment
- **Puppeteer** - Headless browser automation
- **JavaScript ES6+** - Modern JavaScript features

### **Key Libraries**
- **csv-writer** - CSV file generation
- **xlsx** - Excel file creation and manipulation
- **csv-parser** - CSV file reading and parsing
- **fs-extra** - Enhanced file system operations
- **chalk** - Colorful terminal output
- **commander** - Command-line interface framework
- **readline** - Interactive command-line interface

### **Browser Automation**
- **Chromium** - Headless browser engine
- **User-Agent Rotation** - Anti-detection measures
- **Smart Delays** - Human-like interaction patterns

## 📦 Installation

### **Prerequisites**
- Node.js (v14 or higher)
- npm or yarn package manager
- Stable internet connection

### **Setup Steps**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd business-directory-scraper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install additional dependencies for XLSX merger**
   ```bash
   npm install xlsx csv-parser
   ```

4. **Verify installation**
   ```bash
   node index.js --help
   ```

## 🚀 Usage

### **Interactive Mode** (Recommended for beginners)

Start the interactive interface:
```bash
node index.js interactive
```

Follow the prompts to:
1. Enter search terms and location
2. Configure page settings
3. Start the scraping process

### **Command Line Mode** (For automation)

#### **Yellow Pages Scraping**
```bash
# Single page scraping
node index.js yellowpages --search "restaurants" --location "New York, NY" --pages 1

# Multiple pages scraping
node index.js yellowpages --search "restaurants" --location "New York, NY" --pages "1,2,3,4,5"

# Different search terms
node index.js yellowpages --search "Insurance Agency" --location "Anchorage, AK" --pages 2
```

#### **Merge CSV to Excel**
```bash
# Merge all CSV files into Excel
node index.js merge

# Merge with statistics and separate sheets
node index.js merge --stats --separate-sheets
```

### **Command Line Options**

#### **Scraping Commands**
| Option | Description | Example |
|--------|-------------|---------|
| `--search` | Business type or keyword | `"restaurants"` |
| `--location` | City, state or address | `"New York, NY"` |
| `--pages` | Page number(s) to scrape | `"1,2,3"` or `"5"` |
| `--help` | Show help information | - |

#### **Merge Commands**
| Option | Description | Example |
|--------|-------------|---------|
| `--source` | Filter by source (yellowpages or all) | `yellowpages` |
| `--output` | Output XLSX filename | `my_contacts.xlsx` |
| `--separate-sheets` | Create separate sheets for each source | - |
| `--stats` | Show statistics before merging | - |

### Direct Script Usage

You can also run the scraper directly:

```bash
# Yellow Pages
node scrapers/yellowpages.js
```

### Programmatic Usage

```javascript
const YellowPagesScraper = require('./scrapers/yellowpages');

// Yellow Pages
const ypScraper = new YellowPagesScraper();
ypScraper.scrape({
  searchTerm: 'restaurants',
  location: 'New York, NY',
  pageNumber: 1
}).then(csvPath => {
  console.log('Results saved to:', csvPath);
});
```

## 📊 CSV to XLSX Merger

The scraper includes a powerful merger tool that combines all your CSV files into professional Excel (XLSX) format for easier analysis and sharing.

### **Installation Requirements**

Make sure you have the required dependencies:
```bash
npm install xlsx csv-parser
```

### **Usage Methods**

#### **Method 1: Using Main Command**
```bash
# Basic merge - combines all CSV files
node index.js merge

# Merge with statistics
node index.js merge --stats

# Merge only Yellow Pages files
node index.js merge -s yellowpages

# Create separate sheets for each source
node index.js merge --separate-sheets

# Custom output filename
node index.js merge -o my_contacts.xlsx
```

#### **Method 2: Using Standalone Script**
```bash
# Basic merge
node merge.js

# Show statistics and merge
node merge.js --stats

# Merge specific source
node merge.js -s yellowpages

# Create separate sheets
node merge.js --separate-sheets

# Custom filename
node merge.js -o custom_name.xlsx

# Show statistics only (no merge)
node merge.js stats
```

#### **Method 3: Using NPM Scripts**
```bash
# Basic merge
npm run merge

# Merge with statistics
npm run merge:stats
```

### **Command Options**

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--source` | `-s` | Filter by source (yellowpages or all) | `all` |
| `--output` | `-o` | Output XLSX filename | `merged_contacts.xlsx` |
| `--separate-sheets` | | Create separate sheets for each source | `false` |
| `--stats` | | Show statistics before merging | `false` |

### **Output Formats**

#### **Single Sheet (Default)**
- All contacts in one sheet named "Contacts"
- Includes a "sourceFile" column showing which CSV file each record came from

#### **Separate Sheets Mode**
- One sheet per source (e.g., "YellowPages")
- Additional "All_Combined" sheet with all records
- Each sheet properly formatted with appropriate column widths

### **File Naming**
The merger automatically detects source types from filenames:
- Files containing "yellowpages" → YellowPages sheet
- Other files → Named by first part of filename

### **Statistics Output**
When using `--stats`, you'll see:
- Total number of CSV files found
- Total number of records across all files
- Breakdown by source (files and records per source)
- Individual file details

### **Example Workflow**
```bash
# 1. Scrape data
node index.js yellowpages -s "Insurance Agency" -l "Anchorage, AK" -p 1

# 2. Check what you have
node merge.js stats

# 3. Merge into Excel
node merge.js --stats --separate-sheets
```

## 🏙️ City-Specific CSV Merger

The scraper includes a specialized city-specific merger tool that allows you to merge CSV files from individual city directories. This is perfect for organizing data by location and creating city-specific Excel reports.

### **Installation Requirements**

Make sure you have the required dependencies:
```bash
npm install xlsx csv-parser fs-extra chalk commander
```

### **Quick Usage**

The simplest way to merge files for any city:
```bash
# Merge files for any city (automatically finds the folder)
node merge-city.js Talkeetna
node merge-city.js Anchorage
node merge-city.js "New York"
```

### **Usage Methods**

#### **Method 1: Direct City Name (Recommended)**
```bash
# Simple city name - automatically searches YellowPages directories
node merge-city.js Talkeetna
node merge-city.js Anchorage
node merge-city.js Miami
```

#### **Method 2: Using the 'city' Command**
```bash
# More explicit command with options
node merge-city.js city Talkeetna
node merge-city.js city Anchorage --source YellowPages
node merge-city.js city Miami --source YellowPages --output "Miami_Custom.xlsx"
```

#### **Method 3: Manual Directory Path**
```bash
# Specify exact directory path
node merge-city.js merge --city "output/YellowPages/Talkeetna AK"
node merge-city.js merge --city "output/YellowPages/Anchorage AK"
```

### **Command Options**

#### **Direct City Command Options**
| Option | Description | Default |
|--------|-------------|---------|
| `cityName` | City name to search for | Required |

#### **'city' Command Options**
| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `cityName` | | City name to search for | Required |
| `--source` | `-s` | Source directory (YellowPages) | `YellowPages` |
| `--output` | `-o` | Custom output filename | Auto-generated |

#### **'merge' Command Options**
| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--city` | `-c` | Full path to city directory | Required |
| `--output` | `-o` | Custom output filename | Auto-generated |
| `--pattern` | `-p` | Filter pattern (yellowpages or all) | `yellowpages` |

### **Output File Naming**

The city merger automatically generates filenames in the format:
```
Final_CityName_StateCode_Data.xlsx
```

**Examples:**
- `Final_Talkeetna_AK_Data.xlsx`
- `Final_Anchorage_AK_Data.xlsx`
- `Final_New_York_NY_Data.xlsx`

### **Directory Structure**

The merger works with the following directory structure:
```
output/
└── YellowPages/
    ├── Talkeetna AK/
    │   ├── yellowpages_Talkeetna_AK_contacts_Page1.csv
    │   ├── yellowpages_Talkeetna_AK_contacts_Page2.csv
    │   └── Final_Talkeetna_AK_Data.xlsx (generated)
    └── Anchorage AK/
        ├── yellowpages_Anchorage_AK_contacts_Page1.csv
        ├── yellowpages_Anchorage_AK_contacts_Page2.csv
        └── Final_Anchorage_AK_Data.xlsx (generated)
```

### **Features**

#### **Smart City Detection**
- Automatically finds city directories by partial name matching
- Case-insensitive search (e.g., "talkeetna" finds "Talkeetna AK")
- Supports multi-word city names

#### **Automatic File Filtering**
- Filters CSV files by source type (yellowpages)
- Excludes already merged Excel files
- Handles mixed file types in directories

#### **Professional Excel Output**
- Single "Contacts" sheet with all merged data
- Continuous serial numbering (S.no column)
- Source file tracking for each record
- Optimized column widths and formatting
- Saves directly in the city directory

### **Utility Commands**

#### **List Available Cities**
```bash
# Show all available city directories
node merge-city.js list
```

## ⚡ Speed Optimizations

The scraper includes several performance optimizations for faster data extraction:

### **Browser Optimizations**
- Disabled images and CSS loading
- Reduced network timeouts
- Optimized viewport settings
- Smart resource blocking

### **Scraping Optimizations**
- Parallel processing where possible
- Intelligent wait strategies
- Optimized selector strategies
- Memory management

### **Rate Limiting**
- Built-in delays between requests
- Respectful scraping practices
- Configurable timing settings

For detailed optimization settings, see [SPEED_OPTIMIZATIONS.md](SPEED_OPTIMIZATIONS.md)

## ⚙️ Configuration

### **Browser Settings**
The scraper uses optimized browser settings defined in `config.js`:

```javascript
module.exports = {
  browser: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },
  delays: {
    pageLoad: 3000,
    betweenActions: 1000,
    betweenPages: 2000
  }
};
```

### **Customization**
You can modify the configuration by editing `config.js` to adjust:
- Browser launch options
- Timing delays
- User agent strings
- Viewport settings

## 📄 Output Format

### **CSV Structure**
Each CSV file contains the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| `S.no` | Serial number | `1` |
| `Name` | Business name | `"Joe's Pizza"` |
| `Phone` | Phone number | `"(555) 123-4567"` |
| `Address` | Full address | `"123 Main St, New York, NY 10001"` |
| `Website` | Website URL | `"https://joespizza.com"` |
| `Email` | Email address | `"info@joespizza.com"` |

### **File Naming Convention**
CSV files are automatically named using the pattern:
```
yellowpages_{location}_{searchTerm}_contacts_Page{pageNumber}_{timestamp}.csv
```

**Example:**
```
yellowpages_NewYork_NY_restaurants_contacts_Page1_20231201_143022.csv
```

### **Directory Structure**
```
output/
└── YellowPages/
    └── {City} {State}/
        ├── yellowpages_{city}_{state}_contacts_Page1.csv
        ├── yellowpages_{city}_{state}_contacts_Page2.csv
        └── Final_{City}_{State}_Data.xlsx
```

## 📁 Project Structure

```
business-directory-scraper/
├── scrapers/
│   ├── baseScraper.js          # Base scraper class
│   └── yellowpages.js          # Yellow Pages scraper
├── utils/
│   ├── csvExporter.js          # CSV file operations
│   ├── contactExtractor.js     # Contact data extraction
│   └── xlsxMerger.js          # Excel merger utility
├── output/                     # Generated CSV and Excel files
├── config.js                   # Configuration settings
├── index.js                    # Main CLI application
├── merge.js                    # Standalone merger script
├── merge-city.js              # City-specific merger
├── package.json               # Dependencies and scripts
├── README.md                  # This file
├── MERGE_USAGE.md            # Detailed merger documentation
└── SPEED_OPTIMIZATIONS.md    # Performance optimization guide
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### **Development Guidelines**
- Follow existing code style
- Add comments for complex logic
- Test with multiple search terms and locations
- Ensure error handling is robust
- Update documentation as needed

## ⚖️ Legal Notice

### **Important Disclaimer**
This tool is designed for educational and research purposes. Users are responsible for:

- **Compliance with Terms of Service**: Always review and comply with the terms of service of websites you scrape
- **Rate Limiting**: Use respectful scraping practices with appropriate delays
- **Data Usage**: Ensure proper use of extracted data in accordance with applicable laws
- **Privacy**: Respect privacy laws and regulations in your jurisdiction

### **Ethical Scraping Practices**
- Use reasonable delays between requests
- Don't overload servers with excessive requests
- Respect robots.txt files
- Use scraped data responsibly
- Consider reaching out to websites for API access when available

### **Liability**
The authors and contributors of this tool are not responsible for any misuse or legal issues arising from its use. Users assume all responsibility for their scraping activities.

---

## 📞 Support

If you encounter issues or have questions:

1. **Check the documentation** in this README
2. **Review the configuration** in `config.js`
3. **Check for common issues** in the troubleshooting section
4. **Open an issue** on the repository with detailed information

---

**Happy Scraping! 🚀**