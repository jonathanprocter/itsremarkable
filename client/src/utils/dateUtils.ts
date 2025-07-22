export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const getWeekStartDate = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getWeekEndDate = (date: Date): Date => {
  const startDate = getWeekStartDate(date);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return endDate;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric'
  });
};

export const formatWeekRange = (startDate: Date, endDate: Date): string => {
  const weekNumber = getWeekNumber(startDate);
  const startFormat = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const endFormat = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  return `Week ${weekNumber} - ${startFormat} - ${endFormat}`;
};

export const generateWeekDays = (referenceDate: Date): any[] => {
  const startDate = getWeekStartDate(referenceDate);
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    days.push({
      date,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      dayNumber: date.getDate(),
      events: []
    });
  }
  
  return days;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const isInCurrentWeek = (date: Date, currentDate: Date): boolean => {
  const weekStart = getWeekStartDate(currentDate);
  const weekEnd = getWeekEndDate(currentDate);
  
  return date >= weekStart && date <= weekEnd;
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addWeeks = (date: Date, weeks: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + (weeks * 7));
  return result;
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
};

export const getDaysInMonth = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  // Add days from previous month to fill the first week
  const firstDayOfWeek = firstDay.getDay();
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));
  
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    days.push(currentDate);
  }
  
  return days;
};
