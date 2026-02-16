
import { 
  format, 
  addDays, 
  subDays, 
  differenceInDays, 
  parseISO, 
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isValid,
  startOfToday
} from 'date-fns';
import { UserSettings, DayLog, CycleStats, CyclePhaseType } from '../types';

export const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const getCalendarDays = (currentDate: Date) => {
  const start = startOfWeek(startOfMonth(currentDate));
  const end = endOfWeek(endOfMonth(currentDate));
  return eachDayOfInterval({ start, end });
};

export const getCyclePhase = (dayOfCycle: number, stats: CycleStats): CyclePhaseType => {
  const { avgPeriodLength, avgCycleLength } = stats;
  
  if (dayOfCycle <= avgPeriodLength) return 'menstrual';
  
  // Ovulação geralmente ocorre 14 dias antes do próximo ciclo
  const ovulationDay = avgCycleLength - 14;
  
  if (dayOfCycle < ovulationDay - 2) return 'folicular';
  if (dayOfCycle <= ovulationDay + 1) return 'ovulatoria';
  return 'lutea';
};

export const calculateCycleStats = (logs: Record<string, DayLog>, settings?: UserSettings): CycleStats => {
  const periodDays = Object.values(logs)
    .filter(log => log.isPeriod)
    .sort((a, b) => a.date.localeCompare(b.date));

  let avgCycleLength = settings?.avgCycleLength || 28;
  let avgPeriodLength = settings?.avgPeriodLength || 5;
  let lastPeriodStart = settings?.lastPeriodStartManual || null;

  if (periodDays.length > 0) {
    const periods: string[][] = [];
    let currentPeriod: string[] = [];

    for (let i = 0; i < periodDays.length; i++) {
      const current = parseISO(periodDays[i].date);
      const prev = i > 0 ? parseISO(periodDays[i - 1].date) : null;

      if (prev && differenceInDays(current, prev) === 1) {
        currentPeriod.push(periodDays[i].date);
      } else {
        if (currentPeriod.length > 0) periods.push(currentPeriod);
        currentPeriod = [periodDays[i].date];
      }
    }
    if (currentPeriod.length > 0) periods.push(currentPeriod);

    if (periods.length > 1) {
      const cycleIntervals = [];
      for (let i = 1; i < periods.length; i++) {
        cycleIntervals.push(differenceInDays(parseISO(periods[i][0]), parseISO(periods[i - 1][0])));
      }
      avgCycleLength = Math.round(cycleIntervals.reduce((a, b) => a + b, 0) / cycleIntervals.length);
    }
    
    avgPeriodLength = Math.round(periods.reduce((acc, p) => acc + p.length, 0) / periods.length);
    lastPeriodStart = periods[periods.length - 1][0];
  }

  if (!lastPeriodStart || !isValid(parseISO(lastPeriodStart))) {
    return {
      avgCycleLength,
      avgPeriodLength,
      lastPeriodStart: null,
      nextPeriodDate: null,
      ovulationDate: null,
      fertileWindow: [],
      currentDayOfCycle: null
    };
  }

  const nextPeriodDate = formatDate(addDays(parseISO(lastPeriodStart), avgCycleLength));
  const ovulationDateObj = subDays(parseISO(nextPeriodDate), 14);
  const ovulationDate = formatDate(ovulationDateObj);
  
  const fertileWindow = [];
  for (let i = -3; i <= 1; i++) {
    fertileWindow.push(formatDate(addDays(ovulationDateObj, i)));
  }

  const currentDayOfCycle = differenceInDays(startOfToday(), parseISO(lastPeriodStart)) + 1;

  return {
    avgCycleLength,
    avgPeriodLength,
    lastPeriodStart,
    nextPeriodDate,
    ovulationDate,
    fertileWindow,
    currentDayOfCycle: currentDayOfCycle > 0 ? ((currentDayOfCycle - 1) % avgCycleLength) + 1 : null
  };
};
