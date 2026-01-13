import { prisma } from '../lib/prisma'

async function updateCMBComplete() {
  console.log('🔄 Updating CMB Group provider with complete information...\n')

  const providerId = 'cmjx8sing0007jv04bqrz1th5'

  // NYC ZIP codes for all 5 boroughs
  const nycZipCodes = [
    // Manhattan
    '10001', '10002', '10003', '10004', '10005', '10006', '10007', '10009', '10010', '10011',
    '10012', '10013', '10014', '10016', '10017', '10018', '10019', '10020', '10021', '10022',
    '10023', '10024', '10025', '10026', '10027', '10028', '10029', '10030', '10031', '10032',
    '10033', '10034', '10035', '10036', '10037', '10038', '10039', '10040', '10044', '10065',
    '10069', '10075', '10128', '10280', '10282',
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
    '11428', '11429', '11430', '11432', '11433', '11434', '11435', '11436', '11691', '11692',
    '11693', '11694', '11697',
    // Bronx
    '10451', '10452', '10453', '10454', '10455', '10456', '10457', '10458', '10459', '10460',
    '10461', '10462', '10463', '10464', '10465', '10466', '10467', '10468', '10469', '10470',
    '10471', '10472', '10473', '10474', '10475',
    // Staten Island
    '10301', '10302', '10303', '10304', '10305', '10306', '10307', '10308', '10309', '10310',
    '10312', '10314',
    // Nassau County (Long Island)
    '11001', '11003', '11010', '11020', '11021', '11023', '11024', '11030', '11040', '11042',
    '11050', '11051', '11052', '11053', '11054', '11055', '11096', '11501', '11507', '11509',
    '11510', '11514', '11516', '11518', '11520', '11530', '11542', '11545', '11547', '11548',
    '11549', '11550', '11551', '11552', '11553', '11554', '11555', '11556', '11557', '11558',
    '11559', '11560', '11561', '11563', '11565', '11566', '11568', '11569', '11570', '11572',
    '11575', '11576', '11577', '11579', '11580', '11581', '11590', '11596', '11598', '11599',
    // Northern NJ (Bergen, Hudson, Essex counties)
    '07002', '07003', '07004', '07006', '07010', '07020', '07021', '07022', '07024', '07026',
    '07029', '07030', '07031', '07032', '07070', '07071', '07072', '07073', '07074', '07075',
    '07086', '07087', '07093', '07094', '07095', '07097', '07099', '07102', '07103', '07104',
    '07105', '07106', '07107', '07108', '07109', '07110', '07111', '07112', '07114'
  ].join(',')

  // Update provider with complete information (only DB fields)
  const provider = await prisma.provider.update({
    where: { id: providerId },
    data: {
      // Update only fields that exist in the schema
      zipCodes: nycZipCodes,
      description: `CMB Group Consulting & Advisory Firm provides comprehensive mobile phlebotomy and health services across NYC and Northern New Jersey.

**Primary Contact:** Dr. Carlos M. Barrera (Executive Director)

**Service Locations:**

📍 NYC Office (Primary):
845 Castleton Ave, Staten Island, NY 10310
Hours: Mon–Fri 10am–7pm, Sat 10am–3pm, Sun Closed

📍 NJ Office:
473 Broadway, Suite 403, Bayonne, NJ 07002
Hours: Mon/Wed/Fri 10am–6pm, Sat 10am–3pm, Tue/Thu/Sun Closed

**Coverage Area:**
• All of NYC (5 boroughs)
• Nassau County (Long Island)
• Northern New Jersey

**Languages Spoken:**
English, Spanish, Chinese, Arabic, Italian

**Comprehensive Services:**
At-home blood draws, immunizations, specimen pickup, lab partner services, telehealth, corporate wellness programs, mobile laboratory, diagnostic services, chiropractic services, collection site, occupational health, biometrics, DNA testing, drug testing, eye exams, IV therapy, physical examinations, and notary public services.`
    }
  })

  console.log('✅ CMB Group provider updated successfully!')
  console.log('\n' + '='.repeat(60))
  console.log('Updated Information:')
  console.log('='.repeat(60))
  console.log('Name:', provider.name)
  console.log('Email:', provider.email)
  console.log('Phone:', provider.phone)
  console.log('Website:', provider.website)
  console.log('Logo:', provider.logo)
  console.log('Profile Image:', provider.profileImage)
  console.log('ZIP Codes:', nycZipCodes.split(',').length, 'zip codes')
  console.log('\n✨ All updates complete!')
  console.log('\n📝 Note: Languages and service details are in the description field')

  await prisma.$disconnect()
}

updateCMBComplete().catch(error => {
  console.error('Error:', error)
  prisma.$disconnect()
})
