'use client'

import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { LeadFormModal } from '@/components/ui/LeadFormModal'
import { US_STATES } from '@/lib/states'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function MobilePhlebotomyNearMePage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const faqs = [
    {
      question: 'How does a mobile phlebotomy visit work?',
      answer: 'A mobile phlebotomy visit begins when you schedule an appointment with a provider who serves your area. The phlebotomist travels to your specified location—home, office, or care facility—with all necessary equipment. They verify your identity and lab order, collect the required blood or specimen samples using sterile techniques, properly label everything, and transport the samples to their partner laboratory for processing. You receive results through your ordering physician or the lab portal, typically within 24-48 hours depending on the tests ordered.'
    },
    {
      question: 'Do I need a doctor&apos;s order for a mobile blood draw?',
      answer: 'Yes, nearly all mobile phlebotomy services require a valid laboratory requisition from a licensed healthcare provider such as a physician, nurse practitioner, or physician assistant. The lab order specifies which tests to run and ensures the testing is medically appropriate. Some direct-to-consumer lab companies offer their own ordering physicians, but most mobile phlebotomists work with orders from your existing healthcare provider.'
    },
    {
      question: 'Is mobile phlebotomy covered by insurance?',
      answer: 'Insurance coverage for mobile phlebotomy varies significantly by health plan, the laboratory processing your samples, and whether testing is medically necessary. Many insurance plans will cover the laboratory testing itself when ordered by a provider and processed by an in-network lab, but the mobile visit fee or house call charge is often a separate out-of-pocket convenience fee. Medicare and some private plans may cover home draws for homebound patients or those meeting specific medical criteria. Always verify coverage with both your insurance carrier and the laboratory before scheduling.'
    },
    {
      question: 'How much does a mobile blood draw usually cost?',
      answer: 'Mobile blood draw costs vary by provider and location, but nationally, the convenience fee for an at-home visit typically ranges from approximately $70 to $150 or more per appointment. Larger national lab services sometimes publish flat rates around $75-$80 as an add-on to laboratory testing fees. Factors affecting pricing include travel distance, appointment urgency, after-hours or weekend visits, the number of patients being drawn at one address, and any special handling requirements. This visit fee is separate from the laboratory processing charges for your actual tests.'
    },
    {
      question: 'How far in advance should I schedule a home blood draw?',
      answer: 'Scheduling timelines depend on your location and provider availability. In major metropolitan areas, many mobile phlebotomy services offer same-day or next-day appointments when their schedule allows. In less populated regions, you may need to book 2-3 days in advance. If your tests require fasting or specific timing, plan accordingly. For routine wellness testing, scheduling 24-48 hours ahead is usually sufficient. For urgent medical needs, call providers directly to discuss expedited service options.'
    },
    {
      question: 'Can mobile phlebotomists draw blood for any lab?',
      answer: 'Mobile phlebotomists typically work with specific partner laboratories, often national chains like Quest Diagnostics, LabCorp, or regional labs. When you receive a lab order from your doctor, it will specify which laboratory should process your samples. Confirm that your chosen mobile provider works with that particular lab before booking. Some mobile services have flexibility to work with multiple labs, while others have exclusive partnerships. Always verify compatibility before your appointment.'
    },
    {
      question: 'Can I get pediatric or special-handling blood draws at home?',
      answer: 'Many mobile phlebotomists are trained and experienced in pediatric blood draws, geriatric care, and special handling situations. However, not all providers offer these specialized services. When scheduling, ask specifically about the provider&apos;s experience with children, difficult veins, specialized timing requirements for hormone panels, or any other specific needs you have. Providers who specialize in home health often have extensive experience making patients of all ages comfortable during the draw.'
    },
    {
      question: 'Does MobilePhlebotomy.org provide medical advice or results?',
      answer: 'No. MobilePhlebotomy.org is a directory website that lists mobile phlebotomy providers based on publicly available information. We do not provide medical advice, lab orders, test results, or healthcare services. We do not verify credentials for all listed providers—some are verified, others are not. You must confirm all details including licensing, insurance acceptance, pricing, and qualifications directly with any provider before booking. Your test results will be delivered to your ordering healthcare provider or posted to your laboratory portal, never to this directory.'
    }
  ]

  // FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does a mobile phlebotomy visit work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A mobile phlebotomy visit begins when you schedule an appointment with a provider who serves your area. The phlebotomist travels to your specified location—home, office, or care facility—with all necessary equipment. They verify your identity and lab order, collect the required blood or specimen samples using sterile techniques, properly label everything, and transport the samples to their partner laboratory for processing. You receive results through your ordering physician or the lab portal, typically within 24-48 hours depending on the tests ordered."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need a doctor's order for a mobile blood draw?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, nearly all mobile phlebotomy services require a valid laboratory requisition from a licensed healthcare provider such as a physician, nurse practitioner, or physician assistant. The lab order specifies which tests to run and ensures the testing is medically appropriate. Some direct-to-consumer lab companies offer their own ordering physicians, but most mobile phlebotomists work with orders from your existing healthcare provider."
        }
      },
      {
        "@type": "Question",
        "name": "Is mobile phlebotomy covered by insurance?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Insurance coverage for mobile phlebotomy varies significantly by health plan, the laboratory processing your samples, and whether testing is medically necessary. Many insurance plans will cover the laboratory testing itself when ordered by a provider and processed by an in-network lab, but the mobile visit fee or house call charge is often a separate out-of-pocket convenience fee. Medicare and some private plans may cover home draws for homebound patients or those meeting specific medical criteria. Always verify coverage with both your insurance carrier and the laboratory before scheduling."
        }
      },
      {
        "@type": "Question",
        "name": "How much does a mobile blood draw usually cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Mobile blood draw costs vary by provider and location, but nationally, the convenience fee for an at-home visit typically ranges from approximately $70 to $150 or more per appointment. Larger national lab services sometimes publish flat rates around $75-$80 as an add-on to laboratory testing fees. Factors affecting pricing include travel distance, appointment urgency, after-hours or weekend visits, the number of patients being drawn at one address, and any special handling requirements. This visit fee is separate from the laboratory processing charges for your actual tests."
        }
      },
      {
        "@type": "Question",
        "name": "How far in advance should I schedule a home blood draw?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Scheduling timelines depend on your location and provider availability. In major metropolitan areas, many mobile phlebotomy services offer same-day or next-day appointments when their schedule allows. In less populated regions, you may need to book 2-3 days in advance. If your tests require fasting or specific timing, plan accordingly. For routine wellness testing, scheduling 24-48 hours ahead is usually sufficient. For urgent medical needs, call providers directly to discuss expedited service options."
        }
      },
      {
        "@type": "Question",
        "name": "Can mobile phlebotomists draw blood for any lab?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Mobile phlebotomists typically work with specific partner laboratories, often national chains like Quest Diagnostics, LabCorp, or regional labs. When you receive a lab order from your doctor, it will specify which laboratory should process your samples. Confirm that your chosen mobile provider works with that particular lab before booking. Some mobile services have flexibility to work with multiple labs, while others have exclusive partnerships. Always verify compatibility before your appointment."
        }
      },
      {
        "@type": "Question",
        "name": "Can I get pediatric or special-handling blood draws at home?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Many mobile phlebotomists are trained and experienced in pediatric blood draws, geriatric care, and special handling situations. However, not all providers offer these specialized services. When scheduling, ask specifically about the provider's experience with children, difficult veins, specialized timing requirements for hormone panels, or any other specific needs you have. Providers who specialize in home health often have extensive experience making patients of all ages comfortable during the draw."
        }
      },
      {
        "@type": "Question",
        "name": "Does MobilePhlebotomy.org provide medical advice or results?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. MobilePhlebotomy.org is a directory website that lists mobile phlebotomy providers based on publicly available information. We do not provide medical advice, lab orders, test results, or healthcare services. We do not verify credentials for all listed providers—some are verified, others are not. You must confirm all details including licensing, insurance acceptance, pricing, and qualifications directly with any provider before booking. Your test results will be delivered to your ordering healthcare provider or posted to your laboratory portal, never to this directory."
        }
      }
    ]
  }

  return (
    <>
      {/* FAQ Schema for SEO */}
      <Script
        type="application/ld+json"
        id="faq-schema"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Mobile Phlebotomy Near Me
            </h1>
            <p className="text-xl text-primary-100 mb-4">
              Find licensed mobile phlebotomists who bring professional blood draw services directly to your home, office, or care facility anywhere in the United States.
            </p>
            <p className="text-lg text-primary-100 mb-8">
              This comprehensive national guide explains how at-home blood draws work, what they cost, and how to find verified providers in your area. Submit a request below or browse our state-by-state directory.
            </p>
            <p className="text-sm text-primary-200 italic">
              MobilePhlebotomy.org is a directory of publicly listed mobile phlebotomy providers. Not all providers are verified. Always confirm credentials, pricing, and details directly with the provider before booking.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 space-y-16">
        {/* Lead Form Block */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Request a mobile phlebotomist near you
          </h2>
          <p className="text-gray-600 mb-6">
            Share a few details about your lab order and location. We&apos;ll connect your request with mobile phlebotomy providers who serve your area.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full sm:w-auto bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Submit Request
          </button>
        </section>

        {/* What is Mobile Phlebotomy */}
        <section className="prose max-w-none">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            What is mobile phlebotomy?
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Mobile phlebotomy, also called at-home blood draw services, brings licensed phlebotomists directly to patients rather than requiring a trip to a laboratory draw station or clinic. A certified professional travels to your home, workplace, senior living facility, or any location you specify, equipped with sterile collection supplies, proper labeling materials, and transport containers to safely deliver your samples to a partnered laboratory.
            </p>
            <p>
              This service model has grown substantially as healthcare shifts toward patient-centered convenience. Instead of waiting in a lab lobby, taking time off work, arranging transportation, or exposing immunocompromised individuals to clinical settings, patients can have blood, urine, or other specimens collected in a comfortable, familiar environment. Mobile phlebotomists follow the same safety protocols, sterile techniques, and regulatory standards as hospital and clinic-based professionals.
            </p>
            <p>
              Mobile phlebotomy is particularly valuable for elderly patients, individuals recovering from surgery, parents coordinating lab work for children, busy professionals who cannot leave work during standard clinic hours, and anyone seeking to minimize exposure in medical waiting rooms. The convenience fee for a home visit is often offset by saved time, reduced stress, and eliminated transportation costs.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="prose max-w-none">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            How mobile blood draws work
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              The mobile phlebotomy process is straightforward and mirrors what happens at a traditional lab, just in a location of your choosing. Understanding each step helps set proper expectations and ensures a smooth experience.
            </p>
            <ul className="list-disc pl-6 space-y-3 my-6">
              <li>
                <strong>Scheduling:</strong> You contact a mobile phlebotomy provider serving your area and schedule an appointment within a specific time window. Many providers offer same-day or next-day service in urban areas, though rural locations may require more advance notice.
              </li>
              <li>
                <strong>Preparation:</strong> Follow any preparation instructions from your ordering healthcare provider (fasting, medication timing, hydration). The mobile phlebotomist will confirm these requirements when scheduling.
              </li>
              <li>
                <strong>Arrival and verification:</strong> At your appointed time, the phlebotomist arrives with all necessary equipment. They verify your identity, review your lab order or requisition, and confirm which tests are being collected.
              </li>
              <li>
                <strong>Sample collection:</strong> Using sterile, single-use needles and collection tubes, the phlebotomist draws your blood or collects other specimens. They follow strict infection control procedures and dispose of sharps safely.
              </li>
              <li>
                <strong>Labeling and transport:</strong> Each sample is immediately labeled with your information and the required test codes. The phlebotomist packages specimens according to laboratory standards and transports them to the designated lab, maintaining proper temperature and handling.
              </li>
              <li>
                <strong>Results delivery:</strong> Your test results are sent to your ordering healthcare provider or posted to the laboratory&apos;s patient portal. MobilePhlebotomy.org does not receive or provide any test results—we are only a directory for finding providers.
              </li>
            </ul>
            <p className="text-sm text-gray-600 italic">
              The directory does not provide medical advice, test interpretation, or clinical recommendations. All medical questions should be directed to your healthcare provider.
            </p>
          </div>
        </section>

        {/* Why Choose Mobile Phlebotomy */}
        <section className="bg-gradient-to-br from-blue-50 to-primary-50 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Why choose mobile phlebotomy over going to a lab?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h3 className="font-semibold text-lg mb-3">Convenience and time savings</h3>
              <p className="text-sm">
                Eliminate travel time, parking fees, and waiting room delays. A mobile phlebotomist comes to you on your schedule, often before work hours or during lunch breaks when traditional labs are busiest.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Reduced exposure risk</h3>
              <p className="text-sm">
                Avoid clinical waiting rooms and potential exposure to illnesses. This is especially important for immunocompromised patients, pregnant women, and individuals recovering from surgery.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Accessibility for homebound patients</h3>
              <p className="text-sm">
                Elderly patients, those with mobility challenges, or individuals without reliable transportation can access necessary lab testing without the burden of arranging rides or navigating public transit.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Comfort and reduced anxiety</h3>
              <p className="text-sm">
                Being in a familiar environment often reduces stress and anxiety, particularly for children or individuals who experience medical-setting anxiety. You control the environment and can have family present.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="prose max-w-none">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Typical costs and pricing for mobile blood draws
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Mobile phlebotomy pricing varies by provider, location, and service requirements, but understanding national trends helps you budget appropriately. The total cost typically includes two separate components: the mobile visit fee (convenience charge) and the laboratory testing fees.
            </p>
            <p>
              Across the United States, the <strong>mobile visit fee</strong> generally ranges from approximately <strong>$70 to $150 or more</strong> per appointment. Large national laboratory services that have expanded into mobile collection sometimes advertise flat fees around <strong>$75-$80</strong> as an add-on to your lab test costs. Independent mobile phlebotomy businesses may charge toward the higher end of the range or adjust pricing based on several factors.
            </p>
            <p>
              <strong>Factors that influence mobile phlebotomy pricing include:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 my-6">
              <li>Travel distance from the provider&apos;s base location to your address</li>
              <li>Appointment urgency (same-day, STAT, or emergency requests often cost more)</li>
              <li>Time of service (early morning, evening, weekend, or holiday visits may incur surcharges)</li>
              <li>Number of patients at one location (some providers offer discounts for multiple family members or employees at a single address)</li>
              <li>Special handling requirements (pediatric draws, difficult access, specific timing for hormone tests)</li>
              <li>Geographic cost of living (providers in high-cost metro areas typically charge more than those in rural regions)</li>
            </ul>
            <p>
              The mobile visit fee is usually a flat charge for the phlebotomist&apos;s time and travel, separate from the <strong>laboratory processing costs</strong> for your actual tests. Lab fees depend entirely on which tests your doctor ordered—a basic metabolic panel might cost $30-$50 at the lab level, while comprehensive hormone or genetic panels can run several hundred dollars. Check with your insurance and the laboratory to understand coverage for the testing component.
            </p>
            <p className="text-sm text-gray-600 bg-gray-50 border-l-4 border-gray-400 p-4 italic">
              <strong>Disclaimer:</strong> The pricing ranges above are general estimates based on national averages and are not quotes or guarantees. Mobile phlebotomy costs vary significantly by provider, region, and specific service requirements. Always confirm the exact visit fee, what it includes, accepted payment methods, and cancellation policies directly with the provider before booking your appointment.
            </p>
          </div>
        </section>

        {/* Insurance Section */}
        <section className="prose max-w-none">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Insurance coverage and doctor&apos;s orders
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Understanding insurance coverage for mobile phlebotomy can be complex because it involves multiple parties: your health insurance plan, the laboratory processing your tests, and the mobile phlebotomy provider. These three entities have separate billing and coverage rules.
            </p>
            <p>
              <strong>Laboratory testing</strong> is often covered by insurance when a licensed healthcare provider orders medically necessary tests and the lab is in your insurance network. If your doctor writes an order for blood work and sends it to Quest Diagnostics or LabCorp (assuming they&apos;re in-network), your standard deductible, copay, and coinsurance rules apply just as they would if you went to a lab draw station.
            </p>
            <p>
              However, the <strong>mobile visit fee or house call charge</strong> for bringing the phlebotomist to your location is typically billed separately and is often an out-of-pocket convenience fee. Most insurance plans do not cover home visit fees unless specific conditions are met.
            </p>
            <p>
              <strong>Key insurance and billing considerations:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-3 my-6">
              <li>
                <strong>Lab order requirement:</strong> You almost always need a valid requisition from a doctor, nurse practitioner, physician assistant, or other authorized provider. The order must specify which tests to run and the medical justification.
              </li>
              <li>
                <strong>Lab network status:</strong> Verify that the laboratory processing your samples is in your insurance network. Even if the mobile phlebotomist accepts your insurance card, if they send specimens to an out-of-network lab, you may face surprise bills.
              </li>
              <li>
                <strong>Homebound coverage:</strong> Medicare and some private insurance plans may cover home phlebotomy for patients who are certified as homebound, recovering from surgery, or meet other medical criteria. This requires specific documentation from your physician.
              </li>
              <li>
                <strong>Mobile fee payment:</strong> Many mobile phlebotomy services operate on a cash-pay or credit card basis for the visit fee, even when the laboratory testing itself is billed to insurance. Always ask upfront about payment expectations.
              </li>
              <li>
                <strong>Superbills and reimbursement:</strong> Some providers can provide a detailed receipt (superbill) that you can submit to your insurance for potential out-of-network reimbursement, though approval is not guaranteed.
              </li>
            </ul>
            <p className="text-sm text-gray-600 bg-gray-50 border-l-4 border-gray-400 p-4 italic">
              <strong>Disclaimer:</strong> This information is general educational content and not insurance or medical advice. Coverage rules vary dramatically by health plan, state, and individual circumstances. Before scheduling mobile phlebotomy, call your insurance carrier and the specific laboratory listed on your order to confirm coverage, copays, deductibles, and whether home collection fees are covered under your plan.
            </p>
          </div>
        </section>

        {/* Who Uses Section */}
        <section className="prose max-w-none">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Who uses mobile phlebotomy services?
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Mobile phlebotomy appeals to a wide range of patients across different life stages and circumstances. While the service was once primarily marketed to homebound or elderly populations, it has expanded to serve anyone valuing convenience, safety, or specialized care in a home setting.
            </p>
            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3">Homebound and post-surgical patients</h3>
                <p className="text-sm">
                  Individuals recovering from surgery, managing chronic conditions at home, or those with limited mobility find mobile phlebotomy essential for monitoring health without the physical burden of travel.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3">Seniors and elderly populations</h3>
                <p className="text-sm">
                  Older adults who no longer drive or have difficulty navigating medical facilities appreciate the dignity and comfort of receiving care at home.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3">Parents with young children</h3>
                <p className="text-sm">
                  Families scheduling pediatric lab work at home avoid the stress of keeping children calm in unfamiliar clinical settings and eliminate the logistics of coordinating childcare for siblings.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3">Busy professionals</h3>
                <p className="text-sm">
                  Working adults who cannot afford to miss work or sit in lab waiting rooms schedule early morning or lunchtime mobile visits to stay on top of preventive health.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3">Immunocompromised individuals</h3>
                <p className="text-sm">
                  Cancer patients, organ transplant recipients, and others with weakened immune systems minimize infection risk by avoiding crowded medical waiting areas.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3">Senior living and long-term care facilities</h3>
                <p className="text-sm">
                  Assisted living communities, nursing homes, and memory care facilities often contract with mobile phlebotomists to provide routine lab services for multiple residents on-site.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3">Wellness and functional medicine patients</h3>
                <p className="text-sm">
                  Individuals pursuing hormone optimization, nutrition testing, or comprehensive wellness panels through functional medicine providers often use mobile phlebotomy for convenience.
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3">Corporate wellness programs</h3>
                <p className="text-sm">
                  Some employers bring mobile phlebotomy on-site for employee health screenings, biometric testing, or annual wellness check labs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How to Choose a Provider */}
        <section className="prose max-w-none">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            How to choose a mobile phlebotomy provider
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Not all mobile phlebotomy services are created equal. Taking time to vet providers ensures you receive professional, safe service and avoid unexpected costs or complications. Here are key factors to evaluate when choosing a mobile phlebotomist.
            </p>
            <ul className="list-disc pl-6 space-y-4 my-6">
              <li>
                <strong>Service area coverage:</strong> Confirm the provider serves your specific address. Some providers cover entire metropolitan areas, while others have radius limitations from their base. Rural addresses may have fewer options or longer wait times.
              </li>
              <li>
                <strong>Laboratory partnerships:</strong> Ask which laboratories the provider works with and verify that matches the lab listed on your doctor&apos;s order. If you have insurance, confirm those labs are in your network.
              </li>
              <li>
                <strong>Credentials and experience:</strong> Verify the phlebotomist holds current certification through organizations like ASCP (American Society for Clinical Pathology), NPA (National Phlebotomy Association), or state-specific licensing. Ask about their experience level, especially if you need pediatric, geriatric, or difficult-access draws.
              </li>
              <li>
                <strong>Pricing transparency:</strong> Request a clear breakdown of the mobile visit fee versus laboratory charges. Confirm accepted payment methods, when payment is due, and if there are any hidden fees for mileage, after-hours service, or failed draw attempts.
              </li>
              <li>
                <strong>Scheduling flexibility:</strong> Understand the provider&apos;s availability windows. Do they offer evening or weekend appointments? How much advance notice do they require? What is their cancellation policy?
              </li>
              <li>
                <strong>Test capabilities:</strong> Confirm the provider can handle your specific test requirements. Some tests need special timing (fasting, specific times of day), temperature control, or handling. Pediatric draws, INR/warfarin monitoring, or specialty hormone panels may require additional expertise.
              </li>
              <li>
                <strong>Insurance and liability coverage:</strong> Ask if the provider carries professional liability insurance and what protections are in place if something goes wrong.
              </li>
              <li>
                <strong>Communication and responsiveness:</strong> A professional mobile phlebotomy service should respond promptly to initial inquiries, provide clear instructions, confirm appointments, and be reachable if issues arise.
              </li>
            </ul>
            <p>
              MobilePhlebotomy.org lists providers based on publicly available information, but we do not verify credentials or vet every listed service. Always do your own due diligence before booking.
            </p>
          </div>
        </section>

        {/* State Directory */}
        <section id="state-directory" className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Find mobile phlebotomy providers by state
          </h2>
          <p className="text-gray-600 mb-8">
            Browse our state-level directories to see mobile phlebotomy services that list coverage in your area. Each state page includes providers serving that region, local pricing insights, and links to major cities.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {US_STATES.map((state) => (
              <Link
                key={state.slug}
                href={`/us/${state.slug}`}
                className="text-primary-600 hover:text-primary-700 hover:underline text-sm font-medium"
              >
                {state.name}
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Mobile Phlebotomy FAQs
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  {openFaq === index ? (
                    <ChevronUp className="flex-shrink-0 text-primary-600" size={20} />
                  ) : (
                    <ChevronDown className="flex-shrink-0 text-gray-400" size={20} />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-700 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to schedule your at-home blood draw?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Mobile phlebotomy brings the lab to you. Submit a request to connect with providers in your area, or browse our complete state directory to find services near you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-white text-primary-700 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow-lg"
            >
              Submit Request
            </button>
            <a
              href="#state-directory"
              className="bg-primary-800 text-white px-8 py-3 rounded-lg hover:bg-primary-900 transition-colors font-semibold border-2 border-primary-500"
            >
              Browse Providers by State
            </a>
          </div>
        </section>
      </main>

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
    </>
  )
}
