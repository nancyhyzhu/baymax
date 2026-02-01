import { saveHealthReading, HealthReading } from "../services/healthService";

/**
 * Seeds sample health data for a user if they have no data.
 * Generates 7 days of historical readings.
 */
export async function seedSampleHealthData(userId: string) {
  console.log(`[Seed] Generating 7 days of sample data for user: ${userId}`);
  
  const now = new Date();
  const readings: HealthReading[] = [];

  for (let i = 6; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - i);
    
    // Generate realistic sample values
    const hrBase = 75;
    const brBase = 18;
    const moodBase = 7;

    const entry: HealthReading = {
      userId,
      timestamp: timestamp.toISOString(),
      data: {
        heartRate: Math.round(hrBase + (Math.random() - 0.5) * 15),
        breathing: Math.round(brBase + (Math.random() - 0.5) * 4),
        mood: Math.round(moodBase + (Math.random() - 0.5) * 2)
      }
    };
    
    readings.push(entry);
  }

  // Save all readings to Firestore
  try {
    const promises = readings.map(r => saveHealthReading(r));
    await Promise.all(promises);
    console.log("[Seed] Sample data successfully seeded.");
    return readings; // Return generated data for immediate use
  } catch (error) {
    console.error("[Seed] Error seeding sample data:", error);
    return [];
  }
}
