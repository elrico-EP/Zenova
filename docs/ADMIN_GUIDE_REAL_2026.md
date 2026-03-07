# Guía de Administrador Zenova - VERSIÓN REAL 2026.3

**⚠️ IMPORTANTE:** Esta guía describe EXACTAMENTE qué funciones existen en la aplicación. Sin inventos, sin menús fantasmas.

---

## 1. INICIO DE SESIÓN COMO ADMIN

Para ser administrador, tu usuario debe tener:
- **Rol:** Admin
- **Email válido** en el sistema

Una vez logueado, verás:
- Acceso a todas las vistas
- Botones especiales en el Sidebar (izquierda) para funciones de admin

---

## 2. VISTAS PRINCIPALES (Lo que ves arriba)

La aplicación tiene **4 vistas principales**:

### 2.1 Schedule (Calendario)
- **Dónde:** Click "Schedule" en el menú superior
- **Qué ves:** Tabla grande con:
  - Columnas = Días del mes
  - Filas = Enfermeros
  - Celdas = Turnos asignados

**COMO ADMIN, PUEDES:**
- Hacer doble-click en celda → Se abre modal para cambiar turno
- Ver TODO el calendario sin restricciones
- Editar turnos de cualquier enfermero cualquier día (si mes no está cerrado)

### 2.2 Balance (Balance de Horas)
- **Dónde:** Click "Balance" en menú superior
- **Qué ves:** Tabla con horas por enfermero:
  - Horas trabajadas este mes
  - Balance (horas - contrato)
  - Tipo de turno (cuántos URGENCES, TRAVAIL, etc.)

**COMO ADMIN:**
- Puedes ver balance de TODOS (no solo el tuyo)
- Es de **solo lectura** (no editas directamente aquí)
- Sirve para auditar si alguien tiene muchas horas o pocas

### 2.3 Wishes (Deseos)
- **Dónde:** Click "Wishes" en menú superior
- **Qué ves:** Tabla de deseos (solicitudes) que han hecho los enfermeros
  - Nombre enfermero
  - Fecha solicitada
  - Tipo solicitud (excluir turno, solicitar turno, etc.)
  - **Estado:** Verde = Validado, Naranja = Pendiente

**COMO ADMIN, PUEDES:**
- **Validar un deseo:** Click en botón (reloj naranja/check verde) junto a la solicitud
  - Un click = Cambiar estado pendiente ↔ validado
  - Eso es TODO. No hay "aprobar con motivo" ni "rechazar"
- Ver deseos de TODOS los enfermeros
- Editar texto de deseos

**⚠️ IMPORTANTE:** Una vez validado, el sistema automáticamente aplica el cambio en el calendario.

### 2.4 User Management (Gestión de Usuarios)
- **Dónde:** Click "Users" en menú superior
- **Qué ves:** Lista de usuarios del sistema

**COMO ADMIN, PUEDES:**
- **Crear usuario:** Botón "+ New User" → Se abre formulario:
  - Nombre
  - Email (username para login)
  - Rol (admin/nurse/viewer)
  - Contraseña (temporal, usuario DEBE cambiarla en primer login)
  - Si es "nurse" = Asociar a un enfermero de la lista

- **Editar usuario:** Click en fila → Modal con campos editables

- **Resetear contraseña:** Botón "Reset Password" → Sistema genera contraseña temporal y la envía por email

- **Eliminar usuario:** Botón "Delete" → Aviso de confirmación

---

## 3. SIDEBAR (PANEL IZQUIERDO) - MÓDULOS DE ADMIN

El Sidebar tiene varios módulos colapsibles. **Solo verás los que tu rol permite.**

