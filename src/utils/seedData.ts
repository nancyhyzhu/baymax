import { supabase } from '../lib/supabase';

export const seedDatabase = async (userId: string, email: string) => {
  // 1. Create User Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      name: email.split('@')[0],
      age: 25,
      height: "5'9\"",
      weight: "150 lbs",
      sex: "Other",
      conditions: "None",
      medications: "None",
      caretaker_name: "Emergency Contact",
      caretaker_phone: "555-0000"
    });

  if (profileError) console.error('Error creating profile:', profileError);

  // 2. Generate 30 days of readings (Mock History)
  const now = new Date();
  const readings = [];

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(14 + Math.random() * 4, Math.random() * 60);

    const hr = 60 + Math.random() * 40;
    const breathing = 12 + Math.random() * 8;
    const moods = ['happy', 'neutral', 'anxious', 'neutral', 'neutral'];
    const mood = moods[Math.floor(Math.random() * moods.length)];

    readings.push({
      user_id: userId,
      timestamp: date.toISOString(),
      heart_rate: Math.round(hr),
      breathing: Math.round(breathing),
      mood: mood
    });
  }

  const { error: readingsError } = await supabase
    .from('readings')
    .insert(readings);
    
  if (readingsError) console.error('Error seeding data:', readingsError);
  else console.log("Database seeded for user:", userId);
};
