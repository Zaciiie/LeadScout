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

You can also run the scrapers directly:

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

Output example:
```
📋 Available city directories:

📁 YellowPages/
   └── Talkeetna AK (4 CSV files)
   └── Anchorage AK (14 CSV files)

📁 Manta/
   └── Miami FL (2 CSV files)
```

### **Example Workflows**

#### **Workflow 1: Quick City Merge**
```bash
# 1. Scrape data for a city
node index.js yellowpages -s "restaurants" -l "Talkeetna, AK" -p 1

# 2. Merge the city files
node merge-city.js Talkeetna

# 3. Check the output
# File created: output/YellowPages/Talkeetna AK/Final_Talkeetna_AK_Data.xlsx
```

#### **Workflow 2: Multiple Cities**
```bash
# Merge multiple cities quickly
node merge-city.js Talkeetna
node merge-city.js Anchorage
node merge-city.js Fairbanks
```

#### **Workflow 3: Custom Source and Output**
```bash
# Merge Manta data with custom filename
node merge-city.js city Miami --source Manta --output "Miami_Restaurants_2024.xlsx"
```

### **Error Handling**

The city merger includes comprehensive error handling:

- **City Not Found**: Shows available cities if search fails
- **No CSV Files**: Warns if directory exists but contains no CSV files
- **Empty Data**: Handles directories with CSV files containing no data
- **Permission Errors**: Clear error messages for file access issues

### **Integration with Main Scraper**

The city merger integrates seamlessly with the main scraping workflow:

```bash
# Complete workflow example
node index.js yellowpages -s "Insurance Agency" -l "Talkeetna, AK" -p 1
node merge-city.js Talkeetna
```

This creates organized, city-specific Excel files that are perfect for:
- Local business analysis
- Territory-based lead generation
- City-specific market research
- Regional sales reporting

## ⚡ Speed Optimizations

The scraper has been optimized for faster extraction while maintaining reliability and avoiding detection.

### **Speed Modes**

The scraper supports two modes in `config.js`:

```javascript
// Fast mode (default) - 60-70% faster
mode: 'fast'

// Stealth mode - more human-like, slower but safer
mode: 'stealth'
```

### **Key Optimizations Applied**

#### **1. Reduced Delays**
- **Page load**: 5000ms → 2000ms
- **Between requests**: 3000ms → 1000ms
- **Scroll delay**: 2000ms → 1000ms
- **Human delay**: 1500ms → 500ms

#### **2. Batch Processing**
- Process 5 business listings simultaneously
- Parallel processing within batches
- Better error isolation and recovery

#### **3. Optimized Navigation**
- Pre-navigation delay: 1-3s → 0.5-1.5s
- Reduced mouse movements and scrolling
- Faster element detection timeouts

#### **4. Protection Page Handling**
- Strategy wait times reduced by 50%
- Faster automatic bypass detection
- Optimized retry mechanisms

### **Performance Improvements**
- **Fast Mode**: ~60-70% faster than original
- **Stealth Mode**: Similar to original speed but with better reliability
- **Batch Processing**: Better throughput with improved error handling

### **Switching Modes**

To change speed mode:

1. Open `config.js`
2. Change `mode: 'fast'` to `mode: 'stealth'` (or vice versa)
3. Restart your scraping session

### **Trade-offs**
- **Fast Mode**: Higher speed, slightly higher detection risk
- **Stealth Mode**: Lower detection risk, moderate speed
- **Batch Processing**: Better throughput, slightly more complex error handling

## Configuration

Edit `config.js` to customize:

- Browser settings (headless mode, viewport size)
- Scraping delays
- Output directory and CSV headers
- User agents for rotation

```javascript
module.exports = {
  browser: {
    headless: true, // Set to false for debugging
    // ... other browser options
  },
  delays: {
    pageLoad: 3000,
    betweenRequests: 2000,
    // ... other delays
  },
  // ... other settings
};
```

