# Configuración de Notificaciones por Email

El sistema de notificaciones de Zenova está preparado para enviar emails usando **Supabase Edge Functions**. Aquí te explico cómo configurarlo.

## Estado Actual

✅ **Notificaciones Toast**: Funcionando (toasts en pantalla)
✅ **Panel de Notificaciones**: Funcionando (campanita con historial)
⚠️ **Envío de Emails**: Requiere configuración de Supabase Edge Function

## ¿Cómo funcionan los emails ahora?

Por ahora, cuando se activa una notificación **los emails se registran en la consola del navegador** pero no se envían. Verás mensajes como:

```
📧 Email notification (Supabase not configured):
To: enfermera@hospital.com
Subject: Zenova: Turno Modificado
Body (preview): Tu turno ha sido cambiado...
Configure Supabase Edge Function to send real emails.
```

## Configuración Completa (Opción 1: Resend)

### Paso 1: Crear cuenta en Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta gratuita
2. Verifica tu dominio o usa el dominio de prueba
3. Obtén tu **API Key** desde el dashboard

### Paso 2: Crear Edge Function en Supabase

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Inicializar Supabase en tu proyecto
supabase init

# Crear la Edge Function
supabase functions new send-notification-email
```

### Paso 3: Código de la Edge Function

Edita el archivo `supabase/functions/send-notification-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json()

    // Send email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Zenova Notifications <noreply@yourdomain.com>',
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### Paso 4: Archivo CORS compartido

Crea `supabase/functions/_shared/cors.ts`:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### Paso 5: Configurar la API Key

En tu panel de Supabase:

1. Ve a **Project Settings** → **Edge Functions** → **Secrets**
2. Agrega el secret `RESEND_API_KEY` con tu API key de Resend

### Paso 6: Deploy de la función

```bash
# Login a Supabase (si no lo has hecho)
supabase login

# Link a tu proyecto
supabase link --project-ref tu-project-ref

# Deploy de la función
supabase functions deploy send-notification-email --no-verify-jwt
```

### Paso 7: Probar

Una vez desplegada, cuando hagas cambios de turnos verás en la consola:

```
✓ Email sent to enfermera@hospital.com
```

---

## Configuración Alternativa (Opción 2: SendGrid)

Si prefieres usar SendGrid en lugar de Resend:

```typescript
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')

const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: 'noreply@yourdomain.com', name: 'Zenova' },
    subject: subject,
    content: [{ type: 'text/html', value: html }],
  }),
})
```

---

## Configuración Alternativa (Opción 3: SMTP Nodemailer)

Si prefieres usar tu propio servidor SMTP:

```typescript
import { SMTPClient } from "https://deno.land/x/denomailer/mod.ts"

const client = new SMTPClient({
  connection: {
    hostname: Deno.env.get('SMTP_HOST'),
    port: Number(Deno.env.get('SMTP_PORT')),
    tls: true,
    auth: {
      username: Deno.env.get('SMTP_USER'),
      password: Deno.env.get('SMTP_PASS'),
    },
  },
})

await client.send({
  from: "noreply@yourdomain.com",
  to: to,
  subject: subject,
  html: html,
})

await client.close()
```

---

## ¿Dónde están los emails de los usuarios?

Los emails se obtienen automáticamente de:

1. **Tabla `nurses`** → campo `email`
2. **Usuarios de Supabase Auth** → campo `email`

Asegúrate de que todos los enfermeros tengan su email configurado en la base de datos.

---

## Cuándo se envían los emails

Los emails se envían automáticamente cuando:

- ✉️ **Cambio manual de turno** → Al enfermero afectado
- ✉️ **Intercambio de turnos** → A ambos enfermeros
- ✉️ **Aprobación de deseos** (cuando lo implementes)

---

## Verificación sin configurar Supabase

Mientras tanto, **el sistema funciona perfectamente sin emails**:
- ✅ Notificaciones Toast (toasts en pantalla)
- ✅ Panel de notificaciones (campanita)
- ℹ️ Logs en consola mostrando los emails que se enviarían

---

## Costos

- **Resend**: 100 emails/día gratis, luego $0.10 por 1000 emails
- **SendGrid**: 100 emails/día gratis forever
- **SMTP propio**: Gratis si tienes servidor

---

## Soporte

Si tienes dudas sobre la configuración, consulta:
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid API Docs](https://docs.sendgrid.com/)
