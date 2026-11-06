# 43 — AI Assistant Drawer: Page-Aware Text and Live Voice

**Document status:** Stages 0 to 4 delivered; Stage 5 prepared, with the owner's two switches recorded in §11
**Opened:** November 3, 2026
**Owner:** Product owner (Vid)
**Audience:** Product owner, Claude Code, Codex, developers

---

## 1. What the owner asked for

An assistant that lives on every Command Center page, understands the data on the page the person is looking at, answers questions about it in text, and can also hold a live spoken conversation. It should open as a drawer from the bottom of the screen. The OpenAI models used for the live conversation must be selectable, and daily use limits must be settable.

## 2. Recommendation in one paragraph

Build one assistant with two transports and one brain. The brain is a server-side tool loop: the model never sees the database, it calls a small set of read-only tools (the agent tool registry already has the pattern), each tool checks the caller's permissions, and the page tells the assistant what it is looking at by registering a page context. Text mode uses the Responses API with streaming. Voice mode uses the Realtime API over WebRTC from the browser with a short-lived client secret minted by the server, and its tool calls are executed by the same server-side tools, never by the browser. Both transports are metered into one ledger and refused when a daily cap is reached. The drawer is a bottom sheet in the application shell, full-height on a phone and about 45% of the viewport on a desktop. Nothing the assistant does writes to a source system; it reads, explains, and can at most draft a Task for a human.

## 3. Why these choices

### 3.1 One tool loop, two transports

The text path and the voice path must not have separate data access. If they did, the permission redaction that exists today for the AI Analyst would have to be reimplemented twice and would drift. The Realtime API supports function calling with the same JSON-schema tool definitions as the Responses API, and the browser only relays the call to the server and the result back. So one `assistant/tools.ts` serves both.

### 3.2 Page context as a declared contract, not a screen scrape

Each page registers a small typed object: route, entity type and id, active filters, date range, store and division, and the headline figures already rendered. The assistant's system prompt includes it, and tools accept it as an argument so "what is this customer's lifetime value" resolves to the customer on screen. This is more reliable than reading the DOM, costs nothing in tokens compared with sending the HTML, and keeps the assistant from seeing anything the page did not already show.

### 3.3 GPT-Live over WebRTC, with the server holding the key (revised November 6, 2026)

The plan was written for OpenAI's Realtime API. By the time Stage 3 was built, OpenAI had marked the Realtime models deprecated and shipped **GPT-Live** (`gpt-live-1`), which the owner asked for by name. The shape is better for this application: the browser sends its WebRTC offer to our server, our server opens the session with the API key (which therefore never leaves the server, and needs no client secret), and the voice model hands every question about the business to a **backend text model** (the assistant's configured text model, `gpt-5-mini` by default) that carries the same read-only tools as text mode. Tool calls still come to the browser on the data channel, the browser relays each to our tool route, and the result goes back the same way; the browser runs nothing. Audio travels directly between the browser and OpenAI, so Render carries no audio. The voice session is billed by the second ($0.05 a minute); the backend model by its tokens.

GPT-Live has no time-to-live field. The "longest live session" setting is enforced by the browser (a timer that sends `session.close`) and by the server (each usage report answers with a stop reason once the session's seconds or the day's minutes reach a cap).

### 3.4 Budgets as a chokepoint, not a convention

Every OpenAI client is handed out by one function. Since Stage 0 that function checks the day's spend before handing the client over and meters every billable response it makes. Features do not need to remember to check; a cap holds for Product Studio's unattended runs as much as for the drawer.

### 3.5 Bottom drawer

A bottom sheet keeps the page visible above it, which matters because the assistant is about the page. On a phone it opens full height with the transcript scrolling and the composer pinned. On a desktop it is resizable between a one-line bar and roughly half the viewport. A right-side drawer would compete with the detail drawers that list pages already use.

## 4. Architecture

