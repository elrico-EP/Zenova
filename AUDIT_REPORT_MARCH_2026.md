# COMPREHENSIVE HOUR CALCULATION AUDIT - MARCH 2026
## All Nurse Issues Before Code Changes

**Current Date**: March 9, 2026  
**Review Date**: Pre-implementation audit  
**Status**: Ready for collaborative review

---

## EXECUTIVE SUMMARY

Five critical bugs identified in the hour-calculation system, affecting 5 of 11 nurses in March 2026:

| Bug | Location | Impact | Affected Nurses |
|-----|----------|--------|-----------------|
| **#1** | CS not in absence list | CS shifts return 0h instead of theoretical | Potentially all |
| **#2** | STRASBOURG bypasses jornada | Reduced-jornada nurses get full 10h on Strasbourg days | Elena, Katelijn, Paola |
| **#3** | RECUP bypasses jornada | RECUP discounts full baseline instead of reduced baseline | Tanja, Virginie, Katelijn |
| **#4** | Absence forced hours ignore jornada | Forced 8.5/6h for sick/closed days without reduction | All reduced-jornada nurses |
| **#5** | Month-boundary proportional mismatch | Theoretical ≠ Actual when weeks span two months | All nurses in boundary weeks |

---

## DETAILED BUG DOCUMENTATION

### BUG #1: CS (Conge Special) Not in Absence List

**Code Location**: `hoursUtils.ts` line 113 + `PersonalAgendaModal.tsx` line 496

**Current Behavior**:
- Absence check only includes: CA, SICK_LEAVE, FP
- CS falls through to shift parsing logic
- CS typically has no shift type → returns 0h

**Impact**: Any nurse with CS on a scheduled workday returns 0h instead of 8.5/6h theoretical

**Code Details**:
```typescript
// hoursUtils.ts line 113 (BUGGY)
if (shifts.length > 0 && ['CA', 'SICK_LEAVE', 'FP'].includes(shifts[0])) {
    return calculateNurseTheoreticalHoursForDay(nurse, date, agenda, jornadasLaborales);
}
// CS not included! Falls through, returns 0h

// PersonalAgendaModal.tsx line 496 (BUGGY)
const isSickDay = shifts.includes('SICK_LEAVE');
// CS not checked! Forced absence hours bypassed
```

**Fix Required**: Add CS to both locations

---

### BUG #2: STRASBOURG Bypasses Jornada Reduction

**Code Location**: `hoursUtils.ts` lines 122-124

**Current Behavior**:
- If shift includes 'STRASBOURG', returns 10h (Mon-Thu) immediately
- No jornada reduction applied before return
- Happens BEFORE jornada reduction logic (line 241)

**Impact**: Reduced-jornada nurses get full 10h on Strasbourg days instead of reduced amount

**Code Details**:
```typescript
// hoursUtils.ts lines 122-124 (BUGGY)
if (shifts.includes('STRASBOURG')) {
    return (dayOfWeek >= 1 && dayOfWeek <= 4) ? 10.0 : 0;  // Early return, no reduction!
}
// This happens BEFORE jornada reduction on line 241
```

**Example - KATELIJN Monday March 9 (Strasbourg + END_SHIFT_4H Monday)**:
- Configuration: 90% reduction, END_SHIFT_4H on Mondays (should give 6h net)
- Current: Returns 10h (Strasbourg bypass)
- Expected: Should apply END_SHIFT_4H first → 6h net, not 10h

**Example - ELENA Tuesday March 10 (Strasbourg + FRIDAY_PLUS_EXTRA Tuesday -1.5h)**:
- Configuration: 80% reduction, FRIDAY_PLUS_EXTRA (Friday OFF, Tuesday -1.5h)
- Current: Returns 10h (Strasbourg bypass)
- Expected: Should apply Tuesday -1.5h → 8.5h net, not 10h

**Fix Required**: Apply jornada reduction BEFORE returning for Strasbourg

---

### BUG #3: RECUP Bypasses Jornada Reduction

**Code Location**: `hoursUtils.ts` lines 220-233 and 237-239

**Current Behavior**:
- RECUP calculates baseHours as negative value: -(8.5 or 6)
- Line 237-239 explicitly states: "RECUP bypasses jornada reductions and returned as-is"
- Returns -8.5 for Mon-Thu or -6 for Friday, regardless of jornada

**Impact**: RECUP discounts from full baseline, not reduced baseline

