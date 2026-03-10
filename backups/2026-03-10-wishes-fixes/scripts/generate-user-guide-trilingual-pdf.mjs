#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const docsDir = path.resolve('docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

const outputPath = path.join(docsDir, 'User_Guide_Zenova_ES_EN_FR.pdf');
const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
doc.pipe(fs.createWriteStream(outputPath));

doc.registerFont('Regular', 'Helvetica');
doc.registerFont('Bold', 'Helvetica-Bold');

const addPageTitle = (title, subtitle) => {
  doc.font('Bold').fontSize(20).fillColor('#0F172A').text(title, { align: 'left' });
  doc.moveDown(0.2);
  doc.font('Regular').fontSize(10).fillColor('#475569').text(subtitle);
  doc.moveDown(0.8);
};

const addSection = (title) => {
  if (doc.y > 720) doc.addPage();
  doc.font('Bold').fontSize(13).fillColor('#0B3B66').text(title);
  doc.moveDown(0.25);
};

const addParagraph = (text) => {
  doc.font('Regular').fontSize(10.5).fillColor('#111827').text(text, { align: 'left' });
  doc.moveDown(0.35);
};

const addBullets = (items) => {
  items.forEach((item) => {
    if (doc.y > 730) doc.addPage();
    doc.font('Regular').fontSize(10.5).fillColor('#111827').text(`• ${item}`, { indent: 10 });
  });
  doc.moveDown(0.35);
};

const addStep = (lines) => {
  lines.forEach((line) => {
    if (doc.y > 730) doc.addPage();
    doc.font('Regular').fontSize(10.5).fillColor('#111827').text(line, { indent: 10 });
  });
  doc.moveDown(0.35);
};

const addLanguageDivider = (label) => {
  if (doc.y > 690) doc.addPage();
  doc.moveDown(0.6);
  doc.font('Bold').fontSize(15).fillColor('#7C2D12').text(label);
  doc.moveDown(0.2);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).strokeColor('#FDBA74').stroke();
  doc.moveDown(0.6);
};

addPageTitle('Zenova — Practical User Guide (ES / EN / FR)', 'Single shareable edition · Updated with real app behavior · March 2026');
addParagraph('This PDF contains the same practical user guide in Spanish, English, and French. The content reflects the real current behavior of Zenova (Wishes workflow, swap flow, reduction badge, language button, and exports).');

addLanguageDivider('ESPAÑOL');
addSection('1) Acceso y perfil');
addBullets([
  'Inicia sesión con tu usuario y contraseña.',
  'Si es primer acceso, cambia contraseña obligatoriamente.',
  'En Mi Perfil, guarda tu email de notificaciones (crítico para recibir avisos por correo).',
  'Puedes cambiar idioma desde el botón de bandera + nombre del idioma.'
]);

addSection('2) Calendario y colores reales de turnos');
addBullets([
  'URGENCES/URGENCES_C: azul claro; URG PM: azul intenso.',
  'TRAVAIL/TRAVAIL_C: amarillo claro; TRAV PM: amarillo intenso.',
  'ADMIN/ADM_PLUS: naranja claro / naranja intenso.',
  'TW/TW_ABROAD: morado claro / morado intenso.',
  'STRASBOURG: rosa.',
  'SICK_LEAVE (CM): gris oscuro; CA: gris claro; F: rojo.',
  'VACCIN y variantes: gama verde-azulada (teal).',
  'Turnos split/custom: celdas combinadas por bloques de color.'
]);

addSection('3) Wishes (cómo funciona de verdad)');
addStep([
  'Paso 1: Ve a la vista Wishes.',
  'Paso 2: En la celda del día, escribe tu deseo directamente.',
  'Paso 3 (opcional): usa los 3 puntos verticales para asignar tipo (CA, CM, FP, RECUP, TW, TW Abroad).',
  'Paso 4: haz clic fuera de la celda para guardar.'
]);
addBullets([
  'Estados reales: pendiente (reloj ámbar), validada (check verde), eliminada (si se borra).',
  'No existe botón “New Wish” en este flujo principal.'
]);

