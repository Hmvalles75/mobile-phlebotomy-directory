export interface MetroArea {
  slug: string;
  city: string;
  state: string;
  stateAbbr: string;
  rank: number;
  zipCodes: string[];
  neighborhoods?: string[];
  majorHospitals?: string[];
  localInfo?: {
    avgCost?: string;
    typicalWaitTime?: string;
    majorEmployers?: string[];
  };
}

export const topMetroAreas: MetroArea[] = [
  // Top Metro Areas
  {
    rank: 1,
    slug: 'new-york-city',
    city: 'New York City',
    state: 'New York',
    stateAbbr: 'NY',
    zipCodes: ['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10009', '10010', '10011'],
    neighborhoods: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
    majorHospitals: ['Mount Sinai Hospital', 'NewYork-Presbyterian', 'NYU Langone', 'Memorial Sloan Kettering'],
    localInfo: {
      avgCost: '$75-150',
      typicalWaitTime: 'Same day available',
      majorEmployers: ['JPMorgan Chase', 'Citi', 'Verizon', 'MetLife', 'Pfizer']
    }
  },
  {
    rank: 2,
    slug: 'los-angeles',
    city: 'Los Angeles',
    state: 'California',
    stateAbbr: 'CA',
    zipCodes: ['90001', '90002', '90003', '90004', '90005', '90006', '90007', '90008', '90010', '90011'],
    neighborhoods: ['Downtown', 'Hollywood', 'Beverly Hills', 'Santa Monica', 'Venice', 'Westwood'],
    majorHospitals: ['Cedars-Sinai', 'UCLA Medical Center', 'USC Medical Center', 'Kaiser Permanente'],
    localInfo: {
      avgCost: '$80-160',
      typicalWaitTime: 'Same day to 24 hours',
      majorEmployers: ['Disney', 'Warner Bros', 'SpaceX', 'Northrop Grumman', 'Kaiser Permanente']
    }
  },
  {
    rank: 3,
    slug: 'chicago',
    city: 'Chicago',
    state: 'Illinois',
    stateAbbr: 'IL',
    zipCodes: ['60601', '60602', '60603', '60604', '60605', '60606', '60607', '60608', '60609', '60610'],
    neighborhoods: ['The Loop', 'Lincoln Park', 'Wicker Park', 'Gold Coast', 'River North', 'Hyde Park'],
    majorHospitals: ['Northwestern Memorial', 'Rush University Medical', 'UChicago Medicine', 'Advocate Christ'],
    localInfo: {
      avgCost: '$70-140',
      typicalWaitTime: 'Same day to 48 hours',
      majorEmployers: ['Boeing', 'Abbott', 'United Airlines', 'McDonald\'s', 'Walgreens']
    }
  },
  {
    rank: 4,
    slug: 'houston',
    city: 'Houston',
    state: 'Texas',
    stateAbbr: 'TX',
    zipCodes: ['77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008', '77009', '77010'],
    neighborhoods: ['Downtown', 'Midtown', 'Montrose', 'Heights', 'River Oaks', 'Medical Center'],
    majorHospitals: ['Houston Methodist', 'MD Anderson', 'Texas Children\'s', 'Memorial Hermann'],
    localInfo: {
      avgCost: '$65-130',
      typicalWaitTime: '24-48 hours',
      majorEmployers: ['ExxonMobil', 'Shell', 'ConocoPhillips', 'Sysco', 'Halliburton']
    }
  },
  {
    rank: 5,
    slug: 'phoenix',
    city: 'Phoenix',
    state: 'Arizona',
    stateAbbr: 'AZ',
    zipCodes: ['85001', '85002', '85003', '85004', '85005', '85006', '85007', '85008', '85009', '85010'],
    neighborhoods: ['Downtown', 'Scottsdale', 'Tempe', 'Mesa', 'Chandler', 'Glendale'],
    majorHospitals: ['Banner Health', 'Mayo Clinic', 'HonorHealth', 'Dignity Health'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: 'Same day to 24 hours',
      majorEmployers: ['Intel', 'Honeywell', 'American Express', 'State Farm', 'Wells Fargo']
    }
  },
  {
    rank: 6,
    slug: 'detroit',
    city: 'Detroit',
    state: 'Michigan',
    stateAbbr: 'MI',
    zipCodes: ['48201', '48202', '48203', '48204', '48205', '48206', '48207', '48208', '48209', '48210'],
    neighborhoods: ['Downtown', 'Midtown', 'Corktown', 'Eastern Market', 'Rivertown', 'New Center'],
    majorHospitals: ['Henry Ford Health', 'Detroit Medical Center', 'Beaumont', 'St. John Providence'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours',
      majorEmployers: ['General Motors', 'Ford', 'Stellantis', 'Quicken Loans', 'Blue Cross Blue Shield']
    }
  },
  {
    rank: 7,
    slug: 'miami',
    city: 'Miami',
    state: 'Florida',
    stateAbbr: 'FL',
    zipCodes: ['33101', '33125', '33126', '33127', '33128', '33129', '33130', '33131', '33132', '33133'],
    neighborhoods: ['Downtown', 'Brickell', 'Wynwood', 'Design District', 'Coconut Grove', 'Coral Gables'],
    majorHospitals: ['Jackson Health', 'Baptist Health', 'Mount Sinai', 'University of Miami'],
    localInfo: {
      avgCost: '$70-140',
      typicalWaitTime: '24 hours'
    }
  },
  {
    rank: 8,
    slug: 'san-antonio',
    city: 'San Antonio',
    state: 'Texas',
    stateAbbr: 'TX',
    zipCodes: ['78201', '78202', '78203', '78204', '78205', '78206', '78207', '78208', '78209', '78210'],
    neighborhoods: ['Downtown', 'Alamo Heights', 'Stone Oak', 'Medical Center', 'Southtown', 'Pearl District'],
    majorHospitals: ['University Health', 'Methodist Healthcare', 'Baptist Health', 'CHRISTUS Health'],
    localInfo: {
      avgCost: '$60-110',
      typicalWaitTime: '24-48 hours',
      majorEmployers: ['USAA', 'H-E-B', 'Valero Energy', 'Rackspace', 'Frost Bank']
    }
  },
  {
    rank: 9,
    slug: 'san-diego',
    city: 'San Diego',
    state: 'California',
    stateAbbr: 'CA',
    zipCodes: ['92101', '92102', '92103', '92104', '92105', '92106', '92107', '92108', '92109', '92110'],
    neighborhoods: ['Downtown', 'La Jolla', 'Pacific Beach', 'North Park', 'Hillcrest', 'Coronado'],
    majorHospitals: ['UC San Diego Health', 'Scripps Health', 'Sharp HealthCare', 'Kaiser Permanente'],
    localInfo: {
      avgCost: '$75-150',
      typicalWaitTime: 'Same day to 24 hours',
      majorEmployers: ['Qualcomm', 'General Atomics', 'Illumina', 'Navy', 'Sharp HealthCare']
    }
  },
  {
    rank: 10,
    slug: 'dallas',
    city: 'Dallas',
    state: 'Texas',
    stateAbbr: 'TX',
    zipCodes: ['75201', '75202', '75203', '75204', '75205', '75206', '75207', '75208', '75209', '75210'],
    neighborhoods: ['Downtown', 'Uptown', 'Deep Ellum', 'Bishop Arts', 'Highland Park', 'Lakewood'],
    majorHospitals: ['UT Southwestern', 'Baylor Scott & White', 'Medical City', 'Methodist Health'],
    localInfo: {
      avgCost: '$65-130',
      typicalWaitTime: '24 hours',
      majorEmployers: ['AT&T', 'American Airlines', 'Texas Instruments', 'Southwest Airlines', 'JPMorgan Chase']
    }
  },
  // Continue with metros 11-25
  {
    rank: 11,
    slug: 'austin',
    city: 'Austin',
    state: 'Texas',
    stateAbbr: 'TX',
    zipCodes: ['78701', '78702', '78703', '78704', '78705', '78721', '78722', '78723', '78724', '78725'],
    neighborhoods: ['Downtown', 'South Congress', 'East Austin', 'Zilker', 'Hyde Park', 'Mueller'],
    majorHospitals: ['Dell Seton Medical', 'St. David\'s', 'Ascension Seton', 'Baylor Scott & White'],
    localInfo: {
      avgCost: '$70-140',
      typicalWaitTime: '24 hours',
      majorEmployers: ['Dell', 'IBM', 'Apple', 'Samsung', 'Tesla']
    }
  },
  {
    rank: 12,
    slug: 'jacksonville',
    city: 'Jacksonville',
    state: 'Florida',
    stateAbbr: 'FL',
    zipCodes: ['32099', '32201', '32202', '32204', '32205', '32206', '32207', '32208', '32209', '32210'],
    neighborhoods: ['Downtown', 'Riverside', 'San Marco', 'Beaches', 'Southside', 'Arlington'],
    majorHospitals: ['Mayo Clinic', 'Baptist Health', 'UF Health', 'Memorial Hospital'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours',
      majorEmployers: ['Navy', 'CSX', 'Fidelity', 'Bank of America', 'Blue Cross Blue Shield']
    }
  },
  {
    rank: 13,
    slug: 'fort-worth',
    city: 'Fort Worth',
    state: 'Texas',
    stateAbbr: 'TX',
    zipCodes: ['76101', '76102', '76103', '76104', '76105', '76106', '76107', '76108', '76109', '76110'],
    neighborhoods: ['Downtown', 'Cultural District', 'West 7th', 'Sundance Square', 'TCU Area', 'Alliance'],
    majorHospitals: ['Texas Health Harris', 'JPS Health', 'Cook Children\'s', 'Baylor All Saints'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours',
      majorEmployers: ['Lockheed Martin', 'American Airlines', 'BNSF Railway', 'Bell Textron', 'Alcon']
    }
  },
  {
    rank: 14,
    slug: 'columbus',
    city: 'Columbus',
    state: 'Ohio',
    stateAbbr: 'OH',
    zipCodes: ['43085', '43201', '43202', '43203', '43204', '43205', '43206', '43207', '43209', '43210'],
    neighborhoods: ['Short North', 'German Village', 'Arena District', 'Clintonville', 'Grandview', 'Dublin'],
    majorHospitals: ['Ohio State Wexner', 'OhioHealth', 'Mount Carmel', 'Nationwide Children\'s'],
    localInfo: {
      avgCost: '$60-110',
      typicalWaitTime: '24-48 hours',
      majorEmployers: ['Nationwide', 'JPMorgan Chase', 'Honda', 'L Brands', 'Cardinal Health']
    }
  },
  {
    rank: 15,
    slug: 'charlotte',
    city: 'Charlotte',
    state: 'North Carolina',
    stateAbbr: 'NC',
    zipCodes: ['28201', '28202', '28203', '28204', '28205', '28206', '28207', '28208', '28209', '28210'],
    neighborhoods: ['Uptown', 'South End', 'NoDa', 'Plaza Midwood', 'Dilworth', 'Myers Park'],
    majorHospitals: ['Atrium Health', 'Novant Health', 'Presbyterian Medical', 'Levine Children\'s'],
    localInfo: {
      avgCost: '$65-130',
      typicalWaitTime: '24 hours',
      majorEmployers: ['Bank of America', 'Wells Fargo', 'Duke Energy', 'Lowe\'s', 'Honeywell']
    }
  },
  {
    rank: 16,
    slug: 'san-francisco',
    city: 'San Francisco',
    state: 'California',
    stateAbbr: 'CA',
    zipCodes: ['94102', '94103', '94104', '94105', '94107', '94108', '94109', '94110', '94111', '94112'],
    neighborhoods: ['Financial District', 'Mission', 'Castro', 'Marina', 'Haight-Ashbury', 'SOMA'],
    majorHospitals: ['UCSF Medical', 'Kaiser Permanente', 'CPMC', 'San Francisco General'],
    localInfo: {
      avgCost: '$90-180',
      typicalWaitTime: 'Same day available',
      majorEmployers: ['Salesforce', 'Uber', 'Twitter', 'Gap', 'Wells Fargo']
    }
  },
  {
    rank: 17,
    slug: 'indianapolis',
    city: 'Indianapolis',
    state: 'Indiana',
    stateAbbr: 'IN',
    zipCodes: ['46201', '46202', '46203', '46204', '46205', '46206', '46207', '46208', '46209', '46210'],
    neighborhoods: ['Downtown', 'Broad Ripple', 'Mass Ave', 'Fountain Square', 'Irvington', 'Castleton'],
    majorHospitals: ['IU Health', 'Community Health', 'St. Vincent', 'Eskenazi Health'],
    localInfo: {
      avgCost: '$55-110',
      typicalWaitTime: '24-48 hours',
      majorEmployers: ['Eli Lilly', 'Anthem', 'Salesforce', 'Cummins', 'Simon Property']
    }
  },
  {
    rank: 18,
    slug: 'seattle',
    city: 'Seattle',
    state: 'Washington',
    stateAbbr: 'WA',
    zipCodes: ['98101', '98102', '98103', '98104', '98105', '98106', '98107', '98108', '98109', '98110'],
    neighborhoods: ['Downtown', 'Capitol Hill', 'Fremont', 'Ballard', 'Queen Anne', 'University District'],
    majorHospitals: ['UW Medical', 'Swedish Medical', 'Virginia Mason', 'Seattle Children\'s'],
    localInfo: {
      avgCost: '$75-150',
      typicalWaitTime: 'Same day to 24 hours',
      majorEmployers: ['Amazon', 'Microsoft', 'Boeing', 'Starbucks', 'Costco']
    }
  },
  {
    rank: 19,
    slug: 'denver',
    city: 'Denver',
    state: 'Colorado',
    stateAbbr: 'CO',
    zipCodes: ['80201', '80202', '80203', '80204', '80205', '80206', '80207', '80208', '80209', '80210'],
    neighborhoods: ['LoDo', 'RiNo', 'Cherry Creek', 'Highlands', 'Capitol Hill', 'Washington Park'],
    majorHospitals: ['UCHealth', 'Presbyterian/St. Joseph', 'National Jewish', 'Denver Health'],
    localInfo: {
      avgCost: '$70-140',
      typicalWaitTime: '24 hours',
      majorEmployers: ['Lockheed Martin', 'United Airlines', 'Comcast', 'Kaiser Permanente', 'Ball Corp']
    }
  },
  {
    rank: 20,
    slug: 'washington-dc',
    city: 'Washington',
    state: 'DC',
    stateAbbr: 'DC',
    zipCodes: ['20001', '20002', '20003', '20004', '20005', '20006', '20007', '20008', '20009', '20010'],
    neighborhoods: ['Georgetown', 'Dupont Circle', 'Capitol Hill', 'Adams Morgan', 'U Street', 'Navy Yard'],
    majorHospitals: ['MedStar Georgetown', 'George Washington', 'Howard University', 'Sibley Memorial'],
    localInfo: {
      avgCost: '$80-160',
      typicalWaitTime: '24 hours',
      majorEmployers: ['Federal Government', 'Fannie Mae', 'Booz Allen', 'Lockheed Martin', 'General Dynamics']
    }
  },
  {
    rank: 21,
    slug: 'boston',
    city: 'Boston',
    state: 'Massachusetts',
    stateAbbr: 'MA',
    zipCodes: ['02108', '02109', '02110', '02111', '02113', '02114', '02115', '02116', '02117', '02118'],
    neighborhoods: ['Back Bay', 'Beacon Hill', 'North End', 'South End', 'Fenway', 'Seaport'],
    majorHospitals: ['Mass General', 'Brigham and Women\'s', 'Boston Medical', 'Beth Israel'],
    localInfo: {
      avgCost: '$80-160',
      typicalWaitTime: 'Same day to 24 hours',
      majorEmployers: ['General Electric', 'State Street', 'Liberty Mutual', 'Fidelity', 'Boston Scientific']
    }
  },
  {
    rank: 22,
    slug: 'el-paso',
    city: 'El Paso',
    state: 'Texas',
    stateAbbr: 'TX',
    zipCodes: ['79901', '79902', '79903', '79904', '79905', '79906', '79907', '79908', '79910', '79911'],
    neighborhoods: ['Downtown', 'Kern Place', 'Sunset Heights', 'Upper Valley', 'East Side', 'West Side'],
    majorHospitals: ['University Medical', 'Del Sol Medical', 'Las Palmas Medical', 'William Beaumont'],
    localInfo: {
      avgCost: '$55-100',
      typicalWaitTime: '24-48 hours',
      majorEmployers: ['Fort Bliss', 'T&T', 'El Paso Electric', 'Prudential', 'Dish Network']
    }
  },
  {
    rank: 23,
    slug: 'detroit',
    city: 'Detroit',
    state: 'Michigan',
    stateAbbr: 'MI',
    zipCodes: ['48201', '48202', '48203', '48204', '48205', '48206', '48207', '48208', '48209', '48210'],
    neighborhoods: ['Downtown', 'Midtown', 'Corktown', 'Eastern Market', 'Rivertown', 'New Center'],
    majorHospitals: ['Henry Ford Health', 'Detroit Medical Center', 'Beaumont', 'St. John Providence'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours',
      majorEmployers: ['General Motors', 'Ford', 'Stellantis', 'Quicken Loans', 'Blue Cross Blue Shield']
    }
  },
  {
    rank: 24,
    slug: 'nashville',
    city: 'Nashville',
    state: 'Tennessee',
    stateAbbr: 'TN',
    zipCodes: ['37201', '37202', '37203', '37204', '37205', '37206', '37207', '37208', '37209', '37210'],
    neighborhoods: ['Downtown', 'East Nashville', 'The Gulch', 'Germantown', '12 South', 'Green Hills'],
    majorHospitals: ['Vanderbilt Medical', 'Saint Thomas', 'TriStar', 'Nashville General'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24 hours',
      majorEmployers: ['HCA Healthcare', 'Nissan', 'Bridgestone', 'Asurion', 'Community Health Systems']
    }
  },
  {
    rank: 25,
    slug: 'portland',
    city: 'Portland',
    state: 'Oregon',
    stateAbbr: 'OR',
    zipCodes: ['97201', '97202', '97203', '97204', '97205', '97206', '97207', '97208', '97209', '97210'],
    neighborhoods: ['Pearl District', 'Hawthorne', 'Alberta Arts', 'Sellwood', 'Nob Hill', 'Southeast Division'],
    majorHospitals: ['OHSU', 'Legacy Health', 'Providence', 'Kaiser Permanente'],
    localInfo: {
      avgCost: '$70-140',
      typicalWaitTime: '24 hours',
      majorEmployers: ['Intel', 'Nike', 'Columbia Sportswear', 'Adidas', 'Precision Castparts']
    }
  },
  // Continue with metros 26-50
  {
    rank: 26,
    slug: 'oklahoma-city',
    city: 'Oklahoma City',
    state: 'Oklahoma',
    stateAbbr: 'OK',
    zipCodes: ['73101', '73102', '73103', '73104', '73105', '73106', '73107', '73108', '73109', '73110'],
    neighborhoods: ['Bricktown', 'Midtown', 'Plaza District', 'Paseo', 'Nichols Hills', 'Edmond'],
    majorHospitals: ['OU Medical', 'Integris Health', 'Mercy Hospital', 'SSM Health'],
    localInfo: {
      avgCost: '$55-110',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 27,
    slug: 'las-vegas',
    city: 'Las Vegas',
    state: 'Nevada',
    stateAbbr: 'NV',
    zipCodes: ['89101', '89102', '89103', '89104', '89106', '89107', '89108', '89109', '89110', '89113'],
    neighborhoods: ['The Strip', 'Downtown', 'Summerlin', 'Henderson', 'Green Valley', 'Spring Valley'],
    majorHospitals: ['Sunrise Hospital', 'UMC', 'Valley Hospital', 'Desert Springs'],
    localInfo: {
      avgCost: '$65-130',
      typicalWaitTime: '24 hours'
    }
  },
  {
    rank: 28,
    slug: 'louisville',
    city: 'Louisville',
    state: 'Kentucky',
    stateAbbr: 'KY',
    zipCodes: ['40201', '40202', '40203', '40204', '40205', '40206', '40207', '40208', '40209', '40210'],
    neighborhoods: ['Downtown', 'NuLu', 'Highlands', 'Old Louisville', 'Germantown', 'Crescent Hill'],
    majorHospitals: ['UofL Hospital', 'Norton Healthcare', 'Baptist Health', 'Jewish Hospital'],
    localInfo: {
      avgCost: '$55-110',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 29,
    slug: 'baltimore',
    city: 'Baltimore',
    state: 'Maryland',
    stateAbbr: 'MD',
    zipCodes: ['21201', '21202', '21203', '21204', '21205', '21206', '21207', '21208', '21209', '21210'],
    neighborhoods: ['Inner Harbor', 'Fells Point', 'Canton', 'Federal Hill', 'Mount Vernon', 'Hampden'],
    majorHospitals: ['Johns Hopkins', 'University of Maryland', 'MedStar', 'Mercy Medical'],
    localInfo: {
      avgCost: '$70-140',
      typicalWaitTime: '24 hours'
    }
  },
  {
    rank: 30,
    slug: 'milwaukee',
    city: 'Milwaukee',
    state: 'Wisconsin',
    stateAbbr: 'WI',
    zipCodes: ['53201', '53202', '53203', '53204', '53205', '53206', '53207', '53208', '53209', '53210'],
    neighborhoods: ['Downtown', 'Third Ward', 'Bay View', 'Walker\'s Point', 'East Side', 'Riverwest'],
    majorHospitals: ['Froedtert', 'Aurora Health', 'Ascension', 'Children\'s Wisconsin'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 31,
    slug: 'albuquerque',
    city: 'Albuquerque',
    state: 'New Mexico',
    stateAbbr: 'NM',
    zipCodes: ['87101', '87102', '87103', '87104', '87105', '87106', '87107', '87108', '87109', '87110'],
    neighborhoods: ['Old Town', 'Downtown', 'Nob Hill', 'North Valley', 'Foothills', 'West Mesa'],
    majorHospitals: ['Presbyterian', 'UNM Hospital', 'Lovelace Medical', 'Christus St. Vincent'],
    localInfo: {
      avgCost: '$55-110',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 32,
    slug: 'tucson',
    city: 'Tucson',
    state: 'Arizona',
    stateAbbr: 'AZ',
    zipCodes: ['85701', '85702', '85703', '85704', '85705', '85706', '85707', '85708', '85709', '85710'],
    neighborhoods: ['Downtown', 'University', 'Sam Hughes', 'Catalina Foothills', 'Oro Valley', 'Rita Ranch'],
    majorHospitals: ['Banner UMC', 'TMC HealthCare', 'Northwest Medical', 'St. Joseph\'s'],
    localInfo: {
      avgCost: '$55-110',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 33,
    slug: 'fresno',
    city: 'Fresno',
    state: 'California',
    stateAbbr: 'CA',
    zipCodes: ['93701', '93702', '93703', '93704', '93705', '93706', '93707', '93708', '93709', '93710'],
    neighborhoods: ['Downtown', 'Tower District', 'Woodward Park', 'Fig Garden', 'Bullard', 'Clovis'],
    majorHospitals: ['Community Medical', 'Saint Agnes', 'Kaiser Permanente', 'Clovis Community'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 34,
    slug: 'sacramento',
    city: 'Sacramento',
    state: 'California',
    stateAbbr: 'CA',
    zipCodes: ['95814', '95815', '95816', '95817', '95818', '95819', '95820', '95821', '95822', '95823'],
    neighborhoods: ['Midtown', 'Downtown', 'East Sacramento', 'Land Park', 'Natomas', 'Oak Park'],
    majorHospitals: ['UC Davis Medical', 'Sutter Health', 'Kaiser Permanente', 'Mercy General'],
    localInfo: {
      avgCost: '$70-140',
      typicalWaitTime: '24 hours'
    }
  },
  {
    rank: 35,
    slug: 'long-beach',
    city: 'Long Beach',
    state: 'California',
    stateAbbr: 'CA',
    zipCodes: ['90801', '90802', '90803', '90804', '90805', '90806', '90807', '90808', '90809', '90810'],
    neighborhoods: ['Downtown', 'Belmont Shore', 'Naples', 'Bixby Knolls', 'California Heights', 'Alamitos Beach'],
    majorHospitals: ['Long Beach Memorial', 'St. Mary Medical', 'College Medical', 'Community Hospital'],
    localInfo: {
      avgCost: '$70-140',
      typicalWaitTime: '24 hours'
    }
  },
  {
    rank: 36,
    slug: 'kansas-city',
    city: 'Kansas City',
    state: 'Missouri',
    stateAbbr: 'MO',
    zipCodes: ['64101', '64102', '64105', '64106', '64108', '64109', '64110', '64111', '64112', '64113'],
    neighborhoods: ['Downtown', 'Crossroads', 'Westport', 'Country Club Plaza', 'River Market', 'Brookside'],
    majorHospitals: ['University of Kansas', 'Saint Luke\'s', 'Children\'s Mercy', 'Truman Medical'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 37,
    slug: 'mesa',
    city: 'Mesa',
    state: 'Arizona',
    stateAbbr: 'AZ',
    zipCodes: ['85201', '85202', '85203', '85204', '85205', '85206', '85207', '85208', '85209', '85210'],
    neighborhoods: ['Downtown', 'Dobson Ranch', 'Red Mountain', 'Eastmark', 'Las Sendas', 'Superstition Springs'],
    majorHospitals: ['Banner Desert', 'Banner Gateway', 'Mountain Vista', 'Banner Baywood'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 38,
    slug: 'virginia-beach',
    city: 'Virginia Beach',
    state: 'Virginia',
    stateAbbr: 'VA',
    zipCodes: ['23450', '23451', '23452', '23453', '23454', '23455', '23456', '23457', '23459', '23460'],
    neighborhoods: ['Oceanfront', 'Town Center', 'Hilltop', 'Great Neck', 'Sandbridge', 'Kempsville'],
    majorHospitals: ['Sentara Virginia Beach', 'Sentara Princess Anne', 'Chesapeake Regional', 'Naval Medical'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 39,
    slug: 'atlanta',
    city: 'Atlanta',
    state: 'Georgia',
    stateAbbr: 'GA',
    zipCodes: ['30301', '30302', '30303', '30304', '30305', '30306', '30307', '30308', '30309', '30310'],
    neighborhoods: ['Midtown', 'Buckhead', 'Downtown', 'Virginia-Highland', 'Old Fourth Ward', 'West End'],
    majorHospitals: ['Emory Healthcare', 'Piedmont', 'Grady Health', 'Children\'s Healthcare'],
    localInfo: {
      avgCost: '$65-130',
      typicalWaitTime: '24 hours'
    }
  },
  {
    rank: 40,
    slug: 'colorado-springs',
    city: 'Colorado Springs',
    state: 'Colorado',
    stateAbbr: 'CO',
    zipCodes: ['80901', '80902', '80903', '80904', '80905', '80906', '80907', '80908', '80909', '80910'],
    neighborhoods: ['Downtown', 'Old Colorado City', 'Broadmoor', 'Briargate', 'Northgate', 'Manitou Springs'],
    majorHospitals: ['UCHealth Memorial', 'Penrose-St. Francis', 'Children\'s Hospital Colorado', 'Evans Army'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 41,
    slug: 'raleigh',
    city: 'Raleigh',
    state: 'North Carolina',
    stateAbbr: 'NC',
    zipCodes: ['27601', '27602', '27603', '27604', '27605', '27606', '27607', '27608', '27609', '27610'],
    neighborhoods: ['Downtown', 'North Hills', 'Cameron Village', 'Five Points', 'Glenwood South', 'Brier Creek'],
    majorHospitals: ['WakeMed', 'Duke Raleigh', 'UNC Rex', 'Wake Med Cary'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24 hours'
    }
  },
  {
    rank: 42,
    slug: 'omaha',
    city: 'Omaha',
    state: 'Nebraska',
    stateAbbr: 'NE',
    zipCodes: ['68101', '68102', '68103', '68104', '68105', '68106', '68107', '68108', '68110', '68111'],
    neighborhoods: ['Old Market', 'Midtown', 'Benson', 'Dundee', 'Aksarben', 'West Omaha'],
    majorHospitals: ['Nebraska Medicine', 'CHI Health', 'Methodist Health', 'Children\'s Hospital'],
    localInfo: {
      avgCost: '$55-110',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 43,
    slug: 'miami',
    city: 'Miami',
    state: 'Florida',
    stateAbbr: 'FL',
    zipCodes: ['33101', '33125', '33126', '33127', '33128', '33129', '33130', '33131', '33132', '33133'],
    neighborhoods: ['Downtown', 'Brickell', 'Wynwood', 'Design District', 'Coconut Grove', 'Coral Gables'],
    majorHospitals: ['Jackson Health', 'Baptist Health', 'Mount Sinai', 'University of Miami'],
    localInfo: {
      avgCost: '$70-140',
      typicalWaitTime: '24 hours'
    }
  },
  {
    rank: 44,
    slug: 'oakland',
    city: 'Oakland',
    state: 'California',
    stateAbbr: 'CA',
    zipCodes: ['94601', '94602', '94603', '94604', '94605', '94606', '94607', '94608', '94609', '94610'],
    neighborhoods: ['Downtown', 'Jack London Square', 'Lake Merritt', 'Rockridge', 'Temescal', 'Fruitvale'],
    majorHospitals: ['Kaiser Oakland', 'Highland Hospital', 'Alta Bates Summit', 'Children\'s Hospital Oakland'],
    localInfo: {
      avgCost: '$75-150',
      typicalWaitTime: '24 hours'
    }
  },
  {
    rank: 45,
    slug: 'minneapolis',
    city: 'Minneapolis',
    state: 'Minnesota',
    stateAbbr: 'MN',
    zipCodes: ['55401', '55402', '55403', '55404', '55405', '55406', '55407', '55408', '55409', '55410'],
    neighborhoods: ['Downtown', 'Uptown', 'Northeast', 'North Loop', 'Linden Hills', 'Dinkytown'],
    majorHospitals: ['Hennepin Healthcare', 'Abbott Northwestern', 'University of Minnesota', 'Children\'s Minnesota'],
    localInfo: {
      avgCost: '$65-130',
      typicalWaitTime: '24 hours'
    }
  },
  {
    rank: 46,
    slug: 'tulsa',
    city: 'Tulsa',
    state: 'Oklahoma',
    stateAbbr: 'OK',
    zipCodes: ['74101', '74102', '74103', '74104', '74105', '74106', '74107', '74108', '74110', '74112'],
    neighborhoods: ['Downtown', 'Brookside', 'Cherry Street', 'Pearl District', 'Brady Arts', 'Riverside'],
    majorHospitals: ['Saint Francis', 'St. John Medical', 'Hillcrest Medical', 'OSU Medical'],
    localInfo: {
      avgCost: '$55-110',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 47,
    slug: 'cleveland',
    city: 'Cleveland',
    state: 'Ohio',
    stateAbbr: 'OH',
    zipCodes: ['44101', '44102', '44103', '44104', '44105', '44106', '44107', '44108', '44109', '44110'],
    neighborhoods: ['Downtown', 'Ohio City', 'Tremont', 'University Circle', 'Gordon Square', 'Little Italy'],
    majorHospitals: ['Cleveland Clinic', 'University Hospitals', 'MetroHealth', 'St. Vincent Charity'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 48,
    slug: 'wichita',
    city: 'Wichita',
    state: 'Kansas',
    stateAbbr: 'KS',
    zipCodes: ['67201', '67202', '67203', '67204', '67205', '67206', '67207', '67208', '67209', '67210'],
    neighborhoods: ['Downtown', 'Old Town', 'Delano', 'College Hill', 'Riverside', 'Eastborough'],
    majorHospitals: ['Wesley Medical', 'Via Christi', 'Robert J. Dole VA', 'Ascension Via Christi'],
    localInfo: {
      avgCost: '$55-100',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 49,
    slug: 'arlington',
    city: 'Arlington',
    state: 'Texas',
    stateAbbr: 'TX',
    zipCodes: ['76001', '76002', '76003', '76004', '76005', '76006', '76010', '76011', '76012', '76013'],
    neighborhoods: ['Downtown', 'Entertainment District', 'Lake Arlington', 'Viridian', 'Pantego', 'Dalworthington Gardens'],
    majorHospitals: ['Medical City Arlington', 'Texas Health Arlington', 'Kindred Hospital', 'Millwood Hospital'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours'
    }
  },
  {
    rank: 50,
    slug: 'new-orleans',
    city: 'New Orleans',
    state: 'Louisiana',
    stateAbbr: 'LA',
    zipCodes: ['70112', '70113', '70114', '70115', '70116', '70117', '70118', '70119', '70122', '70124'],
    neighborhoods: ['French Quarter', 'Garden District', 'Marigny', 'Bywater', 'Uptown', 'Mid-City'],
    majorHospitals: ['Ochsner Medical', 'Tulane Medical', 'LSU Health', 'Touro Infirmary'],
    localInfo: {
      avgCost: '$60-120',
      typicalWaitTime: '24-48 hours'
    }
  }
];

export function getMetroBySlug(slug: string): MetroArea | undefined {
  return topMetroAreas.find(metro => metro.slug === slug);
}

export function getMetrosByState(stateAbbr: string): MetroArea[] {
  return topMetroAreas.filter(metro => metro.stateAbbr === stateAbbr);
}