**Code Details**:
```typescript
// hoursUtils.ts lines 220-233 (BUGGY)
else if (primaryShift === 'RECUP') {
    const dayOfWeekForRecup = date.getUTCDay();
    if (dayOfWeekForRecup >= 1 && dayOfWeekForRecup <= 5) {
        baseHours = -(dayOfWeekForRecup === 5 ? 6.0 : 8.5); // Full baseline, no reduction!
    }
}

// hoursUtils.ts lines 237-239 (BUGGY)
if (baseHours < 0) {
    return baseHours;  // Explicitly bypass reduction!
}
```

**Example - KATELIJN RECUP on Monday (normally 6h reduced)**:
- Configuration: 90% END_SHIFT_4H Monday = 6h net
- RECUP on Monday: Expected discount = -6h
- Current: Returns -8.5h (full Monday baseline, no reduction)
- Result: Monthly balance is 2.5h worse than expected

**Example - VIRGINIE RECUP on Wednesday (normally 7.5h reduced)**:
- Configuration: 90% LEAVE_EARLY_1H Wed = 7.5h net (8.5-1)
- RECUP on Wednesday: Expected discount = -7.5h
- Current: Returns -8.5h (full Wednesday baseline)
- Result: Monthly balance is 1h worse than expected

**Fix Required**: Apply jornada reduction to RECUP discount calculation

---

### BUG #4: Absence Forced Hours Ignore Jornada Reduction

**Code Location**: `PersonalAgendaModal.tsx` lines 500-506

**Current Behavior**:
- When CLOSED/holiday/sick-day detected, forces daily hours to 8.5 or 6
- This happens BEFORE any jornada lookup or reduction
- No jornada reduction applied to forced hours

**Impact**: On special days (CLOSED, holiday), reduced-jornada nurses get full hours instead of reduced

**Code Details**:
```typescript
// PersonalAgendaModal.tsx lines 500-506 (BUGGY)
} else if (activityLevel === 'CLOSED' || isHoliday || isSickDay) {
    if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Mon-Thu
        dailyHours = 8.5;  // No jornada reduction applied!
    } else if (dayOfWeek === 5) { // Fri
        dailyHours = 6.0;  // Same issue
    }
}
```

**Also interacts with BUG #1**: SICK_DAY detection only checks SICK_LEAVE, missing CS:
```typescript
// PersonalAgendaModal.tsx line 496 (BUGGY)
const isSickDay = shifts.includes('SICK_LEAVE');  // CS not checked!
```

**Example - PAOLA Monday (holiday or CLOSED, normally OFF due to FULL_DAY_OFF)**:
- Configuration: 80% FULL_DAY_OFF Monday = 0h
- If Monday is CLOSED or holiday: Currently forced to 8.5h
- Expected: Should respect FULL_DAY_OFF = 0h
- Result: +8.5h incorrectly added

**Example - KATELIJN Monday (reduced to 6h, day is CLOSED)**:
- Configuration: 90% END_SHIFT_4H Monday = 6h
- If Monday is CLOSED: Currently forced to 8.5h
- Expected: Should apply reduction = 6h
- Result: +2.5h error

**Fix Required**: Apply jornada reduction after forced-hours assignment

---

### BUG #5: Month-Boundary Proportional Calculation Mismatch

**Code Location**: `PersonalAgendaModal.tsx` lines 461 vs 479-514

**Current Behavior**:
- Week theoretical hours calculated based on `inMonthWeekDates` (days IN current month only)
- Week actual hours calculated from `weekDates.forEach` loop (all 7 days, including dates outside month)
- Mismatch: Proportional baseline ≠ aggregation grid

**Example - Last Week of March (March 30-31 only, but grid includes earlier Feb dates)**:

*Incorrect calculation in PersonalAgendaModal*:
```typescript
// Line 461-472: Calculate theoretical for in-month days only
const inMonthWeekDates = weekDates.filter((d): d is Date => !!d && d.getUTCMonth() === month);
const weekdaysInMonth = inMonthWeekDates.filter(date => {
    const dayOfWeek = date.getUTCDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5;
}).length;  // = 2 for March 30-31 (Tue-Wed)

const weekTheoreticalFixed = (weekdaysInMonth / 5) * weekTheoreticalBase;  // = (2/5) * 40 = 16h

// Line 479-514: Calculate actual for ALL dates in grid
weekDates.forEach(date => {  // <-- Includes dates OUTSIDE March!
    const dailyHours = calculateHoursForDay(...);
    weekRealTotal += dailyHours;
});
```

