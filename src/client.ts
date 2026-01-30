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
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'CHAT_WITH_AI',
          model: request.model || 'gpt-4o-mini',
          promptObject: {
            prompt: request.prompt,
            temperature: request.temperature || 0.7,
            maxTokens: request.maxTokens || 500,
            webSearch: request.webSearch || false,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `API Error: ${response.status} - ${error}`,
        };
      }

      const data = await response.json() as { data?: string };
      return {
        success: true,
        data: data.data || JSON.stringify(data),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async chatStream(request: ChatRequest): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${this.baseUrl}?isStreaming=true`, {
      method: 'POST',
      headers: {
        'API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'CHAT_WITH_AI',
        model: request.model || 'gpt-4o-mini',
        promptObject: {
          prompt: request.prompt,
          temperature: request.temperature || 0.7,
          maxTokens: request.maxTokens || 500,
          webSearch: request.webSearch || false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.body as ReadableStream<Uint8Array>;
  }
}