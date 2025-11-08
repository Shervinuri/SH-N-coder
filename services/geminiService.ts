
import { GoogleGenAI } from '@google/genai';
import { keyManager } from './keyManager';

// List of substrings found in errors that suggest a key-related issue (quota, validity, etc.)
const KEY_RELATED_ERROR_SUBSTRINGS = [
  'api key not valid',
  'quota',
  'permission denied',
  'could not be found', // For invalid key errors
  'billing', // For billing-related issues on the key's project
];

/**
 * Checks if an error message indicates a problem with the API key.
 * @param errorMessage The error message string.
 * @returns True if the error is likely key-related, false otherwise.
 */
function isKeyRelatedError(errorMessage: string): boolean {
  const lowerCaseMessage = errorMessage.toLowerCase();
  return KEY_RELATED_ERROR_SUBSTRINGS.some(keyword => lowerCaseMessage.includes(keyword));
}

export async function* generateCodeStream(prompt: string): AsyncGenerator<string> {
  const keyGenerator = keyManager.getKeyGenerator();
  
  for (const apiKey of keyGenerator) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      // If we get here, the key is valid and the stream has started.
      // We yield all chunks from the stream and then return, which successfully ends the function
      // and breaks out of the key-retry loop.
      for await (const chunk of response) {
          yield chunk.text;
      }

      return; // Success! Exit the function.

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`API call failed with key "...${apiKey.slice(-4)}". Error: ${errorMessage}`);
      
      // If the error is NOT key-related (e.g., a prompt issue), we should not retry with another key.
      // We fail fast by throwing the error immediately.
      if (!isKeyRelatedError(errorMessage)) {
         throw new Error(`A non-key-related Gemini API error occurred: ${errorMessage}`);
      }

      // If the error IS key-related, the loop will just continue to the next iteration, trying the next key.
    }
  }

  // If the 'for...of' loop completes without a successful 'return', it means every key in the generator was tried and failed.
  throw new Error("All available API keys failed. Please check your keys in services/apiKeys.ts and verify their status and quotas in the Google AI Studio dashboard.");
};