### 3.1 Manage Team
- **Qué es:** Lista de enfermeros del sistemas
- **Como Admin, puedes:**
  - **Agregar enfermero:** Campo de texto + botón "Add"
    - Crea nueva "enfermera" en la lista (no confundir con "usuario")
    - Los enfermeros ≠ Usuarios. Ejemplo: Ana García es enfermera. Luego creas usuario "ana@hospital.es" que apunta a Ana García
  
  - **Editar nombre:** Haz clic en nombre, escribe el nuevo
  
  - **Ver agenda personal:** Click en icono "calendario" (abre personal agenda de esa enfermera)
  
  - **Resetear mes:** Click en icono "flechas circulares" → Borra TODOS los cambios manuales de esa enfermera para este mes (vuelve al auto-generado)
  
  - **Eliminar enfermera:** Click en "X" rojo → Pide confirmación → BORRA así sea que tenga turnos asignados

**⚠️ OJO:** Eliminar una enfermera puede dejar el calendario sin cobertura algunos días.

### 3.2 Manual Change - ACTUALIZADO 2026.3
- **Qué es:** Herramienta para cambiar turnos manualmente
- **Cómo usarla:**
  1. Selecciona enfermero (dropdown)
  2. Selecciona fecha
  3. Selecciona nuevo turno (URGENCES, TRAVAIL, URGENCES_TARDE, TRAVAIL_TARDE, ADMIN, TW, CA, F, SICK_LEAVE, etc.)
  4. Click "Apply Change" o similar
- **Resultado:**
  - Turno se actualiza en calendario
  - Enfermero recibe notificación donde dice: "Tu turno [fecha] cambió a [nuevo turno]"

**AUTOMÁTICO 2026.3** (`ensureMandatoryCoverage`):
- Después de hacer el cambio, sistema automáticamente:
  1. Verifica si quedan turnos obligatorios sin cubrir (URGENCES, TRAVAIL, URGENCES_TARDE, TRAVAIL_TARDE)
  2. Si falta algo → busca enfermeros con ADMIN ese día
  3. Reasigna automáticamente: ADMIN → turno obligatorio faltante
  4. Notifica a reasignados
  5. TÚ no tienes que intervenir ni verificar manualmente

**Ejemplo:**
- Cambias a Carlos: TRAVAIL → SICK_LEAVE (el 10/4)
- Sistema detecta: "Falta 1 TRAVAIL ese día"
- Ve que Elena tiene ADMIN
- Reasigna: Elena ADMIN → TRAVAIL
- Notifica a ambos
- ¡Listo!

### 3.3 Mass Assign Absence - ACTUALIZADO 2026.3
- **Qué es:** Asignar MÚLTIPLES enfermeros a ausencias (CA, SICK_LEAVE, FP, CS) en rango de fechas
- **Cómo usarla:**
  1. Checkbox cada enfermero que quieres
  2. Selecciona tipo ausencia (CA/SICK_LEAVE/FP/CS)
  3. Selecciona fecha de inicio y fin
  4. Click "Apply"
- **Resultado:**
  - TODOS esos enfermeros esos días reciben esa ausencia
  - Útil para: "5 enfermeros se enferman, asigno SICK_LEAVE a todos en un click"

**AUTOMÁTICO 2026.3** (`ensureMandatoryCoverage`):
- Después de aplicar ausencias masivas, sistema automáticamente:
  - Para CADA DÍA en el rango: verifica si quedan turnos obligatorios sin cubrir
  - Si falta algo → reasigna automáticamente ADMIN → turno obligatorio faltante
  - En casos complejos (muchos ADMIN limitados): muestra alerta roja con días sin cobertura
  - TÚ no tienes que revisar manualmente cada día

**Ventaja:** Asignas 5 SICK_LEAVE, sistema automáticamente reorganiza coberturas. Mucho más rápido.

### 3.4 Strasbourg Events (si aplica)
- **Qué es:** Gestión de sesiones de Estrasburgo
- **Cómo usarla:**
  - Selector de mes (colapsible)
  - Por cada semana con SESSION:
    - Verás lista de enfermeros asignados
    - Puedes agregar/quitar enfermeros
    - Botón "Edit" para abrir modal de edición masiva

### 3.5 Advanced Settings (Expandible)
Aquí hay sub-módulos:

