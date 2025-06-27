/**
 * Example: Using API Keys with Story Engine
 * 
 * This example demonstrates how to authenticate requests using API keys
 * instead of JWT tokens.
 */

// First, create an API key through the authenticated endpoint
async function createApiKey() {
  const response = await fetch('http://localhost:4000/api/auth/apiKeys/create', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'My SDK Integration',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    })
  });

  const result = await response.json();
  console.log('API Key created:', result.key);
  console.log('Store this key securely - it won\'t be shown again!');
  
  return result.key;
}

// Use the API key for subsequent requests
async function listWorldsWithApiKey(apiKey: string) {
  const response = await fetch('http://localhost:4000/api/worlds/list', {
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  });

  const worlds = await response.json();
  console.log('Your worlds:', worlds);
  return worlds;
}

// Example: Create a new world using API key
async function createWorldWithApiKey(apiKey: string) {
  const response = await fetch('http://localhost:4000/api/worlds/create', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'My Fantasy Realm',
      description: 'A world of magic and adventure'
    })
  });

  const world = await response.json();
  console.log('World created:', world);
  return world;
}

// Using with popular HTTP clients

// Axios example
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'X-API-Key': process.env.STORY_ENGINE_API_KEY
  }
});

// Node.js native fetch (Node 18+)
async function makeAuthenticatedRequest(endpoint: string) {
  const response = await fetch(`http://localhost:4000/api${endpoint}`, {
    headers: {
      'X-API-Key': process.env.STORY_ENGINE_API_KEY!
    }
  });
  
  return response.json();
}

// Environment variable best practice
if (!process.env.STORY_ENGINE_API_KEY) {
  throw new Error('STORY_ENGINE_API_KEY environment variable not set');
}

export { createApiKey, listWorldsWithApiKey, createWorldWithApiKey, apiClient };