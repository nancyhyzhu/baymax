import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Initialize Gemini API
const getGeminiAPI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.warn('Gemini API key not configured or using placeholder. Using threshold-based analysis.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export interface HealthCheckRequest {
  sex: string;
  age: number;
  weight: string;
  height: string;
  statValue: number;
  statName: 'heartbeat' | 'respiration rate' | 'mood';
  unit: string;
}

export interface HealthCheckResponse {
  isTypical: boolean;
  statName: string;
}

/**
 * Threshold-based health analysis (reliable fallback)
 */
function checkHealthStatThreshold(request: HealthCheckRequest): boolean {
  const { statName, statValue, age } = request;
  
  switch (statName) {
    case 'heartbeat':
      // Basic HR ranges
      if (age < 12) return statValue >= 70 && statValue <= 120;
      if (age < 18) return statValue >= 60 && statValue <= 100;
      return statValue >= 60 && statValue <= 100;

    case 'respiration rate':
      // Basic respiration ranges
      if (age < 12) return statValue >= 18 && statValue <= 30;
      return statValue >= 12 && statValue <= 20;

    case 'mood':
      // Mood score 1-10
      return statValue >= 4 && statValue <= 9;
    
    default:
      return true;
  }
}

/**
 * Generate a cache key for a health check request
 */
function getCacheKey(request: HealthCheckRequest): string {
  // Normalize strings to lowercase for consistent caching
  const sex = request.sex.toLowerCase();
  return `${sex}_${request.age}_${request.weight}_${request.height}_${request.statName}_${request.statValue}`;
}

/**
 * Check cache in Firestore for previous analysis
 */
async function checkCache(userId: string, cacheKey: string): Promise<boolean | null> {
  try {
    const cacheDoc = await getDoc(doc(db, 'health_analysis_cache', `${userId}_${cacheKey}`));
    if (cacheDoc.exists()) {
      const data = cacheDoc.data();
      console.log(`[Cache Hit] Stat is ${data.isTypical ? 'TYPICAL' : 'ATYPICAL'} for ${cacheKey}`);
      return data.isTypical;
    }
  } catch (error) {
    // If it's a permission error, it means rules haven't been applied or ad-blocker is interfering
    console.error('Error checking cache (likely Firestore rules or Ad-blocker):', error);
  }
  return null;
}

/**
 * Save analysis result to Firestore cache
 */
async function saveToCache(userId: string, cacheKey: string, isTypical: boolean): Promise<void> {
  try {
    await setDoc(doc(db, 'health_analysis_cache', `${userId}_${cacheKey}`), {
      userId,
      isTypical, // true = typical, false = atypical
      timestamp: new Date().toISOString(),
      cacheKey
    });
    console.log(`[Cache Saved] Result (${isTypical ? 'TYPICAL' : 'ATYPICAL'}) stored for ${cacheKey}`);
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

// Session-based circuit breaker to avoid repeated failing calls
let isGeminiAvailable = true;

/**
 * Check if a single health stat is typical for the user's demographics
 */
export async function checkHealthStat(request: HealthCheckRequest, userId?: string): Promise<HealthCheckResponse> {
  const cacheKey = getCacheKey(request);
  
  // 1. Check cache first
  if (userId) {
    const cachedResult = await checkCache(userId, cacheKey);
    if (cachedResult !== null) {
      return { isTypical: cachedResult, statName: request.statName };
    }
  }

  // 2. Try Gemini API if available and not previously failed in this session
  const genAI = getGeminiAPI();
  if (genAI && isGeminiAvailable) {
    const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
        });

        const prompt = `Given a ${request.sex} individual, age ${request.age}, weighing ${request.weight}kg who is ${request.height}cm tall, is ${request.statValue} ${request.unit} in the typical expected range for ${request.statName}? Please give a one word response true (for yes) or false (for no) do not include any other characters in your message`;

        console.log(`[Gemini Request] Analyzing ${request.statName} (${request.statValue}) with ${modelName}...`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim().toLowerCase();
        
        // true = typical, false = atypical
        const isTypical = text.includes('true');
        console.log(`[Gemini Success] ${modelName} analysis: ${text} (Typical: ${isTypical})`);

        if (userId) await saveToCache(userId, cacheKey, isTypical);
        return { isTypical, statName: request.statName };
      } catch (err: any) {
        // If it's a 404 or blocked by client, disable Gemini for this session to reduce noise
        if (err.message && (err.message.includes('404') || err.message.includes('BLOCKED_BY_CLIENT') || err.message.includes('not found'))) {
          console.warn(`[Gemini Disabled] API returned 404 or was blocked. Switching to threshold fallback for this session.`);
          isGeminiAvailable = false;
          break; 
        }
        console.warn(`[Gemini Error] ${modelName} failed. Trying next...`);
      }
    }
  }

  // 3. Fallback to Threshold-based analysis (always works)
  const isTypical = checkHealthStatThreshold(request);
  console.log(`[Threshold Analysis] Result for ${request.statName}: ${isTypical ? 'TYPICAL' : 'ATYPICAL'}`);
  
  if (userId) await saveToCache(userId, cacheKey, isTypical);
  return { isTypical, statName: request.statName };
}

/**
 * Check all health stats at once
 */
export async function checkAllHealthStats(
  profile: { sex: string; age: number; weight: string; height: string },
  heartRateAvg: number,
  respirationRateAvg: number,
  moodScore: number,
  userId?: string
): Promise<HealthCheckResponse[]> {
  console.log('🔍 Starting Health Analysis...');
  
  return Promise.all([
    checkHealthStat({
      sex: profile.sex,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      statValue: heartRateAvg,
      statName: 'heartbeat',
      unit: 'bpm'
    }, userId),
    checkHealthStat({
      sex: profile.sex,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      statValue: respirationRateAvg,
      statName: 'respiration rate',
      unit: 'breaths/min'
    }, userId),
    checkHealthStat({
      sex: profile.sex,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      statValue: moodScore,
      statName: 'mood',
      unit: 'score (1-10)'
    }, userId)
  ]);
}
