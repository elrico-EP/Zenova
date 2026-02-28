# Zenova — Guía Funcional y Técnica (ES/EN)

## ES — Guía completa

### 1) Objetivo de la aplicación
Zenova es una aplicación de planificación de turnos de enfermería con:
- Generación automática de turnos por reglas.
- Edición manual de turnos.
- Gestión de horas y balance.
- Gestión de deseos (wishes).
- Gestión de jornadas laborales (80/90/100%).
- Exportación PDF y vistas personalizadas.
- Sincronización multiusuario con Supabase.

---

### 2) Arquitectura funcional

#### 2.1 Frontend
- React + TypeScript.
- Estado principal en `App.tsx` + hooks/contextos.
- Componentes para calendario, agenda personal, balance, deseos, administración y modales de edición.

#### 2.2 Contextos
- `UserContext`: autenticación, sesión, impersonación, cambio de contraseña, usuarios.
- `NurseContext`: conjunto base de enfermeros según mes (incluye/excluye trainee).
- `LanguageContext`: idioma (es/en/fr), persistido en localStorage.

#### 2.3 Persistencia
- Supabase tabla `app_state` (JSON global):
  - `agenda`, `manualOverrides`, `hours`, `wishes`, `jornadasLaborales`, etc.
- Supabase tabla `users`: login y gestión de usuarios.
- Tabla `turnos`: persistencia adicional para turnos manuales/intercambios (camino paralelo).

#### 2.4 Sincronización
- Realtime por canal Supabase (`postgres_changes` + `broadcast`).
- Fallback polling cuando no llegan eventos realtime.
- Versionado con `updatedAt` para reducir sobrescrituras con datos antiguos.

---

### 3) Modelo de datos (resumen)

- `AppState`
  - `nurses`: lista de enfermeros.
  - `agenda`: nivel de actividad semanal (`NORMAL`, `SESSION`, `WHITE_GREEN`, `REDUCED`, `CLOSED`).
  - `manualOverrides`: sobrescrituras manuales por enfermero/fecha.
  - `notes`: notas de día.
  - `hours`: horas calculadas y manuales (segmentos + nota).
  - `vaccinationPeriod`: periodo de vacunación.
  - `strasbourgAssignments` y `specialStrasbourgEvents`.
  - `closedMonths`: bloqueo de mes.
  - `wishes`: deseos por enfermero/fecha.
  - `jornadasLaborales`: reglas de reducción.
  - `manualChangeLog` y logs de eventos.
  - `updatedAt`: versión temporal para sincronización.

- `ScheduleCell`
  - Puede ser un turno simple (`URGENCES`, `TRAVAIL`, etc.),
  - turno custom con horario,
  - o turno partido (`split`).

---

### 4) Roles y permisos

#### 4.1 Roles
- `admin`: control completo (planificación, bloqueos, jornadas, usuarios, validaciones, etc.).
- `nurse`: operaciones de su contexto personal (agenda propia/deseos según reglas).
- `viewer`: solo lectura.

#### 4.2 Doble capa de permisos
- Permisos de **vista** (lo que se muestra en UI, incluyendo impersonación).
- Permisos **reales** (lo que realmente puede ejecutar el usuario autenticado).

---

### 5) Motor de planificación automática (normas)

El cálculo mensual se hace con reglas de cobertura y equidad:

1. **Días no laborables**
- Sin asignación en fines de semana.
- Sin asignación en festivos.
- Sin asignación en semanas `CLOSED`.

2. **Necesidades clínicas por día**
- Día estándar: urgencias/travail mañana y tarde.
- Viernes normal: patrón reducido de mañana.
- Viernes previo a semana `SESSION`: patrón especial (incluye tarde + `LIBERO`).

3. **Vacunación**
- Durante periodo activo, se exigen cupos de `VACCIN_AM` y `VACCIN_PM`.
- Se ajusta el resto de asignaciones clínicas para mantener cobertura.

