# Plan de Mejora: Equidad Semanal, Mensual y Anual en Rotación de Turnos

**Problema Actual:** Enfermeros con 3 días de ADMIN en la misma semana → Falta de equidad semanal

## ANÁLISIS DEL PROBLEMA ACTUAL

### Código Actual (findBestCandidateWithWeeklyEquity)
```typescript
const sorted = [...candidates].sort((a, b) => {
    // Prioridad 1: Stat mensual del turno específico (ej: admin mensual)
    if (statsA[primaryStat] !== statsB[primaryStat]) 
        return statsA[primaryStat] - statsB[primaryStat];
    
    // Prioridad 2: Stat semanal del turno específico
    if (weeklyA !== weeklyB) 
        return weeklyA - weeklyB;
    
    // Prioridad 3: Total clínico mensual
    if (statsA[secondaryStat] !== statsB[secondaryStat]) 
        return statsA[secondaryStat] - statsB[secondaryStat];
    
    // Prioridad 4: Random
    return Math.random() - 0.5;
});
```

### ¿Por qué falla?

1. **Prioridad incorrecta:** Stat mensual ANTES que stat semanal
   - Si varios nurses tienen mismo stat mensual (ej: todos 2 ADMIN este mes)
   - El stat semanal decide, pero al inicio de semana todos tienen 0
   - Random decide → Puede elegir la misma persona 3 veces seguidas

2. **Sin penalización por consecutividad:**
   - Si Ana tiene ADMIN lunes, puede volver a tenerlo martes y miércoles
   - No hay lógica "evitar mismo turno días seguidos"

3. **Sin total clínico semanal:**
   - Solo se mira el turno específico (ej: ADMIN semanal)
   - No se considera "¿cuántos turnos clínicos tiene esta semana en total?"

4. **Sin stats anuales:**
   - No hay equidad a largo plazo (365 días)
   - Un nurse que trabajó 30 ADMIN en 2025 no tiene desventaja en 2026

---

## SOLUCIÓN PROPUESTA: 3 MEJORAS CONCRETAS

### **MEJORA 1: Invertir Prioridad + Añadir Total Clínico Semanal**

**Nuevo orden de prioridad:**

```typescript
const sorted = [...candidates].sort((a, b) => {
    // NUEVO CRITERIO 1: Stat semanal del turno específico
    // → Previene que alguien domine un turno esta semana
    if (weeklyA !== weeklyB) 
        return weeklyA - weeklyB;
    
    // NUEVO CRITERIO 2: Total clínico semanal (suma de TODOS los turnos esta semana)
    // → Previene que alguien trabaje 5 días esta semana mientras otros 2
    const weeklyTotalA = calculateWeeklyClinicTotal(weeklyStats[a.id]);
    const weeklyTotalB = calculateWeeklyClinicTotal(weeklyStats[b.id]);
    if (weeklyTotalA !== weeklyTotalB) 
        return weeklyTotalA - weeklyTotalB;
    
    // CRITERIO 3: Stat mensual del turno específico
    // → Equidad mensual
    if (statsA[primaryStat] !== statsB[primaryStat]) 
        return statsA[primaryStat] - statsB[primaryStat];
    
    // CRITERIO 4: Total clínico mensual
    // → Equidad mensual global
    if (statsA.clinicalTotal !== statsB.clinicalTotal) 
        return statsA.clinicalTotal - statsB.clinicalTotal;
    
    // CRITERIO 5: Stat anual (NUEVO - ver Mejora 3)
    if (annualStats && annualStatsA[primaryStat] !== annualStatsB[primaryStat]) 
        return annualStatsA[primaryStat] - annualStatsB[primaryStat];
    
    // CRITERIO 6: Random (último recurso)
    return Math.random() - 0.5;
});
```

**Función auxiliar nueva:**
```typescript
const calculateWeeklyClinicTotal = (weeklyShiftStats: Record<WorkZone, number>): number => {
    return (weeklyShiftStats['URGENCES'] || 0) +
           (weeklyShiftStats['TRAVAIL'] || 0) +
           (weeklyShiftStats['URGENCES_TARDE'] || 0) +
           (weeklyShiftStats['TRAVAIL_TARDE'] || 0) +
           (weeklyShiftStats['ADMIN'] || 0) +
           (weeklyShiftStats['STRASBOURG'] || 0) +
           (weeklyShiftStats['VACCIN'] || 0);
};
```

---

### **MEJORA 2: Penalización por Consecutividad**

**Problema:** Ana tiene ADMIN lunes, martes, miércoles → Injusto

**Solución:** Tracking de "última fecha con este turno" y penalización

