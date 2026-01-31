# Markdown to Slack

## Overview
A web application that converts rich Markdown text (from ChatGPT, Notion, etc.) into Slack's `mrkdwn` format. It ensures that tables, nested lists, and headers are displayed correctly in Slack without breaking the layout.

Features:
- **Table Conversion**: Converts Markdown tables into ASCII-aligned code blocks or list-style formats for mobile readability.
- **List Preservation**: Handles nested lists with proper indentation using full-width spaces.
- **Header Formatting**: Converts headers to bold text or emoji-prefixed styles.
- **Privacy First**: All processing works client-side; no data is sent to any server.

## Tech Stack
- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **Libraries**: 
  - `markdown-it` (Markdown parsing)
  - `wcwidth` (Character width calculation for table alignment)
  - `lucide-react` (Icons)

## Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Usage

1. Paste your Markdown text into the left input panel.
2. Select options (if needed):
   - **Header Style**: Simple (Bold) or Emoji.
   - **Table Style**: Code Block (Recommended for PC) or List Style (Recommended for Mobile).
3. Click the **Copy** button on the right panel.
4. Paste the result into Slack.

## Directory Structure
```
.
├── src/
│   ├── assets/       # Static assets
│   ├── lib/          # Core conversion logic
│   │   └── converter.ts
│   ├── App.tsx       # Main application component
│   ├── main.tsx      # Entry point
│   └── index.css     # Tailwind CSS entry
├── public/           # Public static files
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## License

This repository is for personal/private use only.
