# Community Guardian

Community Guardian is a compact prototype that ingests **synthetic** local safety + digital-security reports, lets you create/search/update them, and generates a **calm, actionable digest**. Digest generation prefers AI when configured, and **fails closed** to deterministic rules when AI is unavailable or malformed.

## Candidate / scenario

- **Candidate name:** Aditya Mishra
- **Scenario chosen:** Scenario 3
- **Estimated time spent:** ~5–6 hours

## Prerequisites

- Node.js 18.19+ (Node 18 is fine)
- npm

## Run

```bash
npm install

# Optional: enable AI digests (server-side only)
cp .env.example .env
# then set OPENAI_API_KEY in .env

npm run dev
```

- App: `http://localhost:5173`
- Server: `http://localhost:8787`

Tip: the header shows a small status line (server reachable, AI configured, last digest mode).

## Tests

```bash
npm test
```

## Core user flow (demo script)

1. Open **Reports** to browse the built-in synthetic dataset.
2. Click **New report**, create a validated report, and save.
3. Search and filter by category/severity/neighborhood/status.
4. Update verification status (e.g., **Community verified**, **Trusted source**, or **Resolved**).
5. Open **Digest generator**, select several reports, and click **Generate digest**.
6. Inspect:
   - digest title/summary, key risks, 1–2–3 checklist
   - **AI-generated** vs **Fallback-generated** badge
   - underlying source reports (raw text + checklist)
7. Toggle **Force in-browser fallback** to demonstrate deterministic mode.

## AI disclosure (product behavior)

- **Single AI capability:** digest summarization + action checklist generation.
- **Secrets:** `OPENAI_API_KEY` is read only by the local server (`server/`), never by the browser.
- **Contract hardening:** the digest API accepts **report IDs only**; the server resolves canonical reports and rejects unknown IDs.
- **Guardrails:** AI output must be strict JSON matching an exact schema; malformed/extra fields trigger deterministic fallback.
- **Fallback:** always available and clearly labeled (server-side fallback, plus an in-browser fallback when forced or when the server is unreachable).

## Verification of AI suggestions

- Verified by running `npm run build` and `npm test`, and by forcing AI-failure paths (no API key / invalid response) to ensure the fallback digest still works.

## One rejected/changed AI suggestion

- Initially considered adding per-report AI summaries; changed scope to keep AI usage to **digest generation only** (simpler, safer, and matches the brief’s “single AI capability” requirement).

## Tradeoffs & prioritization

- Used **localStorage** instead of a database to keep setup fast and keep data local.
- Kept the UI focused to three pages and one end-to-end story; no auth, no maps, no scraping.
- Server is a lightweight Express app for secret handling and for the AI boundary; production deployment concerns are intentionally out of scope.

## What was cut

- Authentication, multi-user collaboration, real maps/geolocation, push notifications, live data ingestion, and any “broad community platform” features.

## Next steps (if extended)

- Better deduplication / clustering to collapse near-duplicate reports in the digest.
- Export/share digest as a printable PDF with a timestamp and sources.
- Optional “report verification notes” separate from AI confidence.

## Known limitations

- Prototype only: no real database, no auth, no production deployment pipeline.
- AI digest quality depends on model availability/configuration; the fallback is intentionally conservative.

## Screenshots

- (Optional) Add screenshots here.

## Demo video

- Not recorded in this run (add an external link here when available).
