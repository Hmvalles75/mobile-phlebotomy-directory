import fs from 'fs';
import path from 'path';

// All US states
const states = [
  { name: 'Alabama', slug: 'alabama' },
  { name: 'Alaska', slug: 'alaska' },
  { name: 'Arizona', slug: 'arizona' },
  { name: 'Arkansas', slug: 'arkansas' },
  { name: 'California', slug: 'california' },
  { name: 'Colorado', slug: 'colorado' },
  { name: 'Connecticut', slug: 'connecticut' },
  { name: 'Delaware', slug: 'delaware' },
  { name: 'Florida', slug: 'florida' },
  { name: 'Georgia', slug: 'georgia' },
  { name: 'Hawaii', slug: 'hawaii' },
  { name: 'Idaho', slug: 'idaho' },
  { name: 'Illinois', slug: 'illinois' },
  { name: 'Indiana', slug: 'indiana' },
  { name: 'Iowa', slug: 'iowa' },
  { name: 'Kansas', slug: 'kansas' },
  { name: 'Kentucky', slug: 'kentucky' },
  { name: 'Louisiana', slug: 'louisiana' },
  { name: 'Maine', slug: 'maine' },
  { name: 'Maryland', slug: 'maryland' },
  { name: 'Massachusetts', slug: 'massachusetts' },
  { name: 'Michigan', slug: 'michigan' },
  { name: 'Minnesota', slug: 'minnesota' },
  { name: 'Mississippi', slug: 'mississippi' },
  { name: 'Missouri', slug: 'missouri' },
  { name: 'Montana', slug: 'montana' },
  { name: 'Nebraska', slug: 'nebraska' },
  { name: 'Nevada', slug: 'nevada' },
  { name: 'New Hampshire', slug: 'new-hampshire' },
  { name: 'New Jersey', slug: 'new-jersey' },
  { name: 'New Mexico', slug: 'new-mexico' },
  { name: 'New York', slug: 'new-york' },
  { name: 'North Carolina', slug: 'north-carolina' },
  { name: 'North Dakota', slug: 'north-dakota' },
  { name: 'Ohio', slug: 'ohio' },
  { name: 'Oklahoma', slug: 'oklahoma' },
  { name: 'Oregon', slug: 'oregon' },
  { name: 'Pennsylvania', slug: 'pennsylvania' },
  { name: 'Rhode Island', slug: 'rhode-island' },
  { name: 'South Carolina', slug: 'south-carolina' },
  { name: 'South Dakota', slug: 'south-dakota' },
  { name: 'Tennessee', slug: 'tennessee' },
  { name: 'Texas', slug: 'texas' },
  { name: 'Utah', slug: 'utah' },
  { name: 'Vermont', slug: 'vermont' },
  { name: 'Virginia', slug: 'virginia' },
  { name: 'Washington', slug: 'washington' },
  { name: 'West Virginia', slug: 'west-virginia' },
  { name: 'Wisconsin', slug: 'wisconsin' },
  { name: 'Wyoming', slug: 'wyoming' }
];

// Load providers to get all cities with coverage
const providers = JSON.parse(fs.readFileSync('data/providers.json', 'utf8'));

// Extract unique cities with their states
const citiesWithProviders = new Map<string, Set<string>>();

providers.forEach((provider: any) => {
  // From coverage cities
  if (provider.coverage?.cities) {
    provider.coverage.cities.forEach((city: string) => {
      const stateAbbr = provider.coverage.states[0]; // Get primary state
      if (stateAbbr) {
        const stateSlug = states.find(s => 
          s.name.toUpperCase() === stateAbbr.toUpperCase() ||
          s.name.split(' ')[0].toUpperCase() === stateAbbr.toUpperCase()
        )?.slug || stateAbbr.toLowerCase();
        
        if (!citiesWithProviders.has(stateSlug)) {
          citiesWithProviders.set(stateSlug, new Set());
        }
        citiesWithProviders.get(stateSlug)!.add(city.toLowerCase().replace(/\s+/g, '-'));
      }
    });
  }
  
  // From address
  if (provider.address?.city && provider.address?.state) {
    const city = provider.address.city;
    const stateAbbr = provider.address.state;
    const stateSlug = states.find(s => 
      s.name.toUpperCase() === stateAbbr.toUpperCase() ||
      s.name.split(' ')[0].toUpperCase() === stateAbbr.toUpperCase()
    )?.slug || stateAbbr.toLowerCase();
    
    if (!citiesWithProviders.has(stateSlug)) {
      citiesWithProviders.set(stateSlug, new Set());
    }
    citiesWithProviders.get(stateSlug)!.add(city.toLowerCase().replace(/\s+/g, '-'));
  }
});

// Generate sitemap URLs
const urls: string[] = [
  '/',
  '/search',
  '/about',
  '/contact',
  '/add-provider',
  '/privacy',
  '/terms'
];

// Add state pages
states.forEach(state => {
  urls.push(`/us/${state.slug}`);
  
  // Add city pages for this state
  const cities = citiesWithProviders.get(state.slug);
  if (cities) {
    cities.forEach(city => {
      urls.push(`/us/${state.slug}/${city}`);
    });
  }
});

// Create sitemap XML
const baseUrl = 'https://mobilephlebotomy.org';
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${url === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${url === '/' ? '1.0' : url.includes('/us/') ? '0.8' : '0.5'}</priority>
  </url>`).join('\n')}
</urlset>`;

// Save sitemap
fs.writeFileSync('public/sitemap.xml', sitemap);

console.log(`✅ Generated sitemap with ${urls.length} URLs`);
console.log(`📊 States: ${states.length}`);
console.log(`🏙️ Cities: ${Array.from(citiesWithProviders.values()).reduce((sum, cities) => sum + cities.size, 0)}`);
console.log(`📁 Saved to public/sitemap.xml`);