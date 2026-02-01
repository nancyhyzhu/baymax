import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from '@google/generative-ai';
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
  conditions: string;
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

  // 2. Try Gemini API
  const genAI = getGeminiAPI();
  if (genAI && isGeminiAvailable) {
    // We use flash first as it is fastest and least likely to trigger filters
    const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          // SAFETY SETTINGS: This prevents the AI from blocking the response because it thinks it's "medical advice"
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 5 }
        });

        // IMPROVED PROMPT: Framed as statistical analysis to avoid medical filters
        const prompt = `Act as a clinical data analyzer. 
        User Profile: ${request.sex}, ${request.age}yo, ${request.weight}kg, ${request.height}cm, conditions: ${request.conditions}.
        Question: Is a ${request.statName} of ${request.statValue} ${request.unit} within the typical statistical range for this profile?
        Answer only with "true" or "false".`;

        console.log(`[Gemini Request] Analyzing ${request.statName} (${request.statValue}) with ${modelName}...`);
        
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().toLowerCase();
        
        // Robust parsing of the response
        const isTypical = text.includes('true');
        console.log(`[Gemini Success] ${modelName} result: ${text}`);

        if (userId) await saveToCache(userId, cacheKey, isTypical);
        return { isTypical, statName: request.statName };

      } catch (err: any) {
        console.warn(`[Gemini Error] ${modelName} failed:`, err.message);
        
        // If the API key is invalid or blocked by an ad-blocker, don't keep trying
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('BLOCKED_BY_CLIENT')) {
          isGeminiAvailable = false;
          break; 
        }
      }
    }
  }

  // 3. Fallback to Threshold-based analysis (if Gemini fails or is missing)
  const isTypical = checkHealthStatThreshold(request);
  console.log(`[Threshold Fallback] Result for ${request.statName}: ${isTypical}`);
  
  if (userId) await saveToCache(userId, cacheKey, isTypical);
  return { isTypical, statName: request.statName };
}

/**
 * Check all health stats at once
 */
export async function checkAllHealthStats(
  profile: { sex: string; age: number; weight: string; height: string; conditions: string },
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
      conditions: profile.conditions,
      statValue: heartRateAvg,
      statName: 'heartbeat',
      unit: 'bpm'
    }, userId),
    checkHealthStat({
      sex: profile.sex,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      conditions: profile.conditions,
      statValue: respirationRateAvg,
      statName: 'respiration rate',
      unit: 'breaths/min'
    }, userId),
    checkHealthStat({
      sex: profile.sex,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      conditions: profile.conditions,
      statValue: moodScore,
      statName: 'mood',
      unit: 'score (1-10)'
    }, userId)
  ]);
}
