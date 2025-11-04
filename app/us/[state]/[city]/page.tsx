'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SearchBar } from '@/components/ui/SearchBar'
import { ProviderActions } from '@/components/ui/ProviderActions'
import { type Provider } from '@/lib/schemas'
import { formatCoverageDisplay } from '@/lib/coverage-utils'
import { ProviderSchema } from '@/components/seo/ProviderSchema'
import { generateLocalBusinessSchema, generateProviderListSchema, generateBreadcrumbSchema } from '@/lib/schema-generators'

// Use the standardized coverage display function
function getProviderCoverageDisplay(provider: Provider, currentCity?: string): string {
  return formatCoverageDisplay(provider.coverage);
}

// Complete city mapping for all cities with providers
// Generated from provider data - 364 cities
const cityMapping: Record<string, {name: string, state: string}> = {
  'albany': { name: 'Albany', state: 'NY' },
  'albuquerque': { name: 'Albuquerque', state: 'NM' },
  'amarillo': { name: 'Amarillo', state: 'TX' },
  'amherst': { name: 'Amherst', state: 'NY' },
  'anchorage': { name: 'Anchorage', state: 'AK' },
  'antioch': { name: 'Antioch', state: 'CA' },
  'apex': { name: 'Apex', state: 'NC' },
  'astoria': { name: 'Astoria', state: 'NY' },
  'atlanta': { name: 'Atlanta', state: 'GA' },
  'augusta': { name: 'Augusta', state: 'ME' },
  'austin': { name: 'Austin', state: 'TX' },
  'beachwood': { name: 'Beachwood', state: 'OH' },
  'bear-lake': { name: 'Bear Lake', state: 'MI' },
  'beaumont': { name: 'Beaumont', state: 'TX' },
  'beaverton': { name: 'Beaverton', state: 'OR' },
  'bedford': { name: 'Bedford', state: 'OH' },
  'belleville': { name: 'Belleville', state: 'NJ' },
  'benicia': { name: 'Benicia', state: 'CA' },
  'benton': { name: 'Benton', state: 'KY' },
  'bergenfield': { name: 'Bergenfield', state: 'NJ' },
  'beverly': { name: 'Beverly', state: 'MA' },
  'binghamton': { name: 'Binghamton', state: 'NY' },
  'boca-raton': { name: 'Boca Raton', state: 'FL' },
  'boise': { name: 'Boise', state: 'ID' },
  'bonita-springs': { name: 'Bonita Springs', state: 'FL' },
  'boston': { name: 'Boston', state: 'MA' },
  'boynton-beach': { name: 'Boynton Beach', state: 'FL' },
  'bozeman': { name: 'Bozeman', state: 'MT' },
  'brentwood': { name: 'Brentwood', state: 'CA' },
  'bridgeport': { name: 'Bridgeport', state: 'CT' },
  'bronx': { name: 'Bronx', state: 'NY' },
  'bronxville': { name: 'Bronxville', state: 'NY' },
  'brooklyn': { name: 'Brooklyn', state: 'NY' },
  'brooklyn-park': { name: 'Brooklyn Park', state: 'MN' },
  'broomfield': { name: 'Broomfield', state: 'CO' },
  'brownsville': { name: 'Brownsville', state: 'TX' },
  'caledonia': { name: 'Caledonia', state: 'MI' },
  'cape-coral': { name: 'Cape Coral', state: 'FL' },
  'carrollton': { name: 'Carrollton', state: 'TX' },
  'catonsville': { name: 'Catonsville', state: 'MD' },
  'centerville': { name: 'Centerville', state: 'PA' },
  'chalmette': { name: 'Chalmette', state: 'LA' },
  'charleston': { name: 'Charleston', state: 'WV' },
  'charlotte': { name: 'Charlotte', state: 'NC' },
  'chicago': { name: 'Chicago', state: 'IL' },
  'cincinnati': { name: 'Cincinnati', state: 'OH' },
  'clackamas': { name: 'Clackamas', state: 'OR' },
  'clark': { name: 'Clark', state: 'NJ' },
  'cleveland': { name: 'Cleveland', state: 'OH' },
  'clifton-park': { name: 'Clifton Park', state: 'NY' },
  'clinton-township': { name: 'Clinton Township', state: 'MI' },
  'colton': { name: 'Colton', state: 'CA' },
  'columbia': { name: 'Columbia', state: 'MD' },
  'columbus': { name: 'Columbus', state: 'OH' },
  'concord': { name: 'Concord', state: 'MA' },
  'coral-gables': { name: 'Coral Gables', state: 'FL' },
  'coral-springs': { name: 'Coral Springs', state: 'FL' },
  'covington': { name: 'Covington', state: 'LA' },
  'crestview': { name: 'Crestview', state: 'FL' },
  'crete': { name: 'Crete', state: 'IL' },
  'crockett': { name: 'Crockett', state: 'CA' },
  'crystal-lake': { name: 'Crystal Lake', state: 'IL' },
  'culver-city': { name: 'Culver City', state: 'CA' },
  'diberville': { name: 'D\'Iberville', state: 'MS' },
  'dallas': { name: 'Dallas', state: 'TX' },
  'daly-city': { name: 'Daly City', state: 'CA' },
  'danbury': { name: 'Danbury', state: 'CT' },
  'dartmouth': { name: 'Dartmouth', state: 'MA' },
  'davie': { name: 'Davie', state: 'FL' },
  'dayton': { name: 'Dayton', state: 'OH' },
  'dearborn': { name: 'Dearborn', state: 'MI' },
  'deerfield-beach': { name: 'Deerfield Beach', state: 'FL' },
  'delaware': { name: 'Delaware', state: 'OH' },
  'delray-beach': { name: 'Delray Beach', state: 'FL' },
  'denver': { name: 'Denver', state: 'CO' },
  'derby': { name: 'Derby', state: 'NY' },
  'doral': { name: 'Doral', state: 'FL' },
  'dothan': { name: 'Dothan', state: 'AL' },
  'doylestown': { name: 'Doylestown', state: 'PA' },
  'dublin': { name: 'Dublin', state: 'OH' },
  'east-brunswick': { name: 'East Brunswick', state: 'NJ' },
  'east-syracuse': { name: 'East Syracuse', state: 'NY' },
  'eastpointe': { name: 'Eastpointe', state: 'MI' },
  'eden-prairie': { name: 'Eden Prairie', state: 'MN' },
  'edinboro': { name: 'Edinboro', state: 'PA' },
  'edinburg': { name: 'Edinburg', state: 'TX' },
  'edison': { name: 'Edison', state: 'NJ' },
  'elgin': { name: 'Elgin', state: 'IL' },
  'elmsford': { name: 'Elmsford', state: 'NY' },
  'elyria': { name: 'Elyria', state: 'OH' },
  'emmett': { name: 'Emmett', state: 'ID' },
  'exeter': { name: 'Exeter', state: 'NH' },
  'fairbanks': { name: 'Fairbanks', state: 'AK' },
  'fairfield': { name: 'Fairfield', state: 'CA' },
  'fairport': { name: 'Fairport', state: 'NY' },
  'farmers-branch': { name: 'Farmers Branch', state: 'TX' },
  'farmington-hills': { name: 'Farmington Hills', state: 'MI' },
  'fishers': { name: 'Fishers', state: 'IN' },
  'fishkill': { name: 'Fishkill', state: 'NY' },
  'flushing': { name: 'Flushing', state: 'NY' },
  'folsom': { name: 'Folsom', state: 'CA' },
  'forest': { name: 'Forest', state: 'MS' },
  'fort-lauderdale': { name: 'Fort Lauderdale', state: 'FL' },
  'fort-myers': { name: 'Fort Myers', state: 'FL' },
  'fort-wayne': { name: 'Fort Wayne', state: 'IN' },
  'fort-worth': { name: 'Fort Worth', state: 'TX' },
  'fountain-hills': { name: 'Fountain Hills', state: 'AZ' },
  'franklin': { name: 'Franklin', state: 'TN' },
  'fredericksburg': { name: 'Fredericksburg', state: 'VA' },
  'fremont': { name: 'Fremont', state: 'CA' },
  'gahanna': { name: 'Gahanna', state: 'OH' },
  'garden-city': { name: 'Garden City', state: 'NY' },
  'garfield-heights': { name: 'Garfield Heights', state: 'OH' },
  'gary': { name: 'Gary', state: 'IN' },
  'glen-burnie': { name: 'Glen Burnie', state: 'MD' },
  'glendale': { name: 'Glendale', state: 'CA' },
  'goodlettsville': { name: 'Goodlettsville', state: 'TN' },
  'goshen': { name: 'Goshen', state: 'NY' },
  'great-neck': { name: 'Great Neck', state: 'NY' },
  'green-bay': { name: 'Green Bay', state: 'WI' },
  'greensboro': { name: 'Greensboro', state: 'NC' },
  'greenwich': { name: 'Greenwich', state: 'CT' },
  'grosse-pointe': { name: 'Grosse Pointe', state: 'MI' },
  'grove-city': { name: 'Grove City', state: 'OH' },
  'gulfport': { name: 'Gulfport', state: 'MS' },
  'gurnee': { name: 'Gurnee', state: 'IL' },
  'hagerstown': { name: 'Hagerstown', state: 'MD' },
  'harvey': { name: 'Harvey', state: 'LA' },
  'harwich-port': { name: 'Harwich Port', state: 'MA' },
  'hauppauge': { name: 'Hauppauge', state: 'NY' },
  'hazard': { name: 'Hazard', state: 'KY' },
  'hendersonville': { name: 'Hendersonville', state: 'TN' },
  'hickory-hills': { name: 'Hickory Hills', state: 'IL' },
  'highland-park': { name: 'Highland Park', state: 'IL' },
  'hollywood': { name: 'Hollywood', state: 'FL' },
  'honolulu': { name: 'Honolulu', state: 'HI' },
  'horseheads': { name: 'Horseheads', state: 'NY' },
  'houma': { name: 'Houma', state: 'LA' },
  'houston': { name: 'Houston', state: 'TX' },
  'huber-heights': { name: 'Huber Heights', state: 'OH' },
  'humble': { name: 'Humble', state: 'TX' },
  'huntley': { name: 'Huntley', state: 'IL' },
  'independence': { name: 'Independence', state: 'OH' },
  'ingleside': { name: 'Ingleside', state: 'TX' },
  'irvine': { name: 'Irvine', state: 'CA' },
  'irving': { name: 'Irving', state: 'TX' },
  'jackson': { name: 'Jackson', state: 'TN' },
  'jackson-township': { name: 'Jackson Township', state: 'NJ' },
  'jamaica': { name: 'Jamaica', state: 'NY' },
  'jenkintown': { name: 'Jenkintown', state: 'PA' },
  'johnstown': { name: 'Johnstown', state: 'NY' },
  'jupiter': { name: 'Jupiter', state: 'FL' },
  'kansas-city': { name: 'Kansas City', state: 'MO' },
  'katy': { name: 'Katy', state: 'TX' },
  'kearny': { name: 'Kearny', state: 'NJ' },
  'key-largo': { name: 'Key Largo', state: 'FL' },
  'key-west': { name: 'Key West', state: 'FL' },
  'knoxville': { name: 'Knoxville', state: 'TN' },
  'lake-jackson': { name: 'Lake Jackson', state: 'TX' },
  'lake-wylie': { name: 'Lake Wylie', state: 'SC' },
  'lakewood': { name: 'Lakewood', state: 'WA' },
  'lancaster': { name: 'Lancaster', state: 'OH' },
  'laplace': { name: 'Laplace', state: 'LA' },
  'lauderhill': { name: 'Lauderhill', state: 'FL' },
  'laurel': { name: 'Laurel', state: 'MD' },
  'league-city': { name: 'League City', state: 'TX' },
  'lees-summit': { name: 'Lee\'s Summit', state: 'MO' },
  'lehigh-acres': { name: 'Lehigh Acres', state: 'FL' },
  'leitchfield': { name: 'Leitchfield', state: 'KY' },
  'leonardtown': { name: 'Leonardtown', state: 'MD' },
  'lexington': { name: 'Lexington', state: 'KY' },
  'live-oak': { name: 'Live Oak', state: 'FL' },
  'livermore': { name: 'Livermore', state: 'CA' },
  'liverpool': { name: 'Liverpool', state: 'NY' },
  'livingston': { name: 'Livingston', state: 'NJ' },
  'lodi': { name: 'Lodi', state: 'CA' },
  'los-angeles': { name: 'Los Angeles', state: 'CA' },
  'los-gatos': { name: 'Los Gatos', state: 'CA' },
  'louisville': { name: 'Louisville', state: 'KY' },
  'lubbock': { name: 'Lubbock', state: 'TX' },
  'macedon': { name: 'Macedon', state: 'NY' },
  'manasquan': { name: 'Manasquan', state: 'NJ' },
  'manteca': { name: 'Manteca', state: 'CA' },
  'maple-heights': { name: 'Maple Heights', state: 'OH' },
  'marion': { name: 'Marion', state: 'OH' },
  'marrero': { name: 'Marrero', state: 'LA' },
  'massapequa-park': { name: 'Massapequa Park', state: 'NY' },
  'mayfield': { name: 'Mayfield', state: 'OH' },
  'mayfield-heights': { name: 'Mayfield Heights', state: 'OH' },
  'mcallen': { name: 'McAllen', state: 'TX' },
  'mchenry': { name: 'McHenry', state: 'IL' },
  'medford': { name: 'Medford', state: 'NY' },
  'memphis': { name: 'Memphis', state: 'TN' },
  'menlo-park': { name: 'Menlo Park', state: 'CA' },
  'meridian': { name: 'Meridian', state: 'ID' },
  'merrill': { name: 'Merrill', state: 'MI' },
  'mesa': { name: 'Mesa', state: 'AZ' },
  'metairie': { name: 'Metairie', state: 'LA' },
  'miami': { name: 'Miami', state: 'FL' },
  'miami-beach': { name: 'Miami Beach', state: 'FL' },
  'middleburg-heights': { name: 'Middleburg Heights', state: 'OH' },
  'middlebury': { name: 'Middlebury', state: 'CT' },
  'millburn': { name: 'Millburn', state: 'NJ' },
  'miramar': { name: 'Miramar', state: 'FL' },
  'mobile': { name: 'Mobile', state: 'AL' },
  'montgomery': { name: 'Montgomery', state: 'AL' },
  'moses-lake': { name: 'Moses Lake', state: 'WA' },
  'mountain-view': { name: 'Mountain View', state: 'CA' },
  'mt-tabor': { name: 'Mt Tabor', state: 'NJ' },
  'naples': { name: 'Naples', state: 'FL' },
  'nashville': { name: 'Nashville', state: 'TN' },
  'naugatuck': { name: 'Naugatuck', state: 'CT' },
  'new-haven': { name: 'New Haven', state: 'CT' },
  'new-hyde-park': { name: 'New Hyde Park', state: 'NY' },
  'new-milford': { name: 'New Milford', state: 'CT' },
  'new-orleans': { name: 'New Orleans', state: 'LA' },
  'new-york': { name: 'New York', state: 'NY' },
  'newark': { name: 'Newark', state: 'DE' },
  'newtown': { name: 'Newtown', state: 'CT' },
  'north-miami-beach': { name: 'North Miami Beach', state: 'FL' },
  'north-port': { name: 'North Port', state: 'FL' },
  'northbrook': { name: 'Northbrook', state: 'IL' },
  'northglenn': { name: 'Northglenn', state: 'CO' },
  'norwalk': { name: 'Norwalk', state: 'CT' },
  'novato': { name: 'Novato', state: 'CA' },
  'oakland': { name: 'Oakland', state: 'CA' },
  'okeechobee': { name: 'Okeechobee', state: 'FL' },
  'ontario': { name: 'Ontario', state: 'OH' },
  'opelika': { name: 'Opelika', state: 'AL' },
  'orbisonia': { name: 'Orbisonia', state: 'PA' },
  'orinda': { name: 'Orinda', state: 'CA' },
  'orion-township': { name: 'Orion Township', state: 'MI' },
  'orlando': { name: 'Orlando', state: 'FL' },
  'owings-mills': { name: 'Owings Mills', state: 'MD' },
  'oxnard': { name: 'Oxnard', state: 'CA' },
  'paducah': { name: 'Paducah', state: 'KY' },
  'palm-beach-gardens': { name: 'Palm Beach Gardens', state: 'FL' },
  'palm-city': { name: 'Palm City', state: 'FL' },
  'palm-springs': { name: 'Palm Springs', state: 'FL' },
  'palo-alto': { name: 'Palo Alto', state: 'CA' },
  'palos-hills': { name: 'Palos Hills', state: 'IL' },
  'panama-city': { name: 'Panama City', state: 'FL' },
  'panama-city-beach': { name: 'Panama City Beach', state: 'FL' },
  'panorama-city': { name: 'Panorama City', state: 'CA' },
  'parkersburg': { name: 'Parkersburg', state: 'WV' },
  'pascagoula': { name: 'Pascagoula', state: 'MS' },
  'passaic': { name: 'Passaic', state: 'NJ' },
  'pawtucket': { name: 'Pawtucket', state: 'RI' },
  'pearland': { name: 'Pearland', state: 'TX' },
  'pembroke-pines': { name: 'Pembroke Pines', state: 'FL' },
  'perrysburg': { name: 'Perrysburg', state: 'OH' },
  'petaluma': { name: 'Petaluma', state: 'CA' },
  'phenix-city': { name: 'Phenix City', state: 'AL' },
  'philadelphia': { name: 'Philadelphia', state: 'PA' },
  'phoenix': { name: 'Phoenix', state: 'AZ' },
  'pickerington': { name: 'Pickerington', state: 'OH' },
  'pittsfield': { name: 'Pittsfield', state: 'MA' },
  'plainview': { name: 'Plainview', state: 'NY' },
  'pleasant-hill': { name: 'Pleasant Hill', state: 'CA' },
  'pleasanton': { name: 'Pleasanton', state: 'CA' },
  'pompano-beach': { name: 'Pompano Beach', state: 'FL' },
  'port-charlotte': { name: 'Port Charlotte', state: 'FL' },
  'port-st-lucie': { name: 'Port St. Lucie', state: 'FL' },
  'portland': { name: 'Portland', state: 'OR' },
  'post-falls': { name: 'Post Falls', state: 'ID' },
  'prestonsburg': { name: 'Prestonsburg', state: 'KY' },
  'prospect': { name: 'Prospect', state: 'CT' },
  'provo': { name: 'Provo', state: 'UT' },
  'pueblo': { name: 'Pueblo', state: 'CO' },
  'randolph': { name: 'Randolph', state: 'MA' },
  'raytown': { name: 'Raytown', state: 'MO' },
  'redmond': { name: 'Redmond', state: 'OR' },
  'rhinebeck': { name: 'Rhinebeck', state: 'NY' },
  'richmond': { name: 'Richmond', state: 'KY' },
  'ridgeland': { name: 'Ridgeland', state: 'MS' },
  'riverside': { name: 'Riverside', state: 'CA' },
  'roanoke': { name: 'Roanoke', state: 'VA' },
  'rochester': { name: 'Rochester', state: 'NY' },
  'rohnert-park': { name: 'Rohnert Park', state: 'CA' },
  'rosedale': { name: 'Rosedale', state: 'MD' },
  'roseville': { name: 'Roseville', state: 'CA' },
  'royal-oak': { name: 'Royal Oak', state: 'MI' },
  'royal-palm-beach': { name: 'Royal Palm Beach', state: 'FL' },
  'sacramento': { name: 'Sacramento', state: 'CA' },
  'salem': { name: 'Salem', state: 'MA' },
  'san-antonio': { name: 'San Antonio', state: 'TX' },
  'san-bruno': { name: 'San Bruno', state: 'CA' },
  'san-diego': { name: 'San Diego', state: 'CA' },
  'san-francisco': { name: 'San Francisco', state: 'CA' },
  'san-jose': { name: 'San Jose', state: 'CA' },
  'san-mateo': { name: 'San Mateo', state: 'CA' },
  'san-rafael': { name: 'San Rafael', state: 'CA' },
  'san-ramon': { name: 'San Ramon', state: 'CA' },
  'santa-clara': { name: 'Santa Clara', state: 'CA' },
  'santa-monica': { name: 'Santa Monica', state: 'CA' },
  'sarasota': { name: 'Sarasota', state: 'FL' },
  'sayre': { name: 'Sayre', state: 'PA' },
  'scarborough': { name: 'Scarborough', state: 'ME' },
  'scotts-valley': { name: 'Scotts Valley', state: 'CA' },
  'scranton': { name: 'Scranton', state: 'PA' },
  'seattle': { name: 'Seattle', state: 'WA' },
  'sebring': { name: 'Sebring', state: 'FL' },
  'setauket--east-setauket': { name: 'Setauket- East Setauket', state: 'NY' },
  'shelby': { name: 'Shelby', state: 'OH' },
  'shelton': { name: 'Shelton', state: 'CT' },
  'slidell': { name: 'Slidell', state: 'LA' },
  'south-euclid': { name: 'South Euclid', state: 'OH' },
  'south-orange-village': { name: 'South Orange Village', state: 'NJ' },
  'spokane': { name: 'Spokane', state: 'WA' },
  'spokane-valley': { name: 'Spokane Valley', state: 'WA' },
  'spring-hill': { name: 'Spring Hill', state: 'TN' },
  'springfield': { name: 'Springfield', state: 'OR' },
  'st-albans': { name: 'St. Albans', state: 'NY' },
  'st-louis': { name: 'St. Louis', state: 'MO' },
  'st-petersburg': { name: 'St. Petersburg', state: 'FL' },
  'stamford': { name: 'Stamford', state: 'CT' },
  'staten-island': { name: 'Staten Island', state: 'NY' },
  'sterling-heights': { name: 'Sterling Heights', state: 'MI' },
  'stratford': { name: 'Stratford', state: 'CT' },
  'sugar-land': { name: 'Sugar Land', state: 'TX' },
  'sunnyvale': { name: 'Sunnyvale', state: 'CA' },
  'syracuse': { name: 'Syracuse', state: 'NY' },
  'tallahassee': { name: 'Tallahassee', state: 'FL' },
  'tampa': { name: 'Tampa', state: 'FL' },
  'teaneck': { name: 'Teaneck', state: 'NJ' },
  'tempe': { name: 'Tempe', state: 'AZ' },
  'texas-city': { name: 'Texas City', state: 'TX' },
  'tok': { name: 'Tok', state: 'AK' },
  'toledo': { name: 'Toledo', state: 'OH' },
  'towson': { name: 'Towson', state: 'MD' },
  'traverse-city': { name: 'Traverse City', state: 'MI' },
  'tualatin': { name: 'Tualatin', state: 'OR' },
  'tyler': { name: 'Tyler', state: 'TX' },
  'union': { name: 'Union', state: 'NJ' },
  'utica': { name: 'Utica', state: 'NY' },
  'valdosta': { name: 'Valdosta', state: 'GA' },
  'vancouver': { name: 'Vancouver', state: 'WA' },
  'venice': { name: 'Venice', state: 'FL' },
  'ventura': { name: 'Ventura', state: 'CA' },
  'vestal': { name: 'Vestal', state: 'NY' },
  'victor': { name: 'Victor', state: 'NY' },
  'walnut-creek': { name: 'Walnut Creek', state: 'CA' },
  'warren': { name: 'Warren', state: 'OH' },
  'warrensvl-hts': { name: 'WARRENSVL HTS', state: 'OH' },
  'washington': { name: 'Washington', state: 'DC' },
  'wasilla': { name: 'Wasilla', state: 'AK' },
  'waterbury': { name: 'Waterbury', state: 'CT' },
  'watsonville': { name: 'Watsonville', state: 'CA' },
  'waukegan': { name: 'Waukegan', state: 'IL' },
  'webster': { name: 'Webster', state: 'NY' },
  'west-jordan': { name: 'West Jordan', state: 'UT' },
  'west-orange': { name: 'West Orange', state: 'NJ' },
  'west-palm-beach': { name: 'West Palm Beach', state: 'FL' },
  'west-seneca': { name: 'West Seneca', state: 'NY' },
  'westerville': { name: 'Westerville', state: 'OH' },
  'weston': { name: 'Weston', state: 'FL' },
  'white-plains': { name: 'White Plains', state: 'NY' },
  'wickliffe': { name: 'Wickliffe', state: 'OH' },
  'wilkes-barre': { name: 'Wilkes-Barre', state: 'PA' },
  'woburn': { name: 'Woburn', state: 'MA' },
  'woodlawn': { name: 'Woodlawn', state: 'MD' },
  'woonsocket': { name: 'Woonsocket', state: 'RI' },
  'youngstown': { name: 'Youngstown', state: 'OH' },
  'yuba-city': { name: 'Yuba City', state: 'CA' }
}

