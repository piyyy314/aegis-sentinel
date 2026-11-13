# Aegis Sentinel Security Dashboard

A defensive telemetry, cryptographic compliance and security operations dashboard for enterprise threat monitoring. It uses the Gemini API for AI-assisted analysis and can export reports as PDF.

## Stack

- React, Vite, Tailwind CSS, Recharts, Motion
- Express server (`server.ts`)
- Gemini API through `@google/genai`, jsPDF for reports

## Getting started

```bash
cp .env.example .env     # then set GEMINI_API_KEY
npm install
npm run dev              # tsx server.ts
```

| Script | What it does |
| --- | --- |
| `npm run dev` / `npm start` | Run the server with `tsx` |
| `npm run build` | Build the front end with Vite |
| `npm run preview` | Preview the production build |
| `npm run lint` | Type-check with `tsc --noEmit` |

## Configuration

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Required for Gemini API calls |
| `APP_URL` | URL where the app is hosted, used for self-referential links |

Never commit a real `.env` file.
