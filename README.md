# MEETUP MEMORY

> **The AI Pre-Meeting Brief Agent That Never Forgets What You Promised**  
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

**MEETUP MEMORY** is a single-click pre-meeting briefing tool that eliminates conversation amnesia:
1. **Side-by-Side Reality Check**: Contrasts a standard memory-less assistant against the Hindsight-powered executive brief.
2. **Urgent Commitment Detection**: Explicitly highlights overdue and unfulfilled promises before you say a single word.
3. **Strategic Opening Advice**: Gives you direct guidance on what to lead with in the first 60 seconds to restore trust.
4. **Memory Transparency Panel**: Displays the exact raw memories recalled from Hindsight with timestamps to prove it's real.
5. **Live Outcome Logging**: Allows you to record today's meeting outcome with one click, calling Hindsight's `retain()` live so the agent learns in real time.

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
                     └── /brief/[contactId]         └── /api/retain
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

MEETUP MEMORY directly integrates Hindsight's three core primitives into the executive briefing loop:

### 1. `client.retain(bankId, content, options)`
- **Isolated Memory Banks**: Each contact receives an independent memory bank (e.g. `contact-jordan-reyes`, `contact-elena-vance`, `contact-marcus-chen`).
- **Episodic Logging**: Meeting notes are retained as episodic records with dates, contexts, and explicit status markers:
  ```ts
  await client.retain(
    "contact-jordan-reyes",
    "Meeting on December 19, 2025 with Jordan Reyes: Jordan raised a major concern about integration support. I PROMISED to send a technical follow-up doc on integration support within 48 hours. As of today this has NOT been sent — this is an outstanding, unfulfilled commitment and is now significantly overdue.",
    { context: "Past Meeting (2025-12-19): Integration support concern", timestamp: "2025-12-19T00:00:00.000Z" }
  );
  ```
- **Live Learning**: During the meeting or right after, the user enters a one-line outcome into the "Log Today's Meeting" box, which immediately triggers `client.retain()` to persist the update into the contact's bank.

### 2. `client.recall(bankId, query, options)`
- **Targeted Evidence Retrieval**: When the user clicks "Brief me", the route handler executes `client.recall(bankId, query)` to pull matching past facts, agreements, and commitments.
- **Transparency Panel**: The raw memory units returned by `recall()` are rendered in the **🧠 Memory Found** panel on the UI, giving the executive full transparency into the source truth.

### 3. `client.reflect(bankId, query, options)`
- **Synthesized Strategic Guidance**: Rather than running multiple micro-lookups, a single high-level `reflect()` call asks the bank:
  ```ts
  const reflection = await client.reflect(
    bankId,
    "What should I lead with in the next meeting with this contact, and are there any outstanding promises or commitments I must address?"
  );
  ```
- **Actionable Brief Generation**: The Groq LLM combines the raw recalled memories and the Hindsight `reflect()` synthesis into a polished executive brief.

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
# Local Docker: http://localhost:8888  |  Hindsight Cloud: https://api.hindsight.vectorize.io
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_api_key_here

# Groq LLM API Key
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 3. Seed Memory Banks
Run the deterministic seed script to populate past meeting history for Jordan Reyes and two benchmark contacts:
```bash
npm run seed
# or
npx tsx scripts/seed.ts
```

The seed script retains:
- **Jordan Reyes**: Meeting 1 (revisit pricing next quarter), Meeting 2 (unfulfilled promise to send technical integration doc), Meeting 3 (scheduling check-in).
- **Elena Vance**: 3 past meetings (vendor evaluation, SSO compliance, roadmap freeze).
- **Marcus Chen**: 3 past meetings (latency review, SOC2 compliance, migration).

### 4. Start the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Error Handling & Resilience
- All calls to Hindsight and Groq are wrapped in structured `try/catch` blocks.
- If Hindsight or Groq is temporarily unreachable or misconfigured, the UI clearly displays diagnostic banners (`"Memory system unavailable"` / `"LLM error"`) rather than crashing or throwing an unhandled exception.
- Groq includes automated fallback from `openai/gpt-oss-120b` &rarr; `qwen/qwen3-32b` &rarr; `llama-3.3-70b-versatile` on timeout or rate limits.
