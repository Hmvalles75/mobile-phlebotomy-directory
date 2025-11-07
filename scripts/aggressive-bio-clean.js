const fs = require('fs');

const lines = fs.readFileSync('cleaned_providers.csv', 'utf-8').split('\n');
const output = [lines[0]]; // Keep header

console.log('Aggressively cleaning bio fields...\n');

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;

  // Parse CSV line (handle quoted fields)
  const fields = [];
  let currentField = '';
  let inQuotes = false;

  for (let j = 0; j < lines[i].length; j++) {
    const char = lines[i][j];

    if (char === '"') {
      inQuotes = !inQuotes;
      currentField += char;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField);

  // Bio is field 20 (index 19)
  if (fields[19]) {
    let bio = fields[19];
    const originalLength = bio.length;

    // Remove quotes
    bio = bio.replace(/^"|"$/g, '');

    // Aggressive emoji removal (limit to max 3 consecutive)
    bio = bio.replace(/💉+/g, '💉');
    bio = bio.replace(/🌟+/g, '🌟');
    bio = bio.replace(/(.)\1{5,}/g, '$1$1$1');

    // Remove repetitive phrases
    bio = bio.split('.').filter((s, i, arr) => {
      // Keep only first occurrence of repeated sentences
      const trimmed = s.trim();
      return !trimmed || arr.findIndex(x => x.trim() === trimmed) === i;
    }).join('.').trim();

    // Truncate if still too long
    if (bio.length > 500) {
      bio = bio.substring(0, 497) + '...';
    }

    // Re-quote
    fields[19] = `"${bio}"`;

    if (originalLength - bio.length > 200) {
      const name = fields[0].replace(/^"|"$/g, '');
      console.log(`Cleaned ${name}: ${originalLength} -> ${bio.length} chars`);
    }
  }

  output.push(fields.join(','));
}

fs.writeFileSync('cleaned_providers.csv', output.join('\n'), 'utf-8');
console.log(`\n✅ Aggressively cleaned ${output.length - 1} provider bios`);
