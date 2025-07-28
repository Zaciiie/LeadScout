# CSV to XLSX Merger Usage Guide

## Overview
The merger tool allows you to combine all your CSV files into a single Excel (XLSX) file for easier analysis and sharing.

## Installation
First, install the required dependencies:
```bash
npm install xlsx csv-parser
```

## Usage Methods

### Method 1: Using the main index.js command
```bash
# Basic merge - combines all CSV files
node index.js merge

# Merge with statistics
node index.js merge --stats

# Merge only Yellow Pages files
node index.js merge -s yellowpages

# Merge only Manta files
node index.js merge -s manta

# Create separate sheets for each source
node index.js merge --separate-sheets

# Custom output filename
node index.js merge -o my_contacts.xlsx
```

### Method 2: Using the standalone merge.js script
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

### Method 3: Using npm scripts
```bash
# Basic merge
npm run merge

# Merge with statistics
npm run merge:stats
```

## Command Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--source` | `-s` | Filter by source (yellowpages, manta, all) | `all` |
| `--output` | `-o` | Output XLSX filename | `merged_contacts.xlsx` |
| `--separate-sheets` | | Create separate sheets for each source | `false` |
| `--stats` | | Show statistics before merging | `false` |

## Output Formats

### Single Sheet (Default)
- All contacts in one sheet named "Contacts"
- Includes a "sourceFile" column showing which CSV file each record came from

### Separate Sheets Mode
- One sheet per source (e.g., "YellowPages", "Manta")
- Additional "All_Combined" sheet with all records
- Each sheet properly formatted with appropriate column widths

## File Naming
The merger automatically detects source types from filenames:
- Files containing "yellowpages" → YellowPages sheet
- Files containing "manta" → Manta sheet
- Other files → Named by first part of filename

## Statistics Output
When using `--stats`, you'll see:
- Total number of CSV files found
- Total number of records across all files
- Breakdown by source (files and records per source)
- Individual file details

## Examples

### Basic Usage
```bash
# Merge all CSV files into merged_contacts.xlsx
node merge.js
```

### Advanced Usage
```bash
# Merge only Yellow Pages files with separate sheets and statistics
node index.js merge -s yellowpages --separate-sheets --stats -o yellowpages_analysis.xlsx
```

### Check What You Have
```bash
# See what CSV files are available before merging
node merge.js stats
```

## Output Location
All XLSX files are created in the same `./output` directory as your CSV files.

## Troubleshooting

### No CSV files found
- Make sure you have CSV files in the `./output` directory
- Check that the files have `.csv` extension
- Verify the source filter matches your file names

### Memory issues with large files
- The merger processes files in batches to handle large datasets
- If you encounter memory issues, try merging smaller subsets using the source filter

### Excel compatibility
- Sheet names are automatically sanitized for Excel compatibility
- Column widths are optimized based on content type
- All standard CSV data types are preserved