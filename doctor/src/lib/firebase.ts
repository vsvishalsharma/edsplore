import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  Timestamp, 
  increment,
  runTransaction
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKJ7IsqjVokl74w9__0dILzQ_5PHhTiYY",
  authDomain: "doctor-74494.firebaseapp.com",
  projectId: "doctor-74494",
  storageBucket: "doctor-74494.appspot.com",
  messagingSenderId: "551576808991",
  appId: "1:551576808991:web:f2ca013379be9e83f06f2a",
  measurementId: "G-5DJJE3S3KQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Keep track of processed session IDs to prevent duplicate token additions
const processedSessions = new Set<string>();

export async function addTokensToFirebase(userId: string, customerId: string, sessionId: string) {
  if (!userId) throw new Error('User ID is required');
  if (!customerId) throw new Error('Customer ID is required');
  if (!sessionId) throw new Error('Session ID is required');
  
  // Check if this session has already been processed
  if (processedSessions.has(sessionId)) {
    console.log('Session already processed, skipping token addition');
    return 0;
  }

  const TOKENS_TO_ADD = 100; // Fixed amount of tokens
  
  try {
    const userTokensRef = doc(db, "tokens", userId);
    
    // Use transaction for atomic updates
    await runTransaction(db, async (transaction) => {
      const tokenDoc = await transaction.get(userTokensRef);
      
      if (!tokenDoc.exists()) {
        // Create new tokens document
        transaction.set(userTokensRef, {
          customerId,
          tokens: TOKENS_TO_ADD,
          lastTokenUpdate: Timestamp.fromDate(new Date()),
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          lastProcessedSession: sessionId // Store the session ID
        });
      } else {
        // Check if this session was already processed
        const data = tokenDoc.data();
        if (data.lastProcessedSession === sessionId) {
          throw new Error('Session already processed');
        }

        // Update existing tokens
        transaction.set(userTokensRef, {
          customerId,
          tokens: (data.tokens || 0) + TOKENS_TO_ADD,
          lastTokenUpdate: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date()),
          lastProcessedSession: sessionId // Update the session ID
        }, { merge: true });
      }
    });

    // Mark session as processed
    processedSessions.add(sessionId);
    return TOKENS_TO_ADD;
  } catch (error) {
    if (error.message === 'Session already processed') {
      console.log('Duplicate session detected, skipping token addition');
      return 0;
    }
    console.error('Error updating tokens in Firebase:', error);
    throw error;
  }
}

export async function deductTokensTransaction(userId: string, amount: number): Promise<void> {
  if (!userId) throw new Error("User ID is required");
  if (amount <= 0) throw new Error("Token amount must be positive");

  try {
    const userTokensRef = doc(db, "tokens", userId);
    
    await runTransaction(db, async (transaction) => {
      const tokenDoc = await transaction.get(userTokensRef);
      
      if (!tokenDoc.exists()) {
        throw new Error("User token data not found");
      }
      
      const currentTokens = tokenDoc.data().tokens || 0;
      if (currentTokens < amount) {
        throw new Error("Insufficient tokens");
      }
      
      transaction.update(userTokensRef, {
        tokens: increment(-amount),
        lastTokenUpdate: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });
    });
  } catch (error) {
    console.error("Error deducting tokens:", error);
    throw error;
  }
}

export { app, auth, db };