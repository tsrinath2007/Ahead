import { NextRequest, NextResponse } from 'next/server';
import { getAllContacts, createNewContact } from '@/lib/contacts-store';
import { createBankIfNotExists, retainMemory, isHindsightConfigured } from '@/lib/hindsight';
import { saveNoteForContact } from '@/lib/notes-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const contacts = getAllContacts();
    return NextResponse.json({
      contacts,
      count: contacts.length,
    });
  } catch (error: any) {
    console.error('[API /api/contacts] Error fetching contacts:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      role,
      company,
      email,
      phone,
      linkedin,
      tagline,
      initialMeetingSummary,
      initialMeetingContent,
      hasOutstandingCommitment = false,
    } = body;

    if (!name || !role || !company) {
      return NextResponse.json(
        { error: 'Name, Role, and Company are required fields.' },
        { status: 400 }
      );
    }

    // 1. Create and persist new contact immediately (disk persistence)
    const newContact = createNewContact({
      name,
      role,
      company,
      email,
      phone,
      linkedin,
      tagline,
      initialMeetingSummary,
      initialMeetingContent,
      hasOutstandingCommitment,
    });

    // 2. Persist initial meeting note locally immediately
    const today = new Date().toISOString().split('T')[0];
    const summary = initialMeetingSummary?.trim() || 'Initial introductory discussion';

    if (initialMeetingContent && initialMeetingContent.trim()) {
      saveNoteForContact({
        contactId: newContact.id,
        date: today,
        title: summary,
        notes: initialMeetingContent.trim(),
        type: 'Discovery',
        promisesYouMade: hasOutstandingCommitment
          ? [initialMeetingContent.trim().slice(0, 120)]
          : [],
        promisesTheyMade: [],
        keyDecisions: [summary],
        resolvesPastOverdue: false,
        hasOutstandingCommitment: Boolean(hasOutstandingCommitment),
      }).catch((err) => console.error('[API /api/contacts] Error saving note:', err));
    }

    // 3. Provision Hindsight Memory Bank asynchronously (non-blocking for instant UI response)
    if (isHindsightConfigured()) {
      (async () => {
        try {
          await createBankIfNotExists(
            newContact.bankId,
            `${newContact.name} - ${newContact.company}`,
            `Executive meeting relationship and commitment tracking for ${newContact.name} at ${newContact.company}.`
          );

          if (initialMeetingContent && initialMeetingContent.trim()) {
            const formatted = `Meeting on ${today} with ${newContact.name}: ${summary}\n\n${initialMeetingContent.trim()}`;
            await retainMemory(newContact.bankId, formatted, {
              context: `Initial Meeting (${today}): ${summary}`,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (hindsightErr: any) {
          console.warn('[API /api/contacts] Async Hindsight bank setup notice:', hindsightErr?.message || hindsightErr);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      contact: newContact,
    });
  } catch (error: any) {
    console.error('[API /api/contacts] Error creating contact:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create contact' },
      { status: 500 }
    );
  }
}
