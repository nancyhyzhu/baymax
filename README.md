# Baymax Health Dashboard 🩺🤖

Baymax is a comprehensive personal health companion designed to provide real-time monitoring, AI-driven health insights, and seamless medication management. Built for speed and accessibility, Baymax combines modern web technologies with the power of Google's Gemini AI to help users understand their health metrics in context.

## ✨ Key Features

- **🧠 Demographics-Aware AI Analysis**: Unlike static thresholds, Baymax uses **Gemini 2.5 Flash** to analyze heart rate and respiration data. It considers your age, sex, weight, and existing conditions to determine if your metrics are statistically typical for *you*.
- **💊 Intelligent Medication Tracking**: A full scheduling system that handles daily medications, custom frequencies, and persistent "taken" records.
- **📊 Real-Time Health Visualization**: Interactive charts for Heart Rate, Respiration Rate, and Mood, providing both daily deep-dives and historical trends.
- **🏥 Medical Profile Integration**: Quick-entry onboarding for diagnosed conditions and medications, ensuring the AI always has the full clinical picture.
- **🔒 Secure & Private**: Built on Firebase with secure Authentication and private Firestore data silos.

## 🚀 Tech Stack

- **Frontend**: React (Vite) + TypeScript
- **State Management**: React Context API
- **Backend/Auth**: Firebase (Authentication, Firestore)
- **AI Intelligence**: Google Generative AI (Gemini 2.5 Flash)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Styling**: Modern Vanilla CSS with a focus on accessibility and responsiveness.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- A Firebase Project (with Auth and Firestore enabled)
- A Google Gemini API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd baymax
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_GEMINI_API_KEY=your_gemini_key_here
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

## 🔐 Firestore Security Rules

For typical operation, ensure your Firestore rules protect user data by ensuring `request.auth.uid == userId`. Refer to `FIREBASE_SETUP.md` in the documentation folder for detailed security configurations.

---

*Baymax is a personal health dashboard for informational purposes and should not replace professional medical advice.*