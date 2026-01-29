import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ai-sdk-ollama';
import { streamText } from 'ai';

// Create singleton provider instances at module level for better performance
const google = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ? createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })
  : null;

const ollama = createOllama({
  baseURL: 'http://localhost:11434',
});

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    const modelName = model || 'gemini-3-flash-preview';

    console.log(`[API] Request for model: ${modelName}`);

    // Determine which provider to use based on model name
    const isGeminiModel = modelName.startsWith('gemini');

    let selectedModel;
    if (isGeminiModel) {
      if (!google) {
        throw new Error("Google Gemini API Key is missing. Please check your .env.local file.");
      }
      selectedModel = google(modelName);
    } else {
      // Ollama model
      selectedModel = ollama(modelName);
    }

    const result = streamText({
      model: selectedModel,
      messages,
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error("❌ [API Error]:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred during text generation.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
