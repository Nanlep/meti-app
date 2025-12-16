
import { ApiKey } from '../types';

// Mock implementation interacting with local storage or backend endpoints
// In a real scenario, these fetch calls go to the backend implemented in server/index.js

export const developerService = {
  // Generate a new API Key
  createKey: async (name: string): Promise<{ apiKey: ApiKey; secret: string }> => {
    // Simulate API Call
    // const response = await fetch('/api/keys', { method: 'POST', body: JSON.stringify({ name }) ... });
    
    // Client-side simulation for demo:
    await new Promise(resolve => setTimeout(resolve, 600));
    const secret = `sk_live_${Math.random().toString(36).substr(2, 24)}`;
    const apiKey: ApiKey = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      userId: 'current_user',
      name,
      prefix: secret.substring(0, 12) + '...',
      createdAt: Date.now()
    };
    
    // Store in LocalStorage for demo persistence
    const keys = developerService.getKeys();
    keys.push(apiKey);
    localStorage.setItem('meti_api_keys', JSON.stringify(keys));

    return { apiKey, secret };
  },

  // List all keys for current user
  getKeys: (): ApiKey[] => {
    try {
      const data = localStorage.getItem('meti_api_keys');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Revoke a key
  revokeKey: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const keys = developerService.getKeys().filter(k => k.id !== id);
    localStorage.setItem('meti_api_keys', JSON.stringify(keys));
  }
};