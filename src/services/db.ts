import { supabase } from '../lib/supabase';

export interface Reading {
  id: number;
  userId: string;
  timestamp: Date;
  heartRate: number;
  breathing: number;
  mood: string;
}

export const getReadings = async (userId: string, days: number = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching readings:', error);
    return [];
  }

  // Transform keys to match frontend expectation (camelCase)
  return data.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    timestamp: new Date(r.timestamp), // Convert string to Date object for frontend
    heartRate: r.heart_rate,
    breathing: r.breathing,
    mood: r.mood
  })) as Reading[];
};

export const getTodaySession = async (userId: string) => {
  const start = new Date();
  start.setHours(0,0,0,0);

  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('user_id', userId)
    .gte('timestamp', start.toISOString())
    .order('timestamp', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const r = data[0];
  return {
    id: r.id,
    userId: r.user_id,
    timestamp: new Date(r.timestamp),
    heartRate: r.heart_rate,
    breathing: r.breathing,
    mood: r.mood
  } as Reading;
};
