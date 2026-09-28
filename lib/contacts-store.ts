import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Contact, MeetingMemoryRecord } from './types';
import { SEEDED_CONTACTS } from './contacts';
import { isHindsightConfigured, createBankIfNotExists } from './hindsight';

const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BASE_DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_DIR = IS_SERVERLESS ? path.join(os.tmpdir(), 'ahead-data') : BASE_DATA_DIR;

const CONTACTS_FILE = path.resolve(DATA_DIR, 'contacts.json');
const DELETED_CONTACTS_FILE = path.resolve(DATA_DIR, 'deleted-contacts.json');

function ensureDataFiles() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (IS_SERVERLESS) {
      if (!fs.existsSync(CONTACTS_FILE)) {
        const sourceContacts = path.resolve(BASE_DATA_DIR, 'contacts.json');
        if (fs.existsSync(sourceContacts)) {
          fs.copyFileSync(sourceContacts, CONTACTS_FILE);
        } else {
          fs.writeFileSync(CONTACTS_FILE, JSON.stringify(SEEDED_CONTACTS, null, 2), 'utf-8');
        }
      }

      if (!fs.existsSync(DELETED_CONTACTS_FILE)) {
        const sourceDeleted = path.resolve(BASE_DATA_DIR, 'deleted-contacts.json');
        if (fs.existsSync(sourceDeleted)) {
          fs.copyFileSync(sourceDeleted, DELETED_CONTACTS_FILE);
        } else {
          fs.writeFileSync(DELETED_CONTACTS_FILE, JSON.stringify([], null, 2), 'utf-8');
        }
      }
    }
  } catch (err) {
    console.warn('[contacts-store] ensureDataFiles warning:', err);
  }
}

export function getDeletedContactIds(): string[] {
  try {
    ensureDataFiles();
    if (!fs.existsSync(DELETED_CONTACTS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DELETED_CONTACTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function isContactDeleted(id: string): boolean {
  if (!id) return false;
  const deleted = getDeletedContactIds();
  const rawId = id.trim().toLowerCase();
  const slugified = decodeURIComponent(rawId).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return deleted.some((d) => d.toLowerCase() === rawId || (slugified && d.toLowerCase() === slugified));
}

export function markContactDeleted(id: string) {
  try {
    ensureDataFiles();
    const deleted = getDeletedContactIds();
    const rawId = (id || '').trim().toLowerCase();
    const slugified = decodeURIComponent(rawId).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const toAdd = [rawId, slugified].filter(Boolean);
    const updated = Array.from(new Set([...deleted, ...toAdd]));
    fs.writeFileSync(DELETED_CONTACTS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('[contacts-store] Error saving deleted-contacts file:', err);
  }
}

export function unmarkContactDeleted(id: string) {
  try {
    ensureDataFiles();
    const deleted = getDeletedContactIds();
    const rawId = (id || '').trim().toLowerCase();
    const slugified = decodeURIComponent(rawId).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const updated = deleted.filter(
      (d) => d.toLowerCase() !== rawId && (!slugified || d.toLowerCase() !== slugified)
    );
    fs.writeFileSync(DELETED_CONTACTS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('[contacts-store] Error updating deleted-contacts file:', err);
  }
}

export function getAllContacts(): (Contact & { meetings: MeetingMemoryRecord[] })[] {
  try {
    ensureDataFiles();
    let contacts: (Contact & { meetings: MeetingMemoryRecord[] })[] = [];
    if (!fs.existsSync(CONTACTS_FILE)) {
      contacts = SEEDED_CONTACTS;
      try {
        fs.writeFileSync(CONTACTS_FILE, JSON.stringify(SEEDED_CONTACTS, null, 2), 'utf-8');
      } catch {}
    } else {
      const raw = fs.readFileSync(CONTACTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        contacts = parsed;
      } else {
        contacts = SEEDED_CONTACTS;
      }
    }

    const deletedIds = getDeletedContactIds();
    if (deletedIds.length > 0) {
      const deletedSet = new Set(deletedIds.map((d) => d.toLowerCase()));
      contacts = contacts.filter((c) => {
        const idLower = (c.id || '').toLowerCase();
        const slug = idLower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return !deletedSet.has(idLower) && !deletedSet.has(slug);
      });
    }

    return contacts;
  } catch (err) {
    console.error('[contacts-store] Error reading contacts file:', err);
    return SEEDED_CONTACTS;
  }
}

export function saveAllContacts(contacts: (Contact & { meetings: MeetingMemoryRecord[] })[]) {
  try {
    ensureDataFiles();
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf-8');
  } catch (err) {
    console.error('[contacts-store] Error saving contacts file:', err);
  }
}

export function getContactById(id: string): (Contact & { meetings: MeetingMemoryRecord[] }) | undefined {
  if (!id || typeof id !== 'string') return undefined;
  if (isContactDeleted(id)) return undefined;

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

export function resolveContact(
  contactId: string,
  customHeaderData?: string | null
): (Contact & { meetings: MeetingMemoryRecord[] }) | undefined {
  if (!contactId && !customHeaderData) return undefined;

  const cleanId = (contactId || '').trim();
  if (cleanId && isContactDeleted(cleanId)) return undefined;

  // If client sent contact payload via header, ensure it exists in store
  if (customHeaderData) {
    try {
      const parsed = JSON.parse(decodeURIComponent(customHeaderData));
      if (parsed && (parsed.id || parsed.name)) {
        const idToMatch = (parsed.id || cleanId).trim();
        if (!isContactDeleted(idToMatch)) {
          const existing = getContactById(idToMatch);
          if (existing) return existing;

          return createNewContact({
            id: parsed.id || cleanId,
            name: parsed.name || 'Executive Contact',
            role: parsed.role || 'Executive Partner',
            company: parsed.company || 'Enterprise Organization',
            email: parsed.email,
            phone: parsed.phone,
            linkedin: parsed.linkedin,
            tagline: parsed.tagline,
          });
        }
      }
    } catch (e) {
      console.warn('[contacts-store] Failed to parse custom header data:', e);
    }
  }

  return getOrCreateContact(cleanId);
}

export function getOrCreateContact(
  idOrName: string,
  options?: { allowDeletedResurrection?: boolean }
): (Contact & { meetings: MeetingMemoryRecord[] }) | undefined {
  if (!idOrName || typeof idOrName !== 'string' || !idOrName.trim()) {
    return createNewContact({
      name: 'Executive Contact',
      role: 'Executive Partner',
      company: 'Enterprise Organization',
      tagline: 'Stakeholder dossier for Executive Contact',
    });
  }

  const raw = idOrName.trim();
  const decoded = decodeURIComponent(raw).trim();
  const cleanId = decoded
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // If this contact was deleted and resurrection is not permitted, do not re-create it
  if (!options?.allowDeletedResurrection && (isContactDeleted(raw) || isContactDeleted(cleanId))) {
    return undefined;
  }

  const existing = getContactById(idOrName);
  if (existing) return existing;

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

  unmarkContactDeleted(id);
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

  markContactDeleted(id);
  if (slugified) markContactDeleted(slugified);

  const index = all.findIndex(
    (c) =>
      c.id === rawId ||
      c.id.toLowerCase() === decoded ||
      (slugified && c.id.toLowerCase() === slugified) ||
      c.name.toLowerCase() === decoded
  );
  if (index === -1) return false;

  const removed = all.splice(index, 1);
  saveAllContacts(all);
  if (removed[0]?.id) {
    markContactDeleted(removed[0].id);
  }
  return true;
}

