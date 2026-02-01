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

// Rate limiting state
let rateLimitUntil: number | null = null; // Timestamp when rate limit expires
let lastRequestTime: number = 0; // Track request timing to avoid rapid calls
const MIN_REQUEST_INTERVAL = 2000; // Minimum 2 seconds between requests

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

const SESSION_ANALYSIS_COLLECTION = 'session_analyses';

/**
 * Generate a unique cache key for a session analysis
 */
function getSessionAnalysisKey(
  userId: string,
  profile: { sex: string; age: number; weight: string; height: string; conditions: string },
  stats: SessionStats
): string {
  const profileKey = `${profile.sex.toLowerCase()}_${profile.age}_${profile.weight}_${profile.height}_${profile.conditions.toLowerCase()}`;
  const statsKey = `${Math.round(stats.breathing.average)}_${Math.round(stats.breathing.max)}_${Math.round(stats.breathing.min)}_${Math.round(stats.pulse.average)}_${Math.round(stats.pulse.max)}_${Math.round(stats.pulse.min)}`;
  return `${userId}_${profileKey}_${statsKey}`;
}

/**
 * Check if a session analysis already exists in the database
 */
async function getCachedSessionAnalysis(cacheKey: string, userId: string): Promise<string | null> {
  try {
    // Use getDoc with the document ID (cacheKey) directly
    const docRef = doc(db, SESSION_ANALYSIS_COLLECTION, cacheKey);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Verify the userId matches (security check)
      if (data.userId === userId) {
        console.log('[Gemini] Using cached session analysis from database');
        return data.analysis;
      }
    }
  } catch (error) {
    console.error('Error checking cached session analysis:', error);
  }
  return null;
}

/**
 * Save a session analysis to the database
 */
async function saveSessionAnalysis(
  cacheKey: string,
  userId: string,
  profile: { sex: string; age: number; weight: string; height: string; conditions: string },
  stats: SessionStats,
  analysis: string
): Promise<void> {
  try {
    await setDoc(doc(db, SESSION_ANALYSIS_COLLECTION, cacheKey), {
      userId,
      cacheKey,
      profile: {
        sex: profile.sex,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        conditions: profile.conditions
      },
      stats: {
        breathing: {
          average: Math.round(stats.breathing.average),
          max: Math.round(stats.breathing.max),
          min: Math.round(stats.breathing.min)
        },
        pulse: {
          average: Math.round(stats.pulse.average),
          max: Math.round(stats.pulse.max),
          min: Math.round(stats.pulse.min)
        }
      },
      analysis,
      timestamp: new Date().toISOString()
    });
    console.log('[Gemini] Saved session analysis to database');
  } catch (error) {
    console.error('Error saving session analysis:', error);
  }
}

/**
 * Insert sample session analysis data into the database
 * This is a one-time function to add sample data
 */
export async function insertSampleSessionAnalysis(userId: string): Promise<void> {
  const sampleProfile = {
    sex: 'male',
    age: 14,
    weight: '30',
    height: '160',
    conditions: 'None'
  };
  
  const sampleStats: SessionStats = {
    breathing: {
      average: 12,
      max: 20,
      min: 7
    },
    pulse: {
      average: 114,
      max: 180,
      min: 70
    }
  };
  
  const sampleAnalysis = "The profile shows a 14yo male with a very low weight (30kg) for his height. The average pulse (114 BPM) is notably high, peaking at 180 BPM, while the minimum breathing rate (7 bpm) is unusually low. These vitals fall outside expected ranges for this age and suggest significant physiological stress. It is recommended to contact a caretaker.";
  
  const cacheKey = getSessionAnalysisKey(userId, sampleProfile, sampleStats);
  
  try {
    await setDoc(doc(db, SESSION_ANALYSIS_COLLECTION, cacheKey), {
      userId,
      cacheKey,
      profile: sampleProfile,
      stats: {
        breathing: {
          average: Math.round(sampleStats.breathing.average),
          max: Math.round(sampleStats.breathing.max),
          min: Math.round(sampleStats.breathing.min)
        },
        pulse: {
          average: Math.round(sampleStats.pulse.average),
          max: Math.round(sampleStats.pulse.max),
          min: Math.round(sampleStats.pulse.min)
        }
      },
      analysis: sampleAnalysis,
      timestamp: new Date().toISOString()
    });
    console.log('[Gemini] Sample session analysis inserted successfully');
  } catch (error) {
    console.error('Error inserting sample session analysis:', error);
    throw error;
  }
}

