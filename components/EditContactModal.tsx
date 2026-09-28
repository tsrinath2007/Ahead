'use client';

import React, { useState, useEffect } from 'react';
import { Contact } from '@/lib/types';
import {
  X,
  Pencil,
  Trash2,
  Building2,
  Mail,
  Phone,
  AlertTriangle,
  RefreshCw,
  User,
} from 'lucide-react';

function LinkedinIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.84 6.2a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24Z" />
    </svg>
  );
}

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  onSuccess: (updatedContact: Contact) => void;
  onDelete?: (deletedContactId: string) => void;
}

export function EditContactModal({
  isOpen,
  onClose,
  contact,
  onSuccess,
  onDelete,
}: EditContactModalProps) {
  const [name, setName] = useState(contact.name || '');
  const [role, setRole] = useState(contact.role || '');
  const [company, setCompany] = useState(contact.company || '');
  const [email, setEmail] = useState(contact.email || '');
  const [phone, setPhone] = useState(contact.phone || '');
  const [linkedin, setLinkedin] = useState(contact.linkedin || '');
  const [tagline, setTagline] = useState(contact.tagline || '');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(contact.name || '');
      setRole(contact.role || '');
      setCompany(contact.company || '');
      setEmail(contact.email || '');
      setPhone(contact.phone || '');
      setLinkedin(contact.linkedin || '');
      setTagline(contact.tagline || '');
      setError(null);
      setConfirmDelete(false);
    }
  }, [isOpen, contact]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !company.trim()) {
      setError('Name, Role, and Company are required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          company: company.trim(),
          email: email.trim() || '',
          phone: phone.trim() || '',
          linkedin: linkedin.trim() || '',
          tagline: tagline.trim() || '',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update contact');
      }

      onSuccess(json.contact);
      onClose();
    } catch (err: any) {
      console.error('Error updating contact:', err);
      setError(err?.message || 'Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to delete contact');
      }

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('ahead_deleted_contacts_v1');
          const current = raw ? JSON.parse(raw) : [];
          const cleanId = contact.id.trim().toLowerCase();
          const slugified = decodeURIComponent(cleanId).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const updated = Array.from(new Set([...current, cleanId, slugified].filter(Boolean)));
          localStorage.setItem('ahead_deleted_contacts_v1', JSON.stringify(updated));
        } catch {}
      }

      if (onDelete) {
        onDelete(contact.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      setError(err?.message || 'Failed to delete contact');
    } finally {
      setDeleting(false);
    }
  };

  const isDemo = contact.isDemoFocus && contact.id === 'jordan-reyes';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Contact Dossier</h2>
              <p className="text-xs text-slate-500">
                Update communication details or relationship context
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Srinath Thota"
                  className="w-full text-xs sm:text-sm p-2.5 pl-8 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Executive Role <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Founder & CEO"
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company / Organization <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Ahead"
                  className="w-full text-xs sm:text-sm p-2.5 pl-8 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Relationship Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Founder leading product"
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
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
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
                    placeholder="+1 (415) 555-0199"
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
                    type="text"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full text-xs p-2.5 pl-8 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div>
              {!isDemo && onDelete && (
                <div>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-rose-600 font-bold">Are you sure?</span>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                      >
                        {deleting ? 'Deleting...' : 'Yes, Delete Contact'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs text-slate-500 hover:text-slate-700 underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Contact</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
