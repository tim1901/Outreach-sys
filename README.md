# Outreach OS — by Timileyin Ajuwon

AI-powered outreach agent. Research companies, find contacts, write emails, send, track, and follow up.

## Features
- ⚡ Agent — research any company and generate a personalized outreach email
- ⚡⚡ Batch — research multiple companies at once
- 👤 Contact Finder — find CEO, Founders, Ops leads at any company
- 📝 Templates — save and reuse your best email styles
- 📋 Tracker — track all outreach with status updates and follow-ups
- 📊 Analytics — reply rate, conversion rate, pipeline breakdown

## Deploy to Netlify

### Option 1: Drag & Drop (easiest)
1. Run `npm install && npm run build` locally
2. Drag the `build/` folder to [netlify.com/drop](https://netlify.com/drop)

### Option 2: GitHub + Netlify (recommended)
1. Push this folder to a GitHub repo
2. Go to [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import from Git"
3. Select your repo
4. Build command: `npm run build`
5. Publish directory: `build`
6. Click Deploy

## Setup
On first load, you'll be asked for your **Anthropic API key**.
- Get one at [console.anthropic.com](https://console.anthropic.com)
- Your key is stored only in your browser's localStorage
- Never shared with anyone except Anthropic's API directly

## Gmail Integration
The app sends emails via Gmail. Gmail integration works when running inside Claude.ai.
For standalone deployment, you'll need to add Google OAuth — or use the "Copy" button to copy emails and send manually.
