const fs = require('fs');

function fixInvalidStates() {
  console.log('🔧 Fixing invalid state codes...');
  
  const data = JSON.parse(fs.readFileSync('./data/providers.json', 'utf8'));
  
  // Create backup
  fs.writeFileSync('./data/providers-before-state-fix.json', JSON.stringify(data, null, 2));
  
  let fixedCount = 0;
  
  data.forEach(provider => {
    const originalStates = [...provider.coverage.states];
    const fixedStates = [];
    
    provider.coverage.states.forEach(state => {
      if (state === 'ME, NH, VT, MA, CT, RI, AND NY') {
        // Split into individual states
        fixedStates.push('ME', 'NH', 'VT', 'MA', 'CT', 'RI', 'NY');
        fixedCount++;
        console.log(`  Fixed: "${state}" → ME, NH, VT, MA, CT, RI, NY`);
      } else if (state === 'CONNECTICUT / NEW YORK / NEW JERSEY / DELAWARE / MARYLAND / MASSACHUSETTS / PA') {
        // Split into individual states
        fixedStates.push('CT', 'NY', 'NJ', 'DE', 'MD', 'MA', 'PA');
        fixedCount++;
        console.log(`  Fixed: "${state}" → CT, NY, NJ, DE, MD, MA, PA`);
      } else if (state === 'MARYLAND, VIRGINA, DC') {
        // Split into individual states (note: VIRGINA is misspelled)
        fixedStates.push('MD', 'VA', 'DC');
        fixedCount++;
        console.log(`  Fixed: "${state}" → MD, VA, DC`);
      } else {
        fixedStates.push(state);
      }
    });
    
    // Remove duplicates and update
    provider.coverage.states = [...new Set(fixedStates)];
    
    if (JSON.stringify(originalStates) !== JSON.stringify(provider.coverage.states)) {
      console.log(`  Provider: ${provider.name} - States updated`);
    }
  });
  
  // Reassign sequential IDs
  data.forEach((provider, index) => {
    provider.id = (index + 1).toString();
  });
  
  // Save fixed data
  fs.writeFileSync('./data/providers.json', JSON.stringify(data, null, 2));
  
  console.log(`✅ Fixed ${fixedCount} invalid state codes`);
  console.log(`💾 Updated providers.json`);
}

fixInvalidStates();