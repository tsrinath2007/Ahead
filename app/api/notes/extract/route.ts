import { NextRequest, NextResponse } from 'next/server';
import { getContactById } from '@/lib/contacts-store';
import { extractCommitmentsFromNotes, isGroqConfigured } from '@/lib/groq';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactId, notesText, meetingTitle } = body;

    if (!contactId || !notesText || typeof notesText !== 'string' || !notesText.trim()) {
      return NextResponse.json(
        { error: 'contactId and notesText are required.' },
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

    const apiKeyOverride = request.headers.get('x-groq-api-key') || undefined;

    const extracted = await extractCommitmentsFromNotes(
      contact,
      notesText.trim(),
      meetingTitle?.trim(),
      apiKeyOverride
    );

    return NextResponse.json({
      success: true,
      extracted,
    });
  } catch (error: any) {
    console.error('[API /api/notes/extract] Error extracting commitments:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to extract commitments from notes' },
      { status: 500 }
    );
  }
}
