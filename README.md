# 1minai Obsidian Plugin

AI chat integration for Obsidian powered by the 1minai API. Chat with AI directly in your notes with streaming responses.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the plugin:
   ```bash
   npm run build
   ```

   This creates `main.js` in the project root.

3. For development with auto-rebuild on changes:
   ```bash
   npm run dev
   ```

## Install in Obsidian (Local Testing)

1. Build the plugin first (see above)

2. Create plugin folder in your Obsidian vault:
   ```bash
   mkdir -p /path/to/your/vault/.obsidian/plugins/1minai
   ```

3. Copy plugin files:
   ```bash
   cp manifest.json main.js /path/to/your/vault/.obsidian/plugins/1minai/
   ```

4. Enable the plugin:
   - Open Obsidian Settings
   - Go to Community Plugins
   - Enable "1minai" from the list

5. Go to settings and set up your 1minai key

6. In your notes write a prompt and call AIchat
   Ctrl+P > 1minai AI Chat
   
   You should see output from AI streaming into your note.

## Development Workflow

After making changes:

```bash
# Rebuild
npm run build

# Copy to vault (adjust path)
cp main.js /path/to/your/vault/.obsidian/plugins/1minai/

# Reload plugin in Obsidian:
# Settings → Community Plugins → Disable then Enable "1minai"
# Or use the "Reload app without saving" command (Ctrl+R)
```

## Project Structure

```
├── src/
│   ├── main.ts      # Plugin entry point (extends Obsidian Plugin)
│   └── client.ts    # 1minai API client
├── manifest.json    # Obsidian plugin manifest
├── esbuild.config.mjs # Build configuration
└── main.js          # Built plugin (generated)
```

This repository was developed with the assistance of Claude code-generation tools. Portions of the code, documentation, and structural scaffolding may have been produced or refined using AI-assisted generation.

Users of this repository should evaluate the software according to their own quality, security, and compliance standards before deploying it in production environments.