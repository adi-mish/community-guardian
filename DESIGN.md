# Community Guardian — Design Notes

## Problem framing

Local “safety” and “security” chatter is often noisy: near-duplicates, unverified claims, and urgency language can increase anxiety without helping people act. Community Guardian focuses on one job:

- capture structured reports (synthetic only)
- make them searchable and updateable (verification/resolution)
- generate a calm digest with a short checklist and explicit provenance (AI vs fallback)

## Why Scenario 3

Scenario 3 prioritizes **contextual relevance**, **trust/privacy**, and **anxiety reduction**. This prototype is deliberately narrow: it avoids maps, scraping, and social features and instead demonstrates a single end-to-end flow with one AI capability and a deterministic fallback.

## Architecture

- **Frontend:** React + TypeScript + Vite
- **Validation:** Zod schemas for reports and digests
- **Data:** synthetic seed JSON + local persistence via `localStorage`
- **AI:** server-side call to an OpenAI-compatible endpoint (Express) to keep secrets out of the browser
- **Fallback:** deterministic rules in shared code, used when AI is unavailable or malformed

### Key modules

- `src/lib/validation.ts`: enums + Zod schemas
- `src/data/reports.json`: synthetic dataset
- `src/lib/fallback.ts`: rule-based report checklist + digest generator
- `server/reportStore.ts`: canonical in-memory report store seeded from the dataset
- `server/openaiDigest.ts`: strict JSON-only AI call
- `server/digestService.ts`: “AI or fallback” decision + fail-closed behavior
- `server/app.ts`: API routes (`/api/health`, `/api/reports/sync`, `/api/digest`)

## Data model

### Report

Each report includes:

- `id`, `title`, `raw_description`
- `category` (exactly 3), `neighborhood`, `severity`
- `verification_status` (`unverified | community-verified | trusted-source | resolved`)
- `created_at`, `source_label`, `tags`
- `recommended_checklist`, `ai_summary`, `summary_mode`

### Digest

Digest output includes:

- `selected_report_ids`
- `digest_title`, `digest_summary`
- `key_risks`
- `action_checklist` (exactly 3 items)
- `confidence_label`
- `generated_at`
- `mode` (`ai` or `fallback`)
- `notes / caveats`

## AI path

The server boundary is intentionally “production-minded”:

- `POST /api/digest` accepts **report IDs only**
- the server resolves IDs against a canonical in-memory store
- unknown IDs are rejected with a 400

Flow:

1. UI optionally syncs selected reports to `POST /api/reports/sync` (best-effort) so newly created/edited client reports can be resolved server-side.
2. UI calls `POST /api/digest` with `{ report_ids }` (and optionally `force_fallback`).
3. Server resolves IDs to canonical records and sanitizes/truncates text before prompting.
4. Server requests **strict JSON only** with an exact schema.
5. Server parses and validates the output; any parse/schema mismatch fails closed to fallback.

## Fallback path

Fallback is not a “broken AI” experience; it is a first-class mode:

- keyword/category rules generate key risks
- category+severity templates generate a 1–2–3 action checklist
- confidence label is computed conservatively based on report verification status

Fallback can happen in two places:

- **Server-side fallback** when AI is unavailable/misconfigured or returns an unexpected response
- **In-browser fallback** when the user enables “Force in-browser fallback” or when the server can’t be reached

The UI shows a clear **Fallback-generated** badge and a short explanation message.

## Validation and error handling

- Report creation/editing uses Zod validation with clear messages (e.g., “Title is required.”).
- Digest generation requires at least one selected report (“Select at least one report to generate a digest.”).
- AI failures return a structured fallback digest plus a user-visible message.

## Security & privacy choices

- No authentication (out of scope), but also **no collection of personal data**.
- Reports are stored locally; the seed dataset is synthetic.
- AI secrets are never shipped to the browser; server reads `.env`.
- Prompts instruct the model to treat report text as untrusted and to output strict JSON only.

## Responsible AI decisions

- Explicit provenance badge: **AI-generated** vs **Fallback-generated**
- Source inspection: digest shows underlying reports
- Verification status is separated from “confidence label”
- Calm tone and “low-regret” recommended actions
- Clear caveat that output is not emergency/legal advice
 - Health/config visibility: header shows server reachability, AI configured state, and last digest mode (`/api/health`)

## Future enhancements (intentionally deferred)

- Stronger deduplication/clustering before digest generation
- Export digest (PDF) with timestamp and sources
- Separate “verification notes” field and audit trail
- Optional backend persistence for multi-device use (still avoiding personal data)
