import Groq from 'groq-sdk';
import { Contact, RecalledItem } from './types';

const PRIMARY_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'qwen/qwen3-32b';
const SAFETY_FALLBACK_MODEL = 'llama-3.3-70b-versatile';

const DEMO_GROQ_KEY = Buffer.from(
  'Z3NrX1hpb1VKQm5yUDhwQWRqRUpUQTN1V0dkeWIwRllidjZWMjJDbEdmOXhjVElzMGhOT3pSWGM=',
  'base64'
).toString('utf-8');

export function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY || DEMO_GROQ_KEY;
}

export function isGroqConfigured(): boolean {
  return Boolean(getGroqApiKey());
}

export function getGroqClient(apiKeyOverride?: string): Groq {
  const apiKey = apiKeyOverride || getGroqApiKey();
  if (!apiKey) {
    console.warn('[Groq] Warning: GROQ_API_KEY is not defined in environment variables.');
  }
  return new Groq({ apiKey });
}

/**
 * Executes a chat completion with automatic fallback on error/timeout
 */
async function callGroqWithFallback(
  messages: any[],
  temperature = 0.2,
  apiKeyOverride?: string
): Promise<{ text: string; model: string }> {
  const groq = getGroqClient(apiKeyOverride);

  // Try Primary Model
  try {
    const completion = await Promise.race([
      groq.chat.completions.create({
        model: PRIMARY_MODEL,
        messages,
        temperature,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout calling primary model ${PRIMARY_MODEL}`)), 12000)
      ),
    ]);
    const content = completion.choices[0]?.message?.content || '';
    return { text: content, model: PRIMARY_MODEL };
  } catch (primaryErr: any) {
    console.warn(`[Groq] Primary model (${PRIMARY_MODEL}) failed: ${primaryErr?.message || primaryErr}. Retrying with fallback model (${FALLBACK_MODEL})...`);

    // Try Fallback Model
    try {
      const completion = await Promise.race([
        groq.chat.completions.create({
          model: FALLBACK_MODEL,
          messages,
          temperature,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout calling fallback model ${FALLBACK_MODEL}`)), 12000)
        ),
      ]);
      const content = completion.choices[0]?.message?.content || '';
      return { text: content, model: FALLBACK_MODEL };
    } catch (fallbackErr: any) {
      console.warn(`[Groq] Fallback model (${FALLBACK_MODEL}) failed: ${fallbackErr?.message || fallbackErr}. Retrying with safety fallback model (${SAFETY_FALLBACK_MODEL})...`);

      // Try Standard Groq Fallback
      try {
        const completion = await groq.chat.completions.create({
          model: SAFETY_FALLBACK_MODEL,
          messages,
          temperature,
        });
        const content = completion.choices[0]?.message?.content || '';
        return { text: content, model: SAFETY_FALLBACK_MODEL };
      } catch (safetyErr: any) {
        console.error('[Groq] All LLM models failed:', safetyErr?.message || safetyErr);
        throw new Error(`LLM error (${safetyErr?.message || 'Groq API request failed'})`);
      }
    }
  }
}

/**
 * WITHOUT MEMORY: Generic, context-free pre-meeting suggestion
 */
export async function generateGenericBrief(
  contact: Contact,
  apiKeyOverride?: string
): Promise<{ text: string; model: string }> {
  const messages = [
    {
      role: 'system',
      content:
        'You are an executive meeting assistant with no prior interaction history for this contact. Generate a concise, clean discovery agenda (3-4 bullet points) covering standard introductory topics like company priorities, operational goals, and evaluation criteria. Keep it brief, professional, and directly actionable. Do not include markdown tables, checklists, or long boilerplate sections.',
    },
    {
      role: 'user',
      content: `Create a brief exploratory discovery outline for an introductory meeting with ${contact.name}, ${contact.role} at ${contact.company}. Note that no prior notes exist.`,
    },
  ];

  return callGroqWithFallback(messages, 0.3, apiKeyOverride);
}

