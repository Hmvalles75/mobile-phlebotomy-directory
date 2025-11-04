import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { getSubmissionById, updateSubmissionStatus, deleteSubmission } from '@/lib/pending-submissions'
import fs from 'fs'
import path from 'path'

const CSV_PATH = path.join(process.cwd(), 'cleaned_providers.csv')

/**
 * Convert pending submission to CSV row
 */
function convertToCSVRow(submission: any): string {
  const FIELDS = [
    'name',
    'totalScore',
    'reviewsCount',
    'street',
    'regions serviced',
    'city',
    'state',
    'countryCode',
    'website',
    'phone',
    'categoryName',
    'url',
    'is_mobile_phlebotomy',
    'is_nationwide',
    'verified_service_areas',
    'validation_notes',
    'logo',
    'profileImage',
    'businessImages',
    'bio',
    'foundedYear',
    'teamSize',
    'yearsExperience',
    'zipCodes',
    'serviceRadius',
    'travelFee',
    'googlePlaceId',
    'testimonials',
    'certifications',
    'licenseNumber',
    'insuranceAmount',
    'specialties',
    'emergencyAvailable',
    'weekendAvailable',
    'email',
    'contactPerson',
    'languages'
  ]

  // Map submission data to CSV fields
  const data: any = {
    name: submission.businessName || '',
    totalScore: '',
    reviewsCount: '',
    street: submission.address || '',
    'regions serviced': submission.serviceArea || '',
    city: submission.city || '',
    state: submission.state || '',
    countryCode: 'US',
    website: submission.website || '',
    phone: submission.phone || '',
    categoryName: '',
    url: '',
    is_mobile_phlebotomy: 'Yes',
    is_nationwide: 'No',
    verified_service_areas: '',
    validation_notes: '',
    logo: submission.logo || '',
    profileImage: '',
    businessImages: '',
    bio: submission.description || '',
    foundedYear: '',
    teamSize: '',
    yearsExperience: submission.yearsExperience || '',
    zipCodes: submission.zipCode || '',
    serviceRadius: '',
    travelFee: '',
    googlePlaceId: '',
    testimonials: '',
    certifications: submission.certifications || '',
    licenseNumber: '',
    insuranceAmount: '',
    specialties: submission.specialties || '',
    emergencyAvailable: submission.emergencyAvailable ? 'Yes' : 'No',
    weekendAvailable: submission.weekendAvailable ? 'Yes' : 'No',
    email: submission.email || '',
    contactPerson: submission.contactName || '',
    languages: 'English'
  }

  // Escape and format values
  function escapeCSVField(field: any): string {
    if (field === null || field === undefined) {
      return ''
    }

    const str = String(field)

    // If field contains comma, newline, or double quote, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`
    }

    return str
  }

  const values = FIELDS.map(field => escapeCSVField(data[field] || ''))
  return values.join(',')
}

/**
 * Approve a submission (add to CSV)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminSession()

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { action } = await request.json()

    const submission = getSubmissionById(id)

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // Convert to CSV row
      const csvRow = convertToCSVRow(submission)

      // Append to CSV file
      fs.appendFileSync(CSV_PATH, '\n' + csvRow)

      // Update status
      updateSubmissionStatus(id, 'approved')

      // Trigger rebuild of providers.json (run Python script)
      try {
        const { execSync } = require('child_process')
        console.log('🔄 Rebuilding providers.json...')
        execSync('py convert_csv.py', {
          cwd: process.cwd(),
          stdio: 'inherit'
        })
        console.log('✅ Providers.json rebuilt successfully')
      } catch (error) {
        console.error('⚠️  Failed to rebuild providers.json:', error)
        // Don't fail the approval if rebuild fails - can be done manually
      }

      return NextResponse.json({
        success: true,
        message: 'Provider approved and added to directory. Site will update on next deployment.',
        provider: submission.businessName
      })

    } else if (action === 'reject') {
      // Update status to rejected
      updateSubmissionStatus(id, 'rejected')

      return NextResponse.json({
        success: true,
        message: 'Submission rejected',
        provider: submission.businessName
      })

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error processing submission action:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Delete a submission
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminSession()

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const success = deleteSubmission(id)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Submission deleted'
    })

  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