```
Browser                                  Render web service                    OpenAI
───────                                  ──────────────────                    ──────
AssistantDrawer (client)                 /api/ai/assistant/chat  ───────────►  Responses (stream)
  ├ PageContextProvider (per page)         ├ permission + budget check            │
  ├ Text transcript + composer             ├ system prompt + page context          │
  ├ Voice: WebRTC peer ◄────────────────── ├ tool loop (server executes) ◄─ tool calls
  │    │  audio both ways                  └ meters usage (client wrapper)
  │    ▼                                  /api/ai/assistant/voice/session ─►  realtime/client_secrets
  │  data channel: tool calls ──────────► /api/ai/assistant/voice/tool
  │  response.done usage ───────────────► /api/ai/assistant/voice/usage ──►  AiUsageEvent
  └ session end / cutoff ───────────────► /api/ai/assistant/voice/end   ──►  AiUsageEvent (seconds)
```

### 4.1 Server modules

| Module | Responsibility |
|---|---|
| `src/server/services/ai/assistant/tools.ts` | The read-only tool registry: definitions (JSON schema) and executors. Each tool declares its permission. |
| `src/server/services/ai/assistant/prompt.ts` | System prompt builder: role, rules (never invent figures, say when data is redacted or stale, no actions), the page context block. |
| `src/server/services/ai/assistant/chat.ts` | Text turn: Responses API streaming with the tool loop, `AiOutput` persistence of the final answer, audit. |
| `src/server/services/ai/assistant/voice.ts` | Mint a client secret with session config (model, voice, instructions, tools, transcription model, TTL), record session start, end and usage. |
| `src/server/services/ai/budget.ts` | Delivered in Stage 0. Caps, day window, ledger reads and writes. |
| `src/server/integrations/openai/metering.ts` | Delivered in Stage 0. Meters every billable call. |

### 4.2 Routes

| Route | Method | Checks | Notes |
|---|---|---|---|
| `/api/ai/assistant/chat` | POST | session, `ai.use`, spend budget | Streams text deltas and tool events as server-sent events. Body: messages, page context. |
| `/api/ai/assistant/voice/session` | POST | session, `ai.use`, `ai.live_voice` flag, voice budget | Returns the client secret, the session id, and the expiry. TTL = longest-session setting. |
| `/api/ai/assistant/voice/tool` | POST | session, `ai.use`, per-tool permission | Executes one tool call relayed from the data channel. Bounded result size. |
| `/api/ai/assistant/voice/usage` | POST | session, must own the session id | Accepts `response.done` usage objects; recorded with `kind: realtime`. |
| `/api/ai/assistant/voice/end` | POST | session, must own the session id | Records wall seconds; idempotent. The server also closes any session whose TTL passed without an end call. |

Routes live under the dashboard surface on Render. Nothing is added to the Vercel public build.

### 4.3 Tools as built (November 4, 2026)

The owner widened the brief on November 4: the assistant answers from the whole database, the public website, the BigCommerce storefronts' APIs, and the outside world. The registry in `tools.ts` holds the curated tools below plus four windows: `website_content` (the public content modules, flattened), `bigcommerce_read` (GET only, an allowlist of paths, pages capped at 50), `database_schema` and `database_query` (one SELECT inside a read-only transaction with a 10-second timeout and a 200-row cap, refused for credential and user tables), and the model's own web search. The two SQL tools are offered to an account holding all three AI context permissions, which together grant whole-data visibility through every other tool (owner, November 4: "the AI should have authority to run SQL queries on the database as needed"); the queries are still read-only. Each tool is gated by permissions at offer time and again at run time; `tools.test.ts` pins that nothing in the directory writes except the answer's own `AiOutput` row. Conversation memory chains turns with the Responses API's previous response id; the client sends it back with each question.

### 4.3a Tools (first set, as planned)

All read-only, all bounded, all permission-checked. They reuse existing services rather than new queries.

| Tool | Permission | Source |
|---|---|---|
| `get_page_summary` | `ai.use` | Returns the registered page context as the model may quote it. |
| `dashboard_snapshot` | `ai.use` (+ financial and customer context redaction) | `filterDashboardForAi` as the AI Analyst uses today. |
| `customer_lookup` | `customers.view` | Customer by id or search; lifetime figures under the sale rule (docs/42). |
| `order_lookup` | `orders.view` | Order by id or number, with status, payment, exceptions. |
| `product_performance` | `products.view` | Sales Intelligence figures for a product or range. |
| `sales_range` | `ai.use_financial_context` | Revenue, orders and units for a range per store under the sale rule. |
| `open_exceptions` | `operations.view` | Exceptions list, bounded. |
| `my_tasks` | `tasks.view` | The caller's open tasks. |
| `draft_task` | `tasks.create` | Returns a proposed Task for the person to confirm in the drawer. It does not create one. |

