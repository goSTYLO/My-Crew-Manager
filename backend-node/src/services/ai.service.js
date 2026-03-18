import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8002';

/**
 * Call the FastAPI AI microservice.
 * Used for generate-overview and generate-backlog.
 */
export async function callAIService(endpoint, body = {}) {
  const url = `${AI_SERVICE_URL}${endpoint}`;
  try {
    const res = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 300000, // 5 min for LLM
    });
    return { status: res.status, data: res.data };
  } catch (err) {
    if (err.response) {
      return { status: err.response.status, data: err.response.data, error: true };
    }
    throw err;
  }
}
