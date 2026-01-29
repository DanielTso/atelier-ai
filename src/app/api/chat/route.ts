import { createOllama } from 'ollama-ai-provider';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

const ollama = createOllama();

// Create the Google provider instance dynamically to ensure it picks up the latest env var
const createGoogleProvider = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ GOOGLE_GENERATIVE_AI_API_KEY is missing from environment variables.");
  }
  return createGoogleGenerativeAI({
    apiKey: apiKey || '',
  });
};

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    const modelName = model || 'llama3:latest';

    console.log(`[API] Request for model: ${modelName}`);

    let modelProvider;

    if (modelName.startsWith('gemini')) {
      const google = createGoogleProvider();
      // Check if key is actually present when a gemini model is requested
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error("Google Gemini API Key is missing. Please check your .env.local file.");
      }
      modelProvider = google(modelName);
    } else {
      modelProvider = ollama(modelName);
    }

    const result = await streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: modelProvider as any,
      messages,
      onFinish: (completion) => {
        // Optional: Log token usage or success here if needed
        // console.log("Stream finished");
      }
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error("❌ [API Error]:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred during text generation.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
