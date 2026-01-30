import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ai-sdk-ollama';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { getChatWithContext } from '@/app/actions';
import { getGeminiApiKey, getOllamaBaseUrl } from '@/lib/settings';
import { generateEmbedding, findSimilarMessages } from '@/lib/embeddings';

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
    let googleTools: Record<string, ReturnType<ReturnType<typeof createGoogleGenerativeAI>['tools']['googleSearch']>> | undefined;
    if (isGeminiModel) {
      const apiKey = await getGeminiApiKey();
      if (!apiKey) {
        throw new Error("Google Gemini API Key is missing. Set it in Settings or .env.local.");
      }
      const google = createGoogleGenerativeAI({ apiKey });
      selectedModel = google(modelName);
      // Enable Google Search grounding for Gemini models
      googleTools = {
        google_search: google.tools.googleSearch({}),
      };
      console.log('[API] Google Search grounding enabled');
    } else {
      const baseURL = await getOllamaBaseUrl();
      const ollama = createOllama({ baseURL });
      selectedModel = ollama(modelName);
    }

    // Build context with hybrid approach: system prompt + semantic context + summary + recent messages
    let contextMessages = messages as UIMessage[];
    let systemPrompt: string | undefined;
    let semanticContext: string | null = null;

    if (chatId) {
      const chat = await getChatWithContext(chatId);

      // 1. System prompt (always included, never trimmed)
      if (chat?.systemPrompt) {
        systemPrompt = chat.systemPrompt;
        console.log(`[API] Using system prompt: ${systemPrompt.substring(0, 50)}...`);
      }

      // 2. Semantic retrieval (NEW) — find relevant past messages
      try {
        const userMessages = (messages as UIMessage[]).filter(m => m.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1];
        if (lastUserMessage) {
          const queryText = lastUserMessage.parts
            ?.filter((part: { type: string }): part is { type: 'text'; text: string } => part.type === 'text')
            .map((part: { text: string }) => part.text)
            .join('') || '';

          if (queryText) {
            const queryEmbedding = await generateEmbedding(queryText, 'query');
            const similar = await findSimilarMessages(queryEmbedding, {
              projectId: chat?.projectId ?? undefined,
              chatId: !chat?.projectId ? chatId : undefined,
            }, 5, 0.7);

            // Filter out messages already in the recent window
            const recentIds = new Set((messages as UIMessage[]).map((m: UIMessage) => m.id));
            const relevantPast = similar.filter(s => !recentIds.has(String(s.messageId)));

            if (relevantPast.length > 0) {
              semanticContext = relevantPast.map(s => s.content).join('\n---\n');
              console.log(`[API] Semantic context: ${relevantPast.length} relevant past messages`);
            }
          }
        }
      } catch (e) {
        // Embedding unavailable — silently skip
        console.log('[API] Semantic retrieval skipped:', e instanceof Error ? e.message : 'unavailable');
      }

      // 3. Summary context (existing behavior)
      if (chat?.summary) {
        // Apply sliding window to recent messages
        const recentMessages = contextMessages.slice(-RECENT_MESSAGES_LIMIT);

        // Build context messages array
        const contextPrefix: UIMessage[] = [];

        // Add semantic context if available
        if (semanticContext) {
          contextPrefix.push(
            {
              id: 'semantic-context',
              role: 'user',
              parts: [{
                type: 'text',
                text: `[Relevant context from previous conversations]:\n${semanticContext}`
              }]
            },
            {
              id: 'semantic-ack',
              role: 'assistant',
              parts: [{
                type: 'text',
                text: "I understand, I'll use this context to inform my response."
              }]
            }
          );
        }

        // Add summary context
        contextPrefix.push(
          {
            id: 'summary-context',
            role: 'user',
            parts: [{
              type: 'text',
              text: `[Previous conversation context: ${chat.summary}]`
            }]
          },
          {
            id: 'summary-ack',
            role: 'assistant',
            parts: [{
              type: 'text',
              text: 'I understand the previous context. How can I continue helping you?'
            }]
          }
        );

        contextMessages = [...contextPrefix, ...recentMessages];
        console.log(`[API] Using hybrid context: ${semanticContext ? 'semantic + ' : ''}summary + ${recentMessages.length} recent messages`);
      } else if (semanticContext) {
        // No summary but semantic context available
        const semanticPrefix: UIMessage[] = [
          {
            id: 'semantic-context',
            role: 'user',
            parts: [{
              type: 'text',
              text: `[Relevant context from previous conversations]:\n${semanticContext}`
            }]
          },
          {
            id: 'semantic-ack',
            role: 'assistant',
            parts: [{
              type: 'text',
              text: "I understand, I'll use this context to inform my response."
            }]
          }
        ];
        contextMessages = [...semanticPrefix, ...contextMessages];
        console.log(`[API] Using semantic context with ${contextMessages.length - 2} messages`);
      }
    }

    // Convert UIMessage to ModelMessage format for streamText
    const modelMessages = await convertToModelMessages(contextMessages);

    const result = streamText({
      model: selectedModel,
      system: systemPrompt, // System instruction is always first, never trimmed
      messages: modelMessages,
      ...(googleTools && { tools: googleTools }),
    });

    return result.toUIMessageStreamResponse({ sendSources: true });

  } catch (error) {
    console.error("❌ [API Error]:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred during text generation.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