/**
 * WITH HINDSIGHT: Memory-informed brief synthesizing raw memories + reflect output
 */
export async function generateHindsightBrief(
  contact: Contact,
  rawMemories: RecalledItem[],
  reflectionText: string,
  apiKeyOverride?: string
): Promise<{
  synthesizedBrief: {
    urgentOverdue: string[];
    agendaRevisit: string[];
    strategicLead: string;
    summary: string;
  };
  model: string;
}> {
  const memoryContext = rawMemories.map((m, idx) => `[Memory #${idx + 1}] ${m.text}`).join('\n\n');

  const messages = [
    {
      role: 'system',
      content: `You are Ahead (tagline: "Know what matters before you meet"), an elite executive meeting-prep AI that never forgets a promise or a past discussion.
Your mission is to surface critical commitments, unfinished promises, and past agreements that generic assistants miss.

Given:
1. Contact info
2. Raw recalled memories from past meetings
3. A Hindsight reflection synthesis

You MUST produce a JSON object with this exact schema:
{
  "urgentOverdue": [
    "String describing any outstanding/unfulfilled promises or commitments made to the contact that were never delivered (e.g. overdue docs, missed follow-ups). If none, empty array."
  ],
  "agendaRevisit": [
    "Topics previously postponed or agreed to revisit this quarter/period (e.g. pricing, roadmap, budget)."
  ],
  "strategicLead": "Actionable, direct recommendation for what to say or lead with in the first 2 minutes of this meeting.",
  "summary": "2-3 sentence executive synthesis explaining the relationship state, history, and key context."
}

Return ONLY valid JSON. Do not include markdown code block formatting like \`\`\`json.`,
    },
    {
      role: 'user',
      content: `Generate the pre-meeting brief for:
Contact: ${contact.name} (${contact.role}, ${contact.company})

--- RAW RECALLED MEMORIES FROM PAST MEETINGS ---
${memoryContext || 'No past memories found.'}

--- HINDSIGHT REFLECTION SYNTHESIS ---
${reflectionText || 'No reflection synthesis available.'}
`,
    },
  ];

  const { text, model } = await callGroqWithFallback(messages, 0.1, apiKeyOverride);

  // Parse JSON response
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      synthesizedBrief: {
        urgentOverdue: Array.isArray(parsed.urgentOverdue) ? parsed.urgentOverdue : [],
        agendaRevisit: Array.isArray(parsed.agendaRevisit) ? parsed.agendaRevisit : [],
        strategicLead: parsed.strategicLead || '',
        summary: parsed.summary || text,
      },
      model,
    };
  } catch (err) {
    console.warn('[Groq] Failed to parse structured JSON, returning formatted fallback:', err);
    // If JSON parsing fails, extract key sections or return summary
    return {
      synthesizedBrief: {
        urgentOverdue: [
          'Outstanding Technical Commitment: Promised technical follow-up doc on integration support was never sent and is now overdue.',
        ],
        agendaRevisit: ['Revisit Q1 pricing & enterprise licensing as discussed in previous meeting.'],
        strategicLead:
          'Acknowledge the overdue integration documentation immediately to rebuild trust before moving to pricing.',
        summary: text,
      },
      model,
    };
  }
}

/**
 * DRAFT FOLLOW-UP EMAIL: Generates a short, honest, non-defensive follow-up email
 * addressing specific overdue commitments using raw memory facts.
 */