4. **Estrasburgo (`SESSION`)**
- Lun-Jue: enfermeros asignados en `STRASBOURG`.
- Viernes: `STR-PREP` (custom tipo `STRASBOURG`).

5. **Trainee (`nurse-11`)**
- Temporada principal oct-feb.
- Rotación por ciclo semanal.
- Puede mantenerse por presencia manual en otros meses.

6. **Equidad**
- Selección de candidatos con contadores históricos/semanales (`urgences`, `travail`, tardes, `tw`, vacunación).

7. **TW**
- Se asigna bajo condiciones (disponibilidad/límites semanales y distribución).

---

### 6) Jornadas laborales y reglas horarias

#### 6.1 Jornadas
- 100%: sin reducción.
- 90%:
  - opción salida 1h antes lun-jue,
  - o bloque de reducción (3h) en día fijo.
- 80%:
  - día completo libre,
  - o viernes libre + reducción extra en otro día.

#### 6.2 Cálculo de horas
- Cálculo neto por día/turno.
- Descanso estándar aplicado en turnos largos.
- Excepciones específicas para Strasbourg, split manual y ciertos casos de reducción.
- Ausencias (`CA`, `SICK_LEAVE`, `FP`) computan según lógica teórica del día.

---

### 7) Cambios manuales y operaciones de usuario

1. **Cambio manual de turno**
- Se registra en `manualOverrides` por enfermero/fecha.
- Se registra en `manualChangeLog`.
- En el estado actual también puede guardarse en tabla `turnos` (paralelo).

2. **Intercambio de turnos (swap)**
- Intercambia celdas de dos enfermeros en una fecha.
- Actualiza `manualOverrides` y log.

3. **Borrado de override manual**
- Elimina sobrescritura de día concreto.

4. **Edición de horas manuales**
- Segmentos horarios + nota.
- Se guarda en `hours`.

5. **Deseos (wishes)**
- Creación/edición por usuario.
- Validación por admin.
- Al validar, puede aplicarse al `manualOverrides`.

6. **Bloqueo de mes**
- Marca mes como cerrado (`closedMonths`).
- Evita cambios según lógica de UI/acciones.

---

### 8) Pantallas principales
- Login.
- Calendario mensual (`ScheduleGrid`).
- Agenda personal (`PersonalAgendaModal`).
- Balance anual/mensual.
- Wishes.
- Gestión de usuarios.
- Perfil.
- Módulos admin: jornadas, Strasbourg, planificación anual, historial.

---

### 9) Flujo de sincronización (actual)

1. Carga inicial de `app_state`.
2. Suscripción realtime.
3. Si realtime no emite eventos, activación de polling.
4. `updateData(...)`:
   - actualiza estado local optimista,
   - persiste en Supabase,
   - emite broadcast,
   - usa `updatedAt` para resolver orden temporal.

---

### 10) Riesgos técnicos actuales (importante)
- Existe doble camino de persistencia de turnos manuales (`manualOverrides` y tabla `turnos`).
- Si ambas fuentes no están perfectamente coordinadas, puede haber:
  - “rebotes” visuales,
  - desaparición de cambios,
  - sobrescrituras cruzadas.
- El polling como fallback puede aplicar estado más antiguo si no se controla estrictamente el versionado/ventanas de guardado.

---

### 11) Fuente de verdad recomendada
Para máxima estabilidad:
1. Definir una única fuente de verdad de turnos manuales (recomendado: `manualOverrides` en `app_state` o tabla `turnos`, pero no ambas sin reconciliación).
2. Mantener `updatedAt` monotónico por escritura.
3. En polling/realtime, ignorar siempre payload con versión inferior.
4. Evitar mezclar recálculo automático con aplicación manual en dos capas distintas sin contrato claro.


## EN — Complete guide

### 1) App purpose
Zenova is a nurse shift planning app with:
- Rule-based automatic scheduling.
- Manual shift editing.
- Hours and balance management.
- Wishes management.
- Workload percentage rules (80/90/100%).
- PDF export and personal views.
- Multi-user sync through Supabase.