Tool results are fenced as untrusted data in the prompt, as the agent runner already does. Results are capped in size so a tool cannot pour a table into the context.

### 4.4 Page context

```ts
type AssistantPageContext = {
  route: string;                       // "/customers/[id]"
  title: string;                       // what the header says
  entity?: { type: "customer" | "order" | "product" | "supplier" | "opportunity"; id: string; label: string };
  filters?: Record<string, string>;    // as the URL carries them
  range?: { from: string; to: string };
  storeId?: string;
  divisionId?: string;
  figures?: { label: string; value: string }[];  // the headline numbers already on screen
};
```

A `PageContextProvider` in the shell holds it; a page calls `useAssistantPageContext(ctx)` in its client island, or a server page renders `<AssistantPageContext value={...} />`. The drawer reads it on each turn, so navigating changes what the assistant knows without restarting the conversation.

### 4.4a Registrations as built (November 6, 2026)

Eleven server pages render `<AssistantPageContext value={…} />` with what their header shows: the executive dashboard (period and its KPIs), the customers list (type, consent, store, search, sort, page, the matching total) and a customer (type, store, consent, lifetime value, orders, last order), the orders list (status, exceptions, search, division, page, the matching total) and an order (store, date, status, payment, fulfillment, exception, total), the products list (store, category, status, quality, segment, search, the performance range, page, the matching total) and a product (SKU, category, price, 90-day revenue, units and margin), analytics (range, store, users, sessions, purchases, revenue, conversion), the operations control centre (queue, store, the queue counts) and its exceptions list (status, severity, type, search, the count), and financials (period, division, the period's dates, revenue, gross profit, margin, operating income, cash, approval, currency). The figures are the formatted strings the page itself shows, so the assistant quotes what the person sees and nothing the page did not render.

`draft_task` is the registry's one workflow tool and still writes nothing: it is offered only to a person with `tasks.create`, it returns the normalised draft (title, description, priority, due date, related record), the turn's `drafts` carry it to the drawer, and the drawer shows a card with Create. Create posts to `/api/ai/assistant/tasks`, which creates the task through the existing task service under the person's own user with `sourceType: ai_recommendation` and the answer's `AiOutput` id as its source. A draft the backend makes during a voice session appears the same way, during the session and in its record afterwards.

### 4.5 Client

| Piece | Behaviour |
|---|---|
| `AssistantDrawer` | Bottom sheet in `AppShell`, present on every dashboard route for users with `ai.use`. Collapsed: a 44 px bar with the assistant icon, the page title, and a microphone button. Expanded: transcript, composer, mode toggle, budget strip. |
| Text mode | Sends messages and page context to the chat route; renders streamed deltas; shows tool calls as collapsed rows ("Looked up order 76507"). |
| Voice mode | Requests the microphone, posts to the session route, opens a WebRTC peer to OpenAI with the client secret, plays remote audio, shows live transcript from the transcription events, relays tool calls to the tool route, posts usage events, and ends on button, on TTL, on navigation away, or on tab close. |
| Dictation | Hold-to-talk in text mode transcribes through the transcription model and fills the composer; cheaper than a full voice session for a one-off question. |
| Budget strip | Shows today's spend and voice minutes against the caps, and the reason when a mode is blocked. |
| Phone | Full-height sheet; composer above the keyboard; the mic button is a large target; the sheet closes on back. |

### 4.5a The drawer as built (November 6, 2026)

`src/components/ai/assistant/AssistantDrawer.tsx`, mounted once in the shell's client boundary (`DockShell`) for anyone with `ai.use`. Below `md` it is a full-height sheet that the dock's AI key opens and the X or the phone's back closes (opening pushes a history entry; the pop closes). From `md` up it is a 44 px bar at the foot of the page, after the main area in the shell's column, that expands to 45% of the viewport. The dock's earlier tinted panel is gone.

Text mode posts to `/api/ai/assistant/chat`, which runs the Stage 1 turn with `stream: true` and relays server-sent events: `tool` (running, done or skipped, with the reason), `delta` (the answer's text as the model writes it; a new tool round drops the text so far, which was the model thinking aloud), and `done` with the whole turn and today's budget, or `error`. The page context is sanitised to its declared fields and sizes on the way in. Enter sends, Shift+Enter breaks a line, Stop aborts the request, New starts a conversation. The budget strip reads `/api/ai/assistant/budget` when the drawer comes into view, not on every page load, and is refreshed by each `done` event; it names today's spend against the caps, the person's own cap when set, and the voice minutes, or "voice off" while the flag is off. The microphone button is present and disabled with the reason until Stage 3. A page registers its context through `useAssistantPageContext` or `<AssistantPageContext value=… />`; a page that registers nothing still sends its route and module name. The AI Analyst page keeps its own conversation component on the same turn service.

### 4.5b Live voice as built (November 6, 2026)

`src/server/services/ai/assistant/voice.ts` opens the session: it checks the flag and the voice budget, resolves the live model (must be a `gpt-live` model; a Realtime name is refused with a message naming the setting), the voice and the backend model, builds the voice instructions in OpenAI's template for `gpt-live-1` (role, backchannel policy, interruption policy, and a delegation policy naming when to generate `<|SpawnThinking|>`) and the backend instructions (the text assistant's, plus "answer for a spoken conversation"), and posts `{ session: { model, instructions, audio.output.voice, delegation: { type: "responses", responses: { model, instructions, tools, tool_choice } } }, transport: { type: "webrtc", sdp } }` to `/v1/live/sessions`. The answer's SDP goes back to the browser with the session id and the limit in seconds. The session is one `AiOutput` (module `assistant.voice`) created at start and completed at the end with the transcript; its ledger row begins with the 15 initialisation seconds OpenAI bills and is overwritten with the running total the browser reports, so a cut connection still leaves what was spent; each backend response is its own ledger row keyed by its response id.

Routes under `/api/ai/assistant/voice/`: `session` (POST the offer and the page context), `tool` (run one relayed call under the person's permissions), `usage` (seconds and backend tokens; answers with a stop reason when a cap is reached), `end` (final seconds, reason, transcript; idempotent; accepts a beacon). `/api/ai/assistant/dictate` transcribes a hold-to-talk clip with the transcription model, metered as `assistant.dictation`.

In the browser, `voice-events.ts` folds the data channel's events (`session.started`, `session.input_transcript.delta`, `session.output_transcript.delta`, `session.usage.updated`, `session.closed`, the nested `response.event` carrying `response.output_item.done` function calls and `response.completed` usage, and `error`) into the transcript and the effects to carry out; `use-voice-session.ts` owns the peer connection, the microphone, the audio element and the effects (relay a tool, report usage every ten seconds, end on the button, on a stop from the server, on the timer, on leaving the page, or on the tab closing by beacon). The drawer shows the live transcript with a timer against the limit and an End button, keeps a finished session in the thread, enables the microphone button only when the flag is on and the budgets allow (its tooltip gives the reason otherwise), and offers hold-to-talk dictation that fills the composer.

### 4.6 Persistence and audit

Each completed text turn is an `AiOutput` with module `assistant.text`, the question as prompt, the answer as output, the tool calls and page context as source references. A voice session is one `AiOutput` with module `assistant.voice` holding the transcript, written at session end. Audit rows: `ai.assistant_query`, `ai.assistant_voice_started`, `ai.assistant_voice_ended`, with the user, model, duration and estimated cost. The ledger rows carry `feature` values `assistant.text`, `assistant.voice`, `assistant.dictation`.

## 5. Budgets and models

### 5.1 Settings (Stage 0, delivered)

| Setting | Default | Meaning |
|---|---|---|
| `ai.openai_realtime_model` | empty, falls back to `gpt-realtime` | The model that holds a voice session. `gpt-realtime-mini` is roughly a third of the audio price. |
| `ai.openai_realtime_voice` | empty, falls back to `marin` | One of the ten built-in voices. |
| `ai.openai_transcribe_model` | empty, falls back to `gpt-4o-mini-transcribe` | Transcribes the person's speech in a session and dictation in text mode. |
| `ai.budget.daily_usd` | 0, no cap | Estimated spend per day across every feature and every user. |
| `ai.budget.daily_usd_per_user` | 0, no cap | The same, per user. Unattended runs count only against the everyone cap. |
| `ai.budget.daily_voice_minutes` | 60 | Live session wall minutes per day, everyone. |
| `ai.budget.daily_voice_minutes_per_user` | 20 | The same, per user. |
| `ai.budget.voice_session_max_minutes` | 15 | TTL of a session's client secret; always enforced. |

Environment overrides exist for the three model settings (`OPENAI_REALTIME_MODEL`, `OPENAI_REALTIME_VOICE`, `OPENAI_TRANSCRIBE_MODEL`) and follow the same env-wins rule as the text and image models. Voice sessions also require the `ai.live_voice` feature flag, default off.

### 5.2 How a cap is enforced

1. `getOpenAiClient()` calls `assertAiBudget({ kind: "spend" })` before returning a client. When the day's estimated spend has reached the everyone cap, or the user's spend their per-user cap, it throws `AiBudgetExceededError` with a message naming the cap and the reset time.
2. Every billable response the client receives is parsed on a clone and written as an `AiUsageEvent` with the attribution the caller gave (user and feature). Streamed responses are read as they stream; the caller is not held up.
3. The voice session route calls `assertAiBudget({ kind: "voice" })`, which adds the minute caps, before minting a secret. Usage and seconds are recorded as the session reports them and when it ends.
4. The day resets at midnight `America/Toronto`.

The estimated cost comes from `services/ai/pricing.ts`, a table of list prices dated in the file. An unknown model is priced at the dearest rate of its kind so a cap stops early rather than failing open. The OpenAI invoice is the billed amount; the ledger is for control, not accounting.

### 5.3 What a budget does not do

It does not stop a call in flight, and it does not refund. A long Product Studio run that starts under the cap finishes. The per-call ceiling is the existing max-output-tokens setting for text and the session TTL for voice.

## 6. Security and privacy

- The API key never reaches the browser. The client secret is single-session, minutes-long, and bound to the session configuration the server chose (model, voice, instructions, tools).
- Tools run on the server under the caller's permissions, with the same redaction the AI Analyst applies. The model cannot ask for more than the person could see.
- The assistant never writes to BigCommerce, QuickBooks, Mailchimp or a supplier portal, and never sends a message. `draft_task` proposes; the person confirms in the drawer and the existing task service creates the row under their user.
- Customer personal data: tools return what the page already shows. The system prompt forbids reading out email addresses or phone numbers in voice mode unless asked for them by that customer's name.
- Transcripts are stored as `AiOutput` rows, which the `ai.view_logs` permission governs. Audio is never stored.
- Prompt injection: tool results and page figures are fenced as data, as the agent runner does, and the system prompt tells the model they are not instructions.
- The microphone is requested on the first voice session and released when it ends. The browser shows its own indicator.

## 7. Cost picture (estimates at list prices, 2026-11-03)

| Use | Model | Rough cost |
|---|---|---|
| One text question with two tool calls | gpt-5-mini | under $0.01 |
| One text question with two tool calls | gpt-5 | $0.02 to $0.05 |
| One minute of live dialog | gpt-live-1 (voice) | $0.05, billed by the second, plus the backend model's tokens (about $0.01 a question on gpt-5-mini) |
| One minute of live dialog | gpt-realtime (deprecated, not supported by the voice service) | about $0.30 to $0.50 depending on how much each side talks |
| One minute of dictation | gpt-4o-mini-transcribe | about $0.003 |

The default voice allowances (60 minutes a day, everyone) therefore bound voice at about $3 a day of session time on gpt-live-1, plus the backend's tokens. A spend cap of $25 to $50 a day would cover present use with room; the owner sets it.

## 8. Stages

Each stage is one run: branch from main, build, verify with typecheck, lint, format, tests and build, open a pull request, wait for checks, squash-merge. The migration in Stage 0 is the only schema change the plan needs.

| Stage | Deliverable | Status |
|---|---|---|
| 0 | Usage ledger and daily budgets enforced at the client; live-dialog model, voice and transcription settings; feature flag; this document. | Delivered November 3, 2026 (this PR). |
| 1 | The brain: the tool registry (`src/server/services/ai/assistant/tools.ts`), the tool loop on the Responses API with web search (`answer.ts`), the page-context type, `AiOutput` and audit rows; the AI Analyst page and the dock panel run on it. Streaming deferred. | Delivered November 4, 2026. See §4.3 as built. |
| 2 | The drawer: bottom sheet in the shell, text mode, tool-call rows, budget strip, phone layout, Playwright checks at 390 px and desktop. | Delivered November 6, 2026. See §4.5a as built. |
| 3 | Live voice: session, tool and usage routes; WebRTC client; transcript; dictation; cutoffs; the flag turned on in staging only. | Delivered November 6, 2026, on GPT-Live. See §4.5b as built. |
| 4 | Page registrations across the main modules (dashboard, customers, orders, products, sales intelligence, operations, finance), and `draft_task`. | Delivered November 6, 2026. See §4.4a as built. |
| 5 | Production enablement: owner turns on `ai.live_voice`, sets caps, two-week review of the ledger by feature, then widen tools. | Prepared November 6, 2026: the code is live and the switches are the owner's. See §11. |

## 9. Decisions for the owner

| Id | Decision | Default if not decided |
|---|---|---|
| A-1 | Daily spend cap values. | None; no cap until set. Recommended $25 to $50 everyone, $10 per user. |
| A-2 | Voice model. Since November 6, 2026 only `gpt-live-1` can open a session (the Realtime models are deprecated); the cost lever is the backend text model. | `gpt-live-1`, backend `gpt-5-mini`. |
| A-3 | Whether the assistant may read personal contact details aloud. | No, unless asked by name. |
| A-4 | Whether voice sessions should be transcribed and kept as `AiOutput` rows. | Yes, text only, under `ai.view_logs`. |
| A-5 | Whether `draft_task` ships in Stage 4 or waits. | Ships, confirm-only. |

## 10. Relationship to Phase 11

The assistant is an internal feature on the Render surface and adds no public page. It widens the surface that Phase 11C (security) and 11E (performance) evidence must cover (`BLK-09`): the voice routes are new authenticated endpoints, and WebRTC sessions add browser-side load but no server audio. It does not accept any launch gate and does not relax the rule that AI takes no external action.

## 11. Stage 5: production enablement (prepared November 6, 2026)

Everything the stage needs is deployed. Two switches remain, and both are the owner's: no API, script or MCP path flips them, by design (`docs/06`, flags default off; `CLAUDE.md`, the flag stays off until the owner turns it on).

### 11.1 The owner's two switches

1. **Caps.** Admin → AI Settings → Daily budgets. Recommended (decision A-1): everyone $50 a day, each person $10 a day. The voice allowances already default to 60 minutes a day for everyone, 20 a person, and a 15-minute session. At $0.05 a minute of voice plus about a cent a question for the backend, a full voice day is about $3 plus tokens; the spend cap is the backstop.
2. **The flag.** Admin → Feature Flags → `ai.live_voice` → on. It takes effect at the next drawer open: the microphone button enables and its tooltip changes from the flag's reason to "Start a live conversation". Off again stops new sessions at once; a session already running ends at its limit.

### 11.2 First session, what to expect

- Open the Command Center over HTTPS (the Render URL or a Home Screen install; a browser allows the microphone only on HTTPS or localhost). Expand the drawer, press the microphone, allow the microphone when the browser asks.
- The drawer shows "Connecting…", then "Listening…" with a timer against the session limit. Speak; the transcript appears for both sides. A question about the business shows a "Looked at:" chip while the backend runs its tool, then the answer is spoken and transcribed.
- End with the red button, or let the limit end it. The session then stays in the thread with its duration, and in AI Analyst → Output review as module `assistant.voice`.
- The budget strip shows the minutes used. Admin → AI Settings → Today's AI use lists `assistant.voice` (the session seconds and the backend rows), `assistant.text` and `assistant.dictation`.

### 11.3 The two-week review

Each day of use, Admin → AI Settings → Today's AI use is the figure to read; the ledger rows are in `ai_usage_events` with `feature`, `kind` (`realtime` for session seconds, `text` for the backend), `modelName`, `audioSeconds` and `estimatedCostUsd`. After two weeks of ordinary use the owner decides the standing caps and which tools to widen (`draft_task` is the only workflow tool today; the next candidates are a read-only "my tasks" view and the operations exception queue as first-class tools).

### 11.4 Turning it off

Admin → Feature Flags → `ai.live_voice` off. Setting `ai.budget.daily_voice_minutes` to a small number has the same effect for everyone while leaving the flag on.

