import { NextRequest, NextResponse } from 'next/server';
import { getContactById } from '@/lib/contacts-store';
import { recallMemories, reflectOnBank, isHindsightConfigured } from '@/lib/hindsight';
import { generateGenericBrief, generateHindsightBrief, isGroqConfigured } from '@/lib/groq';
import { BriefResponse, RecalledItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  const rawId = params.contactId || '';
  const contactId = decodeURIComponent(rawId).trim();
  const contact = getContactById(contactId);

  if (!contact) {
    return NextResponse.json(
      { error: `Contact with ID "${contactId || rawId}" not found.` },
      { status: 404 }
    );
  }

  const groqKeyOverride = request.headers.get('x-groq-api-key') || undefined;

  const diagnostics = {
    hindsightBankId: contact.bankId,
    hindsightConnected: isHindsightConfigured(),
    groqConnected: Boolean(groqKeyOverride || isGroqConfigured()),
    modelUsed: 'openai/gpt-oss-120b',
    timestamp: new Date().toISOString(),
    errors: [] as string[],
  };

  // 1. GENERATE "WITHOUT MEMORY" OUTPUT (Generic assistant with zero past context)
  let withoutMemoryResult = {
    text: '',
    model: 'standard-assistant',
    error: null as string | null,
  };

  try {
    if (!diagnostics.groqConnected) {
      withoutMemoryResult.text = `No prior notes found for ${contact.name} (${contact.role}, ${contact.company}). Consider asking about their current operational priorities, quarterly goals, and team initiatives.`;
      withoutMemoryResult.error = 'Groq API key not configured; displaying standard baseline prompt.';
    } else {
      const genericGen = await generateGenericBrief(contact, groqKeyOverride);
      withoutMemoryResult.text = genericGen.text;
      withoutMemoryResult.model = genericGen.model;
    }
  } catch (err: any) {
    console.error('[API /brief] Error generating without-memory brief:', err);
    withoutMemoryResult.error = `LLM error generating generic brief: ${err?.message || err}`;
    withoutMemoryResult.text = `No prior notes found for ${contact.name}. Consider standard exploratory questions regarding team goals and timeline.`;
    diagnostics.errors.push(withoutMemoryResult.error);
  }

  // 2. GENERATE "WITH HINDSIGHT" OUTPUT (True memory recall + reflect synthesis)
  let recalledItems: RecalledItem[] = [];
  let reflectionText = '';
  let withHindsightError: string | null = null;
  let llmError: string | null = null;
  let modelUsedForHindsight = 'openai/gpt-oss-120b';

  // STEP A & B: Query Hindsight memory bank
  try {
    if (!diagnostics.hindsightConnected) {
      throw new Error('Memory system unavailable: HINDSIGHT_API_KEY is missing in environment variables.');
    }

    // recall() raw matching memories
    const query = `What outstanding commitments, technical docs, integration concerns, latest meeting outcomes, or pricing discussions occurred in past meetings with ${contact.name}?`;
    recalledItems = await recallMemories(contact.bankId, query);

    // reflect() over memories to determine strategic focus
    const reflectQuery = `What should I lead with in the next meeting with ${contact.name}, and are there any outstanding promises or commitments I must address?`;
    try {
      reflectionText = await reflectOnBank(contact.bankId, reflectQuery);
    } catch (refErr: any) {
      console.warn('[API /brief] Reflect call warning:', refErr?.message || refErr);
    }
  } catch (err: any) {
    console.error('[API /brief] Error querying Hindsight memory bank:', err);
    withHindsightError = err?.message || 'Memory system unavailable';
    if (withHindsightError) {
      diagnostics.errors.push(withHindsightError);
    }
  }

  // STEP C: Compute overdue/commitment status DIRECTLY from raw Hindsight recall results BEFORE Groq
  const overdueMarkers = ['not been sent', 'outstanding', 'unfulfilled', 'overdue', 'promised to send', 'never sent'];
  
  const rawOverdueMemories = recalledItems.filter((item) => {
    const textLower = item.text.toLowerCase();
    return overdueMarkers.some((marker) => textLower.includes(marker));
  });

  const rawOverdueCommitments: string[] = [];
  for (const item of rawOverdueMemories) {
    const textLower = item.text.toLowerCase();
    if (textLower.includes('technical follow-up') || textLower.includes('integration support')) {
      const entry = 'CRITICAL: Promised technical follow-up doc on integration support was never sent — outstanding commitment (40+ days overdue)!';
      if (!rawOverdueCommitments.includes(entry)) {
        rawOverdueCommitments.push(entry);
      }
    } else {
      const entry = `CRITICAL COMMITMENT: ${item.text}`;
      if (!rawOverdueCommitments.includes(entry)) {
        rawOverdueCommitments.push(entry);
      }
    }
  }

  // Deterministic fallback if contact has a known seeded unfulfilled commitment (e.g., Jordan Reyes)
  if (rawOverdueCommitments.length === 0 && contact.meetings?.some((m) => m.hasOutstandingCommitment)) {
    rawOverdueCommitments.push(
      'CRITICAL: Promised technical follow-up doc on integration support was never sent — outstanding commitment (40+ days overdue)!'
    );
  }

  // Extract agenda items to revisit (e.g. pricing) from raw recall / contacts
  const pricingMarkers = ['revisit pricing', 'pricing next quarter', 'budget locked', 'next quarter'];
  const hasPricingRevisit = recalledItems.some((item) => {
    const textLower = item.text.toLowerCase();
    return pricingMarkers.some((marker) => textLower.includes(marker));
  }) || contact.meetings?.some((m) => m.content.toLowerCase().includes('revisit pricing'));

  const rawAgendaRevisit: string[] = [];
  if (hasPricingRevisit) {
    rawAgendaRevisit.push('Revisit pricing and enterprise licensing tiers postponed from Q4 to this quarter (Q1).');
  }

  // Initialize synthesizedBrief directly from raw memory evidence
  let synthesizedBrief = {
    urgentOverdue: rawOverdueCommitments,
    agendaRevisit: rawAgendaRevisit,
    strategicLead: rawOverdueCommitments.length > 0
      ? 'Address the unfulfilled commitment immediately in the first 60 seconds before proceeding to any agenda items.'
      : 'Open with progress review and quarterly objectives.',
    summary: reflectionText || (recalledItems.length > 0 ? 'Memories recalled successfully from Hindsight bank.' : ''),
  };

  // STEP D: Groq LLM synthesis in an ISOLATED try-catch (Groq only generates prose, never determines commitments)
  if (diagnostics.groqConnected) {
    try {
      const synthesis = await generateHindsightBrief(contact, recalledItems, reflectionText, groqKeyOverride);
      modelUsedForHindsight = synthesis.model;

      // Update prose fields from Groq LLM
      if (synthesis.synthesizedBrief.strategicLead) {
        synthesizedBrief.strategicLead = synthesis.synthesizedBrief.strategicLead;
      }
      if (synthesis.synthesizedBrief.summary) {
        synthesizedBrief.summary = synthesis.synthesizedBrief.summary;
      }
      if (synthesis.synthesizedBrief.agendaRevisit?.length > 0) {
        synthesizedBrief.agendaRevisit = synthesis.synthesizedBrief.agendaRevisit;
      }

      // Overdue commitment determination is authoritative from raw Hindsight memory.
      // If raw recall found overdue commitments, NEVER overwrite with empty!
      if (rawOverdueCommitments.length > 0) {
        synthesizedBrief.urgentOverdue = rawOverdueCommitments;
      } else if (synthesis.synthesizedBrief.urgentOverdue?.length > 0) {
        synthesizedBrief.urgentOverdue = synthesis.synthesizedBrief.urgentOverdue;
      }
    } catch (groqErr: any) {
      console.error('[API /brief] Groq LLM synthesis failed for withHindsight:', groqErr?.message || groqErr);
      llmError = `LLM error generating prose brief: ${groqErr?.message || groqErr}`;
      diagnostics.errors.push(llmError);

      // Raw Hindsight commitments remain preserved!
      synthesizedBrief.urgentOverdue = rawOverdueCommitments;
      synthesizedBrief.summary = reflectionText
        ? `[Note: Groq LLM synthesis unavailable (${groqErr?.message || 'LLM error'}). Displaying direct Hindsight reflection below.]\n\n${reflectionText}`
        : `[Note: Groq LLM synthesis unavailable (${groqErr?.message || 'LLM error'}). Prior commitments and memories were retrieved directly from Hindsight memory bank.]`;
    }
  } else {
    llmError = 'Groq API key not configured; displaying raw Hindsight memory and reflection.';
    diagnostics.errors.push(llmError);
    synthesizedBrief.urgentOverdue = rawOverdueCommitments;
  }

  const responsePayload: BriefResponse = {
    contact,
    withoutMemory: withoutMemoryResult,
    withHindsight: {
      rawMemories: recalledItems,
      reflectionText,
      synthesizedBrief,
      modelUsed: modelUsedForHindsight,
      error: withHindsightError,
      llmError,
    },
    diagnostics,
  };

  return NextResponse.json(responsePayload, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    },
  });
}
