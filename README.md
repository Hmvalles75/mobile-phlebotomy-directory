# MobilePhlebotomy.org

A production-ready Next.js 14 application providing a comprehensive directory of mobile phlebotomy services across the United States. Built with TypeScript, featuring strong SEO, automated data seeding, and clean architecture.

## 🚀 Features

- **Next.js 14 App Router** with TypeScript and React Server Components
- **Comprehensive Search** with Fuse.js for fuzzy matching and filtering
- **Dynamic Location Pages** - Auto-generated state and city landing pages
- **Strong SEO** - Meta tags, OpenGraph, JSON-LD structured data, sitemaps
- **Data Seeding** - API-based data collection from Google Places, Yelp, and NPI Registry
- **Mobile-First Design** - Tailwind CSS with accessible, responsive UI
- **Provider Management** - CSV import, form submissions, and claim system
- **Static Generation** - Optimized for performance and SEO

## 🏗️ Architecture

```
├── app/                          # Next.js 14 App Router
│   ├── (pages)/                  # Main application pages
│   ├── api/                      # API routes (claim, submit)
│   ├── provider/[slug]/          # Dynamic provider pages
│   ├── us/[state]/               # Dynamic state pages
│   ├── us/[state]/[city]/        # Dynamic city pages
│   ├── sitemap.ts               # Dynamic sitemap generation
│   └── robots.txt/              # Robots.txt route
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components
│   └── layout/                  # Layout components
├── lib/                         # Utilities and schemas
│   ├── schemas.ts               # Zod validation schemas
│   ├── utils.ts                 # Utility functions
│   └── ingest/                  # Data ingestion utilities
├── data/                        # JSON data files
│   ├── providers.json           # Main provider database
│   ├── cities.json              # City data
│   ├── states.json              # State data
│   └── seeds/                   # Seeding configuration
├── scripts/                     # Data management scripts
│   ├── seed/                    # API seeding scripts
│   ├── import-csv.ts            # CSV import utility
│   └── generate-city-pages.ts   # City page generator
└── public/                      # Static assets
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Search:** Fuse.js
- **Data:** Local JSON files (MVP approach)
- **Deployment:** Vercel-ready

## 📦 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd mobilephlebotomy
```

2. **Install dependencies:**
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Add your API keys to `.env.local`:
```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key
YELP_API_KEY=your_yelp_api_key
NPI_BASE_URL=https://npiregistry.cms.hhs.gov/api/
NEXT_PUBLIC_SITE_URL=https://mobilephlebotomy.org
```

4. **Run the development server:**
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🔑 API Keys Setup

### Google Places API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Places API (New)
4. Create credentials (API Key)
5. Restrict the key to Places API for security

### Yelp Fusion API
1. Visit [Yelp Developers](https://www.yelp.com/developers)
2. Create an app
3. Get your API key from the app dashboard

### NPI Registry API
- No API key required - this is a free public API by CMS

## 🧪 Development Scripts

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run typecheck             # Run TypeScript checks

# Data Management (requires tsx installation)
npm run import:csv            # Import from CSV
npm run seed:places           # Seed from Google Places
npm run seed:yelp             # Seed from Yelp
npm run seed:npi              # Seed from NPI Registry
npm run seed:all              # Run all seeding
npm run generate:cities       # Generate city metadata
```

## 📄 Pages

- **/** - Homepage with search and featured locations
- **/search** - Provider search with filters
- **/provider/[slug]** - Individual provider details
- **/us/[state]** - State-specific provider listings
- **/us/[state]/[city]** - City-specific provider listings
- **/add-provider** - Provider submission form
- **/about** - About page
- **/contact** - Contact information
- **/terms** - Terms of service
- **/privacy** - Privacy policy

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Add environment variables** in Vercel dashboard
3. **Deploy:** Automatic deployment on git push

### Manual Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🎯 SEO Features

- **Dynamic Meta Tags:** Title, description, OpenGraph for all pages
- **JSON-LD Structured Data:**
  - WebSite with SearchAction
  - LocalBusiness for providers
  - CollectionPage for locations
  - FAQPage for common questions
- **Sitemaps:** Auto-generated for all pages and providers
- **Robots.txt:** Proper crawling instructions
- **Canonical URLs:** Prevent duplicate content

## 🔍 Search Features

- **Text Search:** Provider names, descriptions, services
- **Location Search:** ZIP codes, cities, states
- **Service Filters:** At-home blood draws, corporate wellness, etc.
- **Availability Filters:** Weekdays, weekends, evenings, 24/7
- **Payment Filters:** Cash, insurance, Medicare, HSA/FSA
- **Sorting:** Relevance, rating, distance (placeholder), name

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@mobilephlebotomy.org or create an issue in this repository.

## 🔮 Future Enhancements

- Real-time booking integration
- Payment processing
- Provider reviews and ratings
- Mobile app
- Advanced analytics
- Multi-language support
- Insurance verification API