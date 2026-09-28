import * as fs from 'fs';
import * as path from 'path';
import { Contact, MeetingMemoryRecord } from './types';
import { SEEDED_CONTACTS } from './contacts';
import { isHindsightConfigured, createBankIfNotExists } from './hindsight';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONTACTS_FILE = path.resolve(DATA_DIR, 'contacts.json');

export function getAllContacts(): (Contact & { meetings: MeetingMemoryRecord[] })[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(CONTACTS_FILE)) {
      fs.writeFileSync(CONTACTS_FILE, JSON.stringify(SEEDED_CONTACTS, null, 2), 'utf-8');
      return SEEDED_CONTACTS;
    }

    const raw = fs.readFileSync(CONTACTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SEEDED_CONTACTS;
  } catch (err) {
    console.error('[contacts-store] Error reading contacts file:', err);
    return SEEDED_CONTACTS;
  }
}

export function saveAllContacts(contacts: (Contact & { meetings: MeetingMemoryRecord[] })[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf-8');
  } catch (err) {
    console.error('[contacts-store] Error saving contacts file:', err);
  }
}

export function getContactById(id: string): (Contact & { meetings: MeetingMemoryRecord[] }) | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const all = getAllContacts();
  const rawId = id.trim();
  const decoded = decodeURIComponent(rawId).trim().toLowerCase();
  const slugified = decoded.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    all.find((c) => c.id === rawId) ||
    all.find((c) => c.id.toLowerCase() === decoded) ||
    (slugified ? all.find((c) => c.id.toLowerCase() === slugified) : undefined) ||
    all.find((c) => c.name.toLowerCase() === decoded)
  );
}

export function getOrCreateContact(idOrName: string): Contact & { meetings: MeetingMemoryRecord[] } {
  if (!idOrName || typeof idOrName !== 'string' || !idOrName.trim()) {
    return createNewContact({
      name: 'Executive Contact',
      role: 'Executive Partner',
      company: 'Enterprise Organization',
      tagline: 'Stakeholder dossier for Executive Contact',
    });
  }

  const existing = getContactById(idOrName);
  if (existing) return existing;

  const raw = idOrName.trim();
  const decoded = decodeURIComponent(raw).trim();
  const cleanId = decoded
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const words = (cleanId || 'Executive Contact')
    .split('-')
    .filter(Boolean);

  const formattedName =
    words.length > 0
      ? words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      : 'Executive Contact';

  const newContact = createNewContact({
    id: cleanId || undefined,
    name: formattedName,
    role: 'Executive Partner',
    company: 'Enterprise Organization',
    tagline: `Stakeholder dossier for ${formattedName}`,
  });

  if (isHindsightConfigured()) {
    createBankIfNotExists(
      newContact.bankId,
      `${newContact.name} - ${newContact.company}`,
      `Executive relationship and commitment tracking for ${newContact.name}.`
    ).catch((err) => console.warn('[Auto-provision Hindsight]', err?.message || err));
  }

  return newContact;
}

export function createNewContact(input: {
  id?: string;
  name: string;
  role: string;
  company: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  tagline?: string;
  initialMeetingSummary?: string;
  initialMeetingContent?: string;
  hasOutstandingCommitment?: boolean;
}): Contact & { meetings: MeetingMemoryRecord[] } {
  const all = getAllContacts();

  // If a specific ID was provided, sanitize it; otherwise derive from name/company
  let baseId = input.id
    ? input.id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : (input.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (!baseId) {
    const compSlug = (input.company || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    baseId = compSlug ? `contact-${compSlug}` : `contact-${Date.now().toString(36)}`;
  }

  let id = baseId;
  let counter = 1;
  while (all.some((c) => c.id === id)) {
    id = `${baseId}-${counter++}`;
  }

  // Create avatar initials
  const parts = input.name.trim().split(/\s+/);
  const avatar =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : input.name.slice(0, 2).toUpperCase();

  const bankId = `contact-${id}`;

  const meetings: MeetingMemoryRecord[] = [];
  if (input.initialMeetingContent && input.initialMeetingContent.trim()) {
    meetings.push({
      date: new Date().toISOString().split('T')[0],
      summary: input.initialMeetingSummary?.trim() || 'Initial introductory discussion',
      content: input.initialMeetingContent.trim(),
      hasOutstandingCommitment: Boolean(input.hasOutstandingCommitment),
    });
  }

  const newContact: Contact & { meetings: MeetingMemoryRecord[] } = {
    id,
    name: input.name.trim(),
    role: input.role.trim(),
    company: input.company.trim(),
    bankId,
    avatar,
    tagline: input.tagline?.trim() || `Key stakeholder at ${input.company.trim()}`,
    isDemoFocus: false,
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    linkedin: input.linkedin?.trim() || undefined,
    createdAt: new Date().toISOString(),
    meetings,
  };

  all.push(newContact);
  saveAllContacts(all);
  return newContact;
}

export function updateContact(
  id: string,
  updates: Partial<Pick<Contact, 'name' | 'role' | 'company' | 'email' | 'phone' | 'linkedin' | 'tagline'>>
): (Contact & { meetings: MeetingMemoryRecord[] }) | null {
  const all = getAllContacts();
  const rawId = (id || '').trim();
  const decoded = decodeURIComponent(rawId).trim().toLowerCase();
  const slugified = decoded.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const index = all.findIndex(
    (c) =>
      c.id === rawId ||
      c.id.toLowerCase() === decoded ||
      (slugified && c.id.toLowerCase() === slugified) ||
      c.name.toLowerCase() === decoded
  );
  if (index === -1) return null;

  const current = all[index];
  let avatar = current.avatar;
  if (updates.name && updates.name.trim()) {
    const parts = updates.name.trim().split(/\s+/);
    avatar =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : updates.name.trim().slice(0, 2).toUpperCase();
  }

  const updated: Contact & { meetings: MeetingMemoryRecord[] } = {
    ...current,
    name: updates.name !== undefined ? updates.name.trim() : current.name,
    role: updates.role !== undefined ? updates.role.trim() : current.role,
    company: updates.company !== undefined ? updates.company.trim() : current.company,
    tagline: updates.tagline !== undefined ? updates.tagline.trim() : current.tagline,
    email: updates.email !== undefined ? (updates.email.trim() || undefined) : current.email,
    phone: updates.phone !== undefined ? (updates.phone.trim() || undefined) : current.phone,
    linkedin: updates.linkedin !== undefined ? (updates.linkedin.trim() || undefined) : current.linkedin,
    avatar,
  };

  all[index] = updated;
  saveAllContacts(all);
  return updated;
}

export function deleteContact(id: string): boolean {
  const all = getAllContacts();
  const rawId = (id || '').trim();
  const decoded = decodeURIComponent(rawId).trim().toLowerCase();
  const slugified = decoded.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const index = all.findIndex(
    (c) =>
      c.id === rawId ||
      c.id.toLowerCase() === decoded ||
      (slugified && c.id.toLowerCase() === slugified) ||
      c.name.toLowerCase() === decoded
  );
  if (index === -1) return false;

  all.splice(index, 1);
  saveAllContacts(all);
  return true;
}

