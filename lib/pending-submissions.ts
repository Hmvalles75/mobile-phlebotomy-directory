/**
 * Manage pending provider submissions
 * Stores submissions in a JSON file until approved/rejected
 */

import fs from 'fs'
import path from 'path'

export interface PendingProvider {
  id: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'

  // Form data
  businessName: string
  contactName: string
  email: string
  phone: string
  website?: string
  services?: string[]
  description: string
  address?: string
  city: string
  state: string
  zipCode?: string
  serviceArea?: string
  yearsExperience?: string
  licensed?: boolean
  insurance?: boolean
  certifications?: string
  specialties?: string
  emergencyAvailable?: boolean
  weekendAvailable?: boolean
  logo?: string

  // Metadata
  ipAddress?: string
  userAgent?: string
}

const SUBMISSIONS_FILE = path.join(process.cwd(), 'data', 'pending-submissions.json')

/**
 * Ensure the data directory and file exist
 */
function ensureDataFile() {
  const dataDir = path.dirname(SUBMISSIONS_FILE)

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2))
  }
}

/**
 * Get all pending submissions
 */
export function getPendingSubmissions(): PendingProvider[] {
  ensureDataFile()

  try {
    const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading pending submissions:', error)
    return []
  }
}

/**
 * Add a new pending submission
 */
export function addPendingSubmission(submission: Omit<PendingProvider, 'id' | 'submittedAt' | 'status'>): PendingProvider {
  ensureDataFile()

  const newSubmission: PendingProvider = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    submittedAt: new Date().toISOString(),
    status: 'pending',
    ...submission
  }

  const submissions = getPendingSubmissions()
  submissions.push(newSubmission)

  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2))

  return newSubmission
}

/**
 * Update submission status
 */
export function updateSubmissionStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected'
): boolean {
  ensureDataFile()

  const submissions = getPendingSubmissions()
  const index = submissions.findIndex(sub => sub.id === id)

  if (index === -1) {
    return false
  }

  submissions[index].status = status
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2))

  return true
}

/**
 * Get a single submission by ID
 */
export function getSubmissionById(id: string): PendingProvider | null {
  const submissions = getPendingSubmissions()
  return submissions.find(sub => sub.id === id) || null
}

/**
 * Delete a submission
 */
export function deleteSubmission(id: string): boolean {
  ensureDataFile()

  const submissions = getPendingSubmissions()
  const filtered = submissions.filter(sub => sub.id !== id)

  if (filtered.length === submissions.length) {
    return false // No submission found
  }

  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(filtered, null, 2))
  return true
}
