#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const docsDir = path.resolve("docs");
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const htmlES = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guía de Usuario - Zenova</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #0f172a; border-bottom: 3px solid #0f172a; padding-bottom: 10px; font-size: 28px; }
    h2 { color: #111827; margin-top: 30px; font-size: 20px; border-left: 4px solid #0369a1; padding-left: 10px; }
    h3 { color: #334155; font-size: 16px; margin-top: 20px; }
    .intro { background: #f0f9ff; padding: 15px; border-left: 4px solid #0369a1; margin: 20px 0; }
    .tip { background: #fef3c7; padding: 10px 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
    .warning { background: #fee2e2; padding: 10px 15px; border-left: 4px solid #dc2626; margin: 15px 0; }
    .step { margin: 15px 0; padding: 10px; background: #f9fafb; border-left: 4px solid #6b7280; }
    ol, ul { margin: 10px 0; padding-left: 25px; }
    li { margin: 8px 0; }
    strong { color: #111827; }
    .section-break { page-break-after: always; }
  </style>
</head>
<body>

<h1>Zenova — Guía Práctica Completa para Usuario/a</h1>
<p style="color: #666; font-style: italic;">Versión 2026 · Manual paso a paso para sacar máximo provecho de la aplicación</p>

<div class="intro">
<strong>¿Qué encontrarás aquí?</strong> Una guía práctica y detallada para usar Zenova en tu trabajo diario. No es manual técnico: es instrucciones claras paso a paso con ejemplos reales.
</div>

<h2>1. INTRODUCCIÓN</h2>
<p>Zenova es tu herramienta para gestionar turnos de enfermería. Con ella puedes:</p>
<ul>
  <li>Consultar tu calendario mensual de turnos</li>
  <li>Solicitar cambios, vacaciones o preferencias</li>
  <li>Revisar horas trabajadas vs. contrato</li>
  <li>Recibir notificaciones de cambios</li>
  <li>Intercambiar turnos con compañeros</li>
  <li>Exportar tu agenda a PDF o Excel</li>
</ul>

<h2>2. ACCESO Y PRIMEROS PASOS</h2>

<h3>2.1 Iniciar sesión</h3>
<div class="step">
<strong>Paso 1:</strong> Abre tu navegador (Chrome, Firefox, Edge) y ve a la URL de Zenova.<br>
<strong>Paso 2:</strong> Verás pantalla de login con dos campos: Usuario y Contraseña.<br>
<strong>Paso 3:</strong> Escribe tu usuario (email ej: ana.garcia@hospital.es).<br>
<strong>Paso 4:</strong> Introduce tu contraseña (cuidado: diferencia mayúsculas/minúsculas).<br>
<strong>Paso 5:</strong> Haz clic en "Iniciar sesión" o presiona Enter.
</div>

<div class="tip">
💡 Si es tu primer acceso, la app probablemente te pida cambiar contraseña. Es obligatorio. Introduce una contraseña segura de al menos 6 caracteres.
</div>

<h3>2.2 Cambio obligatorio de contraseña</h3>
<div class="step">
<strong>Paso 1:</strong> Verás modal diciendo "Debes cambiar tu contraseña".<br>
<strong>Paso 2:</strong> Introduce nueva contraseña (mínimo 6 caracteres, recomendado mezclar letras y números).<br>
<strong>Paso 3:</strong> Confirma escribiendo exactamente lo mismo de nuevo.<br>
<strong>Paso 4:</strong> Haz clic en "Cambiar Contraseña".<br>
<strong>Resultado:</strong> Accederás a la pantalla principal.
</div>

<div class="warning">
⚠️ GUARDA tu nueva contraseña en un lugar seguro. Si la olvidas, contacta con administración.
</div>

<div class="section-break"></div>

<h2>3. TU PERFIL: CONFIGURACIÓN CRÍTICA</h2>
<p>Tu perfil es donde configuras datos personales, idioma y <strong>el email para recibir notificaciones</strong>. Esta es la configuración más importante.</p>

<h3>3.1 Acceder a Mi Perfil</h3>
<div class="step">
<strong>Paso 1:</strong> En pantalla principal, busca tu nombre en esquina superior derecha.<br>
<strong>Paso 2:</strong> Haz clic en tu nombre o ícono de usuario.<br>
<strong>Paso 3:</strong> Se abrirá menú desplegable.<br>
<strong>Paso 4:</strong> Selecciona "Mi Perfil" o "My Profile".
</div>

<h3>3.2 EMAIL PARA NOTIFICACIONES (CRÍTICO!!!)</h3>
<p><strong>SIN ESTE EMAIL, NO RECIBIRÁS AVISOS DE CAMBIOS EN TU PLANIFICACIÓN.</strong></p>

<div class="step">
<strong>Paso 1:</strong> Busca campo "Email para notificaciones" (primero en sección).<br>
<strong>Paso 2:</strong> Si hay email anterior, bórralo completamente.<br>
<strong>Paso 3:</strong> Escribe tu email real. Ejemplos correctos: ana@gmail.com, juan.lopez@hotmail.com<br>
<strong>Paso 4:</strong> Verifica que NO haya espacios antes ni después.<br>
<strong>Paso 5:</strong> Haz clic botón "Guardar" (azul grande).<br>
<strong>Resultado:</strong> Verás mensaje verde "Email actualizado correctamente".
</div>

<div class="warning">
⚠️ Si ves error rojo: el email no es válido O ya lo usa otro usuario. Revisa formato o contacta admin.
</div>

<div class="tip">
💡 Usa el email que revisas regularmente. Si escribes email que no lees, perderás notificaciones.
</div>

<h3>3.3 Cambiar Contraseña</h3>
<div class="step">
<strong>Paso 1:</strong> En sección "Cambiar Contraseña", introduce tu contraseña actual.<br>
<strong>Paso 2:</strong> Escribe nueva contraseña (mínimo 6 caracteres).<br>
<strong>Paso 3:</strong> Confirma escribiendo exactamente lo mismo en "Confirmar Nueva Contraseña".<br>
<strong>Paso 4:</strong> Haz clic "Guardar Contraseña".<br>
<strong>Resultado:</strong> Mensaje verde. Próximo login usa la nueva contraseña.
</div>

<h3>3.4 Cambiar Idioma</h3>
<div class="step">
<strong>Paso 1:</strong> En "Preferencias de Idioma", haz clic en desplegable.<br>
<strong>Paso 2:</strong> Selecciona: Español, English o Français.<br>
<strong>Resultado:</strong> Toda la interfaz cambia inmediatamente. Se guarda automáticamente.
</div>

<div class="section-break"></div>

<h2>4. CALENDARIO MENSUAL: Tu Vista Principal</h2>
<p>Es la pantalla que ves al iniciar sesión. Muestra TODOS los turnos del mes actual para todo el equipo.</p>

<h3>4.1 Estructura</h3>
<ul>
  <li><strong>Cada FILA:</strong> Un enfermero/a (tu nombre aparecerá en una fila)</li>
  <li><strong>Cada COLUMNA:</strong> Un día del mes (1, 2, 3... hasta 31)</li>
  <li><strong>Cada CELDA:</strong> Un turno asignado (URGENCES, TRAVAIL, ADMIN, etc.)</li>
  <li><strong>CELDA VACÍA:</strong> Día libre, festivo o sin asignación</li>
</ul>

<h3>4.2 Navegar por meses</h3>
<div class="step">
<strong>Paso 1:</strong> En parte superior, verás mes actual (ej: "Mayo 2026").<br>
<strong>Paso 2:</strong> A la izquierda: botón "< Mes anterior".<br>
<strong>Paso 3:</strong> A la derecha: botón "Mes siguiente >".<br>
<strong>Paso 4:</strong> Haz clic para navegar. Calendario se actualiza.
</div>

<h3>4.3 Significado de colores</h3>
<ul>
  <li>🔴 <strong>URGENCES</strong> (rojo): Turno en Urgencias. Crítico, stress alto.</li>
  <li>🔵 <strong>TRAVAIL</strong> (azul): Turno normal/general.</li>
  <li>⚪ <strong>ADMIN</strong> (gris): Administración/oficina.</li>
  <li>🟣 <strong>TW</strong> (morado): Teletrabajo (trabajas desde casa).</li>
  <li>🟢 <strong>CA</strong> (verde): Congé Annuel / Vacaciones.</li>
  <li>🟡 <strong>SICK_LEAVE</strong> (amarillo): Baja por enfermedad.</li>
  <li>🟤 <strong>F</strong> (marrón): Festivo (día no laborable).</li>
  <li>⭐ <strong>STRASBOURG</strong>: Viaje/sesión especial.</li>
</ul>

<h3>4.4 Leer tu planificación personal</h3>
<div class="step">
<strong>Paso 1:</strong> Busca tu nombre en columna izquierda.<br>
<strong>Paso 2:</strong> Sigue esa fila de izquierda a derecha viendo cada día.<br>
<strong>Paso 3:</strong> El color y nombre de cada celda es tu turno para ese día.
</div>

<div class="tip">
💡 Revisa especialmente lunes y viernes. Suelen tener dinámicas diferentes.
</div>

<div class="section-break"></div>

<h2>5. NOTIFICACIONES: Recibir Avisos</h2>
<p><strong>CRÍTICO:</strong> Las notificaciones te alertan de cambios. Funcionan en dos canales: pantalla e email.</p>

<h3>5.1 Notificaciones en pantalla</h3>
<p>Cuando algo importante cambia en tu planificación, aparece automáticamente un mensaje en la parte superior durante 7 segundos. Ejemplo: "✅ Tu turno del 15/5 cambió de URGENCES a TRAVAIL".</p>

<h3>5.2 Notificaciones por EMAIL</h3>
<p><strong>Requiere haber guardado email en Mi Perfil (sección 3.2).</strong> Si lo hiciste, recibirás email automático cuando haya cambios importantes con detalles: qué cambió, cuándo, qué turno es ahora. Puede tardar unos segundos o minutos en llegar (como Gmail).</p>

<div class="warning">
⚠️ Si NUNCA recibes email: probablemente no guardaste email válido en Mi Perfil. Vuelve a sección 3.2 y hazlo AHORA.
</div>

<div class="tip">
💡 Si no ves email: revisa carpeta SPAM. Los filtros a veces lo clasifican erróneamente ahí.
</div>

<h3>5.3 Panel de Notificaciones</h3>
<div class="step">
<strong>Paso 1:</strong> Busca ícono campana 🔔 en esquina superior derecha.<br>
<strong>Paso 2:</strong> Haz clic para abrir panel lateral.<br>
<strong>Paso 3:</strong> Verás lista de todas tus notificaciones recientes.<br>
<strong>Paso 4:</strong> Las nuevas (no leídas) tienen punto azul a la izquierda.<br>
<strong>Paso 5:</strong> Haz clic en notificación para marcarla como leída.
</div>

<div class="section-break"></div>

<h2>6. PERSONAL AGENDA: Tu Agenda Privada Descargable</h2>
<p>Tu agenda personal es una vista más limpia: SOLO tus turnos, sin los de otros compañeros.</p>

<h3>6.1 Acceder a Tu Agenda Personal</h3>
<div class="step">
<strong>Paso 1:</strong> En menú principal (arriba a la izquierda), busca "Mi Agenda" o "Personal Agenda".<br>
<strong>Paso 2:</strong> Se abrirá vista con SOLO tus turnos del mes actual.<br>
<strong>Paso 3:</strong> Puedes navegar meses igual que en vista general (< / >).
</div>

<h3>6.2 Exportar a PDF</h3>
<div class="step">
<strong>Paso 1:</strong> En vista "Mi Agenda", busca botón "Exportar a PDF" o "Export PDF".<br>
<strong>Paso 2:</strong> Haz clic. Se descargará un PDF con tu planificación bonita, lista para imprimir.<br>
<strong>Paso 3:</strong> Puedes guardarlo en tu carpeta, enviarlo, o imprimirlo.
</div>

<h3>6.3 Exportar a Excel/Google Sheets</h3>
<div class="step">
<strong>Paso 1:</strong> En misma vista Mi Agenda, busca botón "Exportar a Excel" o similar.<br>
<strong>Paso 2:</strong> Se descargará archivo Excel con tu calendario.<br>
<strong>Paso 3:</strong> Lo puedes abrir directamente en Excel o Google Sheets (sube archivo allí).<br>
<strong>Ventaja:</strong> Puedes hacer cálculos, copiar, analizar tus turnos.
</div>

<div class="section-break"></div>

<h2>7. WISHES & PREFERENCES: Solicitudes Personales</h2>
<p>Las "Wishes" son tus solicitudes: "No quiero trabajar el 20 de mayo" o "Prefiero URGENCES esos días". Debes solicitarlas, y después el administrador las apruba o rechaza.</p>

<h3>7.1 Crear una Wish (Solicitud)</h3>
<div class="step">
<strong>Paso 1:</strong> En menú principal, busca "Wishes" o "Mis Deseos".<br>
<strong>Paso 2:</strong> Verás lista de wishes que ya solicitaste.<br>
<strong>Paso 3:</strong> Busca botón "+ Nueva Wish" o "+ New Wish".<br>
<strong>Paso 4:</strong> Se abrirá modal/formulario.
</div>

<h3>7.2 Rellenar solicitud: Ejemplo Real</h3>
<div class="step">
<strong>EJEMPLO:</strong> Quiero solicitar "No trabajar en Urgencias el 20 de mayo"<br><br>
<strong>Paso 1:</strong> Tipo de solicitud: "Excluir turno" o "Exclude shift type"<br>
<strong>Paso 2:</strong> Selecciona fecha: 20 de mayo<br>
<strong>Paso 3:</strong> Tipo de turno a excluir: URGENCES<br>
<strong>Paso 4:</strong> Motivo (opcional): "Cita médica ese día"<br>
<strong>Paso 5:</strong> Haz clic "Enviar Solicitud"<br>
<strong>Resultado:</strong> Admin recibe tu solicitud. Estado cambia a "Pendiente".
</div>

<h3>7.3 Estados de Wish</h3>
<ul>
  <li>⏳ <strong>Pendiente:</strong> Admin la está revisando. Espera.</li>
  <li>✅ <strong>Aprobada:</strong> Admin dijo que sí. Tu calendario se actualiza automáticamente.</li>
  <li>❌ <strong>Rechazada:</strong> Admin dijo que no (mínimas rotaciones necesarias). Verás motivo.</li>
  <li>🔄 <strong>Auto-aplicada:</strong> Sistema automático la aplicó tras aprobación.</li>
</ul>

<div class="tip">
💡 Moraleja: Solicita con anticipación. Wishes último minuto son más difíciles de aprobar.
</div>

<div class="section-break"></div>

<h2>8. SHIFT SWAPS: Intercambiar Turnos con Compañeros</h2>
<p>Intercambiar turno significa: Tú trabajas el turno de otro, él trabaja el tuyo. Ambos deben estar de acuerdo.</p>

<h3>8.1 Iniciar un Swap</h3>
<div class="step">
<strong>EJEMPLO:</strong> Tú trabajas el 12 de mayo (TRAVAIL) pero Juan trabaja ese día (URGENCES). Quieres cambiar.<br><br>
<strong>Paso 1:</strong> Ve a "Wish" o "Personal Agenda".<br>
<strong>Paso 2:</strong> Haz clic en tu turno del 12 mayo.<br>
<strong>Paso 3:</strong> Se abre menú: busca "Intercambiar" o "Swap".<br>
<strong>Paso 4:</strong> Se abrirá modal "Proponer intercambio".<br>
<strong>Paso 5:</strong> Selecciona: "Intercambio con Juan", "Tu turno 12 (TRAVAIL) por su turno 12 (URGENCES)".<br>
<strong>Paso 6:</strong> Escribe motivo si quieres (ej: "Tengo cita ese día").<br>
<strong>Paso 7:</strong> Haz clic "Enviar propuesta".
</div>

<h3>8.2 Estados del Swap</h3>
<ul>
  <li>⏳ <strong>Pendiente:</strong> Juan tiene propuesta. Puede aceptar/rechazar.</li>
  <li>✅ <strong>Aceptado:</strong> Juan dijo que sí. Ambos ven evento de swap confirmado.</li>
  <li>❌ <strong>Rechazado:</strong> Juan dijo que no.</li>
  <li>⚡ <strong>Confirmado por Admin:</strong> Admin validó el swap. Ya está en calendario oficial.</li>
</ul>

<h3>8.3 Ver mis swaps</h3>
<div class="step">
<strong>Paso 1:</strong> En menú, busca "Mis Intercambios" o "My Swaps".<br>
<strong>Paso 2:</strong> Ves lista de todos tus swaps (pendientes, confirmados, rechazados).<br>
<strong>Paso 3:</strong> Haz clic en uno para ver detalles (compañero, fechas, estado).
</div>

<div class="section-break"></div>

<h2>9. BALANCE & HOURS: ¿Cuántas Horas He Trabajado?</h2>
<p>Tu contrato especifica cuántas horas DEBES trabajar (ej: 80%, 90%, 100%). Esta sección muestra si estás dentro, por encima, o por debajo.</p>

<h3>9.1 Acceder a Balance</h3>
<div class="step">
<strong>Paso 1:</strong> En menú, busca "Balance" o "Horas Trabajadas".<br>
<strong>Paso 2:</strong> Verás tabla con todos los meses del año.<br>
<strong>Paso 3:</strong> Cada fila es un mes. Columnas: mes, horas requeridas, horas trabajadas, diferencia, tu porcentaje.
</div>

<h3>9.2 Interpretar la tabla</h3>
<div class="step">
<strong>EJEMPLO:</strong> Si tu contrato es 80%:<br><br>
<strong>Mayo 2026:</strong><br>
- Requerido: 160 horas (80% de 160)<br>
- Trabajadas: 158 horas<br>
- Diferencia: -2 horas (<strong>DEFICIT</strong>). Te faltan 2 horas este mes.<br>
- Porcentaje: 98.75% (casi completo pero no del todo)<br><br>
<strong>Si viera SUPERÁVIT (+ horas):</strong> Trabajaste MÁS de lo requerido. Eso se suma para próximos meses.
</div>

<h3>9.3 Exportar balance</h3>
<div class="step">
<strong>Paso 1:</strong> En vista Balance, busca botón "Exportar" o "Export to Excel".<br>
<strong>Paso 2:</strong> Se descargará Excel con toda la tabla para guardar/analizar.<br>
<strong>Paso 3:</strong> Puedes comparar con tus registros personales.
</div>

<div class="warning">
⚠️ Si ves DEFICIT grande: avisa a administración. Puede ser error o necesitas horas extra.
</div>

<div class="section-break"></div>

<h2>10. CAMBIAR IDIOMA: English, Español, Français</h2>
<p>Zenova funciona en tres idiomas. Puedes cambiar cuando quieras.</p>

<h3>10.1 Cambiar idioma</h3>
<div class="step">
<strong>Paso 1:</strong> Busca ícono 🌐 (globo terráqueo) en esquina superior derecha.<br>
<strong>Paso 2:</strong> Haz clic. Se abre menú desplegable con idiomas: Español, English, Français.<br>
<strong>Paso 3:</strong> Haz clic en el que quieras.<br>
<strong>Resultado:</strong> Toda interfaz cambia inmediatamente. Se guarda tu preferencia.
</div>

<div class="section-break"></div>

<h2>11. EXPORTAR: Descarga tus Datos</h2>
<p>Puedes descargar tu información en múltiples formatos.</p>

<h3>11.1 Exportar Agenda Completa</h3>
<div class="step">
<strong>Paso 1:</strong> Ve a "Mi Agenda".<br>
<strong>Paso 2:</strong> Selecciona mes que quieres exportar (navega con < / >).<br>
<strong>Paso 3:</strong> Haz clic "Exportar a PDF" para formato bonito/imprimible.<br>
<strong>Paso 4:</strong> O haz clic "Exportar a Excel" para formato editable/analizable.
</div>

<h3>11.2 Exportar Balance</h3>
<div class="step">
<strong>Paso 1:</strong> Ve a "Balance".<br>
<strong>Paso 2:</strong> Haz clic "Exportar a Excel".<br>
<strong>Resultado:</strong> Descargas hoja de cálculo con todos tus meses.
</div>

<h3>11.3 Dónde se descargan</h3>
<p>Los archivos irán a tu carpeta "Descargas" del sistema operativo. Ejemplo: C:\Users\tu_usuario\Downloads\ (Windows) o ~/Downloads (Mac/Linux).</p>

<div class="section-break"></div>

<h2>12. MEJORES PRÁCTICAS: Consejos Profesionales</h2>
<p>Aprovecha Zenova al máximo:</p>

<ul>
  <li>✅ <strong>Revisa diariamente:</strong> Abre Zenova cada mañana (2-3 minutos) para ver si hay cambios nocturnos.</li>
  <li>✅ <strong>Email actualizado:</strong> Tu email en Mi Perfil es CRÍTICO. Si no está: AHORA MISMO, ve a sección 3.2.</li>
  <li>✅ <strong>Solicita pronto:</strong> Wishes con 2-3 semanas anticipación tienen más probabilidad aprobación.</li>
  <li>✅ <strong>Coordina intercambios:</strong> Habla antes con compañero. Propuestas coordinadas se aprueban más rápido.</li>
  <li>✅ <strong>Descarga backup:</strong> Cada mes, exporta tu agenda a Excel/PDF. Así tienes copia de seguridad.</li>
  <li>✅ <strong>Revisa balance:</strong> Cada mes-final, chequea que tus horas sean correctas. Si hay discrepancia, avisa.</li>
  <li>✅ <strong>Usa búsqueda de compañeros:</strong> Si necesitas intercambio, pregunta al que trabaja el día que necesitas (no es random).</li>
  <li>✅ <strong>Guarda contraseña:</strong> Usa password manager (1Password, Bitwarden, etc.) para no olvidarla.</li>
</ul>

<div class="section-break"></div>

<h2>13. SOLUCIÓN DE PROBLEMAS</h2>

<h3>Problema 1: "No veo mis cambios en el calendario"</h3>
<div class="step">
<strong>Solución:</strong><br>
1. Actualiza página (F5 o Ctrl+R).<br>
2. Si sigue igual: cierra navegador completamente y reabre.<br>
3. Si aún no ves: contacta admin (puede ser problema tipo dato congelado).
</div>

<h3>Problema 2: "Recibí notificación en pantalla pero no por email"</h3>
<div class="step">
<strong>Solución:</strong><br>
1. Revisa que hayas guardado email en Mi Perfil (sección 3.2).<br>
2. Mira carpeta SPAM/Correo no deseado de tu email.<br>
3. Si email escrito es incorrecto: corrígelo en Mi Perfil ahora.<br>
4. Contacta admin si las dos primeras no funcionan.
</div>

<h3>Problema 3: "Olvidé mi contraseña"</h3>
<div class="step">
<strong>Solución:</strong><br>
1. En pantalla login, busca "¿Olvidaste tu contraseña?" o "Forgot Password?".<br>
2. Haz clic. Escribe tu usuario/email.<br>
3. Recibirás email con link para reset. Abre email, haz clic link, estableece contraseña nueva.<br>
4. Si no recibes email en 5 minutos: revisa SPAM y contacta admin.
</div>

<h3>Problema 4: "Mi wish fue rechazada sin motivo"</h3>
<div class="step">
<strong>Posibles razones:</strong><br>
1. Cobertura mínima: ese día necesitan mínimas rotaciones obligatorias.<br>
2. Falta de disponibilidad: todos solicitan lo mismo ese día.<br>
3. Problema jornada: tu contrato (80%/90%/100%) no lo permite.<br>
4. Contacta admin para explicación exacta.
</div>

<h3>Problema 5: "No puedo hacer swap con Juan"</h3>
<div class="step">
<strong>Razones comunes:</strong><br>
1. Juan ya tiene propuesta pendiente con otro compañero.<br>
2. Uno de los dos turnos es de cobertura obligatoria (no intercambiable).<br>
3. Horarios no compatible (turnos diferentes, tipos diferentes).<br>
4. Habla con Juan directamente o contacta admin.
</div>

<div class="section-break"></div>

<h2>14. SEGURIDAD: Protege tu Cuenta</h2>

<h3>Buenas Prácticas</h3>
<ul>
  <li>🔐 <strong>Contraseña fuerte:</strong> Mínimo 6 caracteres, mejor si mezclas letras+números. NO uses: fecha nacimiento, nombre, secuencias obvias.</li>
  <li>🔐 <strong>Computadora pública:</strong> Nunca dejes sesión abierta en computadora compartida. Cierra navegador siempre.</li>
  <li>🔐 <strong>Wi-Fi público:</strong> Evita conectarte a Zenova en Wi-Fi público sin VPN (cafés, aeropuertos). Si debes: no accedas datos sensibles.</li>
  <li>🔐 <strong>Phishing:</strong> Si recibes email raro pidiendo login: NO hagas clic. Contacta admin si es sospechoso.</li>
  <li>🔐 <strong>Logout:</strong> Cuando termines sesión en PC ajena: haz clic tu nombre → "Salir" o "Logout".</li>
  <li>🔐 <strong>Cambio regular:</strong> Cada 3-6 meses, cambia contraseña (especialmente si compartiste computadora).</li>
</ul>

<div class="section-break"></div>

<h2>PREGUNTAS FRECUENTES (FAQ)</h2>

<div class="step">
<strong>P: ¿Puedo ver calendario de mis compañeros?</strong><br>
R: Sí, en vista "Calendario General". Ventana pública donde ves TODOS (estrategia de planificación).
</div>

<div class="step">
<strong>P: ¿Puedo cambiar mis datos personales (nombre, email principal)?</strong><br>
R: Parcialmente. Email de NOTIFICACIONES: sí (sección 3.2). Email principal, nombre: NO. Contacta admin.
</div>

<div class="step">
<strong>P: ¿Qué pasa si me cambio a otro hospital antes de terminar mes?</strong><br>
R: Tus horas se calculan hasta fecha de cambio. Balance se congela. Contacta admin para finiquito.
</div>

<div class="step">
<strong>P: ¿Zenova funciona en celular?</strong><br>
R: Sí, abre en navegador Chrome/Firefox de celular. No hay app nativa, es web responsive.
</div>

<div class="section-break"></div>

<h2>CONTACTO Y SOPORTE</h2>
<p><strong>Si después de leer esta guía tienes dudas o problemas:</strong></p>
<ul>
  <li>📧 Contacta administración Zenova del hospital.</li>
  <li>📋 Proporciona: tu nombre, fecha del problema, descripción clara de qué pasó.</li>
  <li>⏰ Respuesta típica: 24 horas laborales.</li>
</ul>

<p style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ccc; color: #666; font-style: italic;">
— Versión 2026 · Guía Zenova · Último update: Marzo 2026 —
</p>

</body>
</html>
`;

const htmlFile = path.join(docsDir, "Guia_Usuario_Zenova_COMPLETA.html");
fs.writeFileSync(htmlFile, htmlES);

console.log("✅ Guía HTML generada:", htmlFile);
console.log("📝 Ahora puedes: 1) Abrir en navegador 2) Imprimir a PDF (Ctrl+P → Guardar como PDF)");
