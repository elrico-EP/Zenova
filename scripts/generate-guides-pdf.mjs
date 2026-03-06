import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const outputDir = path.resolve('docs');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const createDoc = (fileName) => {
  const fullPath = path.join(outputDir, fileName);
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(fs.createWriteStream(fullPath));
  return { doc, fullPath };
};

const addTitle = (doc, title, subtitle) => {
  doc.font('Helvetica-Bold').fontSize(22).fillColor('#0f172a').text(title);
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(11).fillColor('#475569').text(subtitle);
  doc.moveDown(1);
};

const addSection = (doc, title) => {
  if (doc.y > 720) doc.addPage();
  doc.font('Helvetica-Bold').fontSize(15).fillColor('#111827').text(title);
  doc.moveDown(0.4);
};

const addParagraph = (doc, text) => {
  doc.font('Helvetica').fontSize(11).fillColor('#1f2937').text(text, { align: 'justify' });
  doc.moveDown(0.5);
};

const addBullets = (doc, items) => {
  items.forEach((item) => {
    if (doc.y > 740) doc.addPage();
    doc.font('Helvetica').fontSize(11).fillColor('#1f2937').text(`• ${item}`, {
      indent: 12,
      align: 'left',
    });
    doc.moveDown(0.2);
  });
  doc.moveDown(0.3);
};

const addNumbered = (doc, items) => {
  items.forEach((item, index) => {
    if (doc.y > 740) doc.addPage();
    doc.font('Helvetica').fontSize(11).fillColor('#1f2937').text(`${index + 1}. ${item}`, {
      indent: 8,
      align: 'left',
    });
    doc.moveDown(0.2);
  });
  doc.moveDown(0.3);
};

const writeUserGuide = () => {
  const { doc, fullPath } = createDoc('Guia_Usuario_Zenova.pdf');

  addTitle(
    doc,
    'Zenova — Guía Completa para Usuario/a',
    'Versión 2026 · Manual práctico para enfermería y personal usuario'
  );

  addSection(doc, '1. ¿Qué es Zenova y para qué sirve?');
  addParagraph(
    doc,
    'Zenova es una aplicación para organizar turnos de enfermería de manera clara, colaborativa y en tiempo real. Permite consultar calendario, revisar agenda personal, gestionar deseos, ver balances de turnos y recibir avisos de cambios. La aplicación está pensada para reducir errores, mejorar transparencia y ahorrar tiempo en la planificación diaria.'
  );

  addSection(doc, '2. Cómo iniciar sesión');
  addNumbered(doc, [
    'Abre la aplicación desde tu navegador habitual.',
    'En la pantalla de acceso, escribe tu usuario (email) y contraseña.',
    'Pulsa “Iniciar sesión”.',
    'Si la aplicación te obliga a cambiar contraseña, define una nueva contraseña segura y guárdala.',
  ]);
  addParagraph(
    doc,
    'Consejo: si cambias tu email en “Mi Perfil”, ese nuevo email será el que tendrás que usar para iniciar sesión a partir de ese momento.'
  );

  addSection(doc, '3. Pantalla principal: calendario mensual');
  addParagraph(
    doc,
    'La vista principal muestra los turnos por día y por profesional. Cada celda representa una asignación (por ejemplo URGENCES, TRAVAIL, ADMIN, TW, etc.). Desde aquí puedes consultar rápidamente quién está asignado a cada área y detectar cambios del mes.'
  );
  addBullets(doc, [
    'Navegación por meses con botones de mes anterior/siguiente.',
    'Visualización clara por colores según tipo de turno.',
    'Posibilidad de ampliar o restaurar ciertas vistas/modales.',
    'Sincronización en tiempo real con Supabase (los cambios aparecen para todos).',
  ]);

  addSection(doc, '4. Mi Perfil (muy importante para notificaciones)');
  addParagraph(
    doc,
    'En “Mi Perfil” puedes gestionar tus datos de usuario, idioma y contraseña. Además, puedes configurar el email donde quieres recibir notificaciones de cambios de turno.'
  );
  addNumbered(doc, [
    'Abre “Mi Perfil”.',
    'Busca el campo “Email para notificaciones”.',
    'Escribe tu email real y pulsa “Guardar”.',
    'Si el email no es válido o está repetido, la app mostrará un mensaje de error.',
    'Cuando se guarde correctamente, ese email se usará para avisos automáticos.',
  ]);

  addSection(doc, '5. Notificaciones: qué verás y cómo funcionan');
  addBullets(doc, [
    'Aviso instantáneo en pantalla cuando hay cambios relevantes (dura 7 segundos).',
    'Panel de notificaciones para ver historial y estado leído/no leído.',
    'Aviso por email (si tu email está configurado y válido).',
    'Los mensajes llegan cuando se realizan operaciones como cambios de turno que te afectan.',
  ]);

  addSection(doc, '6. Agenda personal y control de jornada');
  addParagraph(
    doc,
    'La agenda personal te permite revisar tu planificación individual con más detalle. Según permisos, podrás consultar tus asignaciones, ausencias y variaciones de horario en periodos concretos.'
  );
  addBullets(doc, [
    'Consulta de días trabajados y tipos de turno.',
    'Revisión de ausencias (CA, SICK LEAVE, FP, etc.).',
    'Visualización de posibles turnos partidos y ajustes manuales.',
  ]);

  addSection(doc, '7. Deseos (Wishes): solicitud de preferencias');
  addParagraph(
    doc,
    'El módulo de deseos te permite expresar preferencias de planificación (por ejemplo, disponibilidad o no disponibilidad en fechas concretas). Estas solicitudes se revisan por administración antes de ser aplicadas.'
  );
  addNumbered(doc, [
    'Accede al módulo de deseos.',
    'Selecciona fecha o rango y define tu preferencia.',
    'Guarda la solicitud.',
    'Espera validación del administrador/a.',
  ]);

  addSection(doc, '8. Horas y balance: cómo interpretar tus datos');
  addParagraph(
    doc,
    'Zenova calcula horas de forma automática según turno asignado y reglas de jornada (100%, 90%, 80%). También puede incluir ajustes manuales cuando se registra una modificación específica.'
  );
  addBullets(doc, [
    'Balance mensual: resumen del mes en curso.',
    'Balance anual: acumulado para seguimiento global.',
    'Distribución por tipo de turno para control de equidad.',
  ]);

  addSection(doc, '9. Buenas prácticas para usuarios');
  addBullets(doc, [
    'Mantén tu email actualizado para no perder avisos importantes.',
    'Cambia tu contraseña periódicamente.',
    'Revisa notificaciones después de cualquier modificación de planificación.',
    'Si detectas un error, informa a administración con fecha, turno y captura si es posible.',
    'No compartas tu contraseña.',
  ]);

  addSection(doc, '10. Problemas frecuentes y solución rápida');
  addBullets(doc, [
    'No llega email: verifica en “Mi Perfil” que el email sea correcto y no tenga errores.',
    'No puedo iniciar sesión: revisa si cambiaste email recientemente y usa el nuevo.',
    'No veo cambios: refresca navegador; si persiste, consulta con administración.',
    'Mensaje de permisos: la acción puede estar limitada por tu rol.',
  ]);

  addSection(doc, '11. Soporte y seguridad');
  addParagraph(
    doc,
    'Zenova guarda y sincroniza información mediante Supabase. Para soporte, comunica siempre el contexto exacto del problema: fecha, pantalla, usuario y acción realizada. Esto permite resolver incidencias de forma más rápida y segura.'
  );

  doc.end();
  return fullPath;
};

