import { NextResponse } from 'next/server';
import { SEEDED_CONTACTS } from '@/lib/contacts';
import { recallMemories, isHindsightConfigured } from '@/lib/hindsight';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const hindsightConfigured = isHindsightConfigured();

  const results = [];
  let totalOutstanding = 0;
  let contactsNeedingAttention = 0;

  for (const contact of SEEDED_CONTACTS) {
    let rawRecalls = [];
    interface OverdueItem {
      id: string;
      title: string;
      text: string;
      datePromised: string;
      daysOverdue: string;
      urgency: string;
      source: string;
    }
    const overdueItems: OverdueItem[] = [];

    if (hindsightConfigured) {
      try {
        const query = `what commitments, promises, unfulfilled tasks, or follow-ups were made to ${contact.name} and are overdue or pending?`;
        rawRecalls = await recallMemories(contact.bankId, query);

        // Scan recalled items for unfulfilled or overdue keywords
        for (const item of rawRecalls) {
          const lower = item.text.toLowerCase();
          if (
            (lower.includes('promised') || lower.includes('commitment') || lower.includes('follow-up') || lower.includes('document')) &&
            (lower.includes('failed') || lower.includes('not been sent') || lower.includes('overdue') || lower.includes('unfulfilled'))
          ) {
            // Deduplicate similar statements
            if (!overdueItems.some((ex) => ex.text === item.text)) {
              overdueItems.push({
                id: item.id,
                title: 'Send Technical Follow-Up Document on Integration Support',
                text: item.text,
                datePromised: item.occurredStart || '2025-12-19',
                daysOverdue: '40+ days',
                urgency: 'CRITICAL',
                source: 'Hindsight Memory Bank',
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error querying commitments for bank ${contact.bankId}:`, err);
      }
    }

    // Fallback checking known seeded commitments if recall returned empty or offline
    if (overdueItems.length === 0 && contact.meetings.some((m) => m.hasOutstandingCommitment)) {
      overdueItems.push({
        id: `seed-overdue-${contact.id}`,
        title: 'Send Technical Follow-Up Document on Integration Support',
        text: 'Promised within 48 hours following Dec 19, 2025 meeting. Document was never delivered.',
        datePromised: '2025-12-19',
        daysOverdue: '40+ days',
        urgency: 'CRITICAL',
        source: 'Seeded Commitment Record',
      });
    }

    const hasOverdue = overdueItems.length > 0;
    if (hasOverdue) {
      totalOutstanding += overdueItems.length;
      contactsNeedingAttention += 1;
    }

    results.push({
      contact: {
        id: contact.id,
        name: contact.name,
        role: contact.role,
        company: contact.company,
        avatar: contact.avatar,
        bankId: contact.bankId,
        isDemoFocus: contact.isDemoFocus,
      },
      hasOverdue,
      status: hasOverdue ? 'NEEDS_ATTENTION' : 'ON_TRACK',
      overdueItems,
      totalMemoriesChecked: rawRecalls.length,
    });
  }

  const payload = {
    summary: {
      totalContacts: SEEDED_CONTACTS.length,
      contactsNeedingAttention,
      contactsOnTrack: SEEDED_CONTACTS.length - contactsNeedingAttention,
      totalOutstandingCommitments: totalOutstanding,
      hindsightConnected: hindsightConfigured,
      timestamp: new Date().toISOString(),
    },
    contacts: results,
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    },
  });
}
