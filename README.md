# AI Screenplay Studio

Turn an idea into a properly formatted screenplay through a guided workflow:

**Idea → Characters → Story Beats → Scenes → Screenplay**

At every stage the AI suggests, and the writer reviews, edits, regenerates, accepts or discards. Nothing is
overwritten silently.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite (`User`, `Project`, `Character`, `StoryBeat`, `Scene`, `Version`)
- Pluggable AI service layer (`src/lib/ai`) with structured JSON responses validated by zod

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000 — "View Demo" seeds a full example project ("The Last Signal").

## AI provider

The provider is chosen at runtime in `src/lib/ai/index.ts`:

| Env | Behaviour |
| --- | --- |
| `OPENAI_API_KEY` unset | deterministic local mock provider — the whole app works offline |
| `OPENAI_API_KEY` set | OpenAI-compatible chat completions (`OPENAI_BASE_URL`, `OPENAI_MODEL` optional) |

Every request is sent structured project memory (project info, logline, theme, characters, beats, scenes,
locations, timeline) rather than chat history, and every response is validated before it can be saved.

Service functions: `expandIdea`, `generateLogline`, `generatePremise`, `generateTheme`, `generateConflict`,
`generateStoryQuestions`, `generateStoryDirections`, `generateCharacters`, `improveCharacter`,
`generateRelationships`, `generateStoryBeats`, `generateScenes`, `generateSceneScreenplay`, `rewriteText`,
`checkContinuity`.

## Features

- Cinematic dark landing page and project creation (title, genre, language, format, duration, tone, reference, idea)
- Dashboard with pipeline status, item counts and last-updated times; stages are never locked
- Idea workspace with expand / logline / premise / theme / conflict / story questions / 3 story directions
- Character cards with all 15 fields, manual creation, and AI improve / complexity / backstory / arc / relationships
- Story beats (3-act default, 5-act and Save the Cat selectable) with add, edit, delete, reorder, expand-into-scenes
- Scene generator with per-scene screenplay generation and tone controls (tense, emotional, dialogue, shorten, expand, rewrite, continue)
- Screenplay editor with screenplay typography, per-element formatting, autosave, `Ctrl+S` save, `Ctrl+K` continuity check
- Selection-aware AI assistant that rewrites only the highlighted text
- Continuity checker sidebar with Fix / Ignore / View Scene
- Automatic scene version history with restore
- Export: TXT download, copy to clipboard, PDF via the print view; `buildFountainText` is ready for Fountain/Final Draft export later
