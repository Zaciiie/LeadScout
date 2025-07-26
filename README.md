# 🔍 Business Directory Scraper

A powerful Node.js web scraping tool designed to extract business contact information from popular business directories. This tool helps gather structured business data including contact details, addresses, and websites for lead generation and market research purposes.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Output Format](#output-format)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Legal Notice](#legal-notice)

## ✨ Features

### 🎯 **Multi-Platform Support**
- **Yellow Pages**: Single-page targeted scraping
- **Manta**: Multi-page comprehensive scraping
- **Dual Mode**: Scrape both platforms simultaneously

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
- Serial numbering and organized data structure
- Timestamped output files
- Append mode for continuous data collection

## 🛠 Tech Stack

### **Core Technologies**
- **Node.js** - Runtime environment
- **Puppeteer** - Headless browser automation
- **JavaScript ES6+** - Modern JavaScript features

### **Key Libraries**
- **csv-writer** - CSV file generation
- **fs-extra** - Enhanced file system operations
- **chalk** - Colorful terminal output
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

3. **Verify installation**
   ```bash
   node index.js --help
   ```

## 🚀 Usage

### **Interactive Mode** (Recommended for beginners)

Start the interactive interface:
```bash
node index.js
```

Follow the prompts to:
1. Choose scraping platform(s)
2. Enter search terms and location
3. Configure pagination settings
4. Start the scraping process

### **Command Line Mode** (For automation)

#### **Yellow Pages Scraping**
```bash
# Single page scraping
node index.js yellowpages --search "restaurants" --location "New York, NY" --page 1

# Different search terms
node index.js yellowpages --search "Insurance Agency" --location "Anchorage, AK" --page 2
```

#### **Manta Scraping**
```bash
# Multi-page scraping
node index.js manta --search "restaurants" --location "New York, NY" --pages 3

# Extended scraping
node index.js manta --search "law firms" --location "Los Angeles, CA" --pages 5
```

#### **Combined Scraping**
```bash
# Scrape both platforms
node index.js both --search "dentists" --location "Chicago, IL" --page 1 --pages 3
```

### **Command Line Options**

| Option | Description | Example |
|--------|-------------|---------|
| `--search` | Business type or keyword | `"restaurants"` |
| `--location` | City, state or address | `"New York, NY"` |
| `--page` | Yellow Pages page number | `1` |
| `--pages` | Manta max pages to scrape | `3` |
| `--help` | Show help information | - |

### Direct Script Usage

You can also run the scrapers directly:

```bash
# Yellow Pages
node scrapers/yellowpages.js

# Manta
node scrapers/manta.js
```

### Programmatic Usage

```javascript
const YellowPagesScraper = require('./scrapers/yellowpages');
const MantaScraper = require('./scrapers/manta');

// Yellow Pages
const ypScraper = new YellowPagesScraper();
ypScraper.scrape({
  searchTerm: 'restaurants',
  location: 'New York, NY',
  maxPages: 5
}).then(csvPath => {
  console.log('Results saved to:', csvPath);
});

// Manta
const mantaScraper = new MantaScraper();
mantaScraper.scrape({
  searchTerm: 'dentists',
  location: 'Los Angeles, CA',
  maxPages: 3
}).then(csvPath => {
  console.log('Results saved to:', csvPath);
});
```

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

### **File Naming**
```
output/
├── yellowpages_contacts_2024-01-15T10-30-00.csv
├── manta_contacts_2024-01-15T10-35-00.csv
└── combined_contacts_2024-01-15T10-40-00.csv
```

## 📁 Project Structure

```
business-directory-scraper/
├── 📁 scrapers/           # Scraping modules
│   ├── yellowpages.js     # Yellow Pages scraper
│   ├── manta.js           # Manta scraper
│   └── baseScraper.js     # Base scraper class
├── 📁 utils/              # Utility modules
│   ├── csvExporter.js     # CSV export functionality
│   ├── contactExtractor.js # Contact data extraction
│   └── browserManager.js  # Browser management
├── 📁 output/             # Generated CSV files (gitignored)
├── 📄 index.js            # Main application entry
├── 📄 config.js           # Configuration settings
├── 📄 package.json        # Dependencies and scripts
├── 📄 .gitignore          # Git ignore rules
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
