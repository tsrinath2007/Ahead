import { NextRequest, NextResponse } from 'next/server';
import { getContactById } from '@/lib/contacts';
import { retainMemory, isHindsightConfigured } from '@/lib/hindsight';
import { saveNoteForContact } from '@/lib/notes-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contactId,
      date,
      title,
      notes,
      type,
      promisesYouMade = [],
      promisesTheyMade = [],
      keyDecisions = [],
      resolvesPastOverdue = false,
    } = body;

    if (!contactId || !title || !notes) {
      return NextResponse.json(
        { error: 'contactId, title, and notes are required fields.' },
        { status: 400 }
      );
    }

    const contact = getContactById(contactId);
    if (!contact) {
      return NextResponse.json(
        { error: `Contact with ID "${contactId}" not found.` },
        { status: 404 }
      );
    }

    const meetingDate = date || new Date().toISOString().split('T')[0];

    // Format content with explicit semantic markers for Hindsight
    const contentParts = [
      `Meeting on ${meetingDate} with ${contact.name}: ${title}`,
      `Discussion Notes: ${notes.trim()}`,
    ];

    if (promisesYouMade.length > 0) {
      contentParts.push(
        `Promises Made / Commitments to Fulfill: ${promisesYouMade.join('; ')}`
      );
    }

    if (promisesTheyMade.length > 0) {
      contentParts.push(
        `Counterpart Actions Promised by ${contact.name}: ${promisesTheyMade.join('; ')}`
      );
    }

    if (keyDecisions.length > 0) {
      contentParts.push(`Key Decisions Agreed: ${keyDecisions.join('; ')}`);
    }

    if (resolvesPastOverdue) {
      contentParts.push(
        `STATUS RESOLUTION: Delivered and fulfilled past outstanding deliverable or commitment.`
      );
    }

    const formattedContent = contentParts.join('\n\n');

    // 1. Retain into Hindsight Memory Bank
    let retainDetails: any = null;
    let retainError: string | null = null;

    if (isHindsightConfigured()) {
      try {
        retainDetails = await retainMemory(contact.bankId, formattedContent, {
          context: `Meeting (${meetingDate}): ${title}`,
          timestamp: new Date(meetingDate).toISOString(),
        });
      } catch (err: any) {
        console.error('[API /api/notes/save] Hindsight retain error:', err);
        retainError = err?.message || 'Failed to retain into Hindsight';
      }
    } else {
      retainError = 'Hindsight API key not configured.';
    }

    // 2. Save into notes store for persistent timeline tracking
    const hasOutstandingCommitment = promisesYouMade.length > 0;
    const savedNote = await saveNoteForContact({
      contactId,
      date: meetingDate,
      title: title.trim(),
      notes: notes.trim(),
      type: type || 'Meeting',
      promisesYouMade,
      promisesTheyMade,
      keyDecisions,
      resolvesPastOverdue: Boolean(resolvesPastOverdue),
      hasOutstandingCommitment,
    });

    return NextResponse.json({
      success: true,
      note: savedNote,
      retainedInHindsight: Boolean(retainDetails),
      retainDetails,
      retainError,
    });
  } catch (error: any) {
    console.error('[API /api/notes/save] Error saving meeting note:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save meeting note' },
      { status: 500 }
    );
  }
}
