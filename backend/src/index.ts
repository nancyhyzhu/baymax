import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase, ServerValue } from 'firebase-admin/database';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin/app';
import { createRequire } from 'module';

/**
 * 1. SETUP & INITIALIZATION
 */
const require = createRequire(import.meta.url);
const serviceAccount = require('../service-account.json') as ServiceAccount;

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://baymax-a7713-default-rtdb.firebaseio.com/"
});

const db = getDatabase();
const firestore = getFirestore();

console.log("---------------------------------------");
console.log("🚀 Vitals Analytics Backend (Pulse & Breathing)");
console.log("📡 Listening for completed sessions...");
console.log("---------------------------------------");

/**
 * 2. DATABASE LISTENER
 */
const sessionsRef = db.ref('sessions');

sessionsRef.on('child_changed', async (snapshot) => {
    const sessionId = snapshot.key;
    const sessionData = snapshot.val();

    if (!sessionId || !sessionData) return;

    const metadata = sessionData.metadata;
    const readings = sessionData.readings;

    // Process only if status is 'completed'
    if (metadata?.status === 'completed') {
        // Check Firestore to avoid duplicate processing
        const docRef = firestore.collection('analytics_sessions').doc(sessionId);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.log(`\n📦 Processing Session: ${sessionId}`);
            if (!readings) {
                console.log("⚠️ No readings found. Skipping.");
                return;
            }
            await calculateAndSaveToFirestore(sessionId, readings, metadata);
        }
    }
});

/**
 * 3. ANALYTICS CALCULATION
 */
async function calculateAndSaveToFirestore(sessionId: string, readings: any, metadata: any) {
    try {
        const pulses: number[] = [];
        const breathings: number[] = [];

        // Extract pulse and breathing values from the readings buffer
        Object.values(readings).forEach((entry: any) => {
            if (typeof entry.pulse === 'number') pulses.push(entry.pulse);
            if (typeof entry.breathing === 'number') breathings.push(entry.breathing);
        });

        if (pulses.length === 0) {
            console.log("❌ No valid numeric data found in session.");
            return;
        }

        // Calculation Helper
        const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        // Prepare the Firestore Document
        const analyticsReport = {
            sessionId: sessionId,
            pulse: {
                average: Math.round(average(pulses)),
                max: Math.max(...pulses),
                min: Math.min(...pulses)
            },
            breathing: {
                average: Math.round(average(breathings)),
                max: Math.max(...breathings),
                min: Math.min(...breathings)
            },
            sessionInfo: {
                startedAt: metadata.startTime ? new Date(metadata.startTime) : null,
                endedAt: metadata.endTime ? new Date(metadata.endTime) : null,
                dataPoints: pulses.length
            },
            processedAt: Timestamp.now()
        };

        // SAVE TO FIRESTORE
        await firestore.collection('analytics_sessions').doc(sessionId).set(analyticsReport);

        console.log(`✅ Success: Analytics for ${sessionId} stored in Firestore.`);
        console.log(`📈 Results -> Pulse Avg: ${analyticsReport.pulse.average} | Breathing Avg: ${analyticsReport.breathing.average}`);

    } catch (error) {
        console.error(`🔥 Firestore Write Error for ${sessionId}:`, error);
    }
}