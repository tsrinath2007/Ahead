# MEETUP MEMORY — 90-Second Hackathon Demo Script

**Total Run Time**: ~75–85 seconds  
**Objective**: Demonstrate how Hindsight transforms pre-meeting preparation from generic discovery into high-stakes intelligence that saves relationships and deals.

---

### [0:00 – 0:20] Hook & Context
- **Screen**: Home Page (`/`) — Contacts List.
- **Presenter**:
  > *"Every sales rep or executive has experienced this nightmare: You walk into a meeting with a client, exchange pleasantries, and completely forget that six weeks ago you promised them a critical document and never sent it.*
  >
  > *Generic AI assistants don't help—they have zero memory between meetings. Meetup Memory uses Hindsight to give AI persistent episodic memory."*

---

### [0:20 – 0:40] The Action: Briefing Jordan Reyes
- **Action**: Hover over the highlighted card for **Jordan Reyes** and click **"Brief me"**.
- **Screen**: Transitions to `/brief/jordan-reyes`.
- **Presenter**:
  > *"Here is our prospect, Jordan Reyes. We've logged 3 past meetings with him over the last few months. Today is meeting #4. Let's hit 'Brief me'."*

---

### [0:40 – 1:05] The "Aha!" Moment: Side-by-Side Comparison
- **Screen**: The side-by-side view renders.
- **Action**: Point to the **LEFT column ("Without Memory")**, then gesture to the **RIGHT column ("With Hindsight Memory")**.
- **Presenter**:
  > *"Look at the contrast on this screen.*
  >
  > *On the **LEFT**, standard AI has complete amnesia. It gives us cookie-cutter discovery questions: 'Ask Jordan about his operational priorities.' Completely useless.*
  >
  > *Now look at the **RIGHT** with Hindsight. In bright red: **CRITICAL OVERDUE COMMITMENT DETECTED**. In meeting #2 six weeks ago, we promised Jordan a technical follow-up doc on integration support and never sent it. Hindsight caught that this is an unfulfilled promise!*
  >
  > *It also alerts us that pricing was tabled until this exact quarter, and gives us strategic advice: address the overdue doc in the first 60 seconds to restore trust before talking price."*

---

### [1:05 – 1:20] Transparency: Proving It's Real Hindsight
- **Action**: Scroll down slightly to highlight the **🧠 Memory Found** panel.
- **Presenter**:
  > *"This isn't hardcoded. Under the hood, Hindsight called `recall()` across our bank `contact-jordan-reyes` to pull the exact past meeting facts, and `reflect()` to synthesize the strategic guidance."*

---

### [1:20 – 1:30] Live Learning: Retain in Real-Time
- **Action**: Scroll to **"Log Today's Meeting Outcome"**, type:
  `"Handed Jordan the technical doc today. He loved it and we agreed to send the enterprise pricing proposal next Tuesday."`
- **Action**: Click **"Retain Meeting Outcome Live"**.
- **Presenter**:
  > *"And when this meeting wraps up, I can log today's outcome in one sentence. A live `client.retain()` call updates the Hindsight memory bank in real time—ready for meeting #5.*
  >
  > *That is Meetup Memory powered by Hindsight."*
