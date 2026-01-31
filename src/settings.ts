import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type OneMinAIPlugin from "./main";

export interface OneMinAISettings {
  apiKey: string;
  model: string;
  temperature: number;
}

export const DEFAULT_SETTINGS: OneMinAISettings = {
  apiKey: "",
  model: "gpt-4o-mini",
  temperature: 0.7,
};

export const AVAILABLE_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "claude-3-5-sonnet",
  "gemini-1.5-flash",
];

export class OneMinAISettingTab extends PluginSettingTab {
  plugin: OneMinAIPlugin;

  constructor(app: App, plugin: OneMinAIPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // API Key setting
    new Setting(containerEl)
      .setName("API key")
      .setDesc("Your 1min.ai API key")
      .addText((text) => {
        text
          .setPlaceholder("Enter your API key")
          .setValue(this.plugin.settings.apiKey)
          .onChange((value: string) => {
          this.plugin.settings.apiKey = value;
          void this.plugin.saveSettings();
        });
        const input = text.inputEl;
        if (input instanceof HTMLInputElement) {
          input.type = "password";
        }
      });

    // Test Connection button
    new Setting(containerEl)
      .setName("Test connection")
      .setDesc("Verify your API key works")
      .addButton((button) =>
         button.setButtonText("Test").onClick(() => {
          void (async () => {
          // Check if API key is empty
          if (!this.plugin.settings.apiKey || this.plugin.settings.apiKey.trim().length === 0) {
            new Notice("Please enter an API key first");
            return;
          }

          // Disable button during test
          button.setDisabled(true);
          button.setButtonText("Testing...");

          try {
            // Reinitialize client with current key
            await this.plugin.saveSettings();
            this.plugin.reinitializeClient();

            // Check if client exists
            if (!this.plugin.client) {
              new Notice("Failed to initialize client");
              return;
            }

            // Make test API call
            new Notice("Testing connection...");
            const result = await this.plugin.client.chat({
              prompt: "Say 'Connection successful' in exactly those words.",
              model: this.plugin.settings.model,
              temperature: 0.1,
            });

            // Show result
            if (result.success) {
              new Notice("Connection successful! API key is valid.");
            } else {
              new Notice(`Connection failed: ${result.error}`);
            }
          } finally {
            // Re-enable button
            button.setDisabled(false);
            button.setButtonText("Test");
          }
        })();
      })
      );

    // Model setting
    new Setting(containerEl)
      .setName("Model")
      .setDesc("AI model to use for chat")
      .addDropdown((dropdown) => {
        AVAILABLE_MODELS.forEach((model) => { dropdown.addOption(model, model); });
        dropdown.setValue(this.plugin.settings.model);
        dropdown.onChange((value: string) => {
          this.plugin.settings.model = value;
          void this.plugin.saveSettings().catch(console.error);
        });
      });

    // Temperature setting
    new Setting(containerEl)
      .setName("Temperature")
      .setDesc("Controls randomness (0.0 = focused, 1.0 = creative)")
      .addSlider((slider) =>
        slider
          .setLimits(0, 1, 0.1)
          .setValue(this.plugin.settings.temperature)
          .setDynamicTooltip()
          .onChange((value: number) => {
          this.plugin.settings.temperature = value;
          void this.plugin.saveSettings();
        }));
  }
}
