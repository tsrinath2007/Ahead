'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SEEDED_CONTACTS } from '@/lib/contacts';
import { Contact, MeetingMemoryRecord } from '@/lib/types';
import {
  Brain,
  ArrowRight,
  Sparkles,
  AlertCircle,
  History,
  Building2,
  User,
  CheckCircle2,
  Flame,
  Plus,
  Mail,
  Phone,
  ExternalLink,
  X,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { EditContactModal } from '@/components/EditContactModal';

function LinkedinIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.84 6.2a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
    </svg>
  );
}

const LOCAL_DELETED_KEY = 'ahead_deleted_contacts_v1';

function getLocalDeletedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addLocalDeletedId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalDeletedIds();
    const cleanId = (id || '').trim().toLowerCase();
    const slugified = decodeURIComponent(cleanId).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const updated = Array.from(new Set([...current, cleanId, slugified].filter(Boolean)));
    localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(updated));
  } catch {}
}

function removeLocalDeletedId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalDeletedIds();
    const cleanId = (id || '').trim().toLowerCase();
    const slugified = decodeURIComponent(cleanId).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const updated = current.filter((x) => x !== cleanId && x !== slugified);
    localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(updated));
  } catch {}
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<(Contact & { meetings: MeetingMemoryRecord[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [successToast, setSuccessToast] = useState<{ id: string; name: string } | null>(null);

  // New Contact Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [tagline, setTagline] = useState('');
  const [initialMeetingSummary, setInitialMeetingSummary] = useState('');
  const [initialMeetingContent, setInitialMeetingContent] = useState('');
  const [hasOutstandingCommitment, setHasOutstandingCommitment] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contacts?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.contacts)) {
          const deleted = getLocalDeletedIds();
          const filtered = json.contacts.filter((c: Contact) => {
            const cid = c.id.toLowerCase();
            return !deleted.includes(cid);
          });
          setContacts(filtered);
        }
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !company.trim()) {
      setFormError('Please enter Name, Role, and Company.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          company: company.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          tagline: tagline.trim() || undefined,
          initialMeetingSummary: initialMeetingSummary.trim() || undefined,
          initialMeetingContent: initialMeetingContent.trim() || undefined,
          hasOutstandingCommitment,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create contact');
      }

      // Immediately add newly created contact to state so it appears instantly on screen!
      if (json.contact) {
        removeLocalDeletedId(json.contact.id);
        setContacts((prev) => [json.contact, ...prev.filter((c) => c.id !== json.contact.id)]);
        setSuccessToast({ id: json.contact.id, name: json.contact.name });
      }

      // Reset form & close modal immediately
      setName('');
      setRole('');
      setCompany('');
      setEmail('');
      setPhone('');
      setLinkedin('');
      setTagline('');
      setInitialMeetingSummary('');
      setInitialMeetingContent('');
      setHasOutstandingCommitment(false);
      setShowAddModal(false);

      // Background re-sync
      fetchContacts();
    } catch (err: any) {
      console.error('Error creating contact:', err);
      setFormError(err?.message || 'Failed to create contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    // 1. Immediately persist to localStorage so it can NEVER reappear even if Vercel cold-starts
    addLocalDeletedId(id);

    // 2. Optimistic UI update: instantly disappears from the UI!
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setContactToDelete(null);

    try {
      await fetch(`/api/contacts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      await fetchContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
      await fetchContacts();
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Ahead — Never break a promise twice.
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Never Break a Promise Twice.
          </h1>
          <p className="text-indigo-200 text-sm sm:text-base font-semibold">
            Know what matters before you meet.
          </p>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Relationships rarely die from big betrayals—they stall on small forgotten promises. Generic AI assistants generate cookie-cutter discovery questions because they have zero recollection of your past interactions.
            <strong className="text-white font-semibold"> Ahead</strong> tracks every commitment across persistent Hindsight memory banks until it is kept.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <span className="font-semibold text-white">Bank Architecture:</span> 1 Hindsight bank per contact
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <span className="font-semibold text-white">Primitives:</span> retain(), recall(), reflect()
            </div>
          </div>
        </div>
      </div>

      {/* Demo Guidance Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs sm:text-sm text-amber-900">
          <span className="font-bold">Core Demo Scenario:</span> Select{' '}
          <strong className="underline decoration-amber-600 font-bold">Jordan Reyes</strong>. In meeting #2, you promised to send a technical integration doc within 48 hours and never did. Meeting #1 agreed to revisit pricing this quarter. Watch Hindsight surface the overdue promise instantly while the generic assistant is completely blind to it.
        </div>
      </div>

      {/* Creation Success Banner */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base text-slate-900">
                Contact &ldquo;{successToast.name}&rdquo; created successfully!
              </p>
              <p className="text-xs text-slate-600">
                New contact profile added to your directory with an active Hindsight memory bank.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/brief/${successToast.id}`}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 shadow"
            >
              <span>Open Brief &amp; Notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Contacts List Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Contacts &amp; Memory Banks
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any contact to view their pre-meeting brief, meeting notes history, and overdue promises.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Contact</span>
            </button>

            <Link
              href="/commitments"
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>View Commitments Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <span className="text-xs text-slate-500 font-medium hidden sm:inline bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
              {contacts.length} Active Banks
            </span>
          </div>
        </div>

        {loading && contacts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-slate-200 rounded-2xl p-6 h-64 animate-pulse flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-3 bg-slate-200 rounded w-4/5" />
                </div>
                <div className="h-10 bg-slate-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact) => {
            const isDemo = contact.isDemoFocus;
            const hasOverdue = contact.meetings?.some((m) => m.hasOutstandingCommitment);

            return (
              <div
                key={contact.id}
                onClick={() => router.push(`/brief/${contact.id}`)}
                className={`relative rounded-2xl transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 ${
                  isDemo
                    ? 'bg-white border-2 border-indigo-500 shadow-lg shadow-indigo-100/50 ring-2 ring-indigo-500/20 hover:shadow-xl'
                    : 'bg-white border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md'
                }`}
              >
                {isDemo && (
                  <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white text-[11px] font-black px-3.5 py-0.5 rounded-full shadow-md tracking-wider uppercase flex items-center gap-1.5 ring-2 ring-white">
                    <span>⭐ Try this one (Hero Demo)</span>
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {/* Avatar & Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-inner ${
                          isDemo
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {contact.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors">
                          {contact.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{contact.role}</p>
                      </div>
                    </div>

                    {/* Relationship Health Badge & Edit Action */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {hasOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm ring-1 ring-rose-300">
                          <Flame className="w-3 h-3" />
                          Needs Attention
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          On Track
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingContact(contact);
                        }}
                        title="Edit Contact Dossier"
                        className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {!isDemo && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setContactToDelete(contact);
                          }}
                          title="Delete Contact"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Company & Bank ID */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">{contact.company}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      <Brain className="w-3.5 h-3.5 text-indigo-500" />
                      <span>bank: {contact.bankId}</span>
                    </div>

                    {/* Contact Dossier: Email, Phone, LinkedIn */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <a
                            href={`mailto:${contact.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline truncate"
                          >
                            {contact.email}
                          </a>
                        </div>
                      )}

                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <a
                            href={`tel:${contact.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-slate-600 hover:text-slate-900 hover:underline"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      )}

                      {contact.linkedin && (
                        <div className="flex items-center gap-2">
                          <LinkedinIcon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <a
                            href={contact.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                          >
                            <span>LinkedIn Profile</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <p className="text-slate-600 pt-1 leading-relaxed italic text-[11px]">
                      &quot;{contact.tagline}&quot;
                    </p>
                  </div>

                  {/* Logged Meetings Summary */}
                  {contact.meetings && contact.meetings.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <History className="w-3 h-3 text-slate-400" />
                        Logged Meetings ({contact.meetings.length})
                      </div>
                      <ul className="space-y-1.5">
                        {contact.meetings.slice(0, 3).map((m, idx) => (
                          <li
                            key={idx}
                            className={`text-xs p-2 rounded-lg flex items-center justify-between ${
                              m.hasOutstandingCommitment
                                ? 'bg-rose-50 border border-rose-200 text-rose-900 font-medium'
                                : 'bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="truncate pr-2">
                              #{idx + 1}: {m.summary}
                            </span>
                            {m.hasOutstandingCommitment && (
                              <span className="flex-shrink-0 text-[10px] font-bold uppercase bg-rose-600 text-white px-1.5 py-0.5 rounded">
                                Overdue
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="p-6 pt-0">
                  <div
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${
                      isDemo
                        ? 'bg-indigo-600 group-hover:bg-indigo-700 text-white shadow-indigo-200 group-hover:shadow-indigo-300'
                        : 'bg-slate-900 group-hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Open Brief &amp; Notes</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD A NEW CONTACT & PROVISION HINDSIGHT BANK                        */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add New Contact</h3>
                  <p className="text-xs text-slate-500">
                    Provisions a dedicated Hindsight memory bank to track past interactions and commitments.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateContact} className="space-y-4">
              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Lin"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Chief Technology Officer"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
              </div>

              {/* Company & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. CloudScale Labs"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Relationship Tagline
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Enterprise pilot evaluation"
                    className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
              </div>

              {/* Contact Dossier: Email, Phone, LinkedIn */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Contact Information (Email, Phone, LinkedIn)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sarah.lin@cloudscale.io"
                        className="w-full text-xs p-2.5 pl-8 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (415) 890-1122"
                        className="w-full text-xs p-2.5 pl-8 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      LinkedIn Profile URL
                    </label>
                    <div className="relative">
                      <LinkedinIcon className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-3" />
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/sarah-lin"
                        className="w-full text-xs p-2.5 pl-8 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Initial Meeting / Memory Note (Optional) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Initial Interaction or Past Meeting Context (Optional)
                </label>
                <input
                  type="text"
                  value={initialMeetingSummary}
                  onChange={(e) => setInitialMeetingSummary(e.target.value)}
                  placeholder="Topic / Summary: e.g. Intro discovery call"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
                />
                <textarea
                  rows={3}
                  value={initialMeetingContent}
                  onChange={(e) => setInitialMeetingContent(e.target.value)}
                  placeholder="Discussion highlights or promises: e.g. Met Sarah at SaaStr. Promised to send our SOC2 report and pricing by Friday."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-none resize-none"
                />

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={hasOutstandingCommitment}
                    onChange={(e) => setHasOutstandingCommitment(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Flag initial promise as an outstanding commitment needing attention
                  </span>
                </label>
              </div>

              {/* Error Notice */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning Bank...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Contact &amp; Provision Bank</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT CONTACT DOSSIER                                                */}
      {/* ========================================================================= */}
      {editingContact && (
        <EditContactModal
          isOpen={Boolean(editingContact)}
          onClose={() => setEditingContact(null)}
          contact={editingContact}
          onSuccess={(updated) => {
            setContacts((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
            );
          }}
          onDelete={(deletedId) => {
            addLocalDeletedId(deletedId);
            setContacts((prev) => prev.filter((c) => c.id !== deletedId));
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONTACT CONFIRMATION                                        */}
      {/* ========================================================================= */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Delete Contact?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <strong className="text-slate-800">{contactToDelete.name}</strong>? This will permanently remove their profile and meeting notes.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteContact(contactToDelete.id)}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
