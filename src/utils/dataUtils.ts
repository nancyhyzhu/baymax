export type DataPoint = {
  time: string; // Label for X-axis (e.g., "Mon", "10:00")
  value: number;
  min?: number;
  max?: number;
  status?: 'typical' | 'atypical';
};

export const generateWeeklyData = (baseValue: number, variance: number): DataPoint[] => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => {
    const val = baseValue + (Math.random() - 0.5) * variance;
    return {
      time: day,
      value: Math.round(val),
      status: 'typical'
    };
  });
};

export const generateMonthlyData = (baseValue: number, variance: number): DataPoint[] => {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  return weeks.map(week => {
    const val = baseValue + (Math.random() - 0.5) * variance;
    return {
      time: week,
      value: Math.round(val),
      status: 'typical'
    };
  });
};

export const checkAtypical = (current: number, min: number, max: number): boolean => {
  return current < min || current > max;
};
