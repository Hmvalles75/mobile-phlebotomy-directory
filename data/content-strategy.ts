export interface ContentKeyword {
  primary: string
  secondary: string[]
  searchVolume: string
  difficulty: string
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational'
}

export interface ContentPage {
  slug: string
  title: string
  metaDescription: string
  h1: string
  keywords: ContentKeyword
  contentType: 'guide' | 'comparison' | 'pricing' | 'local' | 'faq' | 'process'
  internalLinks: string[]
  featured: boolean
}

export const nonBrandedKeywords: ContentPage[] = [
  // High-volume informational keywords
  {
    slug: 'at-home-blood-draw-services',
    title: 'At-Home Blood Draw Services: Complete Guide to Mobile Phlebotomy (2026)',
    metaDescription: 'Everything you need to know about at-home blood draw services. Find certified mobile phlebotomists, costs, insurance coverage, and how to book appointments near you.',
    h1: 'At-Home Blood Draw Services: Your Complete Guide',
    keywords: {
      primary: 'at-home blood draw services',
      secondary: [
        'mobile blood draw',
        'home phlebotomy services',
        'at home blood work',
        'mobile lab services',
        'home blood collection',
        'traveling phlebotomist',
        'mobile blood testing',
        'in-home blood draw'
      ],
      searchVolume: '8,100/month',
      difficulty: 'Medium',
      intent: 'informational'
    },
    contentType: 'guide',
    internalLinks: ['/search', '/metros', '/us/california', '/us/texas', '/us/florida'],
    featured: true
  },

  // Cost-focused commercial intent
  {
    slug: 'mobile-phlebotomy-cost',
    title: 'Mobile Phlebotomy Cost: Pricing Guide & Insurance Coverage (2026)',
    metaDescription: 'Mobile phlebotomy costs $60-150 per visit. Learn about pricing factors, insurance coverage, Medicare/Medicaid acceptance, and ways to save money on at-home blood draws.',
    h1: 'How Much Does Mobile Phlebotomy Cost?',
    keywords: {
      primary: 'mobile phlebotomy cost',
      secondary: [
        'at home blood draw cost',
        'mobile blood draw price',
        'home phlebotomy pricing',
        'blood draw at home cost',
        'mobile lab cost',
        'traveling phlebotomist cost',
        'at home blood work price',
        'mobile phlebotomy rates'
      ],
      searchVolume: '3,600/month',
      difficulty: 'Low',
      intent: 'commercial'
    },
    contentType: 'pricing',
    internalLinks: ['/search', '/metros', '/about'],
    featured: true
  },

  // Local/near me searches
  {
    slug: 'mobile-blood-draw-near-me',
    title: 'Mobile Blood Draw Near Me: Find Local At-Home Services',
    metaDescription: 'Find mobile blood draw services near you. Search 1000+ certified phlebotomists offering at-home blood collection in your area. Same-day appointments available.',
    h1: 'Mobile Blood Draw Near Me',
    keywords: {
      primary: 'mobile blood draw near me',
      secondary: [
        'at home blood draw near me',
        'phlebotomist near me',
        'mobile phlebotomy near me',
        'home blood draw service near me',
        'traveling phlebotomist near me',
        'blood work at home near me',
        'mobile lab near me',
        'at home blood collection near me'
      ],
      searchVolume: '12,100/month',
      difficulty: 'High',
      intent: 'transactional'
    },
    contentType: 'local',
    internalLinks: ['/search', '/metros', '/us/california/los-angeles', '/us/texas/houston', '/us/florida/miami'],
    featured: true
  },

  // Process and how-to content
  {
    slug: 'how-mobile-phlebotomy-works',
    title: 'How Mobile Phlebotomy Works: Step-by-Step Process Guide',
    metaDescription: 'Learn how mobile phlebotomy works from booking to results. Step-by-step guide to at-home blood draws, what to expect, preparation tips, and safety protocols.',
    h1: 'How Does Mobile Phlebotomy Work?',
    keywords: {
      primary: 'how mobile phlebotomy works',
      secondary: [
        'mobile blood draw process',
        'at home blood draw procedure',
        'what to expect mobile phlebotomy',
        'home blood collection process',
        'traveling phlebotomist procedure',
        'mobile lab services process'
      ],
      searchVolume: '1,900/month',
      difficulty: 'Low',
      intent: 'informational'
    },
    contentType: 'process',
    internalLinks: ['/search', '/about', '/contact'],
    featured: false
  },

  // Comparison content
  {
    slug: 'mobile-phlebotomy-vs-lab',
    title: 'Mobile Phlebotomy vs Lab: Which Is Better for Blood Draws?',
    metaDescription: 'Mobile phlebotomy vs traditional lab visits: Compare costs, convenience, accuracy, and safety. Find out which option is best for your blood draw needs.',
    h1: 'Mobile Phlebotomy vs Traditional Lab: Complete Comparison',
    keywords: {
      primary: 'mobile phlebotomy vs lab',
      secondary: [
        'at home blood draw vs lab',
        'mobile vs clinic blood draw',
        'home phlebotomy benefits',
        'mobile blood draw advantages',
        'at home vs lab blood work'
      ],
      searchVolume: '880/month',
      difficulty: 'Low',
      intent: 'informational'
    },
    contentType: 'comparison',
    internalLinks: ['/at-home-blood-draw-services', '/mobile-phlebotomy-cost', '/search'],
    featured: false
  },

  // Insurance and coverage
  {
    slug: 'mobile-phlebotomy-insurance-coverage',
    title: 'Mobile Phlebotomy Insurance Coverage: Medicare, Medicaid & Private Plans',
    metaDescription: 'Does insurance cover mobile phlebotomy? Learn about Medicare, Medicaid, and private insurance coverage for at-home blood draws. CPT codes and billing info.',
    h1: 'Mobile Phlebotomy Insurance Coverage Guide',
    keywords: {
      primary: 'mobile phlebotomy insurance coverage',
      secondary: [
        'does insurance cover mobile phlebotomy',
        'Medicare mobile phlebotomy',
        'at home blood draw insurance',
        'mobile blood draw Medicare',
        'phlebotomy insurance billing'
      ],
      searchVolume: '1,400/month',
      difficulty: 'Medium',
      intent: 'informational'
    },
    contentType: 'guide',
    internalLinks: ['/mobile-phlebotomy-cost', '/search'],
    featured: false
  },

  // Safety and certification
  {
    slug: 'mobile-phlebotomy-safety',
    title: 'Mobile Phlebotomy Safety: Certification, Training & Best Practices',
    metaDescription: 'Learn about mobile phlebotomy safety standards, phlebotomist certification requirements, infection control, and what makes at-home blood draws safe.',
    h1: 'Is Mobile Phlebotomy Safe? Certification & Safety Standards',
    keywords: {
      primary: 'mobile phlebotomy safety',
      secondary: [
        'is mobile phlebotomy safe',
        'phlebotomist certification',
        'mobile blood draw safety',
        'at home blood draw safety',
        'phlebotomy training requirements'
      ],
      searchVolume: '720/month',
      difficulty: 'Low',
      intent: 'informational'
    },
    contentType: 'guide',
    internalLinks: ['/at-home-blood-draw-services', '/search'],
    featured: false
  },

  // Specialty services
  {
    slug: 'pediatric-mobile-phlebotomy',
    title: 'Pediatric Mobile Phlebotomy: At-Home Blood Draws for Children',
    metaDescription: 'Pediatric mobile phlebotomy services for children. Find certified pediatric phlebotomists offering gentle, stress-free at-home blood draws for kids.',
    h1: 'Pediatric Mobile Phlebotomy: At-Home Blood Draws for Children',
    keywords: {
      primary: 'pediatric mobile phlebotomy',
      secondary: [
        'mobile phlebotomy for children',
        'pediatric blood draw at home',
        'kids mobile blood draw',
        'children phlebotomy services',
        'pediatric phlebotomist'
      ],
      searchVolume: '590/month',
      difficulty: 'Low',
      intent: 'commercial'
    },
    contentType: 'guide',
    internalLinks: ['/search?services=Pediatric', '/at-home-blood-draw-services'],
    featured: false
  },

  // Senior services
  {
    slug: 'geriatric-mobile-phlebotomy',
    title: 'Geriatric Mobile Phlebotomy: At-Home Blood Draws for Seniors',
    metaDescription: 'Geriatric mobile phlebotomy for seniors and elderly patients. Compassionate at-home blood draw services with experienced geriatric phlebotomists.',
    h1: 'Geriatric Mobile Phlebotomy: Senior-Focused Blood Draw Services',
    keywords: {
      primary: 'geriatric mobile phlebotomy',
      secondary: [
        'mobile phlebotomy for seniors',
        'elderly blood draw at home',
        'senior phlebotomy services',
        'geriatric phlebotomist',
        'mobile blood draw elderly'
      ],
      searchVolume: '320/month',
      difficulty: 'Low',
      intent: 'commercial'
    },
    contentType: 'guide',
    internalLinks: ['/search?services=Geriatric', '/at-home-blood-draw-services'],
    featured: false
  },

  // Corporate services
  {
    slug: 'corporate-mobile-phlebotomy',
    title: 'Corporate Mobile Phlebotomy: Workplace Health Screening Services',
    metaDescription: 'Corporate mobile phlebotomy services for employee health screenings, wellness programs, and on-site blood draws. Improve workplace health and productivity.',
    h1: 'Corporate Mobile Phlebotomy: On-Site Employee Health Services',
    keywords: {
      primary: 'corporate mobile phlebotomy',
      secondary: [
        'workplace blood draw services',
        'employee health screening mobile',
        'corporate wellness phlebotomy',
        'on-site blood draw services',
        'mobile phlebotomy for business'
      ],
      searchVolume: '480/month',
      difficulty: 'Low',
      intent: 'commercial'
    },
    contentType: 'guide',
    internalLinks: ['/search?services=Corporate%20Wellness', '/contact'],
    featured: false
  }
]

