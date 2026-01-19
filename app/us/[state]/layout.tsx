import { Metadata } from 'next'

interface StateLayoutProps {
  children: React.ReactNode
  params: {
    state: string
  }
}

// State data with full names and abbreviations
const stateData: Record<string, {name: string, abbr: string}> = {
  'alabama': { name: 'Alabama', abbr: 'AL' },
  'alaska': { name: 'Alaska', abbr: 'AK' },
  'arizona': { name: 'Arizona', abbr: 'AZ' },
  'arkansas': { name: 'Arkansas', abbr: 'AR' },
  'california': { name: 'California', abbr: 'CA' },
  'colorado': { name: 'Colorado', abbr: 'CO' },
  'connecticut': { name: 'Connecticut', abbr: 'CT' },
  'delaware': { name: 'Delaware', abbr: 'DE' },
  'florida': { name: 'Florida', abbr: 'FL' },
  'georgia': { name: 'Georgia', abbr: 'GA' },
  'hawaii': { name: 'Hawaii', abbr: 'HI' },
  'idaho': { name: 'Idaho', abbr: 'ID' },
  'illinois': { name: 'Illinois', abbr: 'IL' },
  'indiana': { name: 'Indiana', abbr: 'IN' },
  'iowa': { name: 'Iowa', abbr: 'IA' },
  'kansas': { name: 'Kansas', abbr: 'KS' },
  'kentucky': { name: 'Kentucky', abbr: 'KY' },
  'louisiana': { name: 'Louisiana', abbr: 'LA' },
  'maine': { name: 'Maine', abbr: 'ME' },
  'maryland': { name: 'Maryland', abbr: 'MD' },
  'massachusetts': { name: 'Massachusetts', abbr: 'MA' },
  'michigan': { name: 'Michigan', abbr: 'MI' },
  'minnesota': { name: 'Minnesota', abbr: 'MN' },
  'mississippi': { name: 'Mississippi', abbr: 'MS' },
  'missouri': { name: 'Missouri', abbr: 'MO' },
  'montana': { name: 'Montana', abbr: 'MT' },
  'nebraska': { name: 'Nebraska', abbr: 'NE' },
  'nevada': { name: 'Nevada', abbr: 'NV' },
  'new-hampshire': { name: 'New Hampshire', abbr: 'NH' },
  'new-jersey': { name: 'New Jersey', abbr: 'NJ' },
  'new-mexico': { name: 'New Mexico', abbr: 'NM' },
  'new-york': { name: 'New York', abbr: 'NY' },
  'north-carolina': { name: 'North Carolina', abbr: 'NC' },
  'north-dakota': { name: 'North Dakota', abbr: 'ND' },
  'ohio': { name: 'Ohio', abbr: 'OH' },
  'oklahoma': { name: 'Oklahoma', abbr: 'OK' },
  'oregon': { name: 'Oregon', abbr: 'OR' },
  'pennsylvania': { name: 'Pennsylvania', abbr: 'PA' },
  'rhode-island': { name: 'Rhode Island', abbr: 'RI' },
  'south-carolina': { name: 'South Carolina', abbr: 'SC' },
  'south-dakota': { name: 'South Dakota', abbr: 'SD' },
  'tennessee': { name: 'Tennessee', abbr: 'TN' },
  'texas': { name: 'Texas', abbr: 'TX' },
  'utah': { name: 'Utah', abbr: 'UT' },
  'vermont': { name: 'Vermont', abbr: 'VT' },
  'virginia': { name: 'Virginia', abbr: 'VA' },
  'washington': { name: 'Washington', abbr: 'WA' },
  'west-virginia': { name: 'West Virginia', abbr: 'WV' },
  'wisconsin': { name: 'Wisconsin', abbr: 'WI' },
  'wyoming': { name: 'Wyoming', abbr: 'WY' }
}

export async function generateMetadata({ params }: { params: { state: string } }): Promise<Metadata> {
  const stateInfo = stateData[params.state.toLowerCase()]

  if (!stateInfo) {
    return {
      title: 'State Not Found',
      description: 'The requested state was not found.'
    }
  }

  const title = `Mobile Phlebotomy ${stateInfo.name} | Top At-Home Blood Draw Services (2026)`
  const description = `🏆 #1 mobile phlebotomy directory in ${stateInfo.name}! Find certified, licensed phlebotomists statewide. Same-day service, insurance accepted. 100+ verified providers in ${stateInfo.abbr}.`

  return {
    title,
    description,
    keywords: `mobile phlebotomy ${stateInfo.name}, at-home blood draw ${stateInfo.name}, phlebotomist ${stateInfo.name}, mobile lab services ${stateInfo.abbr}, home blood test ${stateInfo.name}`,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
    },
  }
}

export default function StateLayout({ children }: StateLayoutProps) {
  return children
}