#### A) Jornada (Workload Management)
- **Qué es:** Gestión de porcentajes de contrato (80%/90%/100%)
- **Qué puedes hacer:**
  - Click botón "Manage Jornadas" → Se abre ventana
  - Aquí PUEDES configurar jornadas especiales (reducción horaria, restricciones de días, etc.)
  - PERO: No está totalmente documentado qué opciones exactas existen (revisar pantalla cuando abras)

#### B) Strasbourg Annual Planner
- **Qué es:** Planificar qué enfermeros van a Estrasburgo cada semana del año
- **Cómo usarla:**
  - Es una tabla grande mostrando TODAS las semanas con SESSION
  - Por cada semana: checkboxes de enfermeros
  - Click "Add Nurse" o "Edit" para cambiar asignación
  - Los cambios se guardan inmediatamente

#### C) Vaccination Period
- **Qué es:** Definir período de vacunación
- **Cómo usarla:**
  - 2 campos: date picker de "Start" y "End"
  - Sistema automáticamente ajusta calendario durante ese período para incluir turnos VACCIN_AM y VACCIN_PM

---

## 4. EDICIÓN DE TURNOS (Lo más crucial) - ACTUALIZADO 2026.3

### 4.1 Editar UN turno individual
1. Ve a vista **Schedule** (calendario)
2. Localiza celda (enfermero + día)
3. **Double-click** en la celda
4. Se abre modal pequeño con dropdown de turnos
5. Selecciona nuevo turno
6. Click "Save" o "Guardar"
7. ¡LISTO! Turno cambió, enfermero notificado

**AUTOMÁTICO (NUEVO 2026) - `ensureMandatoryCoverage`:**
- Si quitas un turno obligatorio (URG, TRAV, URG_TARDE, TRAV_TARDE), sistema automáticamente:
  1. Detecta que falta ese turno
  2. Busca enfermeros con ADMIN asignado ese día
  3. Reasigna automáticamente el primero encontrado a ese turno obligatorio
  4. Notifica a ese enfermero del cambio
- Si NO hay enfermeros con ADMIN disponibles → muestra **ALERTA ROJA** (tú arreglas manualmente)

**Ejemplo:**
- Cambias a Ana de URGENCES_TARDE → SICK_LEAVE
- Sistema detecta falta URGENCES_TARDE
- Ve que Elena tiene ADMIN
- Reasigna automáticamente Elena ADMIN → URGENCES_TARDE
- Elena recibe notificación del cambio
- ¡Listo! Cobertura se mantiene

### 4.2 Editar MÚLTIPLES turnos (rango)
1. Ve a **Schedule**
2. Click en primera celda que quieres cambiar
3. Arrastra hasta última celda (se destacan en azul)
4. Se abre modal "Assign to Range"
5. Selecciona qué turno asignar a TODOS esos días
6. Click "Apply" o "Aplicar Rango"

**Resultado:** Todos los días de ese rango, ese enfermero recibe ese turno.

**AUTOMÁTICO:** Igual que en 4.1, sistema verifica cobertura y reasigna si falta algo.

### 4.3 Cambiar UN DÍA COMPLETO (todos los enfermeros)
1. Ve a **Schedule**
2. Click en ENCABEZADO de columna (el número del día en top) - NO en una celda
3. Se abre modal "Edit Day"
4. Selecciona qué turnos: 
   - "All same" = Todos los enfermeros ese día reciben mismo turno
   - O editar individual
5. Click "Save"

**Resultado:** Todos los enfermeros ese día tienen ese turno.

**AUTOMÁTICO:** Sistema verifica cobertura después de cambio.

---

## 5. SISTEMA DE COBERTURA (LO MÁS IMPORTANTE) - ACTUALIZADO 2026.3

### 5.1 Turnos Obligatorios (6 Mínimo)
Cada día DEBE tener:
- **2 x URGENCES** (mañana) - OBLIGATORIO
- **2 x TRAVAIL** (mañana) - OBLIGATORIO
- **1 x URGENCES_TARDE** (tarde) - OBLIGATORIO
- **1 x TRAVAIL_TARDE** (tarde) - OBLIGATORIO

= **Total: 6 turnos obligatorios mínimo por día**

