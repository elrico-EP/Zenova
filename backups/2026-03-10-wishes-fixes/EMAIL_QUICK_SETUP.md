# Configuración Rápida de Emails - Zenova

## Opción 1: Resend (Recomendado - más fácil)

### 1. Crear cuenta Resend
```bash
# Ir a https://resend.com y crear cuenta
# Verificar email
```

### 2. Obtener API Key
```
Dashboard → API Keys → Create API Key
Copiar la key que empieza con: re_...
```

### 3. Instalar Supabase CLI
```bash
npm install -g supabase
```

### 4. Inicializar y conectar
```bash
cd c:\Users\elena\Zenova
supabase login
supabase link --project-ref TU_PROJECT_REF
```

### 5. Configurar secret
```bash
# En Supabase Dashboard:
# Settings → Edge Functions → Secrets → Add Secret
# Name: RESEND_API_KEY
# Value: tu_api_key_de_resend
```

### 6. Desplegar función
```bash
cd c:\Users\elena\Zenova
supabase functions deploy send-notification-email --no-verify-jwt
```

### 7. Verificar dominio (para producción)
En Resend Dashboard:
- Settings → Domains → Add Domain
- Agregar tu dominio (ej: zenova.com)
- Configurar registros DNS según instrucciones
- Cambiar en `index.ts`: `from: 'Zenova <noreply@tudominio.com>'`

---

## Opción 2: SendGrid (Alternativa)

### 1. Crear cuenta SendGrid
```
https://sendgrid.com → Sign Up
Plan Free: 100 emails/día gratis forever
```

### 2. Obtener API Key
```
Settings → API Keys → Create API Key
Copiar la key
```

### 3. Configurar en Supabase
```bash
# En Supabase Dashboard:
# Settings → Edge Functions → Secrets
# Name: SENDGRID_API_KEY
# Value: tu_api_key_de_sendgrid
```

### 4. Usar versión SendGrid
```bash
# Reemplazar contenido de:
# supabase/functions/send-notification-email/index.ts
# Con el contenido de:
# supabase/functions/send-notification-email/sendgrid-version.ts
```

### 5. Desplegar
```bash
supabase functions deploy send-notification-email --no-verify-jwt
```

---

## Verificar que funciona

### Opción A: Desde consola del navegador

Abre la consola (F12) en tu app Zenova y ejecuta:

```javascript
// Obtener el cliente de Supabase
const { supabase } = await import('./firebase/supabase-config.js');

// Enviar email de prueba
const { data, error } = await supabase.functions.invoke('send-notification-email', {
  body: {
    to: 'tu-email@gmail.com',
    subject: 'Prueba de Zenova',
    html: '<h1>¡Funciona!</h1><p>El sistema de emails está configurado correctamente.</p>',
  },
});

console.log('Resultado:', data, error);
```

### Opción B: Hacer un cambio de turno

1. Abre Zenova
2. Cambia manualmente un turno de cualquier enfermero
3. Revisa la consola del navegador:
   - ✓ Si ves: "✓ Email sent to ..." → Funciona
   - ⚠️ Si ves: "Email notification (Supabase not configured)" → Aún no está configurado

---

## Emails de Prueba (desarrollo)

Mientras configuras, puedes usar dominios de prueba:

**Resend**: Usa `onboarding@resend.dev` mientras verificas dominio
**SendGrid**: Usa Single Sender Verification para tu email personal

---

## Solución de Problemas

### Error: "Edge function not found"
```bash
# Verificar que está desplegada
supabase functions list

# Si no aparece, desplegar de nuevo
supabase functions deploy send-notification-email --no-verify-jwt
```

### Error: "API key not configured"
```bash
# Verificar secrets en Supabase Dashboard
# Settings → Edge Functions → Secrets
# Debe existir: RESEND_API_KEY o SENDGRID_API_KEY
```

### Error: "Domain not verified"
```bash
# En desarrollo, usa el dominio onboarding de Resend
# En producción, verifica tu dominio en Resend/SendGrid
```

### No llegan los emails
1. Revisa spam/promociones
2. Verifica que el email del nurse esté en la BD
3. Revisa logs: Supabase Dashboard → Edge Functions → Logs

---

## Costos

- **Resend Free**: 100 emails/día, 3,000/mes
- **SendGrid Free**: 100 emails/día forever
- **Resend Pro**: $20/mes = 50,000 emails
- **SendGrid Essentials**: $15/mes = 50,000 emails

Para un hospital con 20 enfermeros y ~10 cambios/día = ~200 emails/mes → **Gratis**

---

## Next Steps

Una vez configurado, el sistema enviará automáticamente emails cuando:
- 📧 Se cambie un turno manualmente
- 📧 Se intercambien turnos entre enfermeros
- 📧 (Futuro) Se aprueben deseos/vacaciones

---

## Soporte Técnico

Si tienes problemas:
1. Revisa logs de Supabase Edge Functions
2. Revisa consola del navegador (F12)
3. Verifica que los emails en la BD sean válidos
4. Prueba la función directamente desde Supabase Dashboard

¿Necesitas ayuda? Contacta: [tu email de soporte]
