import * as fs from 'fs'
import * as path from 'path'

// Backfill the send log with the 47 emails already sent on 2026-03-10
const LOG_PATH = path.join(process.cwd(), 'data', 'email-send-log.json')
const CAMPAIGN = 'survey-biggest-challenge-2026-03'

const alreadySent = [
  { name: 'Gateway Mobile Phlebotomy', email: 'labs@gatewaymobilephlebotomy.com' },
  { name: 'Illumination Mobile Phlebotomy', email: 'imphlebotomy25@gmail.com' },
  { name: 'Ponce Mobile Phlebotomy', email: 'info@poncemobilephlebotomy.com' },
  { name: 'STICKS & NEEDLES MOBILE LAB LLC', email: 'sticksandneedlesllc@gmail.com' },
  { name: 'EverGreene Mobile Phlebotomy', email: 'egmphlebotomy@gmail.com' },
  { name: "Salina's Mobile Phlebotomist & Healthcare service", email: 'salinasmith21@gmail.com' },
  { name: 'LB DIAGNOSTIC LABORATORY LLC', email: 'banksglenda1@yahoo.com' },
  { name: 'CMB Group', email: 'cbarrera@cmbgroupny.com' },
  { name: 'Optimal Paramedical Exams, LLC', email: 'admin@optimalparamedicalexams.com' },
  { name: 'Butterflies & Rainbows Training LLC', email: 'support@bandrtraining.com' },
  { name: "one stick that's it lab", email: 'ameshia@onesticknola.com' },
  { name: 'UBERSTICKS MEDICAL LLC', email: 'INFO@UBERSTICKSMEDICAL.COM' },
  { name: 'Mile High Drug Test Consultants', email: 'info@milehighdtc.com' },
  { name: 'Allstar Phlebotomy LLC', email: 'allstarphlebotomy@gmail.com' },
  { name: 'Stats Phlebotomy and Drug Testing', email: 'statspdt@gmail.com' },
  { name: 'ProStik Solutions', email: 'lcallen@prostiksolutions.com' },
  { name: 'Compassion Care Phlebotomy', email: 'lab@cpclabsanywhere.com' },
  { name: 'MobileBloodDraw', email: 'starrmobileblooddraw@gmail.com' },
  { name: 'Vibrance Screening and Wellness', email: 'vibrancescreeningandwell@gmail.com' },
  { name: 'MDC Mobile Phlebotomy & Rural Health Services', email: 'mdcmobilephlebotomy@yahoo.com' },
  { name: 'I.T. Phlebotomy Solutions', email: 'info@itphlebotomysol.com' },
  { name: 'Pro Vein Mobile Phlebotomy Servic', email: 'proveinphlebotomy22@gmail.com' },
  { name: 'CAREWITHLUVS LLC', email: 'carewithluvshealth@gmail.com' },
  { name: 'Tamiana Wheel Phlebotomy', email: 'tamianawheelphlebotomy@gmail.com' },
  { name: 'Choice Mobile Lab', email: 'ebonywexam@gmail.com' },
  { name: 'Boujee Sticks And CO', email: 'boujeesticksco@gmail.com' },
  { name: 'AccuGen Diagnostics LLC', email: 'support@accugendiagnostics.com' },
  { name: 'G4 Solutions', email: 'booknow@g4solutions.online' },
  { name: 'Compassionate Touch Lab ServicesLLC', email: 'info@compassionatetouchlab.com' },
  { name: 'Tree of Life Lab Group', email: 'info@treeoflifelabgroup.com' },
  { name: "Max's CPR And Medical Training LLC", email: 'maxinechapp@icloud.com' },
  { name: 'ATL Mobile Phlebotomy/ Houston,TX', email: 'atlmobilphlebotomy@gmail.com' },
  { name: 'TrustTest Collection', email: 'INFO@TRUSTTESTCOLLECTION.COM' },
  { name: 'MediLabs LLC', email: 'medilabsllc@gmail.com' },
  { name: 'Ideal Vitality Wellness', email: 'ivliquidlounge@gmail.com' },
  { name: 'Gentle touch mobile lab services', email: 'Info@gentletouchmobilelabservices.com' },
  { name: 'LabServices Inc', email: 'info@labservicesinc.com' },
  { name: 'Stepdown Medical', email: 'morveramedicalllc@gmail.com' },
  { name: 'RAINE LAB PROS', email: 'info@rainelabpros.com' },
  { name: 'US Mobile Lab', email: 'info@usmobilelab.com' },
  { name: 'Crystallized Specimen Collections LLC', email: 'corlandra14@aol.com' },
  { name: 'CMB Group Consulting & Advisory Firm', email: 'info@cmbgroupny.com' },
  { name: 'Always There Enterprises LLC', email: 'alwaysthereenterprises@gmail.com' },
  { name: 'Just Little Poke Mobile Phlebotomy', email: 'info@justlittlepoke.com' },
  { name: 'Mobile Labs Pro', email: 'kterepka@mobilelabspro.com' },
  { name: 'Phlebcare Mobile Lab & DNA Solutions', email: 'info@mobilephlebcare.com' },
  { name: "Miriam's Mobile blood draw LLC", email: 'miriamsmobileblooddraw@gmail.com' },
]

const log = alreadySent.map(p => ({
  email: p.email.toLowerCase(),
  name: p.name,
  campaign: CAMPAIGN,
  sentAt: '2026-03-10T12:00:00.000Z',
  status: 'sent' as const
}))

const dir = path.dirname(LOG_PATH)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))

console.log(`Backfilled ${log.length} entries to ${LOG_PATH}`)
