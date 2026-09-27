# Ahead — Know what matters before you meet.

> **The AI Pre-Meeting Intelligence Agent That Never Forgets What You Promised**  
> Built for hackathons & executive prep • Powered by **Hindsight** (`@vectorize-io/hindsight-client`) and **Groq LLM**.

---

## 🎯 The Problem

When preparing for a meeting with a client or prospect, traditional AI assistants (ChatGPT, Claude, generic RAG) suffer from **chronic amnesia**:
- They treat every interaction as day one.
- If you ask: *"Brief me for my meeting with Jordan Reyes"*, a generic assistant responds with generic, context-free discovery questions: *"Ask about their goals, their current stack, and their operational priorities."*
- **What they miss**: In Meeting #2 six weeks ago, Jordan raised a concern about integration support, and you **promised to send a technical follow-up doc within 48 hours**. You never sent it. In Meeting #1, Jordan explicitly stated: *"Let's revisit pricing next quarter."*
- Walking into a meeting without realizing you owe the client an overdue deliverable destroys deal momentum and trust.

---

## 💡 The Solution

**Ahead** is a single-click pre-meeting briefing tool that eliminates conversation amnesia:
1. **Side-by-Side Reality Check**: Contrasts a standard memory-less assistant (muted card) against the Hindsight-powered executive brief (highlighted accent card).
2. **Urgent Commitment Detection**: Explicitly highlights overdue and unfulfilled promises in an amber/red `⚠ Overdue Commitment` callout before you say a single word.
3. **Strategic Opening Advice**: Gives you direct guidance on what to lead with in the first 60 seconds to restore trust.
4. **Memory Transparency Inspector**: Displays the exact raw memories recalled from Hindsight with timestamps and IDs to prove it's real.
5. **"Why This Brief?" Reasoning Chain**: An expandable panel detailing the 4-step audit trail (*Previous meeting &rarr; What was promised &rarr; Whether it was fulfilled &rarr; Why this matters now*).
6. **Live Outcome Logging**: Record today's meeting outcome with one click, calling Hindsight's `retain()` live so the agent learns in real time with a visible `✓ Saved to memory` confirmation.
7. **Portfolio Commitments Dashboard**: Cross-bank dashboard (`/commitments`) auditing all contacts to prove organizational memory across your entire relationship portfolio.

---

## 🏗️ Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 Next.js 14 (App Router)                │
                  │             Single Full-Stack Codebase                 │
                  └────────────┬─────────────────────────────┬─────────────┘
                               │                             │
                     Client Pages (UI)              API Route Handlers
                     ├── / (Contact Picker)         ├── /api/brief/[contactId]
                     ├── /brief/[contactId]         ├── /api/commitments
                     └── /commitments               └── /api/retain
                                                             │
                                ┌────────────────────────────┴───────────────────────────┐
                                │                                                        │
                                ▼                                                        ▼
                    ┌─────────────────────────┐                             ┌─────────────────────────┐
                    │     Hindsight Client    │                             │       Groq LLM SDK      │
                    │ @vectorize-io/hindsight │                             │ Primary: gpt-oss-120b   │
                    │ retain, recall, reflect │                             │ Fallback: qwen3-32b     │
                    └─────────────────────────┘                             └─────────────────────────┘
```

- **Framework**: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide icons.
- **Backend**: Next.js Route Handlers (`app/api/**`). No separate FastAPI, Flask, or Express backend.
- **Memory Persistence**: Hindsight is the sole persistence layer — no SQL or external database needed.
- **LLM Synthesis**: Groq SDK using primary model `openai/gpt-oss-120b` (with automated fallback to `qwen/qwen3-32b`).

---

## 🧠 How Hindsight Memory is Used

**Ahead** directly integrates Hindsight's three core primitives into the executive briefing loop:

### 1. `client.retain(bankId, content, options)`
- **Isolated Memory Banks**: Each contact receives an independent memory bank (e.g. `contact-jordan-reyes`, `contact-elena-vance`, `contact-marcus-chen`).
- **Idempotent Episodic Logging**: Meeting notes are retained with deterministic document IDs, dates, contexts, and explicit status markers:
  ```ts
  await client.retain(
    "contact-jordan-reyes",
    "Meeting on December 19, 2025 with Jordan Reyes: Jordan raised a major concern about integration support. I PROMISED to send a technical follow-up doc on integration support within 48 hours. As of today this has NOT been sent — this is an outstanding, unfulfilled commitment and is now significantly overdue.",
    {
      documentId: "contact-jordan-reyes-meeting-2",
      updateMode: "replace",
      context: "Past Meeting (2025-12-19): Integration support concern",
      timestamp: "2025-12-19T00:00:00.000Z",
    }
  );
  ```
- **Live Learning**: Right in the meeting view, entering a one-line outcome into the "Log Today's Meeting" form triggers `client.retain()` to persist the update live into the contact's bank.

### 2. `client.recall(bankId, query, options)`
- **Targeted Evidence Retrieval**: When the user clicks "Brief me", the route handler executes `client.recall(bankId, query)` to pull matching past facts, agreements, and commitments.
- **Cross-Bank Audits**: On the `/commitments` dashboard, `recall()` queries each contact's memory bank to aggregate outstanding obligations across the entire organizational portfolio.
- **Transparency Panel**: Raw memory units returned by `recall()` are rendered in the dark-slate **🧠 Memory Found** inspector panel, providing unedited evidence behind the brief.

### 3. `client.reflect(bankId, query, options)`
- **Synthesized Strategic Guidance**: Rather than running multiple micro-lookups, a single high-level `reflect()` call asks the bank:
  ```ts
  const reflection = await client.reflect(
    bankId,
    "What should I lead with in the next meeting with this contact, and are there any outstanding promises or commitments I must address?"
  );
  ```
- **Actionable Brief Generation**: The Groq LLM combines the raw recalled memories and the Hindsight `reflect()` synthesis into a structured brief.

---

## ⚡ Quick Start & Setup

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
# Hindsight Memory Service Configuration
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_api_key_here

# Groq LLM API Key
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Seed Memory Banks
Run the deterministic seed script once to populate past meeting history:
```bash
npm run seed
# or: npx tsx scripts/seed.ts
```

The seed script retains:
- **Jordan Reyes**: Meeting 1 (revisit pricing next quarter), Meeting 2 (unfulfilled promise to send technical integration doc), Meeting 3 (scheduling check-in).
- **Elena Vance**: 3 past meetings (vendor evaluation, SSO compliance, roadmap freeze).
- **Marcus Chen**: 3 past meetings (latency review, SOC2 compliance, sandbox migration).

### 4. Start the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Error Handling & Resilience
- All calls to Hindsight and Groq are wrapped in structured `try/catch` blocks.
- If Hindsight or Groq is temporarily unreachable or misconfigured, the UI displays clear diagnostic banners (`"Memory system unavailable"` / `"LLM error"`) rather than crashing or throwing an unhandled exception.
- Groq includes automated fallback from `openai/gpt-oss-120b` &rarr; `qwen/qwen3-32b` &rarr; `llama-3.3-70b-versatile` on timeout or rate limits.