**Impact**: When weeks span month boundaries, theoretical baseline doesn't match aggregation grid size

**Affected Weeks in March**:
- **W14 (March 30-31)**: Only 2 days in March
  - Theoretical = (2/5) × 40 = 16h ✓
  - But if grid includes Mon-Fri April 1-5: Actual could include those days ✗

**Fix Required**: Align calendarGrid aggregation to match in-month filtering for theoretical

---

## NURSE-BY-NURSE IMPACT ANALYSIS

### NURSE-1: ELVIO (100% baseline)
**Jornada**: None (100%)  
**Known Issues**: None  
**Impact in March**:
- Assigned Strasbourg W11 (March 9-15)
- Bug #2 doesn't affect (no jornada to bypass)
- Bug #4 doesn't affect (no reduced jornada)
- Bug #5: Potential low impact (week boundaries don't affect 100% baseline)

**Status**: ✓ NO CRITICAL ISSUES

---

### NURSE-2: TANJA (90% END_SHIFT_4H Wednesday)
**Jornada**: 90%, END_SHIFT_4H Wednesday  
**Configuration Details**:
- Reductions: [March 4, 11, 18, 25] → Wednesday -3h (6h net instead of 8.5h)
- Not in Strasbourg week
- No RECUP assignments known

**Known Issues**:
- Bug #1: If CS appears → 0h instead of theoretical
- Bug #3: If RECUP on Wednesday → -8.5h instead of -7.5h
- Bug #4: If Wednesday is CLOSED → 8.5h instead of 6h
- Bug #5: March 4 is end of W09, March 25 is mid-W13

**March Impact**:
- Expected theoretical: ~156.5h (21 days - 3 Wednesdays × 2.5h)
- Bug #3 risk: RECUP on any Wednesday would overcharge by 1h
- Bug #4 risk: CLOSED Wednesday would overcharge by 2.5h

