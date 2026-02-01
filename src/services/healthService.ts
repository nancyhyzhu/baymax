import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  limit 
} from "firebase/firestore";

const HEALTH_COLLECTION = "health_data";

export interface HealthReading {
  userId: string;
  timestamp: string; // ISO string for consistency
  data: {
    heartRate: number;
    breathing: number;
    mood: number;
  };
}

/**
 * Save a new health reading to Firestore
 */
export async function saveHealthReading(reading: HealthReading) {
  try {
    const docRef = await addDoc(collection(db, HEALTH_COLLECTION), reading);
    return docRef.id;
  } catch (error) {
    console.error("Error saving health reading:", error);
    throw error;
  }
}

/**
 * Fetch health readings for a specific user
 */
export async function getHealthReadings(userId: string, limitCount: number = 20): Promise<HealthReading[]> {
  try {
    const q = query(
      collection(db, HEALTH_COLLECTION),
      where("userId", "==", userId),
      // Removed orderBy to avoid index errors, we'll sort in memory
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const readings: HealthReading[] = [];
    
    querySnapshot.forEach((doc) => {
      readings.push(doc.data() as HealthReading);
    });

    // Sort ascending for chart display (chronological)
    return readings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.error("Error fetching health readings:", error);
    return [];
  }
}
