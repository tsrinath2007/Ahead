import { NextRequest, NextResponse } from 'next/server';
import { resolveContact } from '@/lib/contacts-store';
import { reflectOnBank, isHindsightConfigured } from '@/lib/hindsight';
import { formatHandoffBrief, isGroqConfigured } from '@/lib/groq';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  const contactId = params.contactId;
  const contact = resolveContact(contactId, request.headers.get('x-contact-data'));

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

  try {
    // 1. Execute one reflect() call on the contact's Hindsight bank
    const handoffQuery = `Summarize everything a new owner of this account must know: relationship history, open commitments and what is overdue, what ${contact.name} cares about, and what to do in the first week.`;
    const reflectionText = await reflectOnBank(contact.bankId, handoffQuery);

    if (!reflectionText) {
      return NextResponse.json(
        { error: 'Hindsight reflection returned empty response.' },
        { status: 502 }
      );
    }

    // 2. Format the reflection through Groq into structured handoff sections (or fallback safely)
    const groqKeyOverride = request.headers.get('x-groq-api-key') || undefined;
    let handoffData = {
      relationshipSummary: reflectionText,
      openCommitments: [] as Array<{ commitment: string; isOverdue: boolean }>,
      whatTheyCareAbout: [] as string[],
      firstWeekActions: [] as string[],
      rawReflection: reflectionText,
    };

    if (isGroqConfigured() || groqKeyOverride) {
      try {
        const formatted = await formatHandoffBrief(contact, reflectionText, groqKeyOverride);
        handoffData = {
          ...formatted,
          rawReflection: reflectionText,
        };
      } catch (formatErr) {
        console.warn(`[API /handoff/${contactId}] Formatting warning, returning raw reflection:`, formatErr);
      }
    }

    return NextResponse.json({
      contact: {
        name: contact.name,
        role: contact.role,
        company: contact.company,
        bankId: contact.bankId,
      },
      handoff: handoffData,
    });
  } catch (err: any) {
    console.error(`[API /handoff/${contactId}] Error generating handoff brief:`, err);
    return NextResponse.json(
      { error: `Failed to generate account handoff brief: ${err?.message || err}` },
      { status: 500 }
    );
  }
}
