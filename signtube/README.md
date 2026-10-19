# SignTube

A standalone Next.js app that renders arbitrary YouTube videos as sign
language. It scrapes the caption track, maps each caption to a sign in the
SiGML lexicon, and drives a 3D avatar with the result.

It is one of four surfaces in the SignSync monorepo and reuses the same
lexicon and avatar engine as the main web app, the FastAPI detection service,
and the browser extension.

## Running it

```bash
npm install
npm run dev
```

Serves on `http://localhost:3000`.

## How it works

1. A YouTube URL is submitted and the caption track is fetched with
   `youtube-captions-scraper` (`lib/youtube.ts`).
2. Captions are cleaned and simplified for sign language by `lib/nlp.ts` —
   it lowercases, strips punctuation, removes articles and copulas, and
   collapses verb phrases (`"I am going to"` → `"i go"`).
3. Each remaining word is looked up in the SiGML lexicon.
4. The matching `.sigml` files are parsed with `xml2js` and handed to the
   Three.js avatar in `components/AvatarPanel.tsx`.

A Whisper-based fallback (`lib/useWhisperFallback.ts`) transcribes the audio
directly when captions are unavailable.

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/captions` | GET | Fetch the caption track for a YouTube video |
| `/api/process-text` | POST | Simplify and resolve text to sign IDs |
| `/api/sigml` | GET | Return the parsed markup for a sign ID |

## Layout

```
app/          Routes and API handlers
components/   Avatar panel, caption display, player, controls
lib/          Caption scraping, text simplification, YouTube helpers
store/        Zustand state
public/avatar Avatar engine, avatar models, shaders, SiGML files
scripts/      SiGML generation utilities
```

The avatar engine and models under `public/avatar/` are shared with the other
SignSync surfaces. `scripts/` contains the generators that produced the
alphabet and gap-filling SiGML files; they take input and output directories
as arguments.