Después de estos 6:
- **Enfermero 7º y 8º:** ADMIN
- **Enfermero 9º en adelante:** TW (si cumple reglas) o ADMIN

### 5.2 Prioridad de Asignación (NUEVO 2026)
Los turnos se asignan en este ORDEN:
1. **URGENCES_TARDE** (urgencias tarde) - PRIMERO
2. **TRAVAIL_TARDE** (turno general tarde) - SEGUNDO
3. **URGENCES** (urgencias mañana) - TERCERO
4. **TRAVAIL** (turno general mañana) - CUARTO

**¿Por qué?** Turdes de TARDE son más críticas. Si hay solo 7 enfermeros disponibles:
- Sistema asigna primero URGENCES_TARDE + TRAVAIL_TARDE → garantizadas
- Luego URGENCES + TRAVAIL → se adaptan al espacio restante
- Así evita "tardes vacías" que es operacionalmente imposible

**Impacto para admin:** Si alguien solicita "excluir turno tarde", es más delicado que excluir mañana.

### 5.3 Reasignación Automática (NUEVO 2026 - `ensureMandatoryCoverage`)

**El sistema automáticamente mantiene cobertura.**

Cuando TÚ haces un cambio que puede quebrar cobertura (ej: cambias a alguien de URGENCES_TARDE a SICK_LEAVE):

1. Sistema detecta: "Falta 1 URGENCES_TARDE"
2. Busca: "¿Hay alguien con ADMIN asignado ese día?"
3. Si SÍ → Reasigna automáticamente: ADMIN → URGENCES_TARDE
4. Notifica: Al enfermero que fue reasignado
5. ¡Cobertura mantiene!

**Esto ocurre automáticamente en:**
- Cambios manuales (sección 4)
- Validación de wishes (sección 6)
- Cambios masivos (Mass Assign)

### 5.4 ¿Qué pasa si sistema NO puede autoarreglar?

Si NO hay enfermeros con ADMIN disponibles para reasignar:
- Sistema muestra **ALERTA ROJA:** "❌ URGENCES_TARDE insuficiente. NO hay ADMIN para reasignar."
- TÚ debes intervenir:
  - **Opción A:** Rechazar el cambio que estabas haciendo
  - **Opción B:** Buscar manualmente otro enfermero para cubrir
  - **Opción C:** Contactar dirección si es emergencia

### 5.5 Ejemplo Práctico (Real)

**Situación:** Día 13 abril, 7 enfermeros asignados:
- URGENCES: Ana, Pedro
- TRAVAIL: Juan, Luis
- URGENCES_TARDE: María
- TRAVAIL_TARDE: Carlos
- ADMIN: Elena

**Tú cambias:** María (URGENCES_TARDE) → SICK_LEAVE

**Sistema automáticamente:**
1. Detecta falta URGENCES_TARDE
2. Ve que Elena tiene ADMIN
3. Reasigna: Elena ADMIN → URGENCES_TARDE
4. Notifica a Elena: "Tu turno 13/4 cambió de ADMIN a URGENCES_TARDE (cobertura baja médica María)"
5. Notifica a María: "Tu turno 13/4 cambió a SICK_LEAVE"

**Resultado:** Cobertura mantenida. TÚ hiciste 1 click, sistema hizo el resto.

**SIN esta función (2025):** Tenías que:
1. Ver que falta URGENCES_TARDE
2. Buscar manualmente quién puede cubrirlo
3. Cambiar manualmente a ese enfermero
4. Notificar a ambos manualmente
5. Verificar que no se quebró otro turno

**AHORA (2026):** ¡1 click!

---

## 6. WISHES (DESEOS) - PROCESS COMPLETO - ACTUALIZADO 2026.3

### 6.1 Enfermero solicita want
Ejemplo: María solicita "Excluir URGENCES_TARDE el 15/4"

### 6.2 Como Admin, ves en Wishes:
- Row con: "María " | "15/4" | "Exclude URGENCES_TARDE" | **Botón naranja (reloj) = PENDIENTE**

