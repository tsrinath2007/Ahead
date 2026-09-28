import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MeetingNote } from './types';
import { SEEDED_CONTACTS } from './contacts';

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BASE_DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_DIR = IS_SERVERLESS ? path.join(os.tmpdir(), 'ahead-data') : BASE_DATA_DIR;
const NOTES_FILE = path.resolve(DATA_DIR, 'meeting-notes.json');

function ensureNotesFiles() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (IS_SERVERLESS && !fs.existsSync(NOTES_FILE)) {
      const sourceNotes = path.resolve(BASE_DATA_DIR, 'meeting-notes.json');
      if (fs.existsSync(sourceNotes)) {
        fs.copyFileSync(sourceNotes, NOTES_FILE);
      }
    }
  } catch (err) {
    console.warn('[notes-store] ensureNotesFiles warning:', err);
  }
}

function generateInitialNotes(): MeetingNote[] {
  const notes: MeetingNote[] = [];

  for (const contact of SEEDED_CONTACTS) {
    contact.meetings.forEach((m, idx) => {
      let promisesYouMade: string[] = [];
      let promisesTheyMade: string[] = [];
      let keyDecisions: string[] = [];

      if (m.hasOutstandingCommitment) {
        promisesYouMade = ['Send technical follow-up doc on integration support within 48 hours (OVERDUE)'];
        keyDecisions = ['Jordan raised major concern about legacy warehouse management system integration'];
      } else if (m.summary.toLowerCase().includes('budget') || m.content.toLowerCase().includes('pricing')) {
        keyDecisions = ['Current budget is locked for Q4', 'Revisit pricing next quarter (Q1 2026)'];
      } else if (m.summary.toLowerCase().includes('scheduling')) {
        keyDecisions = ['Align on calendar availability for next working session'];
      } else if (m.summary.toLowerCase().includes('compliance') || m.summary.toLowerCase().includes('sso')) {
        keyDecisions = ['SAML and Okta SSO compliance requirements completely satisfied'];
      } else if (m.summary.toLowerCase().includes('latency') || m.summary.toLowerCase().includes('architecture')) {
        keyDecisions = ['Standard tier API latency and rate limits confirmed sufficient'];
      } else if (m.summary.toLowerCase().includes('sandbox')) {
        keyDecisions = ['Sandbox migration completed successfully with zero blockers'];
      } else {
        keyDecisions = [m.summary];
      }

      notes.push({
        id: `${contact.id}-seed-${idx + 1}`,
        contactId: contact.id,
        date: m.date,
        title: m.summary,
        notes: m.content,
        type: idx === 0 ? 'Discovery & Budget' : idx === 1 ? 'Technical Architecture' : 'Check-in',
        promisesYouMade,
        promisesTheyMade,
        keyDecisions,
        hasOutstandingCommitment: Boolean(m.hasOutstandingCommitment),
        resolvesPastOverdue: false,
        createdAt: new Date(m.date).toISOString(),
      });
    });
  }

  return notes;
}

function loadAllNotes(): MeetingNote[] {
  try {
    ensureNotesFiles();

    if (!fs.existsSync(NOTES_FILE)) {
      const initial = generateInitialNotes();
      fs.writeFileSync(NOTES_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }

    const raw = fs.readFileSync(NOTES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return generateInitialNotes();
  } catch (err) {
    console.error('[notes-store] Error reading meeting notes file:', err);
    return generateInitialNotes();
  }
}

function saveAllNotes(notes: MeetingNote[]) {
  try {
    ensureNotesFiles();
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
  } catch (err) {
    console.error('[notes-store] Error writing meeting notes file:', err);
  }
}

export async function getNotesForContact(contactId: string): Promise<MeetingNote[]> {
  const all = loadAllNotes();
  const cleanId = (contactId || '').trim().toLowerCase();
  const slugified = decodeURIComponent(cleanId).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const contactNotes = all.filter((n) => {
    const nid = (n.contactId || '').toLowerCase();
    return nid === cleanId || (slugified && nid === slugified);
  });
  // Sort descending by date (most recent first)
  return contactNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveNoteForContact(
  noteInput: Omit<MeetingNote, 'id' | 'createdAt'>
): Promise<MeetingNote> {
  const all = loadAllNotes();
  const id = `${noteInput.contactId}-${Date.now()}`;
  const newNote: MeetingNote = {
    ...noteInput,
    id,
    createdAt: new Date().toISOString(),
  };

  all.push(newNote);
  saveAllNotes(all);
  return newNote;
}

export async function resetNotesForContact(contactId: string): Promise<void> {
  const all = loadAllNotes();
  const cleanId = (contactId || '').trim().toLowerCase();
  const slugified = decodeURIComponent(cleanId).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  // Filter out all notes for this contact
  const remaining = all.filter((n) => {
    const nid = (n.contactId || '').toLowerCase();
    return nid !== cleanId && (!slugified || nid !== slugified);
  });
  // Re-generate pristine seed notes for this contact
  const pristine = generateInitialNotes().filter((n) => {
    const nid = (n.contactId || '').toLowerCase();
    return nid === cleanId || (slugified && nid === slugified);
  });
  saveAllNotes([...remaining, ...pristine]);
}

export async function deleteNotesForContact(contactId: string): Promise<void> {
  const all = loadAllNotes();
  const cleanId = (contactId || '').trim().toLowerCase();
  const slugified = decodeURIComponent(cleanId).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const remaining = all.filter((n) => {
    const nid = (n.contactId || '').toLowerCase();
    return nid !== cleanId && (!slugified || nid !== slugified);
  });
  saveAllNotes(remaining);
}

