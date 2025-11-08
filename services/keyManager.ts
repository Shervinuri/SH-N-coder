
import { API_KEYS } from './apiKeys';

if (!API_KEYS || API_KEYS.length === 0) {
  throw new Error("API keys array is empty. Please provide keys in services/apiKeys.ts");
}

/**
 * A simple key manager that provides a generator to iterate through all available keys once.
 */
export const keyManager = {
  /**
   * Returns a generator that yields each available API key once.
   * This is used to retry a failed API call with the next key in the list.
   */
  getKeyGenerator: function* () {
    for (const key of API_KEYS) {
      yield key;
    }
  }
};
