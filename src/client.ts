import { requestUrl } from "obsidian";

export interface ChatRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  webSearch?: boolean;
}

export interface ChatResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export class OneMinAIClient {
  private apiKey: string;
  private baseUrl = 'https://api.1min.ai/api/features';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
  }
async chat(request: ChatRequest): Promise<ChatResponse> {
  try {
    const res = await requestUrl({
      url: this.baseUrl,
      method: "POST",
      headers: {
        "API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "CHAT_WITH_AI",
        model: request.model ?? "gpt-4o-mini",
        promptObject: {
          prompt: request.prompt,
          temperature: request.temperature ?? 0.7,
          maxTokens: request.maxTokens ?? 500,
          webSearch: request.webSearch ?? false,
        },
      }),
    });

    if (res.status < 200 || res.status >= 300) {
      return {
        success: false,
        error: `API error: ${res.status} - ${res.text}`,
      };
    }

    // Obsidian returns parsed JSON in `.json` when possible
    const json = res.json as unknown;

    if (typeof json === "object" && json !== null && "data" in json) {
      const dataField = (json as { data?: unknown }).data;
      return {
        success: true,
        data: typeof dataField === "string" ? dataField : JSON.stringify(json),
      };
    }

    return {
      success: true,
      data: JSON.stringify(json),
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async chatStream(request: ChatRequest): Promise<ReadableStream<Uint8Array>> {
  const res = await requestUrl({
    url: `${this.baseUrl}?isStreaming=true`,
    method: "POST",
    headers: {
      "API-KEY": this.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "CHAT_WITH_AI",
      model: request.model ?? "gpt-4o-mini",
      promptObject: {
        prompt: request.prompt,
        temperature: request.temperature ?? 0.7,
        maxTokens: request.maxTokens ?? 500,
        webSearch: request.webSearch ?? false,
      },
    }),
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`API error: ${res.status}`);
  }

  const text = typeof res.text === "string" ? res.text : JSON.stringify(res.json);

  const encoder = new TextEncoder();

  // Simulated streaming
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const chunkSize = 50; // adjust for smoother UI streaming

      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}
}