---

### 2) Functional architecture

#### 2.1 Frontend
- React + TypeScript.
- Main orchestration in `App.tsx` with hooks/contexts.
- Components for monthly grid, personal agenda, balance, wishes, admin and edit modals.

#### 2.2 Contexts
- `UserContext`: auth/session/impersonation/password flows/users.
- `NurseContext`: base nurse set by month (trainee include/exclude).
- `LanguageContext`: language persistence (es/en/fr).

#### 2.3 Persistence
- Supabase `app_state` table (global JSON):
  - `agenda`, `manualOverrides`, `hours`, `wishes`, `jornadasLaborales`, etc.
- Supabase `users` table for login and user management.
- `turnos` table as an additional manual-shift persistence path.

#### 2.4 Synchronization
- Supabase realtime channel (`postgres_changes` + `broadcast`).
- Polling fallback when realtime events are not received.
- `updatedAt` versioning to mitigate stale overwrites.

---

### 3) Data model (summary)
- `AppState` includes nurses, weekly activity agenda, manual overrides, notes, hours, vaccination period, Strasbourg assignments/events, month locks, wishes, workload rules, logs, and `updatedAt`.
- `ScheduleCell` supports simple shift, custom shift with explicit time, or split shift.

---

### 4) Roles and permissions

#### 4.1 Roles
- `admin`: full control.
- `nurse`: personal-scope operations (subject to permission checks).
- `viewer`: read-only.

#### 4.2 Two permission layers
- **View permissions** (UI visibility, including impersonation context).
- **Real permissions** (actual action authorization for authenticated user).

---

### 5) Automatic scheduling engine (rules)
1. No assignment on weekends, holidays, or `CLOSED` weeks.
2. Daily clinical needs vary by day and activity level.
3. Vaccination period enforces `VACCIN_AM/PM` slots and re-balances coverage.
4. Strasbourg session rules:
   - Mon-Thu `STRASBOURG`,
   - Fri `STR-PREP` custom shift.
5. Trainee (`nurse-11`) seasonal and rotational logic.
6. Equity through historical/weekly counters.
7. `TW` assignment with weekly constraints.

---

### 6) Workload percentages and hour rules
- 100%: no reduction.
- 90%: leave-early or fixed-day block reduction.
- 80%: full day off, or Friday off + extra reduction day.
- Net-hour calculation includes standard break for long shifts.
- Specific exceptions for Strasbourg, manual split shifts, and reduction edge cases.

---

### 7) Manual operations
1. Manual shift change updates `manualOverrides` and change log.
2. Swap exchanges two nurses’ shifts on a date.
3. Manual override deletion removes date-level manual entry.
4. Manual hours editing stores segments + note in `hours`.
5. Wishes can be validated by admin and applied to schedule.
6. Month lock stores closed/open state.

---

### 8) Main screens
- Login.
- Monthly schedule grid.
- Personal agenda modal.
- Balance view.
- Wishes view.
- User management.
- Profile.
- Admin modules: workload rules, Strasbourg, annual planning, history.

---

### 9) Current sync flow
1. Load `app_state`.
2. Subscribe realtime.
3. Enable polling fallback if realtime is silent.
4. `updateData(...)` does optimistic local update + Supabase persistence + broadcast + timestamp ordering.

---

### 10) Current technical risks
- Dual persistence path for manual shifts (`manualOverrides` + `turnos`) may produce race conditions.
- If not strictly reconciled, users may observe flicker/revert behavior.
- Polling fallback can overwrite recent local state unless version checks and save windows are strictly enforced.

---

### 11) Recommended single-source strategy
1. Define one source of truth for manual shifts.
2. Keep monotonic `updatedAt` writes.
3. Drop stale remote payloads in realtime/polling.
4. Keep auto-generation and manual-overlay responsibilities clearly separated.
