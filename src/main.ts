import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import {
  OneMinAISettings,
  DEFAULT_SETTINGS,
  OneMinAISettingTab,
} from "./settings";
import { OneMinAIClient } from "./client";

export default class OneMinAIPlugin extends Plugin {
  settings: OneMinAISettings;
  client: OneMinAIClient | null = null;

  async onload() {
    await this.loadSettings();
    this.initializeClient();
    this.addSettingTab(new OneMinAISettingTab(this.app, this));

    this.addCommand({
      id: "ai-chat",
      name: "AI Chat",
      editorCheckCallback: (checking: boolean, editor: Editor, view: MarkdownView) => {
        // Only show command when in editor view
        if (checking) {
          return true; // Command is available
        }
        // Execute command
        this.executeAIChat(editor);
      },
    });

    console.log("1minai plugin loaded, settings loaded");
  }

  onunload() {
    console.log("1minai plugin unloaded");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  initializeClient() {
    if (this.settings.apiKey && this.settings.apiKey.trim().length > 0) {
      this.client = new OneMinAIClient(this.settings.apiKey);
      console.log("1minai client initialized");
    } else {
      this.client = null;
      console.log("1minai client not initialized: API key missing");
    }
  }

  reinitializeClient() {
    this.initializeClient();
  }

  showNotice(message: string, duration?: number) {
    new Notice(message, duration || 5000);
  }

  handleApiError(error: string) {
    const errorLower = error.toLowerCase();
    let friendlyMessage: string;

    if (errorLower.includes("401") || errorLower.includes("unauthorized")) {
      friendlyMessage = "Invalid API key. Check your settings.";
    } else if (errorLower.includes("403") || errorLower.includes("forbidden")) {
      friendlyMessage = "API access denied. Check your subscription.";
    } else if (errorLower.includes("429") || errorLower.includes("rate limit")) {
      friendlyMessage = "Rate limited. Please wait and try again.";
    } else if (errorLower.includes("500") || errorLower.includes("server error")) {
      friendlyMessage = "Server error. Try again later.";
    } else {
      friendlyMessage = `API Error: ${error}`;
    }

    this.showNotice(friendlyMessage);
  }

  private extractPrompt(editor: Editor): string | null {
    const cursor = editor.getCursor();
    const text = editor.getRange({ line: 0, ch: 0 }, cursor);
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async executeAIChat(editor: Editor): Promise<void> {
    if (!this.client) {
      this.showNotice("Configure API key in settings first.");
      return;
    }

    const prompt = this.extractPrompt(editor);
    if (!prompt) {
      this.showNotice("No prompt text found. Write something above the cursor.");
      return;
    }

    // Insert role marker at cursor position
    const cursor = editor.getCursor();
    const roleMarker = "\n\n> [!ai]\n> ";
    editor.replaceRange(roleMarker, cursor, cursor);

    // Track insertion position for streamed content
    // After marker "\n\n> [!ai]\n> ", content starts at line+3, ch 2 (after "> ")
    let insertPos = {
      line: cursor.line + 3,
      ch: 2
    };

    const markerPos = { line: cursor.line, ch: cursor.ch };
    let contentReceived = false;

    try {
      // Call streaming API
      const stream = await this.client.chatStream({
        prompt: prompt,
        model: this.settings.model,
        temperature: this.settings.temperature,
      });

      // Process stream
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let lastChunkEndedWithNewline = false;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });

        if (chunk.length > 0) {
          contentReceived = true;
        }

        // Format for callout (prefix new lines with "> ")
        const lines = chunk.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (i > 0) {
            // This is a new line - insert newline with callout prefix
            editor.replaceRange('\n> ', insertPos, insertPos);
            insertPos = { line: insertPos.line + 1, ch: 2 };
          }

          // Insert the text content
          if (line.length > 0) {
            editor.replaceRange(line, insertPos, insertPos);
            insertPos = { line: insertPos.line, ch: insertPos.ch + line.length };
          }
        }

        lastChunkEndedWithNewline = chunk.endsWith('\n');
      }
    } catch (error) {
      // Remove marker if no content was received
      if (!contentReceived) {
        const endPos = {
          line: cursor.line + 3,
          ch: 2
        };
        editor.replaceRange('', markerPos, endPos);
      }

      // Handle different error types
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.toLowerCase().includes('fetch') ||
          errorMessage.toLowerCase().includes('network')) {
        this.showNotice("Network error. Check your connection.");
      } else if (errorMessage.toLowerCase().includes('api error')) {
        // Use existing handleApiError for API errors
        this.handleApiError(errorMessage);
      } else {
        this.showNotice("Stream interrupted. Response may be incomplete.");
      }
    }
  }
}
