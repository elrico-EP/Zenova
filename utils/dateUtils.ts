const getISOWeekInfo = (date: Date): { year: number; week: number } => {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);

    const isoYear = d.getUTCFullYear();
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return { year: isoYear, week };
};

export const getWeekIdentifier = (date: Date): string => {
    const { year, week } = getISOWeekInfo(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
};

export const getDateOfWeek = (weekId: string): Date => {
    const [yearStr, weekStr] = weekId.split('-W');
    const year = parseInt(yearStr, 10);
    const weekNumber = parseInt(weekStr, 10);

    // Create a date for Jan 4th of the year. Jan 4th is always in week 1.
    const jan4 = new Date(year, 0, 4);
    // Get the day of the week (0=Sun, 1=Mon...). Adjust Sunday to be 7.
    const dayOfWeek = jan4.getDay() || 7;
    // Go back to the previous Monday.
    jan4.setDate(jan4.getDate() - dayOfWeek + 1);
    
    // Add the number of weeks (in milliseconds) to the first Monday.
    // (weekNumber - 1) because we're already on week 1.
    const targetDate = new Date(jan4.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);

    return targetDate;
};


export interface WeekInfo {
    id: string;
    label: string;
    startDay: number;
    endDay: number;
}

export const getWeeksInMonth = (date: Date): WeekInfo[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const weeks: { [key: string]: { start: number, end: number } } = {};

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const weekId = getWeekIdentifier(currentDate);
        if (!weeks[weekId]) {
            weeks[weekId] = { start: day, end: day };
        } else {
            weeks[weekId].end = day;
        }
    }

    return Object.entries(weeks).map(([id, { start, end }]) => ({
        id,
        label: `${start} - ${end}`,
        startDay: start,
        endDay: end
    }));
};

export const getWeeksOfYear = (year: number): WeekInfo[] => {
    const weeksMap = new Map<string, {start: Date, end: Date}>();
    const date = new Date(year, 0, 1);

    // Iterate through the entire year
    while(date.getFullYear() === year) {
        const weekId = getWeekIdentifier(date);

        if(!weeksMap.has(weekId)) {
            weeksMap.set(weekId, { start: new Date(date.getTime()), end: new Date(date.getTime()) });
        } else {
            weeksMap.get(weekId)!.end = new Date(date.getTime());
        }
        date.setDate(date.getDate() + 1);
    }
    
    const weeks: WeekInfo[] = [];
    weeksMap.forEach((value, key) => {
        weeks.push({
            id: key,
            label: `${value.start.getDate()}/${value.start.getMonth() + 1} - ${value.end.getDate()}/${value.end.getMonth() + 1}`,
            startDay: value.start.getDate(),
            endDay: value.end.getDate()
        });
    });

    return weeks.sort((a,b) => a.id.localeCompare(b.id));
}

// Get all dates for a month organized by weeks (no cross-month bleeding)
// Returns ONLY days within the month, but preserves week row structure for UI display
export const getWeeksForMonth = (year: number, month: number): Date[] => {
    const grid: Date[] = [];
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    // Start from the first day of the month (no retroceding)
    for (let d = new Date(firstDayOfMonth); d <= lastDayOfMonth; d.setUTCDate(d.getUTCDate() + 1)) {
        grid.push(new Date(d));
    }

    return grid;
}