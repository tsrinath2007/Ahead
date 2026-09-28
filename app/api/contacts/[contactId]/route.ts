import { NextRequest, NextResponse } from 'next/server';
import { getContactById, getOrCreateContact, updateContact, deleteContact, markContactDeleted } from '@/lib/contacts-store';
import { deleteNotesForContact } from '@/lib/notes-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const rawContactId = params.contactId || '';
    const contactId = decodeURIComponent(rawContactId).trim();
    const contact = getOrCreateContact(contactId);
    if (!contact) {
      return NextResponse.json(
        { error: `Contact "${contactId}" was deleted or not found.`, deleted: true },
        { status: 404 }
      );
    }
    return NextResponse.json({ contact });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const contactId = params.contactId;
    const body = await request.json();
    const { name, role, company, email, phone, linkedin, tagline } = body;

    const existing = getContactById(contactId);
    if (!existing) {
      return NextResponse.json(
        { error: `Contact with ID "${contactId}" not found.` },
        { status: 404 }
      );
    }

    const updated = updateContact(existing.id, {
      name,
      role,
      company,
      email,
      phone,
      linkedin,
      tagline,
    });

    return NextResponse.json({
      success: true,
      contact: updated,
    });
  } catch (error: any) {
    console.error(`[API /api/contacts/${params.contactId}] Error updating:`, error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const rawContactId = params.contactId || '';
    const contactId = decodeURIComponent(rawContactId).trim();
    const existing = getContactById(contactId);
    if (!existing) {
      markContactDeleted(contactId);
      await deleteNotesForContact(contactId);
      return NextResponse.json({
        success: true,
        message: `Contact "${contactId}" is deleted.`,
      });
    }

    // Protect demo benchmark contacts if needed, or allow deleting with warning
    if (existing.isDemoFocus && existing.id === 'jordan-reyes') {
      return NextResponse.json(
        { error: 'Cannot delete benchmark demo contact Jordan Reyes.' },
        { status: 400 }
      );
    }

    deleteContact(existing.id);
    await deleteNotesForContact(existing.id);

    return NextResponse.json({
      success: true,
      message: `Contact "${existing.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error(`[API /api/contacts/${params.contactId}] Error deleting:`, error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
