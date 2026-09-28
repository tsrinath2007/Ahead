import { NextRequest, NextResponse } from 'next/server';
import { getContactById } from '@/lib/contacts-store';
import { recallMemories, isHindsightConfigured } from '@/lib/hindsight';
import { draftFollowupEmail, isGroqConfigured } from '@/lib/groq';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  const contactId = params.contactId;
  const contact = getContactById(contactId);

  if (!contact) {
    return NextResponse.json(
      { error: `Contact "${contactId}" not found.` },
      { status: 404 }
    );
  }

  if (!isHindsightConfigured()) {
    return NextResponse.json(
      { error: 'Memory system unavailable: HINDSIGHT_API_KEY is not configured.' },
      { status: 503 }
    );
  }

  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'LLM service unavailable: GROQ_API_KEY is not configured.' },
      { status: 503 }
    );
  }

  try {
    // 1. Fetch raw recall results from the contact's Hindsight bank
    const query = `What outstanding commitments, technical docs, integration concerns, latest meeting outcomes, or pricing discussions occurred in past meetings with ${contact.name}?`;
    const recalledItems = await recallMemories(contact.bankId, query);

    // 2. Identify overdue commitments directly from raw recall results (same logic as brief badge)
    const overdueMarkers = ['not been sent', 'outstanding', 'unfulfilled', 'overdue', 'promised to send', 'never sent'];
    const rawOverdueMemories = recalledItems.filter((item) => {
      const textLower = item.text.toLowerCase();
      return overdueMarkers.some((marker) => textLower.includes(marker));
    });

    if (rawOverdueMemories.length === 0) {
      return NextResponse.json(
        { error: `No overdue unfulfilled commitments found for ${contact.name}.` },
        { status: 400 }
      );
    }

    const overdueContext = rawOverdueMemories.map((m, idx) => `[Overdue Fact #${idx + 1}] ${m.text}`).join('\n\n');

    // 3. Make ONE Groq call to draft an honest, accountable follow-up email
    const groqKeyOverride = request.headers.get('x-groq-api-key') || undefined;
    const { draft, model } = await draftFollowupEmail(contact, overdueContext, groqKeyOverride);

    if (!draft) {
      return NextResponse.json(
        { error: 'Groq returned an empty draft.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      draft,
      model,
      contact: {
        name: contact.name,
        role: contact.role,
        company: contact.company,
      },
    });
  } catch (err: any) {
    console.error(`[API /followup/${contactId}] Error drafting follow-up email:`, err);
    return NextResponse.json(
      { error: `Failed to draft follow-up email: ${err?.message || err}` },
      { status: 500 }
    );
  }
}