export const featuredSnippetTargets = [
  {
    question: "What is mobile phlebotomy?",
    answer: "Mobile phlebotomy is a healthcare service where certified phlebotomists travel to patients' homes, offices, or preferred locations to collect blood samples for laboratory testing. This convenient alternative to traditional lab visits eliminates wait times and provides a comfortable, familiar environment for blood draws.",
    targetPage: "/at-home-blood-draw-services"
  },
  {
    question: "How much does mobile phlebotomy cost?",
    answer: "Mobile phlebotomy typically costs between $60-150 per visit, depending on location, services requested, and provider. Many insurance plans cover mobile phlebotomy when medically necessary. Medicare and Medicaid often provide coverage for homebound patients.",
    targetPage: "/mobile-phlebotomy-cost"
  },
  {
    question: "Is mobile phlebotomy safe?",
    answer: "Yes, mobile phlebotomy is safe when performed by certified professionals. Mobile phlebotomists must maintain the same licensing, certification, and infection control standards as hospital-based phlebotomists. They use sterile equipment and follow strict safety protocols.",
    targetPage: "/mobile-phlebotomy-safety"
  },
  {
    question: "Does insurance cover mobile phlebotomy?",
    answer: "Many insurance plans cover mobile phlebotomy, including Medicare, Medicaid, and most private insurance. Coverage depends on medical necessity and your specific plan. Mobile phlebotomy is typically covered for homebound patients, elderly individuals, or those with mobility limitations.",
    targetPage: "/mobile-phlebotomy-insurance-coverage"
  }
]