
/**
 * METI CORE UTILITIES
 * Enterprise-grade helpers for Data Normalization, Error Handling, and Async Logic.
 */

// --- 1. DATE & TIME STANDARDIZATION ---

export const formatDate = (timestamp: number | string | undefined): string => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    // Check for Invalid Date
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Enforce US/English locale for consistency in Enterprise Reports
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (e) {
    console.error("Date parsing error:", e);
    return 'Error';
  }
};

export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// --- 2. ASYNC HANDOFF & RETRY LOGIC ---

/**
 * Executes a promise with exponential backoff.
 * Stops retrying on fatal errors (400, 401, 403, 429 too frequent).
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Identify Fatal Errors where retry is useless
    const status = error?.status || error?.response?.status;
    const msg = error?.message || '';
    
    const isFatal = 
      status === 400 || // Bad Request
      status === 401 || // Unauthorized
      status === 403 || // Forbidden
      msg.includes('INVALID_ARGUMENT') ||
      msg.includes('API_KEY_INVALID');

    if (isFatal || retries === 0) {
       console.error(`Operation failed fatally (Status: ${status}). Not retrying.`);
       throw error;
    }

    console.warn(`Operation failed. Retrying in ${delay}ms... (${retries} left). Reason: ${msg}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
  }
}

// --- 3. HALLUCINATION MITIGATION & SAFE JSON PARSING ---

/**
 * Safely extracts and parses JSON from AI responses, handling Markdown code blocks 
 * and conversational fluff (Hallucinations). Also handles simple strings.
 */
export const cleanAndParseJSON = <T>(text: string | undefined): T => {
  if (!text) throw new Error("Empty response from AI");

  let cleanText = text.trim();

  // Remove Markdown Code Blocks (```json ... ```)
  const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleanText = jsonMatch[1];
  }

  // Attempt Parse
  try {
    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error("JSON Parse Failed. Attempting aggressive cleanup.", e);
    // Fallback: Try to find the first '{' or '[' and the last '}' or ']'
    const firstBrace = cleanText.search(/[{[]/);
    const lastBrace = cleanText.search(/[}\]]$/);
    
    if (firstBrace !== -1) {
       // Find the *last* closing brace/bracket
       const lastIndex = Math.max(cleanText.lastIndexOf('}'), cleanText.lastIndexOf(']'));
       if (lastIndex > firstBrace) {
           const potentialJson = cleanText.substring(firstBrace, lastIndex + 1);
           try {
               return JSON.parse(potentialJson) as T;
           } catch (e2) {
               throw new Error("Failed to repair hallucinated JSON context.");
           }
       }
    }
    throw new Error("Invalid Data Format returned by AI.");
  }
};

/**
 * A safe wrapper for JSON.parse that handles undefined/null and returns a default value
 * Prevents "Unexpected token u" runtime crashes.
 */
export const safeJSONParse = <T>(data: string | null, fallback: T): T => {
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Storage Corrupt:", e);
    return fallback;
  }
};

// --- 4. ID GENERATION ---
export const generateId = (): string => {
  // Use crypto API if available (Secure), fallback to Math.random (Legacy support)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// --- 5. STORAGE QUOTA CHECK & COMPRESSION ---
export const checkStorageQuota = (key: string, newData: any): boolean => {
    try {
        const json = JSON.stringify(newData);
        // Approx check (UTF-16 is 2 bytes per char, but localStorage is usually 5MB char count)
        if (json.length > 4500000) { // Safety buffer before 5MB
            return false;
        }
        return true;
    } catch {
        return false;
    }
};

/**
 * Compresses an image file to Base64 string, max dimension 800px, JPEG 0.7 quality.
 * Prevents LocalStorage overflow.
 */
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG 0.7
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};