interface PageProps {
  params: {
    state: string
    city: string
  }
}

export default function CityPage({ params }: PageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [groupedResults, setGroupedResults] = useState<{
    citySpecific: Provider[]
    regional: Provider[]
    statewide: Provider[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const cityKey = params.city as keyof typeof cityMapping
  const cityInfo = cityMapping[cityKey]

  if (!cityInfo) {
    notFound()
  }

  const { name: cityName, state } = cityInfo
  
  useEffect(() => {
    async function fetchProviders() {
      setLoading(true)
      try {
        // Try enhanced search first with grouped results
        const params = new URLSearchParams({
          city: cityInfo.name,
          state: cityInfo.state,
          grouped: 'true'
        })
        
        const response = await fetch(`/api/providers/city?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch providers')
        }
        
        const data = await response.json()
        
        // Check if we got grouped results or flat array
        if (data.citySpecific || data.regional || data.statewide) {
          // Store grouped results and combine for display
          setGroupedResults(data)
          const allProviders = [
            ...(data.citySpecific || []),
            ...(data.regional || []),
            ...(data.statewide || [])
          ]
          setProviders(allProviders)
        } else {
          // Fallback to flat array
          setGroupedResults(null)
          setProviders(data)
        }
      } catch (error) {
        console.error('Error fetching providers:', error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchProviders()
  }, [cityInfo.name, cityInfo.state])

  const serviceOptions = [
    'At-Home Blood Draw',
    'Corporate Wellness',
    'Pediatric',
    'Geriatric',
    'Fertility/IVF',
    'Specimen Pickup',
    'Lab Partner'
  ]

  // Filter providers based on search and services
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = !searchQuery || 
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.coverage.cities?.some(city => city.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesServices = selectedServices.length === 0 ||
      selectedServices.some(service => provider.services.includes(service as any))

    return matchesSearch && matchesServices
  })

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-4">
              Mobile Phlebotomy Services in {cityName}, {state}
            </h1>
            <p className="text-xl text-primary-100 mb-6">
              Find certified mobile phlebotomists for at-home blood draws and lab collections in {cityName}.
              Licensed, insured, and professional services available 7 days a week.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Same-day appointments</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Licensed professionals</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>Insured & bonded</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-200">✓</span>
                <span>HIPAA compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search providers in ${cityName}...`}
            className="mb-4"
          />

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Filter by Services</h3>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map((service) => (
                <button
                  key={service}
                  onClick={() => handleServiceToggle(service)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedServices.includes(service)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Providers Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {filteredProviders.length} Provider{filteredProviders.length !== 1 ? 's' : ''} Available in {cityName}
            </h2>
            {groupedResults && (
              <div className="text-sm text-gray-600 mb-2">
                {groupedResults.citySpecific.length > 0 && (
                  <span className="mr-4">
                    <span className="font-medium text-green-700">{groupedResults.citySpecific.length}</span> city-specific
                  </span>
                )}
                {groupedResults.regional.length > 0 && (
                  <span className="mr-4">
                    <span className="font-medium text-blue-700">{groupedResults.regional.length}</span> regional
                  </span>
                )}
                {groupedResults.statewide.length > 0 && (
                  <span className="mr-4">
                    <span className="font-medium text-gray-700">{groupedResults.statewide.length}</span> statewide
                  </span>
                )}
              </div>
            )}
            <p className="text-gray-600">
              Professional mobile phlebotomy services available in your area
            </p>
          </div>
          
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>Sort by Rating</option>
            <option>Sort by Reviews</option>
            <option>Sort by Experience</option>
          </select>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Loading providers...</h3>
              <p className="text-gray-600">Please wait while we find providers in {cityName}.</p>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No providers found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check our general search page.</p>
              <a href="/search" className="inline-block mt-4 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                View All Providers
              </a>
            </div>
          ) : (
            filteredProviders.map((provider) => {
              // Determine provider type for visual indicator
              let providerType = 'statewide';
              if (groupedResults?.citySpecific.some(p => p.id === provider.id)) {
                providerType = 'city-specific';
              } else if (groupedResults?.regional.some(p => p.id === provider.id)) {
                providerType = 'regional';
              }
              
              return (
              <div key={provider.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Individual Provider Schema */}
                <ProviderSchema
                  provider={provider}
                  location={`${cityName}, ${state}`}
                />

                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        href={`/provider/${provider.slug}`}
                        className="text-xl font-bold text-gray-900 hover:text-primary-600"
                      >
                        {provider.name}
                      </Link>
                      {/* Nationwide/Multi-State Badge */}
                      {(provider as any).is_nationwide === 'Yes' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          🌎 Nationwide Service
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      {provider.address?.city && provider.address.city.trim() ? (
                        <span>📍 {provider.address.city}{provider.address.state ? `, ${provider.address.state}` : ''}{provider.address.zip ? ` ${provider.address.zip}` : ''}</span>
                      ) : (
                        <span>🌐 Online Services</span>
                      )}
                      {provider.phone && <span>📞 {provider.phone}</span>}
                      {provider.rating && provider.reviewsCount && (
                        <div className="flex items-center">
                          <span className="text-yellow-400">
                            {'★'.repeat(Math.floor(provider.rating))}{'☆'.repeat(5 - Math.floor(provider.rating))}
                          </span>
                          <span className="ml-1">{provider.rating} ({provider.reviewsCount} reviews)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      {provider.availability && (
                        <span>📅 {provider.availability.join(', ')}</span>
                      )}
                      {provider.payment && (
                        <span>💳 {provider.payment.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {/* Coverage type indicator with improved messaging */}
                    <span
                      className={`text-xs px-2 py-1 rounded-full text-center ${
                        providerType === 'city-specific' ? 'bg-green-100 text-green-800' :
                        providerType === 'regional' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {providerType === 'city-specific' ? '📍 Serves This Area' :
                       providerType === 'regional' ? '🌐 Regional Coverage' :
                       '🗺️ Statewide Service'}
                    </span>
                    {provider.badges?.map((badge) => (
                      <span
                        key={badge}
                        className={`text-xs px-2 py-1 rounded-full text-center ${
                          badge === 'Certified' ? 'bg-green-100 text-green-800' :
                          badge === 'Insured' ? 'bg-blue-100 text-blue-800' :
                          badge === 'Background-Checked' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {provider.description && (
                  <p className="text-gray-600 mb-4">{provider.description}</p>
                )}

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Services Offered:</h4>
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((service) => (
                      <span
                        key={service}
                        className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Coverage:</span> {getProviderCoverageDisplay(provider, cityName)}
                  </div>
                  {provider.website && (
                    <div>
                      <span className="font-medium">Website:</span>{' '}
                      <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {provider.website.replace('https://', '')}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <ProviderActions
                    provider={provider}
                    currentLocation={`${cityName}, ${state}`}
                    showStructuredData={true}
                    variant="compact"
                  />
                  <Link
                    href={`/provider/${provider.slug}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
              )
            })
          )}
        </div>

        {/* Local Info Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            About Mobile Phlebotomy in {cityName}, {state}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Choose Mobile Phlebotomy?</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Skip the wait at traditional labs</li>
                <li>• Comfortable home environment</li>
                <li>• Flexible scheduling around your needs</li>
                <li>• Professional, licensed phlebotomists</li>
                <li>• Same accuracy as traditional lab draws</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What to Expect</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Quick 15-30 minute appointments</li>
                <li>• Professional, sterile equipment</li>
                <li>• Results sent directly to your doctor</li>
                <li>• Insurance often covers services</li>
                <li>• Follow-up support if needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}