## 📊 Output Format

### **CSV Structure**
| Column | Description | Example |
|--------|-------------|---------|
| S.no | Serial number | `1` |
| Business Name | Company name | `"Joe's Pizza"` |
| Website | Business website | `"https://joespizza.com"` |
| Address | Physical address | `"123 Main St, New York, NY"` |
| Email | Contact email | `"info@joespizza.com"` |
| Phone | Phone number | `"(555) 123-4567"` |
| Source | Scraping source | `"yellowpages"` |
| Scraped At | Timestamp | `"2024-01-15T10:30:00.000Z"` |

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
└── all_contacts_merged_2024-01-15T10-45-00.xlsx
```

### **XLSX Output Structure**
When using the merger tool, Excel files include:
- **Single Sheet Mode**: All data in one "Contacts" sheet with source file column
- **Separate Sheets Mode**: Individual sheets per source plus combined sheet
- **Formatted Columns**: Optimized widths for business names, addresses, emails
- **Professional Layout**: Headers, proper spacing, and Excel compatibility

## 📁 Project Structure

```
business-directory-scraper/
├── 📁 scrapers/           # Scraping modules
│   ├── yellowpages.js     # Yellow Pages scraper
│   └── baseScraper.js     # Base scraper class
├── 📁 utils/              # Utility modules
│   ├── csvExporter.js     # CSV export functionality
│   ├── contactExtractor.js # Contact data extraction
│   └── xlsxMerger.js      # XLSX merger functionality
├── 📁 output/             # Generated CSV and XLSX files (gitignored)
│   └── YellowPages/       # YellowPages data organized by city
│       ├── Talkeetna AK/  # City-specific CSV and Excel files
│       └── Anchorage AK/  # City-specific CSV and Excel files
├── 📄 index.js            # Main application entry
├── 📄 merge.js            # Standalone CSV to XLSX merger
├── 📄 merge-city.js       # City-specific CSV to XLSX merger
├── 📄 config.js           # Configuration settings
├── 📄 package.json        # Dependencies and scripts
├── 📄 .gitignore          # Git ignore rules
├── 📄 SPEED_OPTIMIZATIONS.md # Speed optimization details
└── 📄 README.md           # This documentation
```

## 🔧 Advanced Features

### **Hidden Email Extraction**
The tool can extract email addresses hidden behind "More Info" sections that typically open email clients:
- Detects mailto links in expandable sections
- Extracts emails from onclick attributes
- Handles dynamic content loading

### **Duplicate Prevention**
- Unique business identification using multiple factors
- Cross-platform duplicate detection
- Memory-efficient processing

### **Error Recovery**
- Automatic retry mechanisms
- Graceful handling of network issues
- Detailed error logging

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**
- Follow existing code style and patterns
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed

## ⚖️ Legal Notice

### **Important Disclaimers**

⚠️ **Responsible Usage Required**
- This tool is for educational and legitimate business purposes only
- Users must comply with website Terms of Service
- Respect robots.txt and rate limiting
- Obtain proper permissions when required

⚠️ **Data Privacy**
- Handle scraped data responsibly
- Comply with GDPR, CCPA, and local privacy laws
- Do not store or share personal information inappropriately
- Implement proper data security measures

⚠️ **Rate Limiting**
- Built-in delays prevent server overload
- Do not modify timing configurations aggressively
- Monitor your usage to avoid IP blocking
- Use proxies if scraping at scale

### **Liability**
The developer of this tool are not responsible for:
- Misuse of the software
- Violations of website terms of service
- Legal issues arising from improper usage
- Data privacy violations

**Use this tool responsibly and ethically.**

## 📞 Support

For questions, issues, or contributions:
- 📧 Create an issue in the repository
- 📖 Check the documentation
- 🔍 Review existing issues and solutions

---

**Made with ❤️ for the business research community**

*Last updated: July 2025*
