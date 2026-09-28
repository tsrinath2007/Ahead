import { NextRequest, NextResponse } from 'next/server';
import { getContactById } from '@/lib/contacts';
import { getNotesForContact } from '@/lib/notes-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const contactId = params.contactId;
    const contact = getContactById(contactId);

    if (!contact) {
      return NextResponse.json(
        { error: `Contact with ID "${contactId}" not found.` },
        { status: 404 }
      );
    }

    const notes = await getNotesForContact(contactId);

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