/**
 * Helper function to wait for a specified duration
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Check if we're currently rate limited
 */
function isRateLimited(): boolean {
  if (rateLimitUntil === null) return false;
  return Date.now() < rateLimitUntil;
}

/**
 * Extract retry delay from error message (in seconds)
 */
function extractRetryDelay(_errorMessage: string): number {
  const retryMatch = _errorMessage.match(/Please retry in ([\d.]+)s/);
  if (retryMatch) {
    return Math.ceil(parseFloat(retryMatch[1]) * 1000); // Convert to milliseconds
  }
  // Default to 60 seconds if we can't parse
  return 60000;
}

/**
 * Generate a fallback analysis message when API fails
 */
function generateFallbackAnalysis(
  profile: { sex: string; age: number; weight: string; height: string; conditions: string },
  stats: SessionStats
): string {
  const age = profile.age;
  const sex = profile.sex.toLowerCase();
  const breathingAvg = Math.round(stats.breathing.average);
  const breathingMin = Math.round(stats.breathing.min);
  const breathingMax = Math.round(stats.breathing.max);
  const pulseAvg = Math.round(stats.pulse.average);
  const pulseMin = Math.round(stats.pulse.min);
  const pulseMax = Math.round(stats.pulse.max);
  
  // Determine normal ranges based on age
  let normalBreathingMin = 12;
  let normalBreathingMax = 20;
  let normalPulseMin = 60;
  let normalPulseMax = 100;
  
  if (age < 12) {
    normalBreathingMin = 18;
    normalBreathingMax = 30;
    normalPulseMin = 70;
    normalPulseMax = 120;
  } else if (age < 18) {
    normalBreathingMin = 12;
    normalBreathingMax = 20;
    normalPulseMin = 60;
    normalPulseMax = 100;
  } else if (age >= 65) {
    normalBreathingMin = 12;
    normalBreathingMax = 18;
    normalPulseMin = 60;
    normalPulseMax = 100;
  }
  
  // Analyze breathing rate
  let breathingStatus = '';
  if (breathingAvg >= normalBreathingMin && breathingAvg <= normalBreathingMax) {
    breathingStatus = `within the normal resting range (${normalBreathingMin}-${normalBreathingMax} bpm)`;
  } else if (breathingAvg < normalBreathingMin) {
    breathingStatus = `below the normal resting range (${normalBreathingMin}-${normalBreathingMax} bpm)`;
  } else {
    breathingStatus = `above the normal resting range (${normalBreathingMin}-${normalBreathingMax} bpm)`;
  }
  
  // Analyze pulse
  let pulseStatus = '';
  if (pulseAvg >= normalPulseMin && pulseAvg <= normalPulseMax) {
    pulseStatus = `within normal range (${normalPulseMin}-${normalPulseMax} BPM)`;
    if (pulseAvg > (normalPulseMax - 10)) {
      pulseStatus = `on the higher end of normal (${normalPulseMin}-${normalPulseMax} BPM)`;
    }
  } else if (pulseAvg < normalPulseMin) {
    pulseStatus = `below normal range (${normalPulseMin}-${normalPulseMax} BPM)`;
  } else {
    pulseStatus = `above normal range (${normalPulseMin}-${normalPulseMax} BPM)`;
  }
  
  // Check for fluctuations (variability)
  const breathingRange = breathingMax - breathingMin;
  const pulseRange = pulseMax - pulseMin;
  const hasHighVariability = pulseRange > 40 || breathingRange > 10;
  
  let variabilityNote = '';
  let caretakerNote = '';
  
  if (hasHighVariability) {
    variabilityNote = ` Note that it shows significant fluctuations. The minimum of ${pulseMin} BPM and maximum of ${pulseMax} BPM indicate high variability.`;
    
    if (pulseMin < 50) {
      variabilityNote += ` The drop to ${pulseMin} BPM is notably low, unless occurring during deep sleep or athletic conditioning.`;
    }
    caretakerNote = ' It is recommended to contact a caretaker.';
  } else if (pulseAvg < normalPulseMin || pulseAvg > normalPulseMax || breathingAvg < normalBreathingMin || breathingAvg > normalBreathingMax) {
    caretakerNote = ' It is recommended to contact a caretaker.';
  }
  
  // Build the message
  const breathingRangeStr = breathingMin === breathingMax 
    ? `${breathingAvg} bpm` 
    : `${breathingMin}–${breathingMax} bpm`;
  const pulseRangeStr = pulseMin === pulseMax 
    ? `${pulseAvg} BPM` 
    : `${pulseMin}–${pulseMax} BPM`;
  
  return `For a ${age}-year-old ${sex}, your breathing rate (${breathingRangeStr}) is ${breathingStatus}. Your pulse (${pulseRangeStr}) is ${pulseStatus}.${variabilityNote}${caretakerNote}`;
}