### 6.3 ¿Apruebas? (NUEVO 2026.3 - ensureMandatoryCoverage)
1. Click en botón naranja/verde junto a wish
2. Estado cambia: naranja → VERDE (checkmark)
3. Sistema automáticamente:
   - Cambia turno de María ese día a otra cosa (generalmente un turno menos crítico)
   - **Busca si queda sin cobertura en turno obligatorio**
   - **Si falta → automáticamente busca ADMIN disponible y lo reasigna**
   - Notifica a María: "Tu desire fue aprobado. Tu turno 15/4 es ahora ADMIN (cobertura)"
   - Notifica a quien sea reasignado: "Tu turno 15/4 cambió de ADMIN a URGENCES_TARDE (cobertura médica María)"

**IMPORTANTE (NUEVO 2026.3):**
- NO tienes que preocuparte de manualmente verificar y arreglar cobertura cuando apruebas wishes
- Sistema lo hace automática y transparentemente
- Si NO hay ADMIN disponible para reasignar → alerta roja te lo indica

### 6.4 ¿No apruebas?
1. Click botón de nuevo (cambia de verde → naranja "unvalidate")
2. Deseo permanece pendiente
3. Sistema NO revierte cambios si ya fue aplicado (TÚ reviertes manual si es necesario)

**⚠️ LIMITACIÓN:** NO hay funcionalidad de "Rechazar con motivo". Solo apruebas/rechazas, no hay campo para escribir "Sorry, no puedo porque..."

**⚠️ VENTAJA 2026.3:** Ya no necesitas revisar manualmente si se quebró cobertura. ensureMandatoryCoverage se encarga.

---

## 7. USUARIOS - PROCESO COMPLETO

### 7.1 Crear Usuario Nuevo
1. Ve a vista **Users** (User Management)
2. Click "+New User"
3. Se abre modal con campos:
   - **Full Name:** Nombre real (ej: Ana García)
   - **Username (Email):** Email corporativo (ej: ana@hospital.es)
   - **Password:** Contraseña temporal
   - **Role:** admin / nurse / viewer
   - **Si Role = "nurse":** Select "Associated Nurse" (el enfermero Ana García de la lista)
4. Click "Save"
5. Sistema crea usuario y envía email con credenciales

**Primer Login del usuario:**
- Usuario recibe email con contraseña temporal
- Hace login
- Sistema FUERZA cambio de contraseña (mandatorio)
- Luego puede usar app

### 7.2 Editar Usuario
1. En Users, click en fila del usuario
2. Se abre modal con campos editables
3. Cambia lo que necesites (nombre, email, rol, etc.)
4. Click "Save"

### 7.3 Reset de Contraseña
1. En Users, busca usuario
2. Click botón "Reset Password"
3. Sistema genera contraseña temporal y envía por email
4. Usuario recibe email, hace login, FUERZA cambio de contraseña

### 7.4 Eliminar Usuario
1. En Users, click "Delete"
2. Aviso: "¿Estás seguro?"
3. Click confirmar
4. Usuario eliminado (no aparece más en lista)

---

## 8. HISTORIAL / AUDITORÍA

### ¿Dónde está?
**NO hay vista separada llamada "Historial"en menu.**

Pero cada cambio se registra en:
- **Manual Change Modal:** Hay un pequeño log de cambios recientes
- **Supabase:** Base de datos guarda LOG con timestamp, qué cambió, quién lo cambió

**Como Admin:**
- Puedes ver logs dentro del sidebar (en algún módulo)
- O revisar directamente en Supabase si tienes acceso

**⚠️ LIMITACIÓN:** No hay interfaz cómoda de admin para "buscar cambios de [usuario] en [fecha]". Necesitarías acceso Supabase directamente.

---

## 9. MONTH LOCK (Congelar Mes)

### ¿Qué es?
Estado que impide cambios al mes (cierra para edición).

### ¿Dónde está?
No sé exactamente (revisar Sidebar, probablemente en header o "Advanced Settings").

### ¿Qué hace?
- Desactiva botones de edición
- Impide que Admin edite turnos o aplique cambios
- Protege mes "finalizado" de cambios accidentales