const writeAdminGuide = () => {
  const { doc, fullPath } = createDoc('Guia_Administrador_Zenova.pdf');

  addTitle(
    doc,
    'Zenova — Guía Completa para Administrador/a',
    'Versión 2026 · Operación avanzada, gobierno del dato y notificaciones'
  );

  addSection(doc, '1. Rol administrador: alcance y responsabilidad');
  addParagraph(
    doc,
    'El rol administrador tiene control total sobre planificación, bloqueos de mes, usuarios, validación de deseos y mantenimiento de consistencia operativa. Además, es responsable de que las reglas de cobertura clínica se cumplan diariamente y de que la comunicación por notificaciones sea fiable.'
  );

  addSection(doc, '2. Arquitectura funcional resumida');
  addBullets(doc, [
    'Frontend React + TypeScript con lógica principal en App.tsx.',
    'Persistencia colaborativa en Supabase (app_state + users + turnos según flujo).',
    'Sincronización en tiempo real por canales Supabase con fallback de polling.',
    'Control de sesión/roles desde UserContext.',
    'Motor de turnos con reglas clínicas, jornadas laborales y restricciones semanales.',
  ]);

  addSection(doc, '3. Gestión de usuarios y permisos');
  addParagraph(
    doc,
    'Desde el módulo de usuarios puedes crear, editar y eliminar cuentas, asignar rol y asociar nurseId cuando corresponda. Es recomendable mantener naming consistente y evitar emails duplicados para minimizar errores de login y notificación.'
  );
  addBullets(doc, [
    'Roles disponibles: admin, nurse, viewer.',
    'Permisos de vista y permisos reales de acción son capas distintas.',
    'Impersonación para soporte/diagnóstico sin perder control admin.',
  ]);

  addSection(doc, '4. Configuración y operación del calendario');
  addNumbered(doc, [
    'Selecciona mes de trabajo.',
    'Verifica estado del mes (editable o bloqueado).',
    'Aplica cambios manuales cuando sea necesario.',
    'Usa recalculado con alcance correcto (día/semana/resto de mes) para no sobrescribir trabajo válido.',
    'Revisa reglas de cobertura clínica tras cada cambio estructural.',
  ]);

  addSection(doc, '5. Cobertura clínica obligatoria y control de calidad');
  addParagraph(
    doc,
    'La planificación debe asegurar mínimos clínicos por día laborable, incluyendo mañana y tarde según tipo de jornada y contexto semanal. Tras cambios masivos, revisa especialmente días críticos (lunes y viernes) y semanas de SESSION para confirmar que no existan huecos.'
  );
  addBullets(doc, [
    'Validar cupos de URGENCES y TRAVAIL por franja horaria.',
    'Confirmar impacto de jornadas 80%/90% antes de cerrar mes.',
    'Comprobar que festivos, cierres y excepciones no rompan cobertura mínima.',
  ]);

  addSection(doc, '6. Jornadas laborales (80/90/100)');
  addParagraph(
    doc,
    'Las jornadas influyen directamente en disponibilidad real del personal. Deben configurarse correctamente para evitar asignaciones imposibles y desequilibrios de carga.'
  );
  addBullets(doc, [
    '100%: jornada completa sin reducción.',
    '90%: reducción por salida anticipada o bloque específico.',
    '80%: día completo libre o viernes + reducción extra.',
    'Recomendación: revisar consistencia de jornada antes de generar planificación anual.',
  ]);

  addSection(doc, '7. Cambios manuales, swaps e historial');
  addParagraph(
    doc,
    'Toda intervención manual debe quedar registrada para trazabilidad. Usa los modales de edición con criterio y evita cambios simultáneos no coordinados cuando haya varios administradores conectados.'
  );
  addBullets(doc, [
    'Cambio manual por día/rango.',
    'Swap entre profesionales.',
    'Registro en histórico para auditoría operativa.',
    'Edición de horas con nota explicativa en casos excepcionales.',
  ]);

  addSection(doc, '8. Wishes: flujo recomendado de validación');
  addNumbered(doc, [
    'Revisar solicitudes por fecha y criticidad de servicio.',
    'Aprobar/rechazar con criterio homogéneo para todo el equipo.',
    'Aplicar en planificación sin comprometer cobertura obligatoria.',
    'Comunicar cambios mediante notificaciones para transparencia.',
  ]);

  addSection(doc, '9. Notificaciones y email: operación en producción');
  addParagraph(
    doc,
    'El sistema de avisos combina notificación in-app y envío por email. Para que funcione en producción, la Edge Function debe estar desplegada y con secretos válidos en Supabase.'
  );
  addBullets(doc, [
    'Edge Function: send-notification-email desplegada sin errores.',
    'Secrets configurados: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME.',
    'Usuarios con email válido guardado en su perfil.',
    'Filtro de emails de prueba activo para evitar envíos a direcciones placeholder.',
  ]);

  addSection(doc, '10. Cierre de mes y buenas prácticas de gobernanza');
  addNumbered(doc, [
    'Antes de bloquear mes: revisar cobertura, jornadas y notificaciones pendientes.',
    'Bloquear mes solo cuando no queden correcciones operativas.',
    'Evitar múltiples fuentes de verdad para turnos manuales sin reconciliación.',
    'Mantener respaldo periódico y control de cambios críticos.',
  ]);

  addSection(doc, '11. Checklist de administración diaria');
  addBullets(doc, [
    'Revisar notificaciones no leídas y cambios del día.',
    'Validar que no haya huecos en turnos clínicos críticos.',
    'Confirmar que nuevas altas de usuarios tengan rol y email correctos.',
    'Verificar que la sincronización colaborativa refleja los últimos cambios.',
    'Registrar incidencias y acciones correctivas para trazabilidad.',
  ]);

  addSection(doc, '12. Incidencias comunes y resolución');
  addBullets(doc, [
    'Error al enviar email: revisar secretos y logs de Edge Function.',
    'Usuario no recibe avisos: confirmar email guardado y no duplicado.',
    'Diferencias entre vistas: refrescar sesión y validar updatedAt del estado.',
    'Comportamiento inesperado tras cambios masivos: recalcular con alcance controlado y revisar histórico.',
  ]);

  doc.end();
  return fullPath;
};

const userPdf = writeUserGuide();
const adminPdf = writeAdminGuide();

console.log('PDF generado:', userPdf);
console.log('PDF generado:', adminPdf);
