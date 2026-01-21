import { NextRequest, NextResponse } from 'next/server'
import { findDuplicates, removeDuplicates } from '@/lib/duplicate-detection'

/**
 * Admin API: Duplicate Provider Detection & Removal
 *
 * GET  /api/admin/duplicates - Find duplicates (dry run)
 * POST /api/admin/duplicates - Remove duplicates
 */

export async function GET(req: NextRequest) {
  try {
    // Security: Check admin authorization
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const duplicateGroups = await findDuplicates()

    return NextResponse.json({
      success: true,
      groupsFound: duplicateGroups.length,
      totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.providers.length - 1, 0),
      groups: duplicateGroups.map(g => ({
        matchKey: g.name,
        count: g.providers.length,
        providers: g.providers.map(p => ({
          id: p.id,
          name: p.name,
          website: p.website,
          location: p.primaryCity && p.primaryState ? `${p.primaryCity}, ${p.primaryState}` : p.primaryState,
          createdAt: p.createdAt
        }))
      }))
    })
  } catch (error: any) {
    console.error('Error finding duplicates:', error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Security: Check admin authorization
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const dryRun = body.dryRun !== false // Default to dry run for safety

    const result = await removeDuplicates(dryRun)

    return NextResponse.json({
      success: true,
      dryRun,
      ...result
    })
  } catch (error: any) {
    console.error('Error removing duplicates:', error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}