---

## 10. LIMITACIONES REALES (Honesto)

1. **NO hay "Aprobar/Rechazar Wishes con motivo"**
   - Solo puedes validar (sí/no), no escribir por qué rechazas

2. **NO hay filtro de "Wishes Pendientes"**
   - Ves TODAS, tienes que filtrar manualmente

3. **NO hay "Violations Dashboard" centralizado**
   - No hay botón que muestre "Hoy hay 3 días sin cobertura"
   - Tienes que revisar el calendario y detectarlos manualmente

4. **NO hay "Recalcular todo el mes" con un botón**
   - Sistema recalcula automático, tu NO tienes botón de "Recalculate Coverage"

5. **Historial no es cómodo**
   - No es Panel bonito de admin
   - Necesitas Supabase acceso directo para auditoría completa

6. **NO hay "Preview" antes de cambios masivos**
   - Si asignas SICK_LEAVE a 5 enfermeros, se aplica inmediatamente
   - No hay "Preview" de impacto

7. **Notificaciones por email DEPENDEN de:**
   - Email configurado en usuario
   - Supabase Edge Function deployada
   - RESEND API key válido
   - Si algo falla → chofer emails pero CAMBIOS se aplicaron igual

---

## 11. WORKFLOW TÍPICO DE ADMIN (REALISTA)

### Cada Mañana:
1. Abres Zenova
2. Visto a **Schedule** → visual scan para alertas rojas (días sin cobertura)
3. Si hay alerta → Ve a **Manual Change**, busca enfermero, cambia turno
4. Visto a **Wishes** → ¿Hay solicitudes pendientes (naranja)?
   - Si sí → Click en botón naranja para validar (o no validar)
5. **Listo**, sistema automático maneja el resto

### Fin de Mes:
1. Revisa **Balance** → ¿Alguien tiene balance muy negativo? (trabajó menos)
2. Si hay anomalía → **Manual Change** para arreglar horas (si aplica)
3. Si todo OK → El sistema está "finished" para mes

**Tiempo promedio:** 10-15 minutos/día

---

## 12. TROUBLESHOOTING

### "No recibí email"
- ¿Tu email está en "User Management" > tu usuario > editar > email?
- Si no → Tú mismo no vas a recibir emails (guardar email primero)
- Si sí → Problema puede ser:
  - Edge Function no deployada
  - RESEND API key expirada o inválida
  - Email en SPAM

### "Un turno que cambié dice que está mal pero no se actualizó"
- Es cache del navegador
- Haz Ctrl+F5 (hard refresh) 
- O cierra/abre navegador

### "Alguien reclamó que yo cambié su turno pero no fui yo"
- Ve a **historial** (si existe) o Supabase
- Busca cambio de ese usuario, ¿quién lo hizo?
- Contacta a ese admin

### "Falta cobertura pero no sé a quién cambiar"
- Ve **Manual Change** → Busca enfermeros con ADMIN ese día
- Reasigna uno a turno obligatorio completo
- Si no hay nadie con ADMIN → busca alguien con "less critical" shift (ej: TW) y muévelo

---

## 13. RESUMEN: LO QUE HACE UN ADMIN EN PRÁCTICA

✅ **SÍ puedes:**
- Crear/editar/eliminar usuarios
- Crear/editar/eliminar enfermeros
- Ver calendario completo
- Cambiar turnos manualmente (1 turno o rango)
- Cambiar día completo
- Validar/no validar wishes
- Asignar ausencias en masa
- Gestionar Strasbourg y Vacunación
- Ver balance de horas de TODOS

❌ **NO puedes (o no existe):**
- Tener UI bonita para "Aprobar Wishes con motivo"
- Dashboard con "Violations Finder"
- Botón "Recalculate everything"
- Interfaz cómoda de Historial
- Preview masivo antes de cambios
- "Reportes automáticos" descargables

---

**Última actualización:** 6 de Marzo 2026
**Versión:** REAL (basada en código actual, sin invenciones)