```typescript
// Nueva estructura de datos (añadir al loop del recalculateScheduleForMonth)
const lastAssignmentDate: Record<string, Record<WorkZone, number>> = {};
// Formato: lastAssignmentDate['nurse-1']['ADMIN'] = 5 (día del mes)

// Al ordenar candidatos, aplicar penalización:
const daysSinceLastAssignment = (nurseId: string, shift: WorkZone, currentDay: number) => {
    const lastDay = lastAssignmentDate[nurseId]?.[shift];
    if (!lastDay) return 999; // Nunca asignado este mes
    return currentDay - lastDay;
};

// MODIFICAR sorting para aplicar penalización ANTES del random:
const sorted = [...candidates].sort((a, b) => {
    // ... criterios 1-5 anteriores ...
    
    // NUEVO CRITERIO 6: Días desde última asignación de este turno
    // → Previene consecutividad (si trabajó ADMIN ayer, le penaliza)
    const daysA = daysSinceLastAssignment(a.id, targetShift, currentDay);
    const daysB = daysSinceLastAssignment(b.id, targetShift, currentDay);
    
    // Si uno trabajó este turno hace <3 días, penalizar
    const penaltyA = daysA < 3 ? 100 : 0;
    const penaltyB = daysB < 3 ? 100 : 0;
    
    if (penaltyA !== penaltyB) 
        return penaltyA - penaltyB; // Menor penalización primero
    
    // CRITERIO 7: Random (último recurso)
    return Math.random() - 0.5;
});

// Después de asignar, actualizar:
lastAssignmentDate[selectedNurse.id][assignedShift] = currentDay;
```

**Resultado:** Si Ana trabajó ADMIN lunes (día 4), el martes (día 5) tiene penalización +100, así que otros nurses con penalización 0 serán elegidos primero.

---

### **MEJORA 3: Stats Anuales (Equidad a Largo Plazo)**

**Problema:** Un nurse que trabajó 40 URGENCES en 2025 debería tener ventaja en 2026

**Solución:** Tracking anual persistente

#### 3.1. Añadir a `types.ts`:
```typescript
export interface AnnualStats {
    year: number;
    nurses: Record<string, NurseStats>; // Mismo formato que NurseStats mensual
}

export interface AppState {
    // ... campos existentes ...
    annualStats?: Record<string, AnnualStats>; // Key: '2026', '2027', etc.
}
```

#### 3.2. Persistir en Firebase:
```typescript
// Estructura en Firestore:
// /shared-data/zenova-2026/annualStats/2026
{
    year: 2026,
    nurses: {
        'nurse-1': { urgences: 45, travail: 30, admin: 50, ... },
        'nurse-2': { urgences: 48, travail: 32, admin: 45, ... },
        // ...
    }
}
```

#### 3.3. Actualizar en cada asignación:
```typescript
// Al final de recalculateScheduleForMonth, actualizar annualStats:
const updateAnnualStats = (
    annualStats: Record<string, AnnualStats>, 
    year: number, 
    monthlyStats: Record<string, NurseStats>
): Record<string, AnnualStats> => {
    const yearKey = String(year);
    if (!annualStats[yearKey]) {
        annualStats[yearKey] = { 
            year, 
            nurses: {} 
        };
    }
    
    // Sumar stats del mes a los anuales
    Object.entries(monthlyStats).forEach(([nurseId, stats]) => {
        if (!annualStats[yearKey].nurses[nurseId]) {
            annualStats[yearKey].nurses[nurseId] = { 
                urgences: 0, travail: 0, admin: 0, tw: 0, 
                clinicalTotal: 0, afternoon: 0, vaccin_am: 0, vaccin_pm: 0, tw_weekly: 0 
            };
        }
        
        const annual = annualStats[yearKey].nurses[nurseId];
        annual.urgences += stats.urgences;
        annual.travail += stats.travail;
        annual.admin += stats.admin;
        annual.tw += stats.tw;
        annual.clinicalTotal += stats.clinicalTotal;
        annual.afternoon += stats.afternoon;
        annual.vaccin_am += stats.vaccin_am;
        annual.vaccin_pm += stats.vaccin_pm;
    });
    
    return annualStats;
};
```

#### 3.4. Usar en findBestCandidateWithWeeklyEquity:
```typescript
// Añadir parámetro annualStats:
const findBestCandidateWithWeeklyEquity = (
    candidates: Nurse[], 
    stats: Record<string, NurseStats>, 
    weeklyShiftStats: Record<string, Record<WorkZone, number>>,
    targetShift: WorkZone,
    primaryStat: keyof NurseStats, 
    secondaryStat: keyof NurseStats = 'clinicalTotal',
    annualStats?: Record<string, NurseStats>, // NUEVO PARÁMETRO
    currentDay?: number, // NUEVO (para penalización consecutividad)
    lastAssignmentDate?: Record<string, Record<WorkZone, number>> // NUEVO
): Nurse | undefined => {
    // ... implementación con nuevos criterios ...
};
```

