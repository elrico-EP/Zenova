# BACKUP - 28 de Febrero de 2026

## Estado Actual del Proyecto

### Problema Principal
Los cambios manuales de turnos **se guardan correctamente en Supabase** pero **desaparecen 1-3 segundos después** en la UI.

### Causa Identificada
1. `handleManualChange` → `updateDataWithUndo` → `updateData`
2. Se guarda en Supabase con `updatedAt: Date.now()`
3. El polling de 5s comienza a leer datos después de 2-3s
4. Si el polling trae una versión anterior (sin cambios recientes), sobrescribe el cambio local
5. Grace period de 5s intenta prevenir esto pero puede ser **insuficiente**

### Solución Parcial Implementada
- Grace period de 5-10 segundos después de guardar (depende de `lastLocalSaveRef`)
- Versioning: `updatedAt` timestamp en cada estado
- Guard: "Si versión remota < versión local, ignorar"
- Logging detallado para debug

### Archivos Modificados
1. **hooks/useSupabaseState.ts**
   - Polling cada 5s (antes 3s)
   - Grace period: 5-10s después de guardar
   - Logging: `⏸️ [Polling] Esperando...`
   - Flag: `isSavingRef` para pausar polling durante guardado

2. **App.tsx**
   - `applyManualOverrides`: Aplica cambios sobre base automática
   - `currentSchedule`: baseOverrides → manualOverrides (prioridad correcta)
   - `handleManualChange`: Usa `updateDataWithUndo`

3. **utils/scheduleUtils.ts**
   - Eliminada la aplicación interna de `manualOverrides`
   - Solo genera horario base automático
   - Modificaciones de jornada aplicadas a todo

4. **types.ts**
   - Añadido campo `updatedAt?: number` al AppState

### Prueba Manual Recomendada
1. Abrir navegador único (sin multi-browser por ahora)
2. Cambiar un turno
3. Observar consola:
   - `✅ Guardado exitoso en Supabase`
   - `⏸️ [Polling] Esperando después de guardado...`
   - Esperar 10 segundos
   - `🔍 [Polling] Versiones iguales`
4. Verificar que el cambio persiste

### Build Hash Actual
`index-Pqo6ylI_.js`

### Próximos Pasos Sugeridos
1. **CRÍTICO**: Aumentar grace period a 15-20 segundos si persiste problema
2. **O**: Desactivar polling completamente si Real-time está activo
3. **O**: Usar CRDTs (Conflict-free Replicated Data Types) para fusionar cambios
4. **Verificar**: Si `isSavingRef.current` está siendo bien setteda/cleareada

### Notas de Debug
- Firefox bloquea localStorage con "Tracking Prevention"
- Real-time PostgreSQL SUBSCRIBED, pero sin eventos recibidos
- Broadcast parece no funcionar (payload.payload complejo)
- Polling es mecanismo de respaldo muy importante