addSection('4) Swap de turnos (flujo real)');
addStep([
  'Paso 1: En calendario general, haz doble clic sobre la celda del turno.',
  'Paso 2: Se abre panel Swap.',
  'Paso 3: Selecciona Nurse 2.',
  'Paso 4: Revisa previsualización y confirma con “Confirm Swap”.'
]);
addBullets([
  'No hay campo de motivo en el panel actual.',
  'No hay estados pendientes/aceptado/rechazado: el swap se aplica al confirmar.',
  'Puedes revisar swaps en histórico general o en tu agenda personal (cambios manuales del mes).'
]);

addSection('5) Agenda personal y horas');
addBullets([
  'El control fino de horas está en Agenda Personal (no en una tabla mensual clásica).',
  'Verás balance semanal, diferencia del mes y total del mes.',
  'Si aparece una “R” amarilla en la celda: hay reducción de jornada activa; al pasar el ratón verás detalle.',
  'En semanas de cierre sin días laborables planificables, el teórico semanal es 0.'
]);

addSection('6) Exportaciones reales disponibles');
addBullets([
  'Agenda personal: PDF del mes, PDF anual y Copy al portapapeles.',
  'Wishes: CSV, Copy al portapapeles y PDF (impresión/exportación).',
  'Los archivos descargados van a la carpeta Descargas del sistema.'
]);

addSection('7) Resolución rápida de problemas');
addBullets([
  'No ves cambios: refresca (Ctrl+R o Ctrl+F5).',
  'No llegan emails: revisa email en perfil y carpeta spam.',
  'Olvido de contraseña: contacta con admin.',
  'Problemas de swap: contacta con admin.'
]);

addLanguageDivider('ENGLISH');
addSection('1) Access and profile');
addBullets([
  'Sign in with your username and password.',
  'On first login, password change is mandatory.',
  'In My Profile, save your notification email (critical for email alerts).',
  'You can change language from the flag + language-name button.'
]);

addSection('2) Calendar and real shift colors');
addBullets([
  'URGENCES/URGENCES_C: light blue; URG PM: strong blue.',
  'TRAVAIL/TRAVAIL_C: light yellow; TRAV PM: strong yellow.',
  'ADMIN/ADM_PLUS: light orange / strong orange.',
  'TW/TW_ABROAD: light purple / strong purple.',
  'STRASBOURG: rose.',
  'SICK_LEAVE (CM): dark gray; CA: light gray; F: red.',
  'VACCIN variants: teal palette.',
  'Split/custom shifts: combined color blocks in the same cell.'
]);

addSection('3) Wishes (real behavior)');
addStep([
  'Step 1: Go to the Wishes view.',
  'Step 2: Type your wish directly inside the day cell.',
  'Step 3 (optional): use the vertical 3-dots menu to assign type (CA, CM, FP, RECUP, TW, TW Abroad).',
  'Step 4: click outside the cell to save.'
]);
addBullets([
  'Real states: pending (amber clock), validated (green check), deleted (wish removed).',
  'There is no “New Wish” button in the main workflow.'
]);

addSection('4) Shift swap (real flow)');
addStep([
  'Step 1: In the general schedule, double-click the shift cell.',
  'Step 2: Swap panel opens.',
  'Step 3: Select Nurse 2.',
  'Step 4: Review preview and click “Confirm Swap”.'
]);
addBullets([
  'No reason field exists in the current swap panel.',
  'No pending/accepted/rejected workflow: swap is applied on confirmation.',
  'You can review swaps in general history or in personal agenda monthly manual changes.'
]);

addSection('5) Personal agenda and hours');
addBullets([
  'Fine-grained hour tracking is in Personal Agenda.',
  'You get weekly balance, month difference, and month total.',
  'A yellow “R” badge means an active workload reduction rule applies that day.',
  'For fully closed weeks with no plannable weekdays, theoretical weekly hours are 0.'
]);

addSection('6) Real export options');
addBullets([
  'Personal agenda: Month PDF, Year PDF, and Copy to clipboard.',
  'Wishes: CSV, Copy to clipboard, and PDF (print/export).',
  'Downloads are saved in your system Downloads folder.'
]);