**Status**: ⚠️ MODERATE RISK (bugs #3, #4)

---

### NURSE-3: VIRGINIE (90% LEAVE_EARLY_1H_L_J Mon-Thu)
**Jornada**: 90%, LEAVE_EARLY_1H_L_J (Mon-Thu -1h, Fri standard)  
**Configuration Details**:
- Reductions: All Mon-Thu × 16 = -1h each (7.5h net instead of 8.5h)
- 5 Fridays × 6h = 30h
- Not in Strasbourg week
- No RECUP assignments known

**Known Issues**:
- Bug #1: If CS appears → 0h instead of theoretical
- Bug #3: If RECUP on any Mon-Thu → -8.5h instead of -7.5h
- Bug #4: If Mon-Thu is CLOSED → 8.5h instead of 7.5h
- Bug #5: Neutral (consistent throughout month)

**March Impact**:
- Expected theoretical: ~150h (16×7.5 + 5×6)
- Bug #3 risk: RECUP on any Mon-Thu would overcharge by 1h
- Bug #4 risk: CLOSED Mon-Thu would overcharge by 1h

**Status**: ⚠️ MODERATE RISK (bugs #3, #4)

---

### NURSE-4: PAOLA (80% FULL_DAY_OFF Monday)
**Jornada**: 80%, FULL_DAY_OFF Monday  
**Configuration Details**:
- Mondays: 5 days OFF (0h)
- Tue-Fri: 16 days standard, but Fridays reduced
- **W11 (March 9-15) - Strasbourg assigned**
  - Monday March 9: OFF (jornada) - should be 0h
  - Tue-Thu March 10-12: STRASBOURG - currently 10h each
  - Friday March 13: STR-PREP - varies

**Known Issues**:
- Bug #1: If CS appears → 0h instead of theoretical
- **Bug #2 CRITICAL**: Monday March 9 is Strasbourg + Monday OFF
  - Currently: Strasbourg returns 10h early (before jornada check)
  - Expected: FULL_DAY_OFF takes precedence → 0h
  - ⚠️ Error: +10h on March 9
- **Bug #4**: If Monday is also CLOSED → Forced 8.5h instead of respecting OFF = 0h
- **Bug #5**: March 14 (Fri) is end of W11; March 15 beyond month but part of Strasbourg week

**March Impact**:
- Expected theoretical: ~126h (3 Strasbourg × 10h + 1 Strasbourg prep + 12×8.5 other days + 4 Fridays × 6)
- **Bug #2 causes: +10h error on March 9**
- Bug #4 risk: If any Monday is CLOSED → +8.5h error
- Current reported balance: Likely 10h HIGHER than actual (Bug #2 artifact)

**Status**: 🔴 CRITICAL - March 9 Strasbourg/Monday conflict

---

### NURSE-5: ELENA (80% FRIDAY_PLUS_EXTRA Mar 1-Sep 30)
**Jornada**: 80%, FRIDAY_PLUS_EXTRA (Friday OFF, Tuesday -1.5h)  
**Configuration Details**:
- **Jornada STARTS March 1** (exactly month boundary!)
- Fridays: 4 days OFF (0h)
- Tuesdays: 5 days reduced -1.5h (7h net instead of 8.5h)
- **W11 (March 9-15) - Strasbourg assigned**
  - Monday March 9: 8.5h
  - **Tuesday March 10: STRASBOURG (10h) - but also Tuesday reduction day**
  - Wed-Thu March 11-12: STRASBOURG 10h each
  - **Friday March 13: OFF (jornada) - but W11 ends Friday (Strasbourg week)**

**Known Issues**:
- Bug #1: If CS appears → 0h instead of theoretical
- **Bug #2 CRITICAL**: Tuesday March 10 is Strasbourg + Tuesday -1.5h reduction
  - Currently: Strasbourg returns 10h early (bypasses Tuesday -1.5h)
  - Expected: Apply Tuesday -1.5h → 8.5h net (or 7h with reduction), but Strasbourg might be exempt
  - Question: Is Strasbourg exempt from secondary reductions? (Likely yes, but bypass is wrong first)
- **Bug #2 CRITICAL**: Friday March 13 is Strasbourg prep + Friday OFF
  - Currently: Strasbourg returns hours (unclear if 10h or prep hours)
  - Expected: FRIDAY_PLUS_EXTRA OFF takes precedence → 0h
- **Bug #4**: If any Tuesday is CLOSED → Forced 8.5h instead of 7h
- **Bug #5 CRITICAL**: Jornada starts exactly March 1
  - First week (W10: Feb 28 - Mar 1): Includes Feb dates
  - Theoretical calculated for weeks, but reduction only valid from March 1
  - Grid might include Feb 28 (Saturday) but proportional calculation assumes March only

**March Impact**:
- Expected theoretical: ~137h (12×8.5 + 5×7h + 0 Fridays)
- **Bug #2 causes: Unknown overcharge on March 10 and March 13 (Strasbourg conflicts)**
- Bug #5 risk: First week proportional calculation may be incorrect (Feb/Mar boundary)
- Reported likely: Higher balance due to Bug #2 Strasbourg bypass + unclear secondary reduction

**Status**: 🔴 CRITICAL - Multiple Strasbourg conflicts

---

### NURSE-6: MIGUEL (100% baseline)
**Jornada**: None (100%)  
**Configuration Details**:
- No reductions
- **W11 (March 9-15) - Strasbourg assigned**
  - Mon-Thu: 10h each (STRASBOURG fixed)
  - Friday: STR-PREP or 0h

**Known Issues**: None related to jornada  
**Associated Items**:
- Bug #5: Potential week boundary effects (neutral, no jornada)

**March Impact**:
- Expected: ~168h (standard 100% baseline)
- Strasbourg accounts for ~40h of that
- No calculation errors expected

**Status**: ✓ NO CRITICAL ISSUES

---

### NURSE-7: GORKA (100% baseline)
**Jornada**: None (100%)  
**Configuration Details**:
- No reductions
- Not assigned to Strasbourg W11

**Known Issues**: None  
**March Impact**:
- Expected: ~168h (standard 100% baseline)

**Status**: ✓ NO CRITICAL ISSUES

---

### NURSE-8: KATELIJN (90% END_SHIFT_4H Monday, active until June 30)
**Jornada**: 90%, END_SHIFT_4H Monday (active Mar 1 - Jun 30)  
**Configuration Details**:
- Mondays: 5 days reduced -3h (6h net instead of 8.5h)
- Other days: 8.5h (except Friday 6h)
- **W11 (March 9-15) - Strasbourg assigned**
  - **Monday March 9: BOTH Strasbourg AND Monday reduction day**
  - Tue-Thu March 10-12: STRASBOURG 10h each
  - Friday March 13: STR-PREP

**Known Issues**:
- Bug #1: If CS appears → 0h instead of theoretical
- **Bug #2 CRITICAL**: Monday March 9 is Strasbourg + END_SHIFT_4H Monday
  - Currently: Strasbourg returns 10h early (bypasses Monday END_SHIFT_4H reduction)
  - Expected: END_SHIFT_4H applies first → 6h net, not 10h
  - ⚠️ Error: +4h on March 9
- **Bug #3**: If any Monday has RECUP → -8.5h instead of -6h (overcharge by 2.5h)
- Bug #4: If Monday CLOSED → forced 8.5h instead of 6h (overcharge by 2.5h)
- **Bug #5**: March is mid-reduction window but no current-month boundary for Katelijn itself

**March Impact**:
- Expected theoretical: ~156h (5×6 Monday + 12×8.5 other Mon-Thu + 4×6 Friday)
- **Bug #2 causes: +4h error on March 9** (matches user report about missing hours!)
- Bug #3 risk: RECUP on any Monday would add +2.5h error on top
- Current reported balance: Likely 4h HIGHER than actual (Bug #2 artifact)

**Status**: 🔴 CRITICAL - March 9 Strasbourg/Monday conflict

---

### NURSE-9: JOSEPH (100% baseline)
**Jornada**: None (100%)  
**Configuration Details**:
- No reductions
- **W11 (March 9-15) - Strasbourg assigned**
  - Mon-Thu: 10h each
  - Friday: STR-PREP

**Known Issues**: None related to jornada  
**March Impact**:
- Expected: ~168h (standard 100% baseline)  
- Strasbourg accounts for ~40h

**Status**: ✓ NO CRITICAL ISSUES

---

### NURSE-10: TATIANA (100% baseline)
**Jornada**: None (100%)  
**Configuration Details**:
- No reductions
- Not assigned to Strasbourg W11

**Known Issues**: None  
**March Impact**:
- Expected: ~168h

**Status**: ✓ NO CRITICAL ISSUES

---

### NURSE-11: TRAINEE (100% baseline, between cycles)
**Jornada**: None (100%)  
**Configuration Details**:
- No jornada reduction
- Oct 2025-Feb 2026 cycle ended
- Mar-Sep 2026 cycle available but not auto-active

**Known Issues**: None related to March (if not manually assigned)  
**Status**: ✓ Default not active in March (no issues)

---

## SUMMARY BY SEVERITY

### 🔴 CRITICAL (Immediate verification needed)

1. **KATELIJN (nurse-8)**: March 9 Strasbourg + Monday reduction (+4h error expected)
2. **PAOLA (nurse-4)**: March 9 Strasbourg + Monday OFF (+10h error expected)  
3. **ELENA (nurse-5)**: March 10 & 13 Strasbourg conflicts with FRIDAY_PLUS_EXTRA (unknown error)

### ⚠️ MODERATE (Additional problems if conditions met)

4. **TANJA (nurse-2)**: RECUP/CLOSED on Wednesdays would compound errors
5. **VIRGINIE (nurse-3)**: RECUP/CLOSED on Mon-Thu would add errors

### ✓ NO ISSUES

- Elvio, Miguel, Gorka, Joseph, Tatiana (100% baseline, Strasbourg doesn't bypass)
- Trainee (not active in March by default)

---

## VALIDATION CHECKLIST

Before implementing fixes, verify:

- [ ] **User confirms**: March 9 balance discrepancies for Katelijn & Paola match +4h / +10h predictions
- [ ] **User confirms**: Elena March 10 & 13 balance issues
- [ ] **Review findings**: Do any other hidden CS/RECUP/CLOSED events occur in March?
- [ ] **Review findings**: Are there other months with similar Strasbourg conflicts?
- [ ] **Access live data**: Pull actual Personal Agenda balances for affected nurses to cross-check predictions

---

## NEXT STEPS (After User Validation)

1. Fix Bug #1: Add CS to absence list (2 files)
2. Fix Bug #2: Apply jornada before Strasbourg return (1 file)
3. Fix Bug #3: Apply jornada to RECUP discount (1 file)
4. Fix Bug #4: Apply jornada after forced hours (1 file)
5. Fix Bug #5: Align month-boundary proportional calculation (1 file)
6. Test: Re-validate all nurses' March balances post-fix
7. Investigate: Check other months for similar patterns

---
