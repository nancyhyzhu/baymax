import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  limit,
  orderBy,
  Timestamp
} from "firebase/firestore";

const HEALTH_COLLECTION = "health_data";
const ANALYTICS_COLLECTION = "analytics_sessions";

export interface HealthReading {
  userId: string;
  timestamp: string; // ISO string for consistency
  data: {
    heartRate: number;
    breathing: number;
    mood: number;
  };
}

export interface AnalyticsSession {
  processedAt: Timestamp;
  breathing: {
    average: number;
    max: number;
    min: number;
  };
  pulse: {
    average: number;
    max: number;
    min: number;
  };
  sessionId: string;
  sessionInfo: {
    dataPoints: number;
    startedAt: Timestamp;
    endedAt: Timestamp;
  }
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
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const readings: HealthReading[] = [];
    
    querySnapshot.forEach((doc) => {
      readings.push(doc.data() as HealthReading);
    });

    return readings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.error("Error fetching health readings:", error);
    return [];
  }
}

/**
 * Fetch all health readings for a user (no limit)
 */
export async function getAllHealthReadings(userId: string): Promise<HealthReading[]> {
  try {
    const q = query(
      collection(db, HEALTH_COLLECTION),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const readings: HealthReading[] = [];
    
    querySnapshot.forEach((doc) => {
      readings.push(doc.data() as HealthReading);
    });

    return readings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.error("Error fetching all health readings:", error);
    return [];
  }
}

/**
 * Fetch health readings for specifically TODAY
 */
export async function getTodayHealthReadings(userId: string): Promise<HealthReading[]> {
  const readings = await getAllHealthReadings(userId);
  const todayStr = new Date().toISOString().split('T')[0];
  
  return readings.filter(r => r.timestamp.startsWith(todayStr));
}

/**
 * Fetch the latest analytics session for a user
 */
export async function getLatestAnalyticsSession(): Promise<AnalyticsSession | null> {
  console.log(`[HealthService] Attempting to fetch from collection: ${ANALYTICS_COLLECTION}`);
  try {
    const q = query(
      collection(db, ANALYTICS_COLLECTION),
      orderBy("processedAt", "desc"),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log(`[HealthService] Collection '${ANALYTICS_COLLECTION}' is empty or does not exist.`);
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();
    console.log(`[HealthService] Successfully fetched doc: ${doc.id}`);
    
    // Debug: Check if expected fields exist
    if (!data.pulse || !data.breathing) {
      console.warn("[HealthService] Found analytics doc but pulse/breathing maps are missing!", data);
    }

    return { id: doc.id, ...data } as any;
  } catch (error: any) {
    console.error(`[HealthService] CRITICAL Error fetching from '${ANALYTICS_COLLECTION}':`, error);
    return null;
  }
}
