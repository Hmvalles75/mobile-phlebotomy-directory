import fs from 'fs';
import csv from 'csv-parser';

interface CsvRow {
  id?: string;
  name?: string;
  website?: string;
  regions_serviced?: string;
  service_areas?: string;
  coverage_areas?: string;
  [key: string]: any; // Allow for different column names
}

interface Provider {
  id: string;
  name: string;
  website?: string;
  coverage: {
    states: string[];
    cities?: string[];
    regions?: string[];
  };
  [key: string]: any;
}

// Load existing providers
const providers: Provider[] = JSON.parse(fs.readFileSync('data/providers.json', 'utf8'));

// Map of region names to slugs
const regionNameToSlug: Record<string, string> = {
  // Major Metro Areas
  'sf bay area': 'sf-bay-area',
  'san francisco bay area': 'sf-bay-area',
  'san fransisco bay': 'sf-bay-area', // Handle misspelling
  'bay area': 'sf-bay-area',
  'north bay': 'sf-bay-area',
  'capital region': 'capital-region-ny',
  'capital region ny': 'capital-region-ny',
  'albany capital region': 'capital-region-ny',
  'greater los angeles': 'greater-los-angeles',
  'los angeles metro': 'greater-los-angeles',
  'la metro': 'greater-los-angeles',
  'metro atlanta': 'metro-atlanta',
  'atlanta metro': 'metro-atlanta',
  'greater atlanta': 'metro-atlanta',
  'greater boston': 'greater-boston',
  'boston metro': 'greater-boston',
  'new england': 'greater-boston', // Map to Boston for now
  'dallas fort worth': 'dallas-fort-worth',
  'dfw': 'dallas-fort-worth',
  'dallas-fort worth': 'dallas-fort-worth',
  'greater houston': 'greater-houston',
  'houston metro': 'greater-houston',
  'tri-state area': 'tri-state-area',
  'tri state area': 'tri-state-area',
  'nyc metro': 'tri-state-area',
  'greater miami': 'greater-miami',
  'miami metro': 'greater-miami',
  'south florida': 'greater-miami',
  'tampa bay': 'tampa-bay-area',
  'tampa bay area': 'tampa-bay-area',
  'tri-cities': 'tampa-bay-area', // Map to Tampa Bay for FL tri-cities
  'greater orlando': 'greater-orlando',
  'orlando metro': 'greater-orlando',
  'chicagoland': 'chicagoland',
  'chicago metro': 'chicagoland',
  'greater chicago': 'chicagoland',
  'greater phoenix': 'greater-phoenix',
  'phoenix metro': 'greater-phoenix',
  
  // Florida Counties (map to nearest metro)
  'miami-dade county': 'greater-miami',
  'broward county': 'greater-miami',
  'palm beach county': 'greater-miami',
  'lee county': 'greater-miami', // SW Florida
  'collier county': 'greater-miami', // SW Florida
  'osceola county': 'greater-orlando',
  'polk counties': 'greater-orlando',
  'polk county': 'greater-orlando',
  
  // California Counties
  'santa barbara county': 'greater-los-angeles',
  'sacramento county': 'sf-bay-area', // Northern CA
  'yolo county': 'sf-bay-area',
  'placer county': 'sf-bay-area',
  'el dorado county': 'sf-bay-area',
  'lake county': 'sf-bay-area',
  'county': 'sf-bay-area', // Catch-all for "county" entries
  
  // Maryland Counties (map to Baltimore/DC area)
  'anne arundel county': 'capital-region-ny', // Use as placeholder
  'baltimore county': 'capital-region-ny',
  'carroll county': 'capital-region-ny',
  'howard county': 'capital-region-ny',
  'howar county': 'capital-region-ny', // Misspelling of Howard
  
  // Connecticut
  'fairfield county': 'tri-state-area',
  
  // Other cities/regions
  'port st. lucie': 'greater-miami',
  'yolo': 'sf-bay-area'
};

// Parse region text and convert to slugs
function parseRegions(regionText: string): string[] {
  if (!regionText || regionText.trim() === '') return [];
  
  const regions: string[] = [];
  const normalizedText = regionText.toLowerCase().trim();
  
  // Split by common separators
  const parts = normalizedText.split(/[,;|&+]/).map(s => s.trim());
  
  for (const part of parts) {
    if (part === '') continue;
    
    // Direct mapping
    if (regionNameToSlug[part]) {
      regions.push(regionNameToSlug[part]);
      continue;
    }
    
    // Fuzzy matching
    const fuzzyMatch = Object.keys(regionNameToSlug).find(key => 
      part.includes(key) || key.includes(part)
    );
    
    if (fuzzyMatch) {
      regions.push(regionNameToSlug[fuzzyMatch]);
    } else {
      console.warn(`⚠️  Unknown region: "${part}" - you may need to add this to regionNameToSlug`);
    }
  }
  
  return [...new Set(regions)]; // Remove duplicates
}

