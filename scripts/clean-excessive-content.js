const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const results = [];

// Read CSV
fs.createReadStream('cleaned_providers.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Clean bio field - remove excessive emojis and repetitive content
    if (row.bio) {
      let bio = row.bio;
      
      // Remove excessive emoji repetition (more than 5 of the same emoji in a row)
      bio = bio.replace(/(.)\1{5,}/g, '');
      
      // Remove repetitive sentences (same sentence repeated 3+ times)
      const sentences = bio.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
      const uniqueSentences = [];
      let lastSentence = '';
      let repeatCount = 0;
      
      sentences.forEach(sentence => {
        if (sentence === lastSentence) {
          repeatCount++;
          if (repeatCount < 2) { // Allow max 2 repetitions
            uniqueSentences.push(sentence);
          }
        } else {
          repeatCount = 0;
          lastSentence = sentence;
          uniqueSentences.push(sentence);
        }
      });
      
      bio = uniqueSentences.join('. ');
      
      // Truncate if still too long (max 1000 chars)
      if (bio.length > 1000) {
        bio = bio.substring(0, 997) + '...';
      }
      
      row.bio = bio.trim();
    }
    
    results.push(row);
  })
  .on('end', () => {
    console.log(`Processed ${results.length} providers`);
    
    // Get headers from first row
    const headers = Object.keys(results[0]).map(key => ({ id: key, title: key }));
    
    // Write cleaned CSV
    const csvWriter = createObjectCsvWriter({
      path: 'cleaned_providers.csv',
      header: headers
    });
    
    csvWriter.writeRecords(results)
      .then(() => {
        console.log('✅ Cleaned excessive content from provider bios');
        console.log('   - Removed excessive emoji repetitions');
        console.log('   - Removed repetitive sentences');
        console.log('   - Truncated overly long bios');
      });
  });
