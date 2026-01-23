import { prisma } from '../lib/prisma'

/**
 * Configure CMB Group as featured provider for all NYC + NJ pages
 * Set primary location and coverage areas
 */
async function configureCMBCoverage() {
  console.log('🔍 Finding CMB Group...\n')

  const cmb = await prisma.provider.findFirst({
    where: { name: { contains: 'CMB Group' } }
  })

  if (!cmb) {
    console.log('❌ CMB Group not found')
    await prisma.$disconnect()
    return
  }

  console.log(`✅ Found: ${cmb.name}`)
  console.log(`   Current Primary State: ${cmb.primaryState}`)
  console.log(`   Current Primary City: ${cmb.primaryCity}`)
  console.log()

  // Define NYC + NJ metro coverage
  const nycZips = [
    // Manhattan
    '10001', '10002', '10003', '10004', '10005', '10006', '10007', '10009', '10010', '10011',
    '10012', '10013', '10014', '10016', '10017', '10018', '10019', '10020', '10021', '10022',
    '10023', '10024', '10025', '10026', '10027', '10028', '10029', '10030', '10031', '10032',
    '10033', '10034', '10035', '10036', '10037', '10038', '10039', '10040',
    // Brooklyn
    '11201', '11203', '11204', '11205', '11206', '11207', '11208', '11209', '11210', '11211',
    '11212', '11213', '11214', '11215', '11216', '11217', '11218', '11219', '11220', '11221',
    '11222', '11223', '11224', '11225', '11226', '11228', '11229', '11230', '11231', '11232',
    '11233', '11234', '11235', '11236', '11237', '11238', '11239',
    // Queens
    '11354', '11355', '11356', '11357', '11358', '11359', '11360', '11361', '11362', '11363',
    '11364', '11365', '11366', '11367', '11368', '11369', '11370', '11372', '11373', '11374',
    '11375', '11377', '11378', '11379', '11385', '11411', '11412', '11413', '11414', '11415',
    '11416', '11417', '11418', '11419', '11420', '11421', '11422', '11423', '11426', '11427',
    '11428', '11429', '11430', '11432', '11433', '11434', '11435', '11436',
    // Bronx
    '10451', '10452', '10453', '10454', '10455', '10456', '10457', '10458', '10459', '10460',
    '10461', '10462', '10463', '10464', '10465', '10466', '10467', '10468', '10469', '10470',
    '10471', '10472', '10473', '10474', '10475',
    // Staten Island
    '10301', '10302', '10303', '10304', '10305', '10306', '10307', '10308', '10309', '10310',
    '10312', '10314',
    // Northern NJ (Newark, Jersey City, Bayonne)
    '07002', '07101', '07102', '07103', '07104', '07105', '07106', '07107', '07108',
    '07302', '07303', '07304', '07305', '07306', '07307', '07310', '07311',
    '07002'
  ]

  console.log('📝 Updating primary location and service area...\n')

  const updated = await prisma.provider.update({
    where: { id: cmb.id },
    data: {
      primaryState: 'NY',
      primaryStateName: 'New York',
      primaryStateSlug: 'new-york',
      primaryCity: 'New York',
      primaryCitySlug: 'new-york',
      primaryMetro: 'New York',
      zipCodes: nycZips.join(','),
      serviceRadiusMiles: 50
    }
  })

  console.log('✅ Primary location updated successfully!')
  console.log()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 NEW CONFIGURATION:')
  console.log(`  Provider: ${updated.name}`)
  console.log(`  Primary State: ${updated.primaryState}`)
  console.log(`  Primary City: ${updated.primaryCity}`)
  console.log(`  Service Radius: ${updated.serviceRadiusMiles} miles`)
  console.log(`  Zip Codes: ${nycZips.length} configured`)
  console.log(`  Featured: ${updated.isFeatured ? 'Yes' : 'No'}`)
  console.log(`  Featured City: ${updated.isFeaturedCity ? 'Yes' : 'No'}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  console.log('✅ CMB will now appear on all NYC + NJ pages')
  console.log('✅ They will receive leads for NYC metro area')
  console.log()

  await prisma.$disconnect()
}

// Run the script
configureCMBCoverage().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
