import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const CallSid = formData.get('CallSid') as string
    const CallStatus = formData.get('CallStatus') as string
    const RecordingUrl = formData.get('RecordingUrl') as string | null
    const CallDuration = formData.get('CallDuration') as string | null

    if (!CallSid) {
      return NextResponse.json({ ok: false, error: 'Missing CallSid' }, { status: 400 })
    }

    // Update the call log
    await prisma.callLog.updateMany({
      where: { callSid: CallSid },
      data: {
        callStatus: CallStatus || null,
        recordingUrl: RecordingUrl || null,
        durationSec: CallDuration ? parseInt(CallDuration, 10) : null
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Status webhook error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to process status update' },
      { status: 500 }
    )
  }
}
