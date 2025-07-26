const ContactExtractor = require('./utils/contactExtractor');
const CSVExporter = require('./utils/csvExporter');

// Test the contact extractor
console.log('🧪 Testing Contact Extractor...');

const extractor = new ContactExtractor();

// Test data
const testText = `
John Smith - Manager
Phone: (555) 123-4567
Email: john.smith@example.com
Business: Smith's Restaurant
Address: 123 Main St, New York, NY

Contact: Mary Johnson
Phone: 555-987-6543
Email: mary@restaurant.com
`;

console.log('📝 Test text:', testText);
console.log('');

// Test email extraction
const emails = extractor.extractEmails(testText);
console.log('📧 Extracted emails:', emails);

// Test phone extraction
const phones = extractor.extractPhones(testText);
console.log('📞 Extracted phones:', phones);

// Test name extraction
const names = extractor.extractNames(testText);
console.log('👤 Extracted names:', names);

// Test full contact extraction
const contacts = extractor.extractAllContacts(testText, 'test');
console.log('');
console.log('👥 Extracted contacts:');
console.log(JSON.stringify(contacts, null, 2));

// Test CSV export
console.log('');
console.log('💾 Testing CSV Export...');

const csvExporter = new CSVExporter();

csvExporter.exportContacts(contacts, 'test').then(csvPath => {
  if (csvPath) {
    console.log('✅ CSV export test successful!');
    console.log('📄 File created:', csvPath);
  } else {
    console.log('❌ CSV export test failed');
  }
}).catch(error => {
  console.error('❌ CSV export error:', error);
});

console.log('');
console.log('🎉 Basic tests completed!');
console.log('');
console.log('To run the full scraper, use:');
console.log('  node index.js interactive');
console.log('  node index.js yellowpages -s "restaurants" -l "New York, NY" -p 2');
console.log('  node index.js manta -s "dentists" -l "Los Angeles, CA" -p 2');
console.log('  node index.js both -s "lawyers" -l "Chicago, IL" -p 1');