import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const To = formData.get('To') as string
    const From = formData.get('From') as string
    const CalledCity = formData.get('CalledCity') as string | null
    const CalledState = formData.get('CalledState') as string | null
    const CallSid = formData.get('CallSid') as string

    // Lookup the provider/city number
    const cityNum = await prisma.cityNumber.findUnique({
      where: { twilioNumber: To }
    })

    const provider = cityNum?.providerId
      ? await prisma.provider.findUnique({ where: { id: cityNum.providerId } })
      : null

    const vr = new VoiceResponse()

    // Forward to provider if verified and has phone
    if (provider?.status === 'VERIFIED' && provider.phonePublic) {
      const dial = vr.dial({
        callerId: To,
        record: 'record-from-answer',
        recordingStatusCallback: `${process.env.PUBLIC_SITE_URL}/api/telephony/status`,
        recordingStatusCallbackEvent: ['completed']
      })
      dial.number(provider.phonePublic)
    } else {
      vr.say(
        'Thank you for calling Mobile Phlebotomy dot org. Please request a home blood draw on our website at mobile phlebotomy dot org.'
      )
      vr.hangup()
    }

    // Log the call
    await prisma.callLog.create({
      data: {
        fromNumber: From,
        toNumber: To,
        city: CalledCity || null,
        state: CalledState || null,
        providerId: provider?.id || null,
        callSid: CallSid,
        callStatus: 'initiated'
      }
    })

    return new NextResponse(vr.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (error) {
    console.error('Voice webhook error:', error)
    const vr = new VoiceResponse()
    vr.say('An error occurred. Please try again later.')
    vr.hangup()

    return new NextResponse(vr.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}