// Import CSV and update providers
export async function importRegionalCsv(csvFilePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    let updatedCount = 0;
    let notFoundCount = 0;
    
    console.log(`🔍 Reading CSV file: ${csvFilePath}`);
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: CsvRow) => results.push(data))
      .on('end', () => {
        console.log(`📊 Loaded ${results.length} rows from CSV`);
        
        // Show column headers for verification
        if (results.length > 0) {
          console.log(`📋 Detected columns: ${Object.keys(results[0]).join(', ')}`);
        }
        
        // Process each row
        results.forEach((row, index) => {
          try {
            // Find region column (flexible column name matching)
            const regionColumn = Object.keys(row).find(key => 
              key.toLowerCase().includes('region') || 
              key.toLowerCase().includes('service') ||
              key.toLowerCase().includes('coverage') ||
              key.toLowerCase().includes('area')
            );
            
            if (!regionColumn) {
              console.warn(`⚠️  Row ${index + 1}: No region column found`);
              return;
            }
            
            const regionText = row[regionColumn];
            if (!regionText || regionText.trim() === '') {
              return; // Skip rows without region data
            }
            
            // Find provider by ID, name, or website
            let provider: Provider | undefined;
            
            if (row.id) {
              provider = providers.find(p => p.id === row.id);
            }
            
            if (!provider && row.name) {
              provider = providers.find(p => 
                p.name.toLowerCase() === row.name.toLowerCase()
              );
            }
            
            if (!provider && row.website) {
              provider = providers.find(p => 
                p.website && (
                  p.website.includes(row.website) || 
                  row.website.includes(p.website.replace(/https?:\/\//, '').replace(/\/$/, ''))
                )
              );
            }
            
            if (!provider) {
              console.warn(`❌ Row ${index + 1}: Provider not found - ${row.name || row.website || row.id}`);
              notFoundCount++;
              return;
            }
            
            // Parse and add regions
            const regionSlugs = parseRegions(regionText);
            
            if (regionSlugs.length > 0) {
              // Initialize regions array if it doesn't exist
              if (!provider.coverage.regions) {
                provider.coverage.regions = [];
              }
              
              // Add new regions (avoiding duplicates)
              const existingRegions = new Set(provider.coverage.regions);
              regionSlugs.forEach(slug => existingRegions.add(slug));
              provider.coverage.regions = Array.from(existingRegions);
              
              console.log(`✅ Updated ${provider.name}: added regions [${regionSlugs.join(', ')}]`);
              updatedCount++;
            }
            
          } catch (error) {
            console.error(`❌ Error processing row ${index + 1}:`, error);
          }
        });
        
        // Save updated providers
        if (updatedCount > 0) {
          fs.writeFileSync('data/providers.json', JSON.stringify(providers, null, 2));
          console.log(`\n🎉 Successfully updated ${updatedCount} providers with regional coverage`);
          console.log(`📁 Saved to data/providers.json`);
        }
        
        if (notFoundCount > 0) {
          console.log(`⚠️  ${notFoundCount} providers not found - check names/IDs/websites in CSV`);
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   - CSV rows processed: ${results.length}`);
        console.log(`   - Providers updated: ${updatedCount}`);
        console.log(`   - Providers not found: ${notFoundCount}`);
        
        resolve();
      })
      .on('error', reject);
  });
}

// CLI usage
async function main() {
  const csvPath = process.argv[2];
  
  if (!csvPath) {
    console.log(`
📋 CSV Regional Coverage Import Tool

Usage: npx tsx scripts/import-regional-csv.ts <path-to-csv>

Expected CSV format:
- Must have columns for provider identification (id, name, or website)
- Must have a column with region data (regions_serviced, service_areas, coverage_areas, etc.)
- Region values can be comma/semicolon separated: "SF Bay Area, Capital Region"

Example CSV:
name,website,regions_serviced
"Vein Blood Draw","veinblooddraw.com","Capital Region"
"Bay Area Mobile Labs","bayareamobile.com","SF Bay Area"

Supported regions:
${Object.keys(regionNameToSlug).map(name => `  - ${name}`).join('\n')}
`);
    process.exit(1);
  }
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }
  
  try {
    await importRegionalCsv(csvPath);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}