// @ts-nocheck
// ALTERNATIVA: Usar SendGrid en lugar de Resend
// 
// Setup:
// 1. Create a SendGrid account at https://sendgrid.com
// 2. Get your API key from SendGrid dashboard
// 3. In Supabase Dashboard → Project Settings → Edge Functions → Secrets
//    Add: SENDGRID_API_KEY = your-sendgrid-api-key
//
// Si prefieres SendGrid sobre Resend, reemplaza el contenido de
// supabase/functions/send-notification-email/index.ts con este código:

// @deno-types='https://deno.land/std@0.168.0/http/server.ts'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')

interface EmailPayload {
  to: string
  subject: string
  html: string
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html }: EmailPayload = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!SENDGRID_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'SendGrid API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Sending email via SendGrid to: ${to}`)
    
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: {
          email: 'noreply@yourdomain.com', // Change to your verified email
          name: 'Zenova Notifications',
        },
        subject: subject,
        content: [
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
    })

    if (!res.ok) {
      let errorData
      try {
        errorData = await res.text()
      } catch {
        errorData = 'Unable to read error response'
      }
      console.error('SendGrid API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`✓ Email sent successfully via SendGrid to ${to}`)
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
