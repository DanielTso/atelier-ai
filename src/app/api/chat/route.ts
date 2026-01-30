import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ai-sdk-ollama';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { getChatWithContext } from '@/app/actions';
import { getGeminiApiKey, getOllamaBaseUrl } from '@/lib/settings';

// Configuration for hybrid context management
const RECENT_MESSAGES_LIMIT = 20; // Keep last N messages in full detail

export async function POST(req: Request) {
  try {
    const { messages, model, chatId } = await req.json();
    const modelName = model || 'gemini-3-flash-preview';

    console.log(`[API] Request for model: ${modelName}`);
    console.log(`[API] Messages count: ${messages?.length}`);

    // Determine which provider to use based on model name
    const isGeminiModel = modelName.startsWith('gemini');

    let selectedModel;
    if (isGeminiModel) {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        throw new Error("Google Gemini API Key is missing. Set it in Settings or .env.local.");
      }
      const google = createGoogleGenerativeAI({ apiKey });
      selectedModel = google(modelName);
    } else {
      const baseURL = await getOllamaBaseUrl();
      const ollama = createOllama({ baseURL });
      selectedModel = ollama(modelName);
    }

    // Build context with hybrid approach: system prompt + summary + recent messages
    let contextMessages = messages as UIMessage[];
    let systemPrompt: string | undefined;

    if (chatId) {
      const chat = await getChatWithContext(chatId);

      // System prompt is always included (never trimmed)
      if (chat?.systemPrompt) {
        systemPrompt = chat.systemPrompt;
        console.log(`[API] Using system prompt: ${systemPrompt.substring(0, 50)}...`);
      }

      if (chat?.summary) {
        // Apply sliding window to recent messages
        const recentMessages = contextMessages.slice(-RECENT_MESSAGES_LIMIT);

        // Prepend summary as context
        const summaryMessage: UIMessage = {
          id: 'summary-context',
          role: 'user',
          parts: [{
            type: 'text',
            text: `[Previous conversation context: ${chat.summary}]`
          }]
        };

        // Add a synthetic assistant acknowledgment
        const ackMessage: UIMessage = {
          id: 'summary-ack',
          role: 'assistant',
          parts: [{
            type: 'text',
            text: 'I understand the previous context. How can I continue helping you?'
          }]
        };

        contextMessages = [summaryMessage, ackMessage, ...recentMessages];
        console.log(`[API] Using hybrid context: summary + ${recentMessages.length} recent messages`);
      }
    }

    // Convert UIMessage to ModelMessage format for streamText
    const modelMessages = await convertToModelMessages(contextMessages);

    const result = streamText({
      model: selectedModel,
      system: systemPrompt, // System instruction is always first, never trimmed
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error("❌ [API Error]:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred during text generation.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
