# 43 — AI Assistant Drawer: Page-Aware Text and Live Voice

**Document status:** Design and staged plan, with Stage 0 delivered
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

### 3.3 Realtime over WebRTC, with the server holding the key

The browser connects to OpenAI directly with a client secret that expires in minutes; the API key never leaves the server. The server mints the secret only after checking the `ai.use` permission, the `ai.live_voice` feature flag, and the voice budgets. The secret's time-to-live is the "longest live session" setting, so a session cannot outlive its allowance even if the browser misbehaves. A WebSocket relay through Render would add a hop, a second audio encode, and memory on a 512 MB web service that already has a history of dying under load.

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

### 4.3 Tools (first set)

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

### 4.5 Client

| Piece | Behaviour |
|---|---|
| `AssistantDrawer` | Bottom sheet in `AppShell`, present on every dashboard route for users with `ai.use`. Collapsed: a 44 px bar with the assistant icon, the page title, and a microphone button. Expanded: transcript, composer, mode toggle, budget strip. |
| Text mode | Sends messages and page context to the chat route; renders streamed deltas; shows tool calls as collapsed rows ("Looked up order 76507"). |
| Voice mode | Requests the microphone, posts to the session route, opens a WebRTC peer to OpenAI with the client secret, plays remote audio, shows live transcript from the transcription events, relays tool calls to the tool route, posts usage events, and ends on button, on TTL, on navigation away, or on tab close. |
| Dictation | Hold-to-talk in text mode transcribes through the transcription model and fills the composer; cheaper than a full voice session for a one-off question. |
| Budget strip | Shows today's spend and voice minutes against the caps, and the reason when a mode is blocked. |
| Phone | Full-height sheet; composer above the keyboard; the mic button is a large target; the sheet closes on back. |

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
| One minute of live dialog | gpt-realtime | about $0.30 to $0.50 depending on how much each side talks |
| One minute of live dialog | gpt-realtime-mini | about $0.10 to $0.15 |
| One minute of dictation | gpt-4o-mini-transcribe | about $0.003 |

The default voice allowances (60 minutes a day, everyone) therefore bound voice at roughly $30 a day on gpt-realtime. A spend cap of $25 to $50 a day would cover present use with room; the owner sets it.

## 8. Stages

Each stage is one run: branch from main, build, verify with typecheck, lint, format, tests and build, open a pull request, wait for checks, squash-merge. The migration in Stage 0 is the only schema change the plan needs.

| Stage | Deliverable | Status |
|---|---|---|
| 0 | Usage ledger and daily budgets enforced at the client; live-dialog model, voice and transcription settings; feature flag; this document. | Delivered November 3, 2026 (this PR). |
| 1 | Page context contract and provider; the tool registry with the first tools and their tests; the text chat route with streaming and the tool loop; `AiOutput` and audit rows. No UI beyond a test page. | Next. |
| 2 | The drawer: bottom sheet in the shell, text mode, tool-call rows, budget strip, phone layout, Playwright checks at 390 px and desktop. | |
| 3 | Live voice: session, tool and usage routes; WebRTC client; transcript; dictation; cutoffs; the flag turned on in staging only. | |
| 4 | Page registrations across the main modules (dashboard, customers, orders, products, sales intelligence, operations, finance), and `draft_task`. | |
| 5 | Production enablement: owner turns on `ai.live_voice`, sets caps, two-week review of the ledger by feature, then widen tools. | |

## 9. Decisions for the owner

| Id | Decision | Default if not decided |
|---|---|---|
| A-1 | Daily spend cap values. | None; no cap until set. Recommended $25 to $50 everyone, $10 per user. |
| A-2 | Voice model: `gpt-realtime` (quality) or `gpt-realtime-mini` (cost). | `gpt-realtime`. |
| A-3 | Whether the assistant may read personal contact details aloud. | No, unless asked by name. |
| A-4 | Whether voice sessions should be transcribed and kept as `AiOutput` rows. | Yes, text only, under `ai.view_logs`. |
| A-5 | Whether `draft_task` ships in Stage 4 or waits. | Ships, confirm-only. |

## 10. Relationship to Phase 11

The assistant is an internal feature on the Render surface and adds no public page. It widens the surface that Phase 11C (security) and 11E (performance) evidence must cover (`BLK-09`): the voice routes are new authenticated endpoints, and WebRTC sessions add browser-side load but no server audio. It does not accept any launch gate and does not relax the rule that AI takes no external action.
