import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateContact } from '@/lib/contacts-store';
import { getNotesForContact } from '@/lib/notes-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const rawId = params.contactId || '';
    const contactId = decodeURIComponent(rawId).trim();
    const contact = getOrCreateContact(contactId);

    if (!contact) {
      return NextResponse.json({
        contact: null,
        notes: [],
        count: 0,
      });
    }

    const notes = await getNotesForContact(contact.id);

    return NextResponse.json({
      contact,
      notes,
      count: notes.length,
    });
  } catch (error: any) {
    console.error('[API /api/notes/[contactId]] Error retrieving notes:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve meeting notes' },
      { status: 500 }
    );
  }
}