/**
 * Summarize and analyze a full session's statistics using Gemini
 */
export async function analyzeSessionStats(
  profile: { sex: string; age: number; weight: string; height: string; conditions: string },
  stats: SessionStats,
  userId?: string
): Promise<string> {
  // Generate cache key for this session
  const cacheKey = userId ? getSessionAnalysisKey(userId, profile, stats) : null;
  
  // Check database first if we have a userId
  if (cacheKey && userId) {
    const cachedAnalysis = await getCachedSessionAnalysis(cacheKey, userId);
    if (cachedAnalysis) {
      return cachedAnalysis;
    }
  }

  const genAI = getGeminiAPI();
  if (!genAI || !isGeminiAvailable) {
    console.log('[Gemini] API unavailable, using fallback analysis');
    return generateFallbackAnalysis(profile, stats);
  }

  // Check if we're rate limited
  if (isRateLimited()) {
    console.log('[Gemini] Rate limited, using fallback analysis');
    return generateFallbackAnalysis(profile, stats);
  }

  // Enforce minimum interval between requests
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await wait(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }

  const maxRetries = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      lastRequestTime = Date.now();
      
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

Summarize the data and make general observations. Do not provide a medical diagnosis. If anything seems abnormal, mention it in the response and add at the end "It is recommended to contact a caretaker."
        Answer only with max 500 characters.`;

      const result = await model.generateContent(prompt);
      const analysisText = result.response.text().trim();
      
      // Save to database if we have userId
      if (cacheKey && userId) {
        await saveSessionAnalysis(cacheKey, userId, profile, stats, analysisText);
      }
      
      return analysisText;

    } catch (error: any) {
      const errorMessage = error.message || '';
      
      // Handle 429 rate limit errors
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        const retryDelay = extractRetryDelay(errorMessage);
        rateLimitUntil = Date.now() + retryDelay;
        
        console.warn(`[Gemini] Rate limited. Will retry after ${Math.ceil(retryDelay / 1000)} seconds.`);
        
        // If this is the last attempt, use fallback analysis
        if (attempt === maxRetries) {
          console.log('[Gemini] All retries exhausted due to rate limit, using fallback analysis');
          return generateFallbackAnalysis(profile, stats);
        }
        
        // Wait before retrying
        await wait(Math.min(retryDelay, 60000)); // Cap wait at 60 seconds
        continue;
      }
      
      // For other errors, log and use fallback
      console.warn("[Gemini Session Analysis Error]:", errorMessage);
      if (attempt === maxRetries) {
        console.log('[Gemini] All retries exhausted, using fallback analysis');
        return generateFallbackAnalysis(profile, stats);
      }
      break;
    }
  }

  // If we get here, all retries failed - generate fallback analysis
  return generateFallbackAnalysis(profile, stats);
}