addSection('7) Quick troubleshooting');
addBullets([
  'Changes not visible: refresh (Ctrl+R / Ctrl+F5).',
  'No email alerts: check profile email and spam folder.',
  'Forgot password: contact admin.',
  'Swap issue: contact admin.'
]);

addLanguageDivider('FRANÇAIS');
addSection('1) Accès et profil');
addBullets([
  'Connectez-vous avec votre identifiant et mot de passe.',
  'Au premier accès, le changement de mot de passe est obligatoire.',
  'Dans Mon Profil, enregistrez votre e-mail de notification (critique pour les alertes e-mail).',
  'Vous pouvez changer de langue avec le bouton drapeau + nom de la langue.'
]);

addSection('2) Calendrier et couleurs réelles des postes');
addBullets([
  'URGENCES/URGENCES_C : bleu clair ; URG PM : bleu intense.',
  'TRAVAIL/TRAVAIL_C : jaune clair ; TRAV PM : jaune intense.',
  'ADMIN/ADM_PLUS : orange clair / orange intense.',
  'TW/TW_ABROAD : violet clair / violet intense.',
  'STRASBOURG : rose.',
  'SICK_LEAVE (CM) : gris foncé ; CA : gris clair ; F : rouge.',
  'VACCIN et variantes : palette teal (vert-bleu).',
  'Postes split/custom : blocs de couleur combinés dans la même cellule.'
]);

addSection('3) Wishes (fonctionnement réel)');
addStep([
  'Étape 1 : Ouvrez la vue Wishes.',
  'Étape 2 : Écrivez votre demande directement dans la cellule du jour.',
  'Étape 3 (optionnel) : utilisez le menu 3 points verticaux pour définir le type (CA, CM, FP, RECUP, TW, TW Abroad).',
  'Étape 4 : cliquez hors de la cellule pour enregistrer.'
]);
addBullets([
  'États réels : en attente (horloge ambre), validée (check vert), supprimée (demande effacée).',
  'Le bouton “New Wish” n’existe pas dans ce flux principal.'
]);

addSection('4) Échange de poste (flux réel)');
addStep([
  'Étape 1 : Dans le planning général, double-cliquez la cellule du poste.',
  'Étape 2 : Le panneau Swap s’ouvre.',
  'Étape 3 : Sélectionnez Nurse 2.',
  'Étape 4 : Vérifiez l’aperçu puis cliquez “Confirm Swap”.'
]);
addBullets([
  'Il n’y a pas de champ motif dans le panneau actuel.',
  'Il n’y a pas de statut en attente/accepté/refusé : l’échange est appliqué à la confirmation.',
  'Les échanges se consultent dans l’historique général ou l’agenda personnel (modifications manuelles du mois).'
]);

addSection('5) Agenda personnel et heures');
addBullets([
  'Le suivi détaillé des heures est dans l’Agenda Personnel.',
  'Vous voyez le solde hebdomadaire, la différence du mois et le total du mois.',
  'Le badge jaune “R” indique une réduction de temps de travail active ce jour-là.',
  'Pour une semaine entièrement fermée sans jours ouvrables planifiables, le théorique hebdomadaire est 0.'
]);

addSection('6) Exports réellement disponibles');
addBullets([
  'Agenda personnel : PDF mensuel, PDF annuel, et copie dans le presse-papiers.',
  'Wishes : CSV, copie dans le presse-papiers et PDF (impression/export).',
  'Les fichiers sont enregistrés dans le dossier Téléchargements du système.'
]);

addSection('7) Dépannage rapide');
addBullets([
  'Changements non visibles : actualisez (Ctrl+R / Ctrl+F5).',
  'Pas d’e-mails : vérifiez l’e-mail du profil et le dossier spam.',
  'Mot de passe oublié : contactez l’admin.',
  'Problème de swap : contactez l’admin.'
]);

doc.moveDown(1);
doc.font('Regular').fontSize(9).fillColor('#64748B').text('Zenova · User Guide ES/EN/FR · Generated on ' + new Date().toLocaleString('en-GB'), { align: 'center' });

doc.end();
console.log('✅ Trilingual PDF generated:', outputPath);
