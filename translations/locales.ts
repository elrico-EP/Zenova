
export const locales = {
  es: {
    // General
    appTitle: 'Planificador de Turnos',
    today: 'Hoy',
    previousMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    changeLanguage: 'Cambiar idioma',
    footerText: 'Creado con ❤️ para equipos de enfermería. Simplificando la planificación de turnos.',
    close: 'Cerrar',
    save: 'Guardar',
    saveChanges: 'Guardar Cambios',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    add: 'Añadir',
    back: 'Atrás',
    note: 'Nota',
    unknown: 'Desconocido',
    export: 'Exportar',
    exportPDF: 'Exportar a PDF',
    copyToSheets: 'Copiar para Sheets',
    copied: '¡Copiado!',
    help: 'Ayuda',
    lockMonth: 'Bloquear Mes',
    unlockMonth: 'Desbloquear Mes',
    viewAsAdmin: 'Ver como Administrador',
    viewAsNurse: 'Ver como Enfermero/a',
    viewingAs: 'Viendo como: ',
    returnToAdmin: 'Volver a vista Admin',
    selectNurse: 'Seleccionar enfermero/a',
    adminView: 'Administrador',
    testUserView: 'Usuario Test',
    selectView: 'Cambiar Vista',
    optional: 'opcional',

    // Days of week
    day_monday: 'Lunes',
    day_tuesday: 'Martes',
    day_wednesday: 'Miércoles',
    day_thursday: 'Jueves',
    day_friday: 'Viernes',
    day: 'Día',

    // Shift Rotations
    shiftRotations_title: 'Gestión de Rotaciones',
    shiftRotations_templates: 'Plantillas de Rotación',
    shiftRotations_assignments: 'Asignaciones de Rotación',
    shiftRotations_newTemplate: 'Nueva Plantilla de Rotación',
    shiftRotations_templateName: 'Nombre de la plantilla',
    shiftRotations_addDay: 'Añadir día al patrón',
    shiftRotations_saveTemplate: 'Guardar Plantilla',
    shiftRotations_assignNurses: 'Asignar Rotación',
    shiftRotations_selectRotation: 'Seleccionar una rotación...',
    shiftRotations_selectNurses: 'Seleccionar enfermeros/as',
    shiftRotations_startDate: 'Fecha de inicio de la rotación',
    shiftRotations_saveAssignment: 'Guardar Asignación',
    shiftRotations_delete_confirm: '¿Estás seguro de que quieres eliminar esto?',

    // Jornada Laboral
    jornada_title: 'Jornada laboral',
    jornada_select_nurse: 'Seleccionar enfermero/a...',
    jornada_add_period: 'Añadir Período de Jornada',
    jornada_edit_period: 'Editar Período de Jornada',
    jornada_no_periods: 'No hay períodos de jornada definidos para este enfermero/a.',
    jornada_percentage: 'Porcentaje',
    jornada_startDate: 'Fecha Inicio',
    jornada_endDate: 'Fecha Fin',
    jornada_reduction_title: 'Cómo se aplica esta reducción',
    jornada_description_header: 'Tipo de Reducción',
    jornada_delete_confirm_message: '¿Estás seguro de que quieres eliminar este período de jornada?',
    jornada_error_overlap: 'Las fechas de este período se solapan con uno existente.',
    jornada_select_day: 'Seleccionar día',
    jornada_reduction_option: 'Opción de Reducción',
    jornada_option_FULL_DAY_OFF: 'Día libre completo (L-J)',
    jornada_option_START_SHIFT_4H: 'Reducción 3h al inicio del turno (L-J)',
    jornada_option_END_SHIFT_4H: 'Reducción 3h al final del turno (L-J)',
    jornada_option_LEAVE_EARLY_1H_L_J: 'Salir 1h antes cada día (L-J)',
    jornada_option_FRIDAY_PLUS_EXTRA: 'Viernes libre + 1.5h extra',
    jornada_extra_reduction_day: 'Día de reducción extra (1.5h)',
    jornada_summary_FULL_DAY_OFF: 'Día libre el {day}',
    jornada_summary_START_SHIFT_4H: 'Reducción 3h al inicio del turno ({day})',
    jornada_summary_END_SHIFT_4H: 'Reducción 3h al final del turno ({day})',
    jornada_summary_LEAVE_EARLY_1H_L_J: 'Salida anticipada de 1h (L-J)',
    jornada_summary_FRIDAY_PLUS_EXTRA: 'Viernes libre + 1.5h el {day}',
    // FIX: Add missing translation keys for jornada laboral feature.
    jornada_reductionMode: 'Modo de Reducción',
    jornada_reductionMode_DAY_OFF: 'Día libre (regla 80%)',
    jornada_reductionMode_HOURS_PER_DAY: 'Horas proporcionales',
    jornada_reductionMode_TIME_BLOCK: 'Bloque de tiempo libre',
    jornada_reductionMode_FIXED_DAY: 'Día Fijo Libre',
    jornada_horaInicio: 'Inicio Reducción',
    jornada_horaFin: 'Fin Reducción',
    
    // Manual Change Modal / Sidebar
    manualChangeTitle: 'Edición de Turno',
    step1_nurses: '1. Seleccionar Enfermero/a(s)',
    step2_shift: '2. Seleccionar Turno o Incidencia',
    step3_dates: '3. Seleccionar Rango de Fechas',
    step4_hours: '4. Seleccionar Rango de Horas (Opcional)',
    step5_scope: '5. Definir Alcance',
    startTime: 'Hora Inicio',
    endTime: 'Hora Fin',
    setCustomHours: 'Definir Horario',
    swapShifts: 'Intercambiar Turnos',
    changeMyHours: 'Cambiar Horas',
    nurse1: 'Enfermero/a 1',
    nurse2: 'Enfermero/a 2',
    reasonForChange: 'Motivo del cambio (ej. consulta médica)',
    previewChanges: 'Previsualizar Cambios',
    confirmAndApply: 'Confirmar y Aplicar Cambios',
    previewTitle: 'Resumen de Cambios Automáticos',
    previewDescription: 'Para mantener la cobertura, los siguientes turnos se ajustarán automáticamente. Revisa los cambios antes de confirmar.',
    noAutomaticChanges: 'No se requieren cambios automáticos en la cobertura.',
    scope_single_title: 'Solo a enfermeros seleccionados',
    scope_single_desc: 'Aplica el cambio solo a los enfermeros seleccionados en las fechas elegidas. La cobertura NO se reajusta automáticamente.',
    scope_all_nurses_day_title: 'Ajustar cobertura en las fechas seleccionadas',
    scope_all_nurses_day_desc: 'Reasigna al personal de ADMIN/TW en los días seleccionados para mantener la cobertura obligatoria. No afecta otros días.',
    scope_all_nurses_from_day_title: 'Replanificar desde fecha de inicio',
    scope_all_nurses_from_day_desc: 'Fija este cambio y recalcula todo el planning desde el primer día seleccionado hasta fin de año.',
    selectAll: 'Seleccionar todos',
    deselectAll: 'Deseleccionar todos',
    error_noNurseSelected: 'Debes seleccionar al menos un enfermero/a.',

    // Visual Swap
    swapShiftsTitle: 'Intercambio de turnos',
    swapShiftsDescription: 'Este cambio es solo visual y no afecta balances ni horas. El turno base se mantiene.',
    selectDate: '1. Seleccionar Fecha',
    selectParticipants: '2. Seleccionar Participantes',
    confirmSwap: 'Confirmar Intercambio',
    swap_error_nurses: 'Debes seleccionar dos enfermeros/as diferentes.',
    swap_error_date: 'Debes seleccionar una fecha.',
    swap_original: 'Original:',
    swappedWith: 'Intercambiado con',
    undoSwap: 'Deshacer',
    noSwaps: 'No hay intercambios registrados para este/a enfermero/a.',
    swapHistory: 'Historial de Intercambios',

    // Zoom Controls
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    fitToScreen: 'Ajustar a pantalla',

    // Schedule Grid
    present: 'Presentes',
    notes: 'Notas',
    week: 'SEMANA',
    closed: 'CERRADO',

    // Shift Palette
    shiftLegendTitle: 'Leyenda de Turnos',

    // Nurse Manager
    manageTeam: 'Equipo',
    internName: 'Nombre becario/a',
    nurseName: 'Nombre',
    assignAbsence: 'Asignar ausencia a',
    addNursePlaceholder: 'Añadir enfermero/a...',

    // Vaccination Planner
    vaccinationCampaign: 'Campaña de Vacunación',
    startDate: 'Fecha de Inicio',
    endDate: 'Fecha de Fin',

    // Rule Violations
    planningAlerts: 'Alertas de Planificación',
    noConflicts: '¡Buen trabajo! No hay conflictos.',
    generalCoverage: 'Cobertura general',
    violation_urgCoverage: 'Cobertura Urgencias baja (necesita 2, tiene {count})',
    violation_travCoverage: 'Cobertura Trabajo baja (necesita 2, tiene {count})',
    violation_missingUrgT: 'Falta 1 en Urgencias Tarde',
    violation_missingTravT: 'Falta 1 en Trabajo Tarde',
    violation_missingVacM: 'Cobertura Vacunación Mañana incompleta (necesita 2)',
    violation_missingVacT: 'Cobertura Vacunación Tarde incompleta (necesita 2)',
    violation_exceedsAfternoon: 'Excede 2 turnos de tarde (tiene {count})',

    // Rules Info
    planningGuide: 'Guía de Planificación',
    rules: [],

    // Summary Table
    monthlySummary: 'Resumen Mensual',
    nurse: 'Enfermero/a',
    total: 'Total',

    // Agenda Planner
    agendaPlanner: 'Planificador de Agenda',
    agenda2026Warning: 'La agenda para 2026 está pre-cargada y no es editable.',
    weekOf: 'Semana del',
    activity_NORMAL: 'Normal',
    activity_SESSION: 'Sesión',
    activity_WHITE_GREEN: 'White/Green',
    activity_REDUCED: 'Reducida',
    activity_CLOSED: 'Cerrado',

    // Wishes Page
    wishesPageTitle: 'Deseos e Incidencias',
    wishesViewButton: 'Deseos',

    // Agenda Popup
    planningNotice: 'Aviso de Planificación',
    agendaPopupMessage: 'Recuerda: al entrar en octubre, es necesario revisar y configurar la nueva agenda para el próximo año ({year}).',
    understood: 'Entendido',
    
    deleteAssignment: 'Eliminar Asignación',

    // Mass Leave Modal
    massAssignAbsence: 'Asignar Ausencia en Masa',
    for: 'Para',
    absenceType: 'Tipo de Ausencia',
    leaveType_CA: 'Congé Annuel (Vacaciones)',
    leaveType_SICK_LEAVE: 'Sick Leave (Baja Médica)',
    leaveType_FP: 'Formación Profesional',
    error_dateOrder: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
    applyToWorkdays: 'Aplicar a Días Laborables',

    // Notes Popover
    addNotePlaceholder: 'Añadir nota...',
    color: 'Color',
    
    // History Log
    historyLog: 'Historial de Cambios',
    history_addNurse: 'Añadido enfermero/a',
    history_removeNurse: 'Eliminado enfermero/a',
    history_updateNurseName: 'Cambiado nombre',
    history_manualChange: 'Cambio manual de turno',
    history_timeChange: 'Ajuste de horas',
    history_noteChange: 'Nota de día',
    history_personalNoteChange: 'Nota personal',
    history_workConditionsChange: 'Condiciones laborales',
    history_strasbourgUpdate: 'Asignación Estrasburgo',
    history_vaccinationPeriodChange: 'Periodo de vacunación',
    history_swapShifts: 'Intercambio de turnos',
    history_undoSwap: 'Deshacer intercambio de turnos',
    history_setPersonalHours: 'Cambio de horas personal',
    history_adminSetHours: 'Ajuste de horas (Admin)',
    history_jornadaChange: 'Jornadas laborales actualizadas',

    // Balance Page
    balancePageTitle: 'Balance de Turnos y Horas',
    travMonthHeader: 'Trabajo (Mes)',
    urgMonthHeader: 'Urgencias (Mes)',
    admMonthHeader: 'Admin',
    twMonthHeader: 'TW',
    holidaysHeader: 'CA',
    trainingHeader: 'FP',
    sickLeaveHeader: 'Baja',
    hoursMonthHeader: 'Total Horas (Mes)',
    hoursYearHeader: 'Total Horas (Año)',
    theoreticalHoursMonth: 'Horas teóricas del mes',
    theoreticalHoursCalculation: '({normalDays} días × 8h + {specialDays} fest./cierre × 8.5h)',
    balance_info_title: 'Balance de Horas (Informativo)',
    balance_info_realizadas: 'Horas realizadas (mes)',
    balance_info_teoricas: 'Horas teóricas (mes)',
    balance_info_diferencia: 'Diferencia',

    helpManualRedesign: {
      title: "📖 Manual de Usuario Definitivo: Zenova",
      sections: [
        {
          title: "1. Introducción: La Filosofía de Zenova",
          content: [
            "Bienvenido/a a <strong>Zenova</strong>, tu asistente digital para la planificación de turnos del equipo de enfermería. El nombre \"Zenova\" representa nuestro compromiso dual: la paz interior (<strong>Zen</strong>) que necesitamos para cuidar, y la explosión creativa (<strong>Nova</strong>) que aplicamos para resolver la complejidad de la planificación.",
            "<strong>El Principio Clave:</strong> Zenova se basa en un sistema híbrido: <ol class='list-decimal list-inside pl-4 space-y-2'><li><strong>Base Automatizada y Equitativa:</strong> El sistema genera automáticamente un borrador de turnos (<strong>planning teórico</strong>) que cumple con las reglas de cobertura, equidad en turnos (urgencias, trabajo, etc.) y las condiciones laborales de cada persona (jornadas reducidas, etc.). Esta base es la \"fuente de la verdad\" para los cálculos de horas teóricas.</li><li><strong>Flexibilidad Humana con Overrides Visuales:</strong> Entendemos que la realidad diaria requiere flexibilidad. Para esto, Zenova introduce los <strong>Intercambios Visuales</strong>, una capa de modificación <strong>puramente estética</strong> que no altera la base de cálculo.</li></ol>",
            "Esto garantiza que el sistema siga siendo justo y equilibrado a largo plazo, mientras que la visualización diaria se adapta a las necesidades del equipo."
          ]
        },
        {
          title: "2. Roles y Accesos: ¿Qué Puedes Hacer?",
          content: [
            "La aplicación tiene dos niveles de acceso para garantizar la seguridad y la correcta gestión.",
            "<h4>2.1 Rol de Administrador</h4><p>El administrador tiene control total sobre la planificación y configuración.</p><ul class='list-disc list-inside pl-4 space-y-1'><li>✅ <strong>Puede ver y editar TODO:</strong> La Agenda General, la Agenda Individual de CUALQUIER enfermero/a, gestionar el equipo, configurar jornadas, gestionar eventos, y bloquear/desbloquear meses.</li><li>✅ <strong>Puede crear, modificar y deshacer Intercambios Visuales.</strong></li><li>✅ <strong>Puede ver el Historial de Cambios completo.</strong></li><li>✅ <strong>Puede \"suplantar\" la vista de un enfermero</strong> para ver la aplicación exactamente como la ven ellos.</li></ul>",
            "<h4>2.2 Rol de Enfermero/a (Usuario Estándar)</h4><p>El usuario estándar tiene acceso a su propia información y a la vista general del equipo.</p><ul class='list-disc list-inside pl-4 space-y-1'><li>✅ <strong>Puede ver:</strong> Su propia Agenda Individual y la Agenda General (solo lectura).</li><li>✅ <strong>Puede editar en su Agenda Individual:</strong> Sus horas reales de entrada y salida y sus notas personales.</li><li>❌ <strong>NO puede:</strong> Editar la Agenda General, crear Intercambios Visuales, ver la Agenda Individual de otros, o editar la configuración del equipo.</li></ul>"
          ]
        },
        {
          title: "3. La Interfaz Principal: Un Vistazo Rápido",
          content: [
            "La pantalla se divide en tres áreas principales:",
            "<ol class='list-decimal list-inside pl-4 space-y-2'><li><strong>Barra Superior (Header):</strong> Contiene el logo, selector de mes/año, navegación entre vistas, controles de exportación y el menú de usuario.</li><li><strong>Panel Lateral Izquierdo (Sidebar):</strong> Herramientas de gestión para administradores y el historial de cambios.</li><li><strong>Área de Contenido Principal:</strong> Muestra la Agenda General, el Balance Anual o el calendario de Deseos.</li></ol>"
          ]
        },
        {
            title: "4. La Agenda General: El Corazón del Planning",
            content: [
                "Es la cuadrícula principal que muestra el horario de todo el equipo para el mes seleccionado.",
                "<h4>4.1 Estructura de la Cuadrícula</h4><ul class='list-disc list-inside pl-4 space-y-1'><li><strong>Filas:</strong> Cada fila representa un día del mes.</li><li><strong>Columnas:</strong> La primera columna es el día, las siguientes son cada enfermero/a, y las últimas (para admins) son <strong>Presentes</strong> y <strong>Notas</strong> del día.</li><li><strong>Celda:</strong> La intersección de un día y un enfermero/a, mostrando el turno asignado.</li></ul>",
                "<h4>4.2 Tipos de Turnos y su Significado (Glosario Detallado)</h4><div class='overflow-x-auto'><table class='w-full text-left border-collapse'><thead><tr class='bg-slate-100'><th class='p-2 border'>Código</th><th class='p-2 border'>Etiqueta</th><th class='p-2 border'>Descripción y Propósito</th></tr></thead><tbody>" +
                "<tr><td class='p-2 border'><strong>URG M/T</strong></td><td class='p-2 border'>Urg M/T</td><td class='p-2 border'><strong>Urgencias (Mañana/Tarde):</strong> Turno clínico en el área de urgencias.</td></tr>" +
                "<tr><td class='p-2 border'><strong>TRAV M/T</strong></td><td class='p-2 border'>Trav M/T</td><td class='p-2 border'><strong>Trabajo (Mañana/Tarde):</strong> Turno clínico planificado.</td></tr>" +
                "<tr><td class='p-2 border'><strong>ADMIN</strong></td><td class='p-2 border'>Adm</td><td class='p-2 border'><strong>Administración:</strong> Tareas administrativas. Flexible para reasignar.</td></tr>" +
                "<tr><td class='p-2 border'><strong>TW</strong></td><td class='p-2 border'>TW</td><td class='p-2 border'><strong>Teletrabajo:</strong> Tareas desde casa. Flexible para reasignar.</td></tr>" +
                "<tr><td class='p-2 border'><strong>STRASBOURG</strong></td><td class='p-2 border'>STR</td><td class='p-2 border'><strong>Sesión de Estrasburgo:</strong> Lunes a Jueves. Suma 10h/día.</td></tr>" +
                "<tr><td class='p-2 border'><strong>STR-PREP</strong></td><td class='p-2 border'>(vacío)</td><td class='p-2 border'><strong>Preparación Estrasburgo:</strong> Viernes previo. Celda vacía con fondo rosa.</td></tr>" +
                "<tr><td class='p-2 border'><strong>VACCIN</strong></td><td class='p-2 border'>Vac</td><td class='p-2 border'><strong>Campaña de Vacunación.</strong></td></tr>" +
                "<tr><td class='p-2 border'><strong>SPLIT</strong></td><td class='p-2 border'>(dividido)</td><td class='p-2 border'><strong>Turno Partido:</strong> Combina dos medios turnos.</td></tr>" +
                "<tr><td class='p-2 border'><strong>CA</strong></td><td class='p-2 border'>CA</td><td class='p-2 border'><strong>Congé Annuel (Vacaciones):</strong> Ausencia justificada. No suma horas.</td></tr>" +
                "<tr><td class='p-2 border'><strong>SICK</strong></td><td class='p-2 border'>Sick</td><td class='p-2 border'><strong>Baja por Enfermedad:</strong> Ausencia justificada. No suma horas.</td></tr>" +
                "<tr><td class='p-2 border'><strong>FP</strong></td><td class='p-2 border'>FP</td><td class='p-2 border'><strong>Formación Profesional:</strong> Ausencia justificada. No suma horas.</td></tr>" +
                "<tr><td class='p-2 border'><strong>RECUP</strong></td><td class='p-2 border'>Recup</td><td class='p-2 border'><strong>Recuperación de Horas:</strong> Día libre compensatorio. No suma horas.</td></tr></tbody></table></div>",
                "<h4>4.3 Tipos de Semanas y su Código de Color</h4><ul class='list-disc list-inside pl-4 space-y-1'><li><strong>Normal (Fondo Blanco/Gris claro):</strong> Operativa estándar.</li><li><strong>Sesión (Fondo Rosa):</strong> Semana de sesión en Estrasburgo.</li><li><strong>White/Green (Fondo Verde claro):</strong> Semanas de menor actividad o de transición.</li><li><strong>Reducida (Fondo Amarillo claro):</strong> Periodos de baja actividad con menos personal.</li><li><strong>Cerrado (Fondo Gris):</strong> El servicio está cerrado.</li></ul>"
            ]
        },
        {
          title: "5. El Intercambio Visual de Turnos: La Herramienta Clave",
          content: [
            "Esta es la funcionalidad más importante para la gestión diaria flexible.",
            "<h4>5.1 ¿Para Qué Sirve?</h4><p>Para reflejar en la agenda un acuerdo de intercambio de turnos entre dos personas para un día concreto, <strong>sin alterar el sistema de cálculo de horas</strong>. Es un \"post-it\" digital sobre el planning oficial.</p>",
            "<h4>5.2 ¿Cómo Funciona? (Paso a Paso para Admins)</h4><ol class='list-decimal list-inside pl-4 space-y-1'><li><strong>Acceso:</strong> Haz <strong>doble clic</strong> en la celda del enfermero/a y día que quieres modificar.</li><li><strong>Panel Lateral:</strong> Se abrirá un panel a la derecha.</li><li><strong>Selección:</strong> Busca y selecciona al segundo enfermero/a.</li><li><strong>Previsualización:</strong> El panel te mostrará claramente cómo quedará la agenda.</li><li><strong>Confirmación:</strong> Pulsa \"Confirmar Intercambio\".</li></ol>",
            "<h4>5.3 ¿Qué Ocurre Después?</h4><ul class='list-disc list-inside pl-4 space-y-1'><li>Las celdas de ambos mostrarán el turno intercambiado.</li><li>Aparecerá un icono 🔁.</li><li>Al pasar el ratón sobre el icono, un tooltip te informará del turno real.</li><li>Se creará una entrada en el Historial de Cambios.</li></ul>",
            "<h4>5.4 Lo que HACE y lo que NO HACE un Intercambio Visual</h4><div class='overflow-x-auto'><table class='w-full text-left border-collapse'><thead><tr class='bg-slate-100'><th class='p-2 border'>✅ Lo que SÍ HACE</th><th class='p-2 border'>❌ Lo que NO HACE</th></tr></thead><tbody>" +
            "<tr><td class='p-2 border'>Cambia <strong>visualmente</strong> el turno.</td><td class='p-2 border'><strong>NO</strong> altera el turno base del algoritmo.</td></tr>" +
            "<tr><td class='p-2 border'>Añade un icono 🔁.</td><td class='p-2 border'><strong>NO</strong> afecta el cómputo de horas teóricas.</td></tr>" +
            "<tr><td class='p-2 border'>Permite saber quién está realmente en cada puesto.</td><td class='p-2 border'><strong>NO</strong> modifica el balance de tipos de turno.</td></tr>" +
            "<tr><td class='p-2 border'>Registra la acción en el Historial.</td><td class='p-2 border'><strong>NO</strong> se refleja en la Agenda Individual.</td></tr></tbody></table></div>"
          ]
        },
        {
            title: "6. La Agenda Individual: Tu Espacio Personal",
            content: [
                "Se accede haciendo clic en el icono 📅 junto a tu nombre. Se abre en una ventana independiente.",
                "<h4>6.1 Funcionalidades Clave</h4><ul class='list-disc list-inside pl-4 space-y-1'><li><strong>Calendario Personal:</strong> Muestra tus turnos <strong>base (teóricos)</strong>. No refleja los intercambios visuales.</li><li><strong>Registro de Horas Reales:</strong> ¡La función más importante! Puedes introducir tu hora de entrada y salida real. <strong>Estas horas tienen prioridad</strong> para calcular tu balance.</li><li><strong>Pausa Automática:</strong> El sistema descuenta 30 minutos de pausa para jornadas de 6 horas o más.</li><li><strong>Notas Personales:</strong> Visibles solo para ti.</li><li><strong>Balance Informativo:</strong> Un resumen de tus turnos y horas del mes y año.</li><li><strong>Maximizar/Restaurar:</strong> Usa los iconos ⛶ / 🗗 para ver a pantalla completa.</li></ul>"
            ]
        },
        {
            title: "7. Balances y Cálculo de Horas: Entendiendo los Números",
            content: [
                "El sistema distingue entre horas teóricas y reales para ofrecer flexibilidad y justicia.",
                "<h4>7.1 Horas Teóricas</h4><ul class='list-disc list-inside pl-4 space-y-1'><li>Calculadas automáticamente por el sistema.</li><li><strong>Base:</strong> Cada turno tiene una duración estándar (ej. `TRAV M` son 8.5h de L-J y 6h los V).</li><li><strong>Modificadores:</strong> Se ajustan según la jornada laboral.</li><li><strong>Uso:</strong> Sirven para generar el planning inicial y como valor por defecto.</li></ul>",
                "<h4>7.2 Horas Reales (Registradas)</h4><ul class='list-disc list-inside pl-4 space-y-1'><li>Las que tú introduces en tu Agenda Individual.</li><li><strong>Son la fuente de verdad para tu balance personal.</strong></li><li><strong>Ejemplo:</strong> Tu turno teórico es de 8:00 a 17:00 (8.5h), pero un día te quedas hasta las 17:30. Si registras \"08:00 - 17:30\", tu balance para ese día será de 9h.</li></ul>",
                "<h4>7.3 El Balance Final</h4><p>Es una herramienta <strong>informativa</strong>. Compara las horas que has realizado con las que teóricamente deberías haber hecho.</p>"
            ]
        },
        {
            title: "8. Glosario de Iconos y Símbolos",
            content: [
                "<div class='overflow-x-auto'><table class='w-full text-left border-collapse'><thead><tr class='bg-slate-100'><th class='p-2 border'>Icono</th><th class='p-2 border'>Nombre</th><th class='p-2 border'>Dónde se encuentra</th><th class='p-2 border'>Significado</th></tr></thead><tbody>" +
                "<tr><td class='p-2 border text-center'>🔁</td><td class='p-2 border'>Intercambio Visual</td><td class='p-2 border'>Celda de la Agenda General</td><td class='p-2 border'>El turno mostrado no es el original.</td></tr>" +
                "<tr><td class='p-2 border text-center'>📅</td><td class='p-2 border'>Abrir Agenda Individual</td><td class='p-2 border'>Junto a cada nombre</td><td class='p-2 border'>Abre la agenda personal.</td></tr>" +
                "<tr><td class='p-2 border text-center'>⛶ / 🗗</td><td class='p-2 border'>Maximizar / Restaurar</td><td class='p-2 border'>Ventana de Agenda Individual</td><td class='p-2 border'>Alterna vista de pantalla completa.</td></tr>" +
                "<tr><td class='p-2 border text-center'>✏️</td><td class='p-2 border'>Editar</td><td class='p-2 border'>Paneles de admin</td><td class='p-2 border'>Abre formulario de edición.</td></tr>" +
                "<tr><td class='p-2 border text-center'>🗑️</td><td class='p-2 border'>Eliminar</td><td class='p-2 border'>Paneles de admin</td><td class='p-2 border'>Elimina un elemento.</td></tr>" +
                "<tr><td class='p-2 border text-center'>🔒 / 🔓</td><td class='p-2 border'>Bloquear / Desbloquear Mes</td><td class='p-2 border'>Barra superior</td><td class='p-2 border'>Impide o permite la edición.</td></tr></tbody></table></div>"
            ]
        },
        {
            title: "9. Preguntas Frecuentes (FAQ)",
            content: [
                "<ul class='list-disc list-inside pl-4 space-y-2'><li><strong>P: Hice un intercambio visual, pero en mi Agenda Individual sigo viendo mi turno original. ¿Es un error?</strong><br><strong>R:</strong> No, es el comportamiento esperado. La Agenda Individual siempre muestra el turno <strong>base/teórico</strong>.</li><li><strong>P: ¿Por qué la celda del viernes de preparación para Estrasburgo está vacía?</strong><br><strong>R:</strong> Es una decisión de diseño para reducir el ruido visual. El fondo de color rosa ya indica que es una semana de sesión.</li><li><strong>P: Registré mis horas reales, pero en la Agenda General sigue apareciendo el horario teórico. ¿No se ha guardado?</strong><br><strong>R:</strong> Sí se ha guardado. La Agenda General siempre muestra la información teórica. Tus horas reales se usan para <strong>tu balance personal</strong>.</li><li><strong>P: ¿Cómo se deshace un intercambio visual?</strong><br><strong>R:</strong> Un administrador puede aplicar un nuevo intercambio para revertir al estado original o contactar con soporte.</li><li><strong>P: Si tengo una jornada reducida, ¿cómo se aplica?</strong><br><strong>R:</strong> El administrador la configura y el sistema la aplica automáticamente. Verás un turno especial o un horario ajustado.</li></ul>"
            ]
        }
      ]
    },

    // Shift descriptions
    shift_URGENCES_desc: 'Urgencias (Mañana)',
    shift_TRAVAIL_desc: 'Trabajo (Mañana)',
    shift_URGENCES_TARDE_desc: 'Urgencias (Tarde)',
    shift_TRAVAIL_TARDE_desc: 'Trabajo (Tarde)',
    shift_ADMIN_desc: 'Administración',
    shift_TW_desc: 'Teletrabajo',
    shift_STRASBOURG_desc: 'Sesión Estrasburgo',
    shift_LIBERO_desc: 'Turno especial pre-sesión',
    shift_RECUP_desc: 'Recuperación de horas',
    shift_FP_desc: 'Formación Profesional',
    shift_SICK_LEAVE_desc: 'Baja Médica',
    shift_CA_desc: 'Vacaciones Anuales',
    shift_F_desc: 'Festivo',
    shift_VACCIN_desc: 'Campaña Vacunación',
    shift_VACCIN_AM_desc: 'Vacunación (Mañana)',
    shift_VACCIN_PM_desc: 'Vacunación (Tarde)',
  },
  en: {
    // General
    appTitle: 'Shift Planner',
    today: 'Today',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    changeLanguage: 'Change language',
    footerText: 'Created with ❤️ for nursing teams. Simplifying shift planning.',
    close: 'Close',
    save: 'Save',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    add: 'Add',
    back: 'Back',
    note: 'Note',
    unknown: 'Unknown',
    export: 'Export',
    exportPDF: 'Export to PDF',
    copyToSheets: 'Copy for Sheets',
    copied: 'Copied!',
    help: 'Help',
    lockMonth: 'Lock Month',
    unlockMonth: 'Unlock Month',
    viewAsAdmin: 'View as Admin',
    viewAsNurse: 'View as Nurse',
    viewingAs: 'Viewing as: ',
    returnToAdmin: 'Return to Admin view',
    selectNurse: 'Select nurse',
    adminView: 'Administrator',
    testUserView: 'Test User',
    selectView: 'Change View',
    optional: 'optional',

    // Days of week
    day_monday: 'Monday',
    day_tuesday: 'Tuesday',
    day_wednesday: 'Wednesday',
    day_thursday: 'Thursday',
    day_friday: 'Friday',
    day: 'Day',

    // Shift Rotations
    shiftRotations_title: 'Rotation Management',
    shiftRotations_templates: 'Rotation Templates',
    shiftRotations_assignments: 'Rotation Assignments',
    shiftRotations_newTemplate: 'New Rotation Template',
    shiftRotations_templateName: 'Template name',
    shiftRotations_addDay: 'Add day to pattern',
    shiftRotations_saveTemplate: 'Save Template',
    shiftRotations_assignNurses: 'Assign Rotation',
    shiftRotations_selectRotation: 'Select a rotation...',
    shiftRotations_selectNurses: 'Select nurses',
    shiftRotations_startDate: 'Rotation start date',
    shiftRotations_saveAssignment: 'Save Assignment',
    shiftRotations_delete_confirm: 'Are you sure you want to delete this?',
    
    // Jornada Laboral
    jornada_title: 'Work Schedules',
    jornada_select_nurse: 'Select a nurse...',
    jornada_add_period: 'Add Work Period',
    jornada_edit_period: 'Edit Work Period',
    jornada_no_periods: 'No work schedule periods defined for this nurse.',
    jornada_percentage: 'Percentage',
    jornada_startDate: 'Start Date',
    jornada_endDate: 'End Date',
    jornada_reduction_title: 'How this reduction is applied',
    jornada_description_header: 'Reduction Type',
    jornada_delete_confirm_message: 'Are you sure you want to delete this work schedule period?',
    jornada_error_overlap: 'The dates for this period overlap with an existing one.',
    jornada_select_day: 'Select day',
    jornada_reduction_option: 'Reduction Option',
    jornada_option_FULL_DAY_OFF: 'Full day off (Mon-Thu)',
    jornada_option_START_SHIFT_4H: '3h reduction at start of shift (Mon-Thu)',
    jornada_option_END_SHIFT_4H: '3h reduction at end of shift (Mon-Thu)',
    jornada_option_LEAVE_EARLY_1H_L_J: 'Leave 1h early each day (Mon-Thu)',
    jornada_option_FRIDAY_PLUS_EXTRA: 'Friday off + 1.5h extra',
    jornada_extra_reduction_day: 'Extra reduction day (1.5h)',
    jornada_summary_FULL_DAY_OFF: 'Day off on {day}',
    jornada_summary_START_SHIFT_4H: '3h reduction at start of shift ({day})',
    jornada_summary_END_SHIFT_4H: '3h reduction at end of shift ({day})',
    jornada_summary_LEAVE_EARLY_1H_L_J: '1h early leave (Mon-Thu)',
    jornada_summary_FRIDAY_PLUS_EXTRA: 'Friday off + 1.5h on {day}',
    // FIX: Add missing translation keys for jornada laboral feature.
    jornada_reductionMode: 'Reduction Mode',
    jornada_reductionMode_DAY_OFF: 'Day off (80% rule)',
    jornada_reductionMode_HOURS_PER_DAY: 'Proportional hours',
    jornada_reductionMode_TIME_BLOCK: 'Free time block',
    jornada_reductionMode_FIXED_DAY: 'Fixed Day Off',
    jornada_horaInicio: 'Reduction Start',
    jornada_horaFin: 'Reduction End',

    // Manual Change Modal / Sidebar
    manualChangeTitle: 'Shift Edit',
    step1_nurses: '1. Select Nurse(s)',
    step2_shift: '2. Select Shift or Incident',
    step3_dates: '3. Select Date Range',
    step4_hours: '4. Select Time Range (Optional)',
    step5_scope: '5. Define Scope',
    startTime: 'Start Time',
    endTime: 'End Time',
    setCustomHours: 'Set Custom Hours',
    swapShifts: 'Swap Shifts',
    changeMyHours: 'Change Hours',
    nurse1: 'Nurse 1',
    nurse2: 'Nurse 2',
    reasonForChange: 'Reason for change (e.g., medical appointment)',
    previewChanges: 'Preview Changes',
    confirmAndApply: 'Confirm and Apply Changes',
    previewTitle: 'Summary of Automatic Changes',
    previewDescription: 'To maintain coverage, the following shifts will be adjusted automatically. Please review the changes before confirming.',
    noAutomaticChanges: 'No automatic coverage adjustments are required.',
    scope_single_title: 'Only to selected nurses',
    scope_single_desc: 'Applies the change only to the selected nurses on the chosen dates. Coverage is NOT automatically readjusted.',
    scope_all_nurses_day_title: 'Adjust coverage on selected dates',
    scope_all_nurses_day_desc: 'Reassigns ADMIN/TW staff ONLY on the selected days to maintain mandatory coverage. Does not affect other days.',
    scope_all_nurses_from_day_title: 'Replan from start date',
    scope_all_nurses_from_day_desc: 'Sets this change and recalculates the entire schedule from the first selected day until the end of the year.',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    error_noNurseSelected: 'You must select at least one nurse.',

    // Visual Swap
    swapShiftsTitle: 'Shift Swap',
    swapShiftsDescription: 'This change is visual only and does not affect balances or hours. The base shift is maintained.',
    selectDate: '1. Select Date',
    selectParticipants: '2. Select Participants',
    confirmSwap: 'Confirm Swap',
    swap_error_nurses: 'You must select two different nurses.',
    swap_error_date: 'You must select a date.',
    swap_original: 'Original:',
    swappedWith: 'Swapped with',
    undoSwap: 'Undo',
    noSwaps: 'No swaps recorded for this nurse.',
    swapHistory: 'Swap History',
    
    // Zoom Controls
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fitToScreen: 'Fit to Screen',

    // Schedule Grid
    present: 'Present',
    notes: 'Notes',
    week: 'WEEK',
    closed: 'CLOSED',

    // Shift Palette
    shiftLegendTitle: 'Shift Legend',

    // Nurse Manager
    manageTeam: 'Team',
    internName: 'Intern name',
    nurseName: 'Name',
    assignAbsence: 'Assign absence to',
    addNursePlaceholder: 'Add nurse...',

    // Vaccination Planner
    vaccinationCampaign: 'Vaccination Campaign',
    startDate: 'Start Date',
    endDate: 'End Date',

    // Rule Violations
    planningAlerts: 'Planning Alerts',
    noConflicts: 'Great job! No conflicts.',
    generalCoverage: 'General Coverage',
    violation_urgCoverage: 'Low Emergencies coverage (needs 2, has {count})',
    violation_travCoverage: 'Low Work coverage (needs 2, has {count})',
    violation_missingUrgT: 'Missing 1 in Emergencies Afternoon',
    violation_missingTravT: 'Missing 1 in Work Afternoon',
    violation_missingVacM: 'Incomplete Morning Vaccination coverage (requires 2)',
    violation_missingVacT: 'Incomplete Afternoon Vaccination coverage (requires 2)',
    violation_exceedsAfternoon: 'Exceeds 2 afternoon shifts (has {count})',

    // Rules Info
    planningGuide: 'Planning Guide',
    rules: [],

    // Summary Table
    monthlySummary: 'Monthly Summary',
    nurse: 'Nurse',
    total: 'Total',

    // Agenda Planner
    agendaPlanner: 'Agenda Planner',
    agenda2026Warning: 'The agenda for 2026 is pre-loaded and not editable.',
    weekOf: 'Week of',
    activity_NORMAL: 'Normal',
    activity_SESSION: 'Session',
    activity_WHITE_GREEN: 'White/Green',
    activity_REDUCED: 'Reduced',
    activity_CLOSED: 'Closed',
    
    // Wishes Page
    wishesPageTitle: 'Wishes & Incidents',
    wishesViewButton: 'Wishes',

    // Agenda Popup
    planningNotice: 'Planning Notice',
    agendaPopupMessage: 'Reminder: as you enter October, you need to review and set up the new agenda for the next year ({year}).',
    understood: 'Understood',

    deleteAssignment: 'Delete Assignment',

    // Mass Leave Modal
    massAssignAbsence: 'Mass Assign Absence',
    for: 'For',
    absenceType: 'Type of Absence',
    leaveType_CA: 'Annual Leave',
    leaveType_SICK_LEAVE: 'Sick Leave',
    leaveType_FP: 'Professional Training',
    error_dateOrder: 'Start date cannot be after end date.',
    applyToWorkdays: 'Apply to Workdays',

    // Notes Popover
    addNotePlaceholder: 'Add a note...',
    color: 'Color',

    // History Log
    historyLog: 'History Log',
    history_addNurse: 'Added nurse',
    history_removeNurse: 'Removed nurse',
    history_updateNurseName: 'Changed name',
    history_manualChange: 'Manual shift change',
    history_timeChange: 'Hours adjustment',
    history_noteChange: 'Day note',
    history_personalNoteChange: 'Personal note',
    history_workConditionsChange: 'Work conditions',
    history_strasbourgUpdate: 'Strasbourg assignment',
    history_vaccinationPeriodChange: 'Vaccination period',
    history_swapShifts: 'Shift swap',
    history_undoSwap: 'Undo shift swap',
    history_setPersonalHours: 'Personal Hours Change',
    history_adminSetHours: 'Hours Adjustment (Admin)',
    history_jornadaChange: 'Work schedules updated',

    // Balance Page
    balancePageTitle: 'Shifts & Hours Balance',
    travMonthHeader: 'Work (Month)',
    urgMonthHeader: 'Emergencies (Month)',
    admMonthHeader: 'Admin',
    twMonthHeader: 'TW',
    holidaysHeader: 'Leave',
    trainingHeader: 'Training',
    sickLeaveHeader: 'Sick',
    hoursMonthHeader: 'Total Hours (Month)',
    hoursYearHeader: 'Total Hours (Year)',
    theoreticalHoursMonth: 'Theoretical Monthly Hours',
    theoreticalHoursCalculation: '({normalDays} days × 8h + {specialDays} holidays/closed × 8.5h)',
    balance_info_title: 'Hours Balance (Informative)',
    balance_info_realizadas: 'Hours worked (month)',
    balance_info_teoricas: 'Theoretical hours (month)',
    balance_info_diferencia: 'Difference',

    helpManualRedesign: {
      title: "📖 Definitive User Manual: Zenova",
      sections: [
        {
          title: "1. Introduction: The Zenova Philosophy",
          content: [
            "Welcome to <strong>Zenova</strong>, your digital assistant for nursing team shift planning. The name \"Zenova\" represents our dual commitment: the inner peace (<strong>Zen</strong>) we need to provide care, and the creative explosion (<strong>Nova</strong>) we apply to solve the complexities of scheduling.",
            "<strong>The Key Principle:</strong> Zenova is built on a hybrid system: <ol class='list-decimal list-inside pl-4 space-y-2'><li><strong>Automated and Equitable Base:</strong> The system automatically generates a draft schedule (<strong>theoretical schedule</strong>) that complies with coverage rules, shift equity (emergencies, work, etc.), and each individual's work conditions (reduced hours, etc.). This base serves as the \"source of truth\" for theoretical hour calculations.</li><li><strong>Human Flexibility with Visual Swaps:</strong> We understand that daily reality requires flexibility. For this, Zenova introduces <strong>Visual Swaps</strong>, a <strong>purely aesthetic</strong> modification layer that does not alter the calculation base.</li></ol>",
            "This ensures the system remains fair and balanced in the long run, while the daily display adapts to the team's needs."
          ]
        },
        {
          title: "2. Roles and Access: What You Can Do",
          content: [
            "The application has two access levels to ensure security and proper management.",
            "<h4>2.1 Administrator Role</h4><p>The administrator has full control over planning and configuration.</p><ul class='list-disc list-inside pl-4 space-y-1'><li>✅ <strong>Can view and edit EVERYTHING:</strong> The General Schedule, ANY nurse's Individual Schedule, manage the team, configure work hours, manage events, and lock/unlock months.</li><li>✅ <strong>Can create, modify, and undo Visual Swaps.</strong></li><li>✅ <strong>Can view the complete Change History.</strong></li><li>✅ <strong>Can \"impersonate\" a nurse's view</strong> to see the application exactly as they do, which is ideal for providing support.</li></ul>",
            "<h4>2.2 Nurse Role (Standard User)</h4><p>The standard user has access to their own information and the team's overall view.</p><ul class='list-disc list-inside pl-4 space-y-1'><li>✅ <strong>Can view:</strong> Their own Individual Schedule and the General Schedule (read-only).</li><li>✅ <strong>Can edit in their Individual Schedule:</strong> Their actual clock-in/out times and their personal notes.</li><li>❌ <strong>CANNOT:</strong> Edit the General Schedule, create or modify Visual Swaps, view other colleagues' Individual Schedules, or edit team configuration and work hours.</li></ul>"
          ]
        },
        {
          title: "3. The Main Interface: A Quick Glance",
          content: [
            "The screen is divided into three main areas:",
            "<ol class='list-decimal list-inside pl-4 space-y-2'><li><strong>Top Bar (Header):</strong> Contains the logo, month/year selector, view navigation, export controls, and the user menu.</li><li><strong>Left Sidebar:</strong> Contains all management tools for administrators (team, absences, events, etc.) and the change history.</li><li><strong>Main Content Area:</strong> This is where the General Schedule, Annual Balance, or Wishes calendar is displayed, depending on the selected view.</li></ol>"
          ]
        },
        {
            title: "4. The General Schedule: The Heart of Planning",
            content: [
                "This is the main grid that displays the entire team's schedule for the selected month.",
                "<h4>4.1 Grid Structure</h4><ul class='list-disc list-inside pl-4 space-y-1'><li><strong>Rows:</strong> Each row represents a day of the month.</li><li><strong>Columns:</strong> The first column shows the day. The following columns represent each nurse. The last columns (for admins only) show the number of <strong>Present</strong> staff and the <strong>Notes</strong> for the day.</li><li><strong>Cell:</strong> The intersection of a day and a nurse, displaying the assigned shift.</li></ul>",
                "<h4>4.2 Shift Types and Their Meanings (Detailed Glossary)</h4><div class='overflow-x-auto'><table class='w-full text-left border-collapse'><thead><tr class='bg-slate-100'><th class='p-2 border'>Code</th><th class='p-2 border'>Label</th><th class='p-2 border'>Description & Purpose</th></tr></thead><tbody>" +
                "<tr><td class='p-2 border'><strong>URG M/T</strong></td><td class='p-2 border'>Urg M/T</td><td class='p-2 border'><strong>Emergencies (Morning/Afternoon):</strong> Clinical shift in the emergency area.</td></tr>" +
                "<tr><td class='p-2 border'><strong>TRAV M/T</strong></td><td class='p-2 border'>Trav M/T</td><td class='p-2 border'><strong>Work (Morning/Afternoon):</strong> Planned clinical shift (consultations, etc.).</td></tr>" +
                "<tr><td class='p-2 border'><strong>ADMIN</strong></td><td class='p-2 border'>Adm</td><td class='p-2 border'><strong>Administration:</strong> Administrative tasks. Flexible for reassignment if there are absences.</td></tr>" +
                "<tr><td class='p-2 border'><strong>TW</strong></td><td class='p-2 border'>TW</td><td class='p-2 border'><strong>Telework:</strong> Tasks that can be performed from home. Also a flexible shift.</td></tr>" +
                "<tr><td class='p-2 border'><strong>STRASBOURG</strong></td><td class='p-2 border'>STR</td><td class='p-2 border'><strong>Strasbourg Session:</strong> Assigned from Monday to Thursday to those traveling. Counts as 10h/day.</td></tr>" +
                "<tr><td class='p-2 border'><strong>STR-PREP</strong></td><td class='p-2 border'>(empty)</td><td class='p-2 border'><strong>Strasbourg Preparation:</strong> Friday before a session. <strong>The cell appears empty</strong> but has a pink background.</td></tr>" +
                "<tr><td class='p-2 border'><strong>VACCIN</strong></td><td class='p-2 border'>Vac</td><td class='p-2 border'><strong>Vaccination Campaign:</strong> Specific shift during the campaign.</td></tr>" +
                "<tr><td class='p-2 border'><strong>SPLIT</strong></td><td class='p-2 border'>(split)</td><td class='p-2 border'><strong>Split Shift:</strong> The cell is divided to combine two half-shifts (e.g., ADM + VAC PM).</td></tr>" +
                "<tr><td class='p-2 border'><strong>CA</strong></td><td class='p-2 border'>CA</td><td class='p-2 border'><strong>Congé Annuel (Annual Leave):</strong> Justified absence. Does not count towards hours.</td></tr>" +
                "<tr><td class='p-2 border'><strong>SICK</strong></td><td class='p-2 border'>Sick</td><td class='p-2 border'><strong>Sick Leave:</strong> Justified absence. Does not count towards hours.</td></tr>" +
                "<tr><td class='p-2 border'><strong>FP</strong></td><td class='p-2 border'>FP</td><td class='p-2 border'><strong>Professional Training:</strong> Justified absence for training. Does not count towards hours.</td></tr>" +
                "<tr><td class='p-2 border'><strong>RECUP</strong></td><td class='p-2 border'>Recup</td><td class='p-2 border'><strong>Hours Recovery:</strong> Day off to compensate for extra hours. Does not count towards hours.</td></tr></tbody></table></div>",
                "<h4>4.3 Week Types and Their Color Code</h4><ul class='list-disc list-inside pl-4 space-y-1'><li><strong>Normal (White/Light Gray Background):</strong> Standard operations.</li><li><strong>Session (Pink Background):</strong> Strasbourg session week. Coverage is automatically adjusted.</li><li><strong>White/Green (Light Green Background):</strong> Weeks of lower activity or transition periods.</li><li><strong>Reduced (Light Yellow Background):</strong> Periods of low activity (e.g., summer) with fewer required staff.</li><li><strong>Closed (Gray Background):</strong> The service is closed (e.g., long holidays). No shifts are assigned.</li></ul>"
            ]
        },
        {
          title: "5. The Visual Shift Swap: The Key Tool",
          content: [
            "This is the most important feature for flexible daily management.",
            "<h4>5.1 What Is It For?</h4><p>To reflect a shift swap agreement between two people on the schedule <strong>for a specific day</strong>, without altering the hour calculation system or the long-term equitable balance of shifts. It's a digital \"sticky note\" on the official schedule.</p>",
            "<h4>5.2 How Does It Work? (Step-by-Step for Admins)</h4><ol class='list-decimal list-inside pl-4 space-y-1'><li><strong>Access:</strong> <strong>Double-click</strong> on the cell of the nurse and day you want to modify.</li><li><strong>Side Panel:</strong> A panel will open on the right with the shift details.</li><li><strong>Selection:</strong> Search for and select the second nurse involved in the swap.</li><li><strong>Preview:</strong> The panel will clearly show you how the schedule will look.</li><li><strong>Confirmation:</strong> If everything is correct, click \"Confirm Swap\".</li></ol>",
            "<h4>5.3 What Happens Next?</h4><ul class='list-disc list-inside pl-4 space-y-1'><li>In the General Schedule, the cells for both nurses on that day will <strong>display the swapped shift</strong>.</li><li>A swap icon 🔁 will appear in the corner of both cells.</li><li>Hovering over the icon will show a tooltip: *\"Visual swap with [Name]. Actual shift: [Original Shift]\"*.</li><li>An entry will be created in the <strong>Change History</strong>.</li></ul>",
            "<h4>5.4 What a Visual Swap DOES and DOES NOT Do</h4><div class='overflow-x-auto'><table class='w-full text-left border-collapse'><thead><tr class='bg-slate-100'><th class='p-2 border'>✅ What It DOES</th><th class='p-2 border'>❌ What It DOES NOT Do</th></tr></thead><tbody>" +
            "<tr><td class='p-2 border'><strong>Visually</strong> changes the shift shown on the General Schedule.</td><td class='p-2 border'>It does <strong>NOT</strong> alter the base shift assigned by the algorithm.</td></tr>" +
            "<tr><td class='p-2 border'>Adds a 🔁 icon to indicate the cell is modified.</td><td class='p-2 border'>It does <strong>NOT</strong> affect the theoretical hours calculation.</td></tr>" +
            "<tr><td class='p-2 border'>Allows the team to know who is actually in each post on that day.</td><td class='p-2 border'>It does <strong>NOT</strong> modify the balance of shift types (if you swap URG for ADM, you still have +1 URG in your annual count).</td></tr>" +
            "<tr><td class='p-2 border'>Logs the action in the Change History for full traceability.</td><td class='p-2 border'>It is <strong>NOT</strong> reflected in the Individual Schedule.</td></tr></tbody></table></div>"
          ]
        },
        {
            title: "6. The Individual Schedule: Your Personal Space",
            content: [
                "Accessed by clicking the calendar icon 📅 next to your name. It opens in a separate window.",
                "<h4>6.1 Key Features</h4><ul class='list-disc list-inside pl-4 space-y-1'><li><strong>Personal Calendar:</strong> Displays your <strong>base (theoretical)</strong> shifts for the month. It does not reflect visual swaps.</li><li><strong>Log Actual Hours:</strong> The most important feature! For each day, you can enter your actual clock-in and clock-out times. <strong>These hours will be used to calculate your monthly balance</strong>, overriding the theoretical hours of the shift.</li><li><strong>Automatic Break:</strong> The system automatically deducts a 30-minute break for shifts of 6 hours or longer.</li><li><strong>Personal Notes:</strong> A space for your own notes, visible only to you.</li><li><strong>Informational Balance:</strong> A side panel shows a summary of your shifts and hours for the month and year, based on your actual hours (if logged) or theoretical hours.</li><li><strong>Maximize/Restore:</strong> Use the ⛶ / 🗗 icons in the top-right corner to toggle between normal and fullscreen view.</li></ul>"
            ]
        },
        {
            title: "7. Balances and Hour Calculation: Understanding the Numbers",
            content: [
                "The system distinguishes between theoretical and actual hours to offer flexibility and fairness.",
                "<h4>7.1 Theoretical Hours</h4><ul class='list-disc list-inside pl-4 space-y-1'><li>Calculated automatically by the system.</li><li><strong>Base:</strong> Each shift type has a standard duration (e.g., `TRAV M` is 8.5h Mon-Thu and 6h on Fri).</li><li><strong>Modifiers:</strong> Adjusted based on the <strong>work schedule</strong> (e.g., a 90% reduction may mean leaving 1 hour earlier).</li><li><strong>Use:</strong> They are used to generate the initial schedule and as a default value if you do not log your actual hours.</li></ul>",
                "<h4>7.2 Actual (Logged) Hours</h4><ul class='list-disc list-inside pl-4 space-y-1'><li>The hours you enter in your Individual Schedule.</li><li><strong>They are the source of truth for your personal balance.</strong></li><li><strong>Example:</strong> Your theoretical shift is from 8:00 to 17:00 (8.5h), but one day you stay until 17:30. If you log \"08:00 - 17:30\", your balance for that day will be 9h.</li></ul>",
                "<h4>7.3 The Final Balance</h4><p>The balance you see in your schedule is an <strong>informational</strong> tool for you to keep track. It compares the hours you have worked (actual or theoretical) with the hours you were theoretically supposed to work in a standard working month.</p>"
            ]
        },
        {
            title: "8. Icon and Symbol Glossary",
            content: [
                "<div class='overflow-x-auto'><table class='w-full text-left border-collapse'><thead><tr class='bg-slate-100'><th class='p-2 border'>Icon</th><th class='p-2 border'>Name</th><th class='p-2 border'>Location</th><th class='p-2 border'>Meaning</th></tr></thead><tbody>" +
                "<tr><td class='p-2 border text-center'>🔁</td><td class='p-2 border'>Visual Swap</td><td class='p-2 border'>General Schedule Cell</td><td class='p-2 border'>The displayed shift is not the original one. Hover for details.</td></tr>" +
                "<tr><td class='p-2 border text-center'>📅</td><td class='p-2 border'>Open Individual Schedule</td><td class='p-2 border'>Next to each name in the Team panel</td><td class='p-2 border'>Opens that nurse's personal schedule.</td></tr>" +
                "<tr><td class='p-2 border text-center'>⛶ / 🗗</td><td class='p-2 border'>Maximize / Restore</td><td class='p-2 border'>Individual Schedule Window</td><td class='p-2 border'>Toggles between fullscreen and normal view.</td></tr>" +
                "<tr><td class='p-2 border text-center'>✏️</td><td class='p-2 border'>Edit</td><td class='p-2 border'>Admin Panels (Events, Schedules)</td><td class='p-2 border'>Opens the form to modify an existing item.</td></tr>" +
                "<tr><td class='p-2 border text-center'>🗑️</td><td class='p-2 border'>Delete</td><td class='p-2 border'>Admin Panels</td><td class='p-2 border'>Permanently deletes an item (with confirmation).</td></tr>" +
                "<tr><td class='p-2 border text-center'>🔒 / 🔓</td><td class='p-2 border'>Lock / Unlock Month</td><td class='p-2 border'>Top Bar (Header)</td><td class='p-2 border'>Prevents or allows editing of the schedule for the selected month.</td></tr></tbody></table></div>"
            ]
        },
        {
            title: "9. Frequently Asked Questions (FAQ)",
            content: [
                "<ul class='list-disc list-inside pl-4 space-y-2'><li><strong>Q: I made a visual swap, but my Individual Schedule still shows my original shift. Is this a bug?</strong><br><strong>A:</strong> No, this is the expected behavior. The Individual Schedule always shows the <strong>base/theoretical</strong> shift so that long-term balance calculations remain correct.</li><li><strong>Q: Why is the Strasbourg preparation Friday cell empty?</strong><br><strong>A:</strong> This is a design choice to reduce visual clutter. The pink background already indicates a session week, and it is assumed that assigned staff know that day is for preparation.</li><li><strong>Q: I logged my actual hours, but the General Schedule still shows the theoretical shift time. Did it not save?</strong><br><strong>A:</strong> Yes, it was saved. The General Schedule <strong>always</strong> shows theoretical information to maintain a consistent view for the entire team. Your actual hours have been correctly saved and are being used to calculate <strong>your personal balance</strong> in your Individual Schedule.</li><li><strong>Q: How do I undo a visual swap?</strong><br><strong>A:</strong> Currently, the easiest way is for an administrator to apply a new \"swap\" to revert to the original state or contact support.</li><li><strong>Q: If I have a reduced work schedule, how is it applied?</strong><br><strong>A:</strong> The administrator configures your schedule in the system. Your shifts will be adjusted automatically (e.g., an assigned day off or a shorter workday). You will see this reflected in the General Schedule as a custom shift.</li></ul>"
            ]
        }
      ]
    },
    
    // Shift descriptions
    shift_URGENCES_desc: 'Emergencies (Morning)',
    shift_TRAVAIL_desc: 'Work (Morning)',
    shift_URGENCES_TARDE_desc: 'Emergencies (Afternoon)',
    shift_TRAVAIL_TARDE_desc: 'Work (Afternoon)',
    shift_ADMIN_desc: 'Administration',
    shift_TW_desc: 'Telework',
    shift_STRASBOURG_desc: 'Strasbourg Session',
    shift_LIBERO_desc: 'Special pre-session shift',
    shift_RECUP_desc: 'Hours Recovery',
    shift_FP_desc: 'Professional Training',
    shift_SICK_LEAVE_desc: 'Sick Leave',
    shift_CA_desc: 'Annual Leave',
    shift_F_desc: 'Holiday',
    shift_VACCIN_desc: 'Vaccination Campaign',
    shift_VACCIN_AM_desc: 'Vaccination (Morning)',
    shift_VACCIN_PM_desc: 'Vaccination (Afternoon)',
  },
  fr: {
    // French Translations
    appTitle: 'Planificateur de Postes',
    today: "Aujourd'hui",
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    changeLanguage: 'Changer de langue',
    footerText: 'Créé avec ❤️ pour les équipes infirmières. Simplifier la planification des postes.',
    close: 'Fermer',
    save: 'Enregistrer',
    saveChanges: 'Enregistrer les modifications',
    cancel: 'Annuler',
    delete: 'Supprimer',
    add: 'Ajouter',
    back: 'Retour',
    note: 'Note',
    unknown: 'Inconnu',
    export: 'Exporter',
    exportPDF: 'Exporter en PDF',
    copyToSheets: 'Copier pour Sheets',
    copied: 'Copié !',
    help: 'Aide',
    lockMonth: 'Verrouiller le mois',
    unlockMonth: 'Déverrouiller le mois',
    viewAsAdmin: "Voir en tant qu'administrateur",
    viewAsNurse: "Voir en tant qu'infirmier/ère",
    viewingAs: 'Connecté en tant que : ',
    returnToAdmin: "Retour à la vue Admin",
    selectNurse: "Sélectionner un(e) infirmier/ère",
    adminView: 'Administrateur',
    testUserView: 'Utilisateur de Test',
    selectView: 'Changer de vue',
    optional: 'optionnel',
    day_monday: 'Lundi',
    day_tuesday: 'Mardi',
    day_wednesday: 'Mercredi',
    day_thursday: 'Jeudi',
    day_friday: 'Vendredi',
    day: 'Jour',
    shiftRotations_title: 'Gestion des rotations',
    shiftRotations_templates: 'Modèles de rotation',
    shiftRotations_assignments: 'Affectations de rotation',
    shiftRotations_newTemplate: 'Nouveau modèle de rotation',
    shiftRotations_templateName: 'Nom du modèle',
    shiftRotations_addDay: 'Ajouter un jour au modèle',
    shiftRotations_saveTemplate: 'Enregistrer le modèle',
    shiftRotations_assignNurses: 'Affecter une rotation',
    shiftRotations_selectRotation: 'Sélectionner une rotation...',
    shiftRotations_selectNurses: 'Sélectionner des infirmier(e)s',
    shiftRotations_startDate: 'Date de début de la rotation',
    shiftRotations_saveAssignment: "Enregistrer l'affectation",
    shiftRotations_delete_confirm: 'Êtes-vous sûr de vouloir supprimer ceci ?',
    jornada_title: 'Temps de travail',
    jornada_select_nurse: "Sélectionner un(e) infirmier/ère...",
    jornada_add_period: 'Ajouter une période de travail',
    jornada_edit_period: 'Modifier la période de travail',
    jornada_no_periods: "Aucune période de travail n'est définie pour cet(te) infirmier/ère.",
    jornada_percentage: 'Pourcentage',
    jornada_startDate: 'Date de début',
    jornada_endDate: 'Date de fin',
    jornada_reduction_title: 'Comment cette réduction est appliquée',
    jornada_description_header: 'Type de réduction',
    jornada_delete_confirm_message: 'Êtes-vous sûr de vouloir supprimer cette période de travail ?',
    jornada_error_overlap: 'Les dates de cette période chevauchent une période existante.',
    jornada_select_day: 'Sélectionner un jour',
    jornada_reduction_option: 'Option de réduction',
    jornada_option_FULL_DAY_OFF: 'Jour de congé complet (L-J)',
    jornada_option_START_SHIFT_4H: 'Réduction de 3h en début de poste (L-J)',
    jornada_option_END_SHIFT_4H: 'Réduction de 3h en fin de poste (L-J)',
    jornada_option_LEAVE_EARLY_1H_L_J: 'Partir 1h plus tôt chaque jour (L-J)',
    jornada_option_FRIDAY_PLUS_EXTRA: 'Vendredi libre + 1.5h supplémentaire',
    jornada_extra_reduction_day: 'Jour de réduction supplémentaire (1.5h)',
    jornada_summary_FULL_DAY_OFF: 'Jour de congé le {day}',
    jornada_summary_START_SHIFT_4H: 'Réduction de 3h en début de poste ({day})',
    jornada_summary_END_SHIFT_4H: 'Réduction de 3h en fin de poste ({day})',
    jornada_summary_LEAVE_EARLY_1H_L_J: 'Départ anticipé de 1h (L-J)',
    jornada_summary_FRIDAY_PLUS_EXTRA: 'Vendredi libre + 1.5h le {day}',
    jornada_reductionMode: 'Mode de réduction',
    jornada_reductionMode_DAY_OFF: 'Jour de congé (règle 80%)',
    jornada_reductionMode_HOURS_PER_DAY: 'Heures proportionnelles',
    jornada_reductionMode_TIME_BLOCK: 'Bloc de temps libre',
    jornada_reductionMode_FIXED_DAY: 'Jour de congé fixe',
    jornada_horaInicio: 'Début de la réduction',
    jornada_horaFin: 'Fin de la réduction',
    manualChangeTitle: 'Édition de Poste',
    step1_nurses: '1. Sélectionner Infirmier(s)/ère(s)',
    step2_shift: '2. Sélectionner Poste ou Incident',
    step3_dates: '3. Sélectionner Plage de dates',
    step4_hours: '4. Sélectionner Plage horaire (Optionnel)',
    step5_scope: '5. Définir la portée',
    startTime: 'Heure de début',
    endTime: 'Heure de fin',
    setCustomHours: 'Définir un horaire',
    swapShifts: 'Échanger les postes',
    changeMyHours: 'Changer mes heures',
    nurse1: 'Infirmier/ère 1',
    nurse2: 'Infirmier/ère 2',
    reasonForChange: 'Motif du changement (ex. rendez-vous médical)',
    previewChanges: 'Aperçu des changements',
    confirmAndApply: 'Confirmer et appliquer',
    previewTitle: 'Résumé des changements automatiques',
    previewDescription: 'Pour maintenir la couverture, les postes suivants seront ajustés automatiquement. Veuillez vérifier les changements avant de confirmer.',
    noAutomaticChanges: 'Aucun ajustement de couverture automatique requis.',
    scope_single_title: 'Uniquement aux infirmiers sélectionnés',
    scope_single_desc: "Le changement ne s'applique qu'aux infirmiers sélectionnés aux dates choisies. La couverture n'est PAS réajustée automatiquement.",
    scope_all_nurses_day_title: 'Ajuster la couverture aux dates sélectionnées',
    scope_all_nurses_day_desc: "Réaffecte le personnel ADMIN/TW UNIQUEMENT sur les jours sélectionnés pour maintenir la couverture obligatoire. N'affecte pas les autres jours.",
    scope_all_nurses_from_day_title: "Replanifier à partir de la date de début",
    scope_all_nurses_from_day_desc: 'Fixe ce changement et recalcule tout le planning depuis le premier jour sélectionné jusqu’à la fin de l’année.',
    selectAll: 'Tout sélectionner',
    deselectAll: 'Tout désélectionner',
    error_noNurseSelected: 'Vous devez sélectionner au moins un(e) infirmier/ère.',
    swapShiftsTitle: 'Échange de postes',
    swapShiftsDescription: "Ce changement est uniquement visuel et n'affecte ni les bilans ni les heures. Le poste de base est conservé.",
    selectDate: '1. Sélectionner la date',
    selectParticipants: '2. Sélectionner les participants',
    confirmSwap: "Confirmer l'échange",
    swap_error_nurses: 'Vous devez sélectionner deux infirmiers/ères différent(e)s.',
    swap_error_date: 'Vous devez sélectionner une date.',
    swap_original: 'Original :',
    swappedWith: 'Échangé avec',
    undoSwap: 'Annuler',
    noSwaps: "Aucun échange enregistré pour cet(te) infirmier/ère.",
    swapHistory: 'Historique des échanges',
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    fitToScreen: "Ajuster à l'écran",
    present: 'Présents',
    notes: 'Notes',
    week: 'SEMAINE',
    closed: 'FERMÉ',
    shiftLegendTitle: 'Légende des postes',
    manageTeam: 'Équipe',
    internName: 'Nom du stagiaire',
    nurseName: 'Nom',
    assignAbsence: 'Attribuer une absence à',
    addNursePlaceholder: 'Ajouter un(e) infirmier/ère...',
    vaccinationCampaign: 'Campagne de vaccination',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    planningAlerts: 'Alertes de planification',
    noConflicts: 'Bon travail ! Aucun conflit.',
    generalCoverage: 'Couverture générale',
    violation_urgCoverage: 'Couverture Urgences faible (requiert 2, a {count})',
    violation_travCoverage: 'Couverture Travail faible (requiert 2, a {count})',
    violation_missingUrgT: 'Manque 1 en Urgences Après-midi',
    violation_missingTravT: 'Manque 1 en Travail Après-midi',
    violation_missingVacM: 'Couverture Vaccination Matin incomplète (requiert 2)',
    violation_missingVacT: 'Couverture Vaccination Après-midi incomplète (requiert 2)',
    violation_exceedsAfternoon: "Dépasse 2 postes d'après-midi (a {count})",
    planningGuide: 'Guide de planification',
    rules: [],
    monthlySummary: 'Résumé mensuel',
    nurse: 'Infirmier/ère',
    total: 'Total',
    agendaPlanner: "Planificateur de l'agenda",
    agenda2026Warning: "L'agenda pour 2026 est pré-chargé et n'est pas modifiable.",
    weekOf: 'Semaine du',
    activity_NORMAL: 'Normal',
    activity_SESSION: 'Session',
    activity_WHITE_GREEN: 'White/Green',
    activity_REDUCED: 'Réduit',
    activity_CLOSED: 'Fermé',
    wishesPageTitle: 'Souhaits et incidents',
    wishesViewButton: 'Souhaits',
    planningNotice: 'Avis de planification',
    agendaPopupMessage: "Rappel : en entrant en octobre, vous devez examiner et configurer le nouvel agenda pour l'année prochaine ({year}).",
    understood: 'Compris',
    deleteAssignment: "Supprimer l'affectation",
    massAssignAbsence: 'Attribuer une absence en masse',
    for: 'Pour',
    absenceType: "Type d'absence",
    leaveType_CA: 'Congé Annuel',
    leaveType_SICK_LEAVE: 'Arrêt Maladie',
    leaveType_FP: 'Formation Professionnelle',
    error_dateOrder: 'La date de début ne peut pas être postérieure à la date de fin.',
    applyToWorkdays: 'Appliquer aux jours ouvrables',
    addNotePlaceholder: 'Ajouter une note...',
    color: 'Couleur',
    historyLog: 'Historique des changements',
    history_addNurse: 'Infirmier/ère ajouté(e)',
    history_removeNurse: 'Infirmier/ère supprimé(e)',
    history_updateNurseName: 'Nom modifié',
    history_manualChange: 'Changement de poste manuel',
    history_timeChange: "Ajustement d'horaires",
    history_noteChange: 'Note de jour',
    history_personalNoteChange: 'Note personnelle',
    history_workConditionsChange: 'Conditions de travail',
    history_strasbourgUpdate: 'Affectation Strasbourg',
    history_vaccinationPeriodChange: 'Période de vaccination',
    history_swapShifts: 'Échange de postes',
    history_undoSwap: 'Annuler l\'échange de postes',
    history_setPersonalHours: 'Changement d\'heures personnel',
    history_adminSetHours: 'Ajustement d\'heures (Admin)',
    history_jornadaChange: 'Temps de travail mis à jour',
    balancePageTitle: 'Bilan des postes et des heures',
    travMonthHeader: 'Travail (Mois)',
    urgMonthHeader: 'Urgences (Mois)',
    admMonthHeader: 'Admin',
    twMonthHeader: 'TW',
    holidaysHeader: 'CA',
    trainingHeader: 'FP',
    sickLeaveHeader: 'Arrêt',
    hoursMonthHeader: 'Total Heures (Mois)',
    hoursYearHeader: 'Total Heures (Année)',
    theoreticalHoursMonth: 'Heures théoriques du mois',
    theoreticalHoursCalculation: '({normalDays} jours × 8h + {specialDays} fériés/fermés × 8.5h)',
    balance_info_title: 'Bilan des heures (Informatif)',
    balance_info_realizadas: 'Heures réalisées (mois)',
    balance_info_teoricas: 'Heures théoriques (mois)',
    balance_info_diferencia: 'Différence',
    
    helpManualRedesign: {
      title: "📖 Manuel Utilisateur Définitif : Zenova",
      sections: [
        {
          title: "1. Introduction : La philosophie de Zenova",
          content: [
            "Bienvenue sur <strong>Zenova</strong>, votre assistant numérique pour la planification des postes de l'équipe infirmière. Le nom \"Zenova\" représente notre double engagement : la paix intérieure (<strong>Zen</strong>) dont nous avons besoin pour soigner, et l'explosion créative (<strong>Nova</strong>) que nous appliquons pour résoudre la complexité de la planification.",
            "<strong>Le principe clé :</strong> Zenova repose sur un système hybride : <ol class='list-decimal list-inside pl-4 space-y-2'><li><strong>Base automatisée et équitable :</strong> Le système génère automatiquement une ébauche de planning (<strong>planning théorique</strong>) qui respecte les règles de couverture, l'équité des postes (urgences, travail, etc.) et les conditions de travail de chaque personne (temps partiel, etc.). Cette base est la \"source de vérité\" pour le calcul des heures théoriques.</li><li><strong>Flexibilité humaine avec des remplacements visuels :</strong> Nous comprenons que la réalité quotidienne exige de la flexibilité. Pour cela, Zenova introduit les <strong>Échanges Visuels de Postes</strong>, une couche de modification <strong>purement esthétique</strong> qui n'altère pas la base de calcul.</li></ol>",
            "Cela garantit que le système reste juste et équilibré à long terme, tandis que l'affichage quotidien s'adapte aux besoins de l'équipe."
          ]
        },
        {
          title: "2. Rôles et accès : Que pouvez-vous faire ?",
          content: [
            "L'application dispose de deux niveaux d'accès pour garantir la sécurité et une gestion appropriée.",
            "<h4>2.1 Rôle d'Administrateur</h4><p>L'administrateur a un contrôle total sur la planification et la configuration.</p><ul class='list-disc list-inside pl-4 space-y-1'><li>✅ <strong>Peut tout voir et tout modifier :</strong> Le Planning Général, le Planning Individuel de N'IMPORTE QUEL infirmier/ère, gérer l'équipe, configurer les temps de travail, gérer les événements, et verrouiller/déverrouiller les mois.</li><li>✅ <strong>Peut créer, modifier et annuler les Échanges Visuels de Postes.</strong></li><li>✅ <strong>Peut consulter l'Historique des Changements complet.</strong></li><li>✅ <strong>Peut \"se connecter en tant que\"</strong> pour voir l'application exactement comme un infirmier/ère la voit, idéal pour l'assistance.</li></ul>",
            "<h4>2.2 Rôle d'Infirmier/ère (Utilisateur Standard)</h4><p>L'utilisateur standard a accès à ses propres informations et à la vue d'ensemble de l'équipe.</p><ul class='list-disc list-inside pl-4 space-y-1'><li>✅ <strong>Peut voir :</strong> Son propre Planning Individuel et le Planning Général (en lecture seule).</li><li>✅ <strong>Peut modifier dans son Planning Individuel :</strong> Ses heures réelles d'arrivée et de départ et ses notes personnelles.</li><li>❌ <strong>NE PEUT PAS :</strong> Modifier le Planning Général, créer des Échanges Visuels, voir le Planning Individuel d'autres collègues, ou modifier la configuration de l'équipe.</li></ul>"
          ]
        },
        {
          title: "3. L'interface principale : Un aperçu rapide",
          content: [
            "L'écran est divisé en trois zones principales :",
            "<ol class='list-decimal list-inside pl-4 space-y-2'><li><strong>Barre supérieure (En-tête) :</strong> Contient le logo, le sélecteur de mois/année, la navigation entre les vues, les contrôles d'exportation et le menu utilisateur.</li><li><strong>Panneau latéral gauche (Barre latérale) :</strong> Outils de gestion pour les administrateurs et l'historique des changements.</li><li><strong>Zone de contenu principale :</strong> Affiche le Planning Général, le Bilan Annuel ou le calendrier des Souhaits.</li></ol>"
          ]
        },
        {
            title: "4. Le Planning Général : Le cœur de la planification",
            content: [
                "C'est la grille principale qui affiche l'horaire de toute l'équipe pour le mois sélectionné.",
                "<h4>4.1 Structure de la grille</h4><ul class='list-disc list-inside pl-4 space-y-1'><li><strong>Lignes :</strong> Chaque ligne représente un jour du mois.</li><li><strong>Colonnes :</strong> La première colonne est le jour, les suivantes sont chaque infirmier/ère, et les dernières (pour les admins) sont les <strong>Présents</strong> et les <strong>Notes</strong> du jour.</li><li><strong>Cellule :</strong> L'intersection d'un jour et d'un infirmier/ère, affichant le poste attribué.</li></ul>",
                "<h4>4.2 Types de postes et leur signification (Glossaire détaillé)</h4><div class='overflow-x-auto'><table class='w-full text-left border-collapse'><thead><tr class='bg-slate-100'><th class='p-2 border'>Code</th><th class='p-2 border'>Étiquette</th><th class='p-2 border'>Description et objectif</th></tr></thead><tbody>" +
                "<tr><td class='p-2 border'><strong>URG M/T</strong></td><td class='p-2 border'>Urg M/T</td><td class='p-2 border'><strong>Urgences (Matin/Après-midi):</strong> Poste clinique aux urgences.</td></tr>" +
                "<tr><td class='p-2 border'><strong>TRAV M/T</strong></td><td class='p-2 border'>Trav M/T</td><td class='p-2 border'><strong>Travail (Matin/Après-midi):</strong> Poste clinique planifié (consultations, etc.).</td></tr>" +
                "<tr><td class='p-2 border'><strong>ADMIN</strong></td><td class='p-2 border'>Adm</td><td class='p-2 border'><strong>Administration :</strong> Tâches administratives. Flexible pour réaffectation.</td></tr>" +
                "<tr><td class='p-2 border'><strong>TW</strong></td><td class='p-2 border'>TW</td><td class='p-2 border'><strong>Télétravail :</strong> Tâches à domicile. Flexible pour réaffectation.</td></tr>" +
                "<tr><td class='p-2 border'><strong>STRASBOURG</strong></td><td class='p-2 border'>STR</td><td class='p-2 border'><strong>Session de Strasbourg :</strong> Du Lundi au Jeudi. Compte pour 10h/jour.</td></tr>" +
                "<tr><td class='p-2 border'><strong>STR-PREP</strong></td><td class='p-2 border'>(vide)</td><td class='p-2 border'><strong>Préparation Strasbourg :</strong> Vendredi précédent. Cellule vide avec fond rose.</td></tr>" +
                "<tr><td class='p-2 border'><strong>VACCIN</strong></td><td class='p-2 border'>Vac</td><td class='p-2 border'><strong>Campagne de vaccination.</strong></td></tr>" +
                "<tr><td class='p-2 border'><strong>SPLIT</strong></td><td class='p-2 border'>(divisé)</td><td class='p-2 border'><strong>Poste fractionné :</strong> Combine deux demi-postes.</td></tr>" +
                "<tr><td class='p-2 border'><strong>CA</strong></td><td class='p-2 border'>CA</td><td class='p-2 border'><strong>Congé Annuel :</strong> Absence justifiée. Ne compte pas d'heures.</td></tr>" +
                "<tr><td class='p-2 border'><strong>SICK</strong></td><td class='p-2 border'>Sick</td><td class='p-2 border'><strong>Arrêt maladie :</strong> Absence justifiée. Ne compte pas d'heures.</td></tr>" +
                "<tr><td class='p-2 border'><strong>FP</strong></td><td class='p-2 border'>FP</td><td class='p-2 border'><strong>Formation Professionnelle :</strong> Absence justifiée. Ne compte pas d'heures.</td></tr>" +
                "<tr><td class='p-2 border'><strong>RECUP</strong></td><td class='p-2 border'>Recup</td><td class='p-2 border'><strong>Récupération d'heures :</strong> Jour de repos compensatoire. Ne compte pas d'heures.</td></tr></tbody></table></div>",
                "<h4>4.3 Types de semaines et leur code couleur</h4><ul class='list-disc list-inside pl-4 space-y-1'><li><strong>Normale (Fond Blanc/Gris clair) :</strong> Activité standard.</li><li><strong>Session (Fond Rose) :</strong> Semaine de session à Strasbourg.</li><li><strong>White/Green (Fond Vert clair) :</strong> Semaines de moindre activité ou de transition.</li><li><strong>Réduite (Fond Jaune clair) :</strong> Périodes de faible activité avec moins de personnel.</li><li><strong>Fermé (Fond Gris) :</strong> Le service est fermé.</li></ul>"
            ]
        },
        {
          title: "5. L'Échange Visuel de Postes : L'outil clé",
          content: [
            "C'est la fonctionnalité la plus importante pour une gestion quotidienne flexible.",
            "<h4>5.1 À quoi ça sert ?</h4><p>Pour refléter sur le planning un accord d'échange de postes entre deux personnes <strong>pour un jour donné</strong>, sans altérer le système de calcul des heures. C'est un \"post-it\" numérique sur le planning officiel.</p>",
            "<h4>5.2 Comment ça marche ? (Pas à pas pour les Admins)</h4><ol class='list-decimal list-inside pl-4 space-y-1'><li><strong>Accès :</strong> Faites un <strong>double-clic</strong> sur la cellule de l'infirmier/ère et du jour à modifier.</li><li><strong>Panneau latéral :</strong> Un panneau s'ouvrira à droite.</li><li><strong>Sélection :</strong> Recherchez et sélectionnez le second infirmier/ère.</li><li><strong>Aperçu :</strong> Le panneau vous montrera clairement le résultat de l'échange.</li><li><strong>Confirmation :</strong> Appuyez sur \"Confirmer l'échange\".</li></ol>",
            "<h4>5.3 Que se passe-t-il ensuite ?</h4><ul class='list-disc list-inside pl-4 space-y-1'><li>Les cellules des deux personnes afficheront le poste échangé.</li><li>Une icône 🔁 apparaîtra.</li><li>Au survol de l'icône, une infobulle vous informera du poste réel.</li><li>Une entrée sera créée dans l'Historique des Changements.</li></ul>",
            "<h4>5.4 Ce qu'un échange visuel FAIT et ne FAIT PAS</h4><div class='overflow-x-auto'><table class='w-full text-left border-collapse'><thead><tr class='bg-slate-100'><th class='p-2 border'>✅ Ce qu'il FAIT</th><th class='p-2 border'>❌ Ce qu'il ne FAIT PAS</th></tr></thead><tbody>" +
            "<tr><td class='p-2 border'>Modifie <strong>visuellement</strong> le poste.</td><td class='p-2 border'><strong>NE modifie PAS</strong> le poste de base de l'algorithme.</td></tr>" +
            "<tr><td class='p-2 border'>Ajoute une icône 🔁.</td><td class='p-2 border'><strong>N'affecte PAS</strong> le calcul des heures théoriques.</td></tr>" +
            "<tr><td class='p-2 border'>Permet de savoir qui est réellement à chaque poste.</td><td class='p-2 border'><strong>NE modifie PAS</strong> le bilan des types de postes.</td></tr>" +
            "<tr><td class='p-2 border'>Enregistre l'action dans l'Historique.</td><td class='p-2 border'><strong>N'est PAS</strong> reflété dans le Planning Individuel.</td></tr></tbody></table></div>"
          ]
        },
        {
            title: "6. Le Planning Individuel : Votre espace personnel",
            content: [
                "Accessible en cliquant sur l'icône 📅 à côté de votre nom. Il s'ouvre dans une fenêtre séparée.",
                "<h4>6.1 Fonctionnalités clés</h4><ul class='list-disc list-inside pl-4 space-y-1'><li><strong>Calendrier personnel :</strong> Affiche vos postes <strong>de base (théoriques)</strong>. Ne reflète pas les échanges visuels.</li><li><strong>Saisie des heures réelles :</strong> La fonction la plus importante ! Vous pouvez entrer vos heures d'arrivée et de départ réelles. <strong>Ces heures ont la priorité</strong> pour le calcul de votre bilan.</li><li><strong>Pause automatique :</strong> Le système déduit 30 minutes de pause pour les journées de 6 heures ou plus.</li><li><strong>Notes personnelles :</strong> Visibles uniquement par vous.</li><li><strong>Bilan informatif :</strong> Un résumé de vos postes et heures du mois et de l'année.</li><li><strong>Agrandir/Restaurer :</strong> Utilisez les icônes ⛶ / 🗗 pour voir en plein écran.</li></ul>"
            ]
        },
        {
            title: "7. Bilans et calcul des heures : Comprendre les chiffres",
            content: [
                "Le système distingue les heures théoriques et réelles pour offrir flexibilité et équité.",
                "<h4>7.1 Heures théoriques</h4><ul class='list-disc list-inside pl-4 space-y-1'><li>Calculées automatiquement par le système.</li><li><strong>Base :</strong> Chaque type de poste a une durée standard (ex: `TRAV M` = 8.5h du L-J et 6h le V).</li><li><strong>Modificateurs :</strong> Ajustées selon le temps de travail.</li><li><strong>Usage :</strong> Servent à générer le planning initial et comme valeur par défaut.</li></ul>",
                "<h4>7.2 Heures réelles (saisies)</h4><ul class='list-disc list-inside pl-4 space-y-1'><li>Celles que vous entrez dans votre Planning Individuel.</li><li><strong>Elles sont la source de vérité pour votre bilan personnel.</strong></li><li><strong>Exemple :</strong> Votre poste théorique est de 8:00 à 17:00 (8.5h), mais un jour vous restez jusqu'à 17:30. Si vous saisissez \"08:00 - 17:30\", votre bilan pour ce jour sera de 9h.</li></ul>",
                "<h4>7.3 Le bilan final</h4><p>C'est un outil <strong>informatif</strong>. Il compare les heures que vous avez effectuées avec celles que vous auriez théoriquement dû faire.</p>"
            ]
        },
        {
            title: "8. Glossaire des icônes et symboles",
            content: [
                "<div class='overflow-x-auto'><table class='w-full text-left border-collapse'><thead><tr class='bg-slate-100'><th class='p-2 border'>Icône</th><th class='p-2 border'>Nom</th><th class='p-2 border'>Emplacement</th><th class='p-2 border'>Signification</th></tr></thead><tbody>" +
                "<tr><td class='p-2 border text-center'>🔁</td><td class='p-2 border'>Échange Visuel</td><td class='p-2 border'>Cellule du Planning Général</td><td class='p-2 border'>Le poste affiché n'est pas l'original.</td></tr>" +
                "<tr><td class='p-2 border text-center'>📅</td><td class='p-2 border'>Ouvrir Planning Individuel</td><td class='p-2 border'>À côté de chaque nom</td><td class='p-2 border'>Ouvre le planning personnel.</td></tr>" +
                "<tr><td class='p-2 border text-center'>⛶ / 🗗</td><td class='p-2 border'>Agrandir / Restaurer</td><td class='p-2 border'>Fenêtre du Planning Individuel</td><td class='p-2 border'>Bascule la vue plein écran.</td></tr>" +
                "<tr><td class='p-2 border text-center'>✏️</td><td class='p-2 border'>Modifier</td><td class='p-2 border'>Panneaux d'administration</td><td class='p-2 border'>Ouvre le formulaire de modification.</td></tr>" +
                "<tr><td class='p-2 border text-center'>🗑️</td><td class='p-2 border'>Supprimer</td><td class='p-2 border'>Panneaux d'administration</td><td class='p-2 border'>Supprime un élément.</td></tr>" +
                "<tr><td class='p-2 border text-center'>🔒 / 🔓</td><td class='p-2 border'>Verrouiller / Déverrouiller</td><td class='p-2 border'>Barre supérieure</td><td class='p-2 border'>Empêche ou autorise la modification.</td></tr></tbody></table></div>"
            ]
        },
        {
            title: "9. Foire aux questions (FAQ)",
            content: [
                "<ul class='list-disc list-inside pl-4 space-y-2'><li><strong>Q : J'ai fait un échange visuel, mais mon Planning Individuel affiche toujours mon poste original. Est-ce une erreur ?</strong><br><strong>R :</strong> Non, c'est le comportement attendu. Le Planning Individuel affiche toujours le poste <strong>de base/théorique</strong>.</li><li><strong>Q : Pourquoi la cellule du vendredi de préparation pour Strasbourg est-elle vide ?</strong><br><strong>R :</strong> C'est un choix de conception pour réduire le bruit visuel. Le fond rose indique déjà une semaine de session.</li><li><strong>Q : J'ai saisi mes heures réelles, mais le Planning Général affiche toujours l'horaire théorique. N'est-ce pas enregistré ?</strong><br><strong>R :</strong> Si, c'est enregistré. Le Planning Général montre toujours l'information théorique. Vos heures réelles sont utilisées pour <strong>votre bilan personnel</strong>.</li><li><strong>Q : Comment annuler un échange visuel ?</strong><br><strong>R :</strong> Un administrateur peut appliquer un nouvel échange pour revenir à l'état initial ou contacter le support.</li><li><strong>Q : Si je suis à temps partiel, comment cela s'applique-t-il ?</strong><br><strong>R :</strong> L'administrateur le configure et le système l'applique automatiquement. Vous verrez un poste spécial ou un horaire ajusté.</li></ul>"
            ]
        }
      ]
    },
    shift_URGENCES_desc: 'Urgences (Matin)',
    shift_TRAVAIL_desc: 'Travail (Matin)',
    shift_URGENCES_TARDE_desc: 'Urgences (Après-midi)',
    shift_TRAVAIL_TARDE_desc: 'Travail (Après-midi)',
    shift_ADMIN_desc: 'Administration',
    shift_TW_desc: 'Télétravail',
    shift_STRASBOURG_desc: 'Session Strasbourg',
    shift_LIBERO_desc: 'Poste spécial pré-session',
    shift_RECUP_desc: "Récupération d'heures",
    shift_FP_desc: 'Formation Professionnelle',
    shift_SICK_LEAVE_desc: 'Arrêt Maladie',
    shift_CA_desc: 'Congé Annuel',
    shift_F_desc: 'Jour Férié',
    shift_VACCIN_desc: 'Campagne de Vaccination',
    shift_VACCIN_AM_desc: 'Vaccination (Matin)',
    shift_VACCIN_PM_desc: 'Vaccination (Après-midi)',
  }
};

export type Locale = typeof locales.es;
