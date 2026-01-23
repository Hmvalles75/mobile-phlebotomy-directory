import { NextRequest, NextResponse } from 'next/server'

/**
 * Twilio SMS Fallback Webhook
 *
 * This endpoint is called when the primary SMS webhook fails.
 * It logs the error and returns a generic response to the user.
 *
 * Configure in Twilio:
 * Messaging Service > Integration > Status Callback URL (Fallback)
 * URL: https://mobilephlebotomy.org/api/webhooks/sms-fallback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    // Parse Twilio error data
    const errorCode = params.get('ErrorCode')
    const errorMessage = params.get('ErrorMessage')
    const from = params.get('From')
    const messageSid = params.get('MessageSid')

    // Log the fallback event
    console.error('SMS Webhook Fallback Triggered:', {
      errorCode,
      errorMessage,
      from,
      messageSid,
      timestamp: new Date().toISOString()
    })

    // Send a user-friendly error response
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>We're experiencing technical difficulties processing your reply. Please try again in a few moments, or contact support at hector@mobilephlebotomy.org</Message></Response>`,
      {
        headers: { 'Content-Type': 'text/xml' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in SMS fallback webhook:', error)

    // Even in error, return valid TwiML
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>System error. Please contact support.</Message></Response>`,
      {
        headers: { 'Content-Type': 'text/xml' },
        status: 200
      }
    )
  }
}
