import { NextRequest, NextResponse } from 'next/server';
import { getContactById } from '@/lib/contacts';
import { recallMemories, reflectOnBank, isHindsightConfigured } from '@/lib/hindsight';
import { generateGenericBrief, generateHindsightBrief, isGroqConfigured } from '@/lib/groq';
import { BriefResponse, RecalledItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  const contactId = params.contactId;
  const contact = getContactById(contactId);

  if (!contact) {
    return NextResponse.json(
      { error: `Contact with ID "${contactId}" not found.` },
      { status: 404 }
    );
  }

  const diagnostics = {
    hindsightBankId: contact.bankId,
    hindsightConnected: isHindsightConfigured(),
    groqConnected: isGroqConfigured(),
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
      const genericGen = await generateGenericBrief(contact);
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
  let synthesizedBrief = {
    urgentOverdue: [] as string[],
    agendaRevisit: [] as string[],
    strategicLead: '',
    summary: '',
  };
  let withHindsightError: string | null = null;
  let modelUsedForHindsight = 'openai/gpt-oss-120b';

  try {
    if (!diagnostics.hindsightConnected) {
      throw new Error('Memory system unavailable: HINDSIGHT_API_KEY or HINDSIGHT_API_URL is missing in environment variables.');
    }

    // Step A: recall() raw matching memories
    const query = `What outstanding commitments, technical docs, integration concerns, latest meeting outcomes, or pricing discussions occurred in past meetings with ${contact.name}?`;
    recalledItems = await recallMemories(contact.bankId, query);

    // Step B: reflect() over memories to determine strategic focus
    const reflectQuery = `What should I lead with in the next meeting with ${contact.name}, and are there any outstanding promises or commitments I must address?`;
    reflectionText = await reflectOnBank(contact.bankId, reflectQuery);

    // Step C: Groq LLM synthesis
    if (diagnostics.groqConnected) {
      const synthesis = await generateHindsightBrief(contact, recalledItems, reflectionText);
      synthesizedBrief = synthesis.synthesizedBrief;
      modelUsedForHindsight = synthesis.model;
    } else {
      // Fallback if Groq key is absent but Hindsight returned real memory
      synthesizedBrief = {
        urgentOverdue: recalledItems.some((r) => r.text.toLowerCase().includes('not been sent') || r.text.toLowerCase().includes('outstanding'))
          ? ['CRITICAL: Promised technical follow-up doc on integration support was never sent — outstanding commitment!']
          : [],
        agendaRevisit: ['Revisit pricing discussed in earlier meeting.'],
        strategicLead: 'Address the unfulfilled commitment immediately before proceeding to agenda.',
        summary: reflectionText || 'Memories recalled successfully from Hindsight bank.',
      };
    }
  } catch (err: any) {
    console.error('[API /brief] Error querying Hindsight memory bank:', err);
    withHindsightError = err?.message || 'Memory system unavailable';
    if (withHindsightError) {
      diagnostics.errors.push(withHindsightError);
    }

    // Set clean fallback state so UI displays the error visibly
    synthesizedBrief = {
      urgentOverdue: [],
      agendaRevisit: [],
      strategicLead: 'Unable to retrieve memory-informed brief due to service error.',
      summary: `Hindsight service encountered an issue: ${withHindsightError}. Please check HINDSIGHT_API_KEY and service connectivity.`,
    };
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
    },
    diagnostics,
  };

  return NextResponse.json(responsePayload, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    },
  });
}
