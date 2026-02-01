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
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Session-based circuit breaker to avoid repeated failing calls
let isGeminiAvailable = true;

export interface HealthCheckRequest {
  sex: string;
  age: number;
  weight: string;
  height: string;
  conditions: string;
  statValue: number;
  statName: 'heartbeat' | 'respiration rate';
  unit: string;
}

export interface HealthCheckResponse {
  isTypical: boolean;
  statName: string;
}

export interface SessionStats {
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
    // Cached result stored
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}


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
    // List of models confirmed via diagnostics
    const modelNames = ['gemini-2.5-flash'];
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 5 }
        });

        const prompt = `Act as a clinical data analyzer. 
        User Profile: ${request.sex}, ${request.age}yo, ${request.weight}kg, ${request.height}cm, conditions: ${request.conditions}.
        Question: Is a ${request.statName} of ${request.statValue} ${request.unit} within the typical statistical range for this profile?
        Answer only with "true" or "false".`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().toLowerCase();
        
        const isTypical = text.includes('true');

        if (userId) await saveToCache(userId, cacheKey, isTypical);
        return { isTypical, statName: request.statName };

      } catch (err: any) {
        console.warn(`[Gemini Error] ${modelName} failed:`, err.message);
        
        // If the API key is clearly invalid or blocked by an ad-blocker, disable Gemini for this session
        if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('BLOCKED_BY_CLIENT')) {
          console.error('[Gemini Critical] API key is invalid or blocked. Switching to threshold fallback.');
          isGeminiAvailable = false;
          break; 
        }
        
        // If it's a 404 (model not found), we just move to the next model in the list
      }
    }
  }

  // 3. Fallback to Threshold-based analysis (if Gemini fails or is missing)
  const isTypical = checkHealthStatThreshold(request);
  // Fallback used
  
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
    }, userId)
  ]);
}

/**
 * Summarize and analyze a full session's statistics using Gemini
 */
export async function analyzeSessionStats(
  profile: { sex: string; age: number; weight: string; height: string; conditions: string },
  stats: SessionStats
): Promise<string> {
  const genAI = getGeminiAPI();
  if (!genAI || !isGeminiAvailable) {
    return "AI analysis is currently unavailable. Please review your session stats manually below.";
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 250 }
    });

    const prompt = `Act as a clinical data analyzer. 
        User Profile: ${profile.sex}, ${profile.age}yo, ${profile.weight}kg, ${profile.height}cm, conditions: ${profile.conditions}.

Given the following stats: 
breathing rate in bpm {
	average: ${Math.round(stats.breathing.average)}
	max: ${Math.round(stats.breathing.max)}
	min: ${Math.round(stats.breathing.min)}
},
pulse in BPM {
	average: ${Math.round(stats.pulse.average)}
	max: ${Math.round(stats.pulse.max)}
	min: ${Math.round(stats.pulse.min)}
}

Summarize the data and make general observations. Do not provide a medical diagnosis. If anything seems abnormal, mention it in the response and add at the end “It is recommended to contact a caretaker.”
        Answer only with max 500 characters.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();

  } catch (error: any) {
    console.warn("[Gemini Session Analysis Error]:", error.message);
    return "Unable to generate AI analysis at this time. Statistical data is shown accurately in the charts.";
  }
}