---

## IMPLEMENTACIÓN: ORDEN DE PRIORIDAD FINAL

### **Algoritmo Completo de Selección:**

```typescript
1. Filtrar candidatos inelegibles (jornada, ya asignado hoy, wish exclude validado)

2. Ordenar candidatos por:
   
   a) STAT SEMANAL del turno específico (weeklyShiftStats[nurseId][targetShift])
      → Quien menos ADMIN tenga esta semana
   
   b) TOTAL CLÍNICO SEMANAL (suma de todos los turnos esta semana)
      → Quien menos días haya trabajado esta semana
   
   c) STAT MENSUAL del turno específico (stats[nurseId][primaryStat])
      → Quien menos ADMIN tenga este mes
   
   d) TOTAL CLÍNICO MENSUAL (stats[nurseId].clinicalTotal)
      → Quien menos turnos clínicos tenga este mes
   
   e) STAT ANUAL del turno específico (annualStats[nurseId][primaryStat])
      → Quien menos ADMIN tenga este año
   
   f) DÍAS DESDE ÚLTIMA ASIGNACIÓN de este turno
      → Penalizar si trabajó este turno en últimos 2 días
   
   g) RANDOM (último recurso)

3. Seleccionar el primero de la lista ordenada

4. Actualizar:
   - weeklyShiftStats[nurseId][shift]++
   - stats[nurseId][primaryStat]++
   - stats[nurseId].clinicalTotal++
   - lastAssignmentDate[nurseId][shift] = currentDay
```

---

## EJEMPLO PRÁCTICO

### Escenario: Asignar ADMIN el miércoles 5 de marzo

**Candidatos:**
- Ana: ADMIN semanal=2, total semanal=3, ADMIN mensual=5, total mensual=12, ADMIN anual=30, último ADMIN=día 4 (ayer)
- Pedro: ADMIN semanal=0, total semanal=4, ADMIN mensual=4, total mensual=15, ADMIN anual=28, último ADMIN=día 1
- Luis: ADMIN semanal=0, total semanal=2, ADMIN mensual=6, total mensual=10, ADMIN anual=32, último ADMIN=nunca

**Ordenamiento:**

1. **ADMIN semanal:** Pedro=0, Luis=0, Ana=2 → Ana al final
2. **Total semanal** (entre Pedro y Luis): Luis=2, Pedro=4 → Luis primero
3. **No hace falta seguir:** Luis gana

**Resultado:** Luis recibe ADMIN

**Sin las mejoras:** Random entre Pedro y Luis → Podría elegir Pedro 3 veces seguidas

---

## VENTAJAS DE ESTA SOLUCIÓN

✅ **Equidad Semanal:** Prioriza quien menos ha trabajado esta semana
✅ **Equidad Mensual:** Considera stats mensuales como criterio secundario
✅ **Equidad Anual:** Balancea carga a largo plazo (365 días)
✅ **Previene Consecutividad:** Penaliza asignar mismo turno días seguidos
✅ **Determinista:** Menos dependencia del random → Resultados más predecibles
✅ **Flexible:** Se pueden ajustar pesos de cada criterio si es necesario

---

## CAMBIOS NECESARIOS EN EL CÓDIGO

### Archivos a modificar:

1. **types.ts:** Añadir `AnnualStats` interface y campo en `AppState`
2. **utils/scheduleUtils.ts:**
   - Modificar `findBestCandidateWithWeeklyEquity` (nuevos criterios)
   - Añadir `calculateWeeklyClinicTotal`
   - Añadir tracking de `lastAssignmentDate`
   - Añadir función `updateAnnualStats`
   - Modificar `recalculateScheduleForMonth` para usar todo esto
3. **App.tsx:** Cargar y guardar `annualStats` desde Firebase
4. **firebase/config.ts:** Documentar estructura de `annualStats`

### Testing recomendado:

1. Generar marzo 2026 con nueva lógica
2. Verificar que ningún nurse tiene 3+ días del mismo turno en semana
3. Verificar distribución mensual sigue siendo equitativa
4. Verificar que stats anuales se acumulan correctamente

---

## PRÓXIMOS PASOS

¿Quieres que implemente estas 3 mejoras?

**Orden sugerido:**
1. MEJORA 1 (invertir prioridad + total semanal) → Soluciona problema inmediato
2. MEJORA 2 (penalización consecutividad) → Previene rachas
3. MEJORA 3 (stats anuales) → Equidad largo plazo

O podemos empezar con las 3 a la vez si apruebas el plan completo.
