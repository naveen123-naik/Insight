const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function callAIService(endpoint, payload) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}${endpoint}`, payload, { timeout: 8000 });
    return response.data;
  } catch (error) {
    console.warn(`[AI Client Warning] FastAPI service call to ${endpoint} failed or timed out. Using fallback analytics engine.`);
    return null;
  }
}

module.exports = { callAIService };
