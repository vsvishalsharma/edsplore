import { doc, getDoc, setDoc, deleteDoc, collection, increment, Timestamp, runTransaction } from "firebase/firestore";
import { db } from "./firebase";

interface UserAgent {
  agentId: string;
  llmId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive';
  questionnaireData?: QuestionnaireData;
}

interface TokenData {
  customerId: string;
  tokens: number;
  lastTokenUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserAgent(userId: string): Promise<UserAgent | null> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const docRef = doc(db, "userAgents", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        questionnaireData: data.questionnaireData || null
      } as UserAgent;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting user agent:", error);
    throw new Error("Failed to fetch user agent data");
  }
}

export async function createUserAgent(
  userId: string, 
  agentId: string, 
  llmId: string, 
  questionnaireData: QuestionnaireData
): Promise<void> {
  if (!userId || !agentId || !llmId) {
    throw new Error("User ID, Agent ID, and LLM ID are required");
  }

  try {
    const docRef = doc(db, "userAgents", userId);
    const now = new Date();
    
    await setDoc(docRef, {
      agentId,
      llmId,
      questionnaireData,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      status: 'active'
    });
  } catch (error) {
    console.error("Error creating user agent:", error);
    throw new Error("Failed to create user agent");
  }
}

export async function getUserTokens(userId: string): Promise<TokenData | null> {
  if (!userId) throw new Error("User ID is required");

  try {
    const docRef = doc(db, "tokens", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        customerId: data.customerId,
        tokens: data.tokens || 0,
        lastTokenUpdate: data.lastTokenUpdate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as TokenData;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting token data:", error);
    throw new Error("Failed to fetch token data");
  }
}

export async function deductTokens(userId: string, amount: number): Promise<void> {
  if (!userId) throw new Error("User ID is required");
  if (amount <= 0) throw new Error("Token amount must be positive");

  try {
    const userTokensRef = doc(db, "tokens", userId);
    
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(userTokensRef);
      
      if (!docSnap.exists()) {
        throw new Error("User token data not found");
      }

      const currentTokens = docSnap.data().tokens || 0;
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
    throw new Error("Failed to deduct tokens");
  }
}

export async function updateUserAgent(userId: string, data: Partial<UserAgent>): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const docRef = doc(db, "userAgents", userId);
    await setDoc(docRef, {
      ...data,
      updatedAt: Timestamp.fromDate(new Date())
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user agent:", error);
    throw new Error("Failed to update user agent");
  }
}

export async function updateUserAgentQuestionnaire(
  userId: string, 
  questionnaireData: QuestionnaireData
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const docRef = doc(db, "userAgents", userId);
    await setDoc(docRef, {
      questionnaireData,
      updatedAt: Timestamp.fromDate(new Date())
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user agent questionnaire:", error);
    throw new Error("Failed to update user agent questionnaire");
  }
}

export async function deleteUserAgent(userId: string): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const docRef = doc(db, "userAgents", userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting user agent:", error);
    throw new Error("Failed to delete user agent");
  }
}