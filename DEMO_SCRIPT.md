# MEETUP MEMORY — Comprehensive Hackathon Demo Script

**Target Run Time**: ~100–115 seconds (under 2 minutes)  
**Objective**: Demonstrate how Hindsight turns pre-meeting preparation from generic discovery into high-stakes relationship intelligence that surfaces forgotten commitments and tracks portfolio health.

---

### [0:00 – 0:20] Hook & The Amnesia Problem
- **Screen**: Home Page (`/`) — Contacts List.
- **Presenter**:
  > *"Every sales rep or executive has experienced this nightmare: You walk into a meeting with a client, exchange pleasantries, and completely forget that six weeks ago you promised them a critical document and never sent it.*
  >
  > *Generic AI assistants don't help—they have zero memory between meetings. Meetup Memory uses Hindsight to give AI persistent episodic memory across past interactions."*

---

### [0:20 – 0:35] Selecting the Demo Contact
- **Screen**: Point to **Jordan Reyes** card marked with the **"⭐ Try this one (Hero Demo)"** badge and the **"Needs Attention"** health badge.
- **Action**: Click **"Brief me"**.
- **Presenter**:
  > *"Here is our prospect, Jordan Reyes at Nexus Logistics. Notice his card is already flagged as 'Needs Attention'. We've logged 3 past meetings with him over the last few months. Today is meeting #4. Let's hit 'Brief me'."*

---

### [0:35 – 1:00] The Core Side-by-Side Comparison (The Payoff)
- **Screen**: Transitions to `/brief/jordan-reyes`.
- **Action**: Point to the **LEFT column (muted gray: "Without Memory")**, then gesture to the **RIGHT column (accent highlighted: "With Hindsight Memory")**.
- **Presenter**:
  > *"Look at the contrast on this screen.*
  >
  > *On the **LEFT**, standard AI has complete amnesia. It gives us cookie-cutter discovery questions: 'Ask Jordan about his operational priorities.' Completely useless.*
  >
  > *Now look at the **RIGHT** with Hindsight. In bright amber and red: **⚠ Overdue Commitment**. In meeting #2 six weeks ago, we promised Jordan a technical follow-up doc on integration support within 48 hours and never delivered it. Hindsight caught this unfulfilled promise!*
  >
  > *It also alerts us that pricing was tabled until this exact quarter, and gives us strategic advice: address the overdue doc in the first 60 seconds to restore trust before talking price."*

---

### [1:00 – 1:20] Evidence & The "Why This Brief?" Reasoning Chain
- **Action**: Scroll down to the dark **🧠 Memory Found** inspector and expand **"Why This Brief? (Audit Reasoning Chain)"**.
- **Presenter**:
  > *"This isn't hardcoded or hallucinated. In the dark inspector panel below, Hindsight executed `recall()` across our bank `contact-jordan-reyes` to pull the exact raw memory units with dates and entities.*
  >
  > *And in this audit panel, you can see the complete 4-step reasoning chain: Previous meeting &rarr; What was promised &rarr; Fulfillment status &rarr; Why this matters today."*

---

### [1:20 – 1:35] Live Learning: Retain in Real-Time
- **Action**: Scroll to **"Log Today's Meeting Outcome"**, type:
  `"Met with Jordan today. Handed him the technical integration doc on the spot. Jordan accepted it and we agreed to send enterprise pricing proposal by Thursday."`
- **Action**: Click **"Retain Meeting Outcome Live"**. Point to the green **"✓ Saved to memory"** confirmation banner.
- **Presenter**:
  > *"And when this meeting wraps up, I can log today's outcome in one sentence. A live `client.retain()` call updates the Hindsight memory bank in real time, and the brief updates immediately for meeting #5."*

---

### [1:35 – 1:55] Optional Closing Beat: Portfolio Commitments Dashboard
- **Action**: Click **"Commitments Dashboard"** in the top navigation bar.
- **Screen**: Transitions to `/commitments`.
- **Presenter**:
  > *"Finally, Meetup Memory isn't just for one contact. In this Portfolio Dashboard, Hindsight audits all memory banks across our entire client portfolio.*
  >
  > *Elena Vance and Marcus Chen are 'On Track' with zero outstanding items, while Jordan Reyes is flagged for immediate executive attention.*
  >
  > *That is organizational memory powered by Hindsight."*
