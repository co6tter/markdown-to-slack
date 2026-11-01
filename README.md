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
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **Libraries**: 
  - `markdown-it` (Markdown parsing)
  - `@cto.af/string-width` (Unicode display width calculation for table alignment)
  - `unicode-segmenter` (Grapheme segmentation compatibility for older browsers)
  - `lucide-react` (Icons)

## Setup

Use Node.js 22.18 or later and pnpm. The test runner uses Node.js's built-in TypeScript support.

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Verification

```bash
# Conversion regressions and browser compatibility
pnpm test

# Static analysis
pnpm lint

# Type checks and production build
pnpm build
```

The browser compatibility test bundles the converter for Firefox 114 and Safari 16.4,
then runs it without native `Intl.Segmenter` or support for the RegExp `v` flag.

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
