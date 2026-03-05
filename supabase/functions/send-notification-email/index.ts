// Supabase Edge Function: send-notification-email
// This function sends email notifications using Resend API
// 
// Setup:
// 1. Create a Resend account at https://resend.com
// 2. Get your API key from Resend dashboard
// 3. In Supabase Dashboard → Project Settings → Edge Functions → Secrets
//    Add: RESEND_API_KEY = your-resend-api-key
// 4. Deploy this function: supabase functions deploy send-notification-email --no-verify-jwt
//
// Alternative providers:
// - SendGrid: https://sendgrid.com
// - AWS SES: https://aws.amazon.com/ses/
// - Mailgun: https://www.mailgun.com

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailPayload {
  to: string
  subject: string
  html: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { to, subject, html }: EmailPayload = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if API key is configured
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Send email via Resend API
    console.log(`Sending email to: ${to}`)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Zenova Notifications <noreply@yourdomain.com>', // Change to your verified domain
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    let data
    try {
      data = await res.json()
    } catch {
      data = { error: 'Invalid JSON response from Resend API' }
    }

    if (!res.ok) {
      console.error('Resend API error:', data)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`✓ Email sent successfully to ${to}`)
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