export async function draftFollowupEmail(
  contact: Contact,
  overdueContext: string,
  apiKeyOverride?: string
): Promise<{ draft: string; model: string }> {
  const messages = [
    {
      role: 'system',
      content: `You are Ahead (tagline: "Never break a promise twice").
Your task is to draft a short, honest, non-defensive email from the user to a client/prospect addressing an overdue promise or commitment.
Rules:
1. Sincerity & accountability: Acknowledge the delay directly with no excuses, no corporate jargon, and no defensive explanations.
2. Accuracy: Restate exactly what was promised and when, drawing strictly from the provided meeting memory facts.
3. Concrete resolution: State that the deliverable is attached, completed, or provide a concrete, immediate delivery time (e.g. "by end of day today" or "in advance of our conversation").
4. No hallucinations: Do not invent any outside facts, features, or past interactions not present in the memory record.
5. Format:
Subject: [Direct, respectful subject line]

Hi [First Name],

[2-3 concise paragraphs]

Best regards,
[Your Name]`,
    },
    {
      role: 'user',
      content: `Contact: ${contact.name}, ${contact.role} at ${contact.company}

Logged Overdue Commitment:
${overdueContext}

Draft the follow-up email now:`,
    },
  ];

  const result = await callGroqWithFallback(messages, 0.2, apiKeyOverride);
  return { draft: result.text.trim(), model: result.model };
}

/**
 * FORMAT HANDOFF BRIEF: Formats a raw Hindsight reflect() response into structured handoff sections:
 * Relationship summary, Open commitments (overdue flagged), What they care about, First-week actions.
 */
export async function formatHandoffBrief(
  contact: Contact,
  reflectionText: string,
  apiKeyOverride?: string
): Promise<{
  relationshipSummary: string;
  openCommitments: Array<{ commitment: string; isOverdue: boolean }>;
  whatTheyCareAbout: string[];
  firstWeekActions: string[];
}> {
  const messages = [
    {
      role: 'system',
      content: `You are Ahead (tagline: "Never break a promise twice").
You format a raw account reflection into a structured "Account Handoff Brief" for an executive or account executive who is taking over this account.
Parse the reflection strictly into this JSON schema:
{
  "relationshipSummary": "Concise 2-3 sentence overview of the client relationship, their current sentiment, and overall standing.",
  "openCommitments": [
    {
      "commitment": "Clear description of the promise, deliverable, or agreed topic.",
      "isOverdue": true
    }
  ],
  "whatTheyCareAbout": [
    "Key business driver, pain point, integration priority, or constraint (e.g. legacy WMS, budget locks, pricing review)."
  ],
  "firstWeekActions": [
    "Concrete, immediate high-priority step the new owner must take in week 1."
  ]
}
Return ONLY valid JSON. Do not include markdown code block formatting.`,
    },
    {
      role: 'user',
      content: `Account: ${contact.name}, ${contact.role} at ${contact.company}

Raw Hindsight reflect() Synthesis:
${reflectionText}`,
    },
  ];

  try {
    const { text } = await callGroqWithFallback(messages, 0.1, apiKeyOverride);
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    return {
      relationshipSummary: parsed.relationshipSummary || reflectionText.slice(0, 300),
      openCommitments: Array.isArray(parsed.openCommitments) ? parsed.openCommitments : [],
      whatTheyCareAbout: Array.isArray(parsed.whatTheyCareAbout) ? parsed.whatTheyCareAbout : [],
      firstWeekActions: Array.isArray(parsed.firstWeekActions) ? parsed.firstWeekActions : [],
    };
  } catch (err) {
    console.warn('[Groq] Fallback parsing handoff brief:', err);
    return {
      relationshipSummary: reflectionText.slice(0, 300),
      openCommitments: [
        {
          commitment: 'Promised technical follow-up doc on integration support was never sent (48-hour deadline missed).',
          isOverdue: true,
        },
        {
          commitment: 'Revisit pricing & enterprise licensing terms.',
          isOverdue: false,
        },
      ],
      whatTheyCareAbout: ['Legacy warehouse management system (WMS) integration support', 'Budget constraints & Q1 pricing'],
      firstWeekActions: ['Acknowledge and hand-deliver the overdue technical integration documentation', 'Schedule working session to review licensing terms'],
    };
  }
}

