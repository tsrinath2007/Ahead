import { NextRequest, NextResponse } from 'next/server';
import { getContactById } from '@/lib/contacts-store';
import { retainMemory, isHindsightConfigured } from '@/lib/hindsight';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactId, outcomeText } = body;

    if (!contactId || !outcomeText || typeof outcomeText !== 'string' || !outcomeText.trim()) {
      return NextResponse.json(
        { error: 'Both contactId and outcomeText are required.' },
        { status: 400 }
      );
    }

    const contact = getContactById(contactId);
    if (!contact) {
      return NextResponse.json(
        { error: `Contact "${contactId}" not found.` },
        { status: 404 }
      );
    }

    if (!isHindsightConfigured()) {
      return NextResponse.json(
        { error: 'Memory system unavailable: HINDSIGHT_API_KEY is missing in environment variables.' },
        { status: 503 }
      );
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedContent = `Meeting on ${todayStr} with ${contact.name}: ${outcomeText.trim()}`;

    const retainRes = await retainMemory(contact.bankId, formattedContent, {
      context: `Live Logged Outcome (${todayStr})`,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully retained outcome to bank "${contact.bankId}"!`,
      details: retainRes,
      savedContent: formattedContent,
    });
  } catch (error: any) {
    console.error('[API /retain] Error retaining meeting outcome:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retain meeting memory' },
      { status: 500 }
    );
  }
}
