'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  Clock,
  RefreshCw,
  ArrowLeft,
  Users,
  Flame,
} from 'lucide-react';

interface CommitmentItem {
  id: string;
  title: string;
  text: string;
  datePromised: string;
  daysOverdue: string;
  urgency: string;
  source: string;
}

interface ContactCommitment {
  contact: {
    id: string;
    name: string;
    role: string;
    company: string;
    avatar: string;
    bankId: string;
    isDemoFocus?: boolean;
  };
  hasOverdue: boolean;
  status: 'NEEDS_ATTENTION' | 'ON_TRACK';
  overdueItems: CommitmentItem[];
  totalMemoriesChecked: number;
}

interface DashboardData {
  summary: {
    totalContacts: number;
    contactsNeedingAttention: number;
    contactsOnTrack: number;
    totalOutstandingCommitments: number;
    hindsightConnected: boolean;
    timestamp: string;
  };
  contacts: ContactCommitment[];
}

export default function CommitmentsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommitments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/commitments?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DashboardData = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Failed to load commitments dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitments();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Contacts
        </Link>

        <button
          onClick={fetchCommitments}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Dashboard
        </button>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <Brain className="w-3.5 h-3.5" />
            Organizational Memory Audit
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Portfolio Commitments Dashboard
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Real-time audit across all Hindsight memory banks. This dashboard surfaces unfulfilled promises, missed deliverables, and relationship risk across your entire contact network before client meetings occur.
          </p>
        </div>

        {/* Stats Row */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-indigo-800/40 mt-6">
            <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-slate-300 uppercase block">Monitored Contacts</span>
              <span className="text-xl sm:text-2xl font-black text-white">{data.summary.totalContacts}</span>
            </div>
            <div className="bg-rose-500/20 border border-rose-500/30 p-3.5 rounded-xl backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-rose-300 uppercase block">Needs Attention</span>
              <span className="text-xl sm:text-2xl font-black text-rose-300">{data.summary.contactsNeedingAttention}</span>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-500/30 p-3.5 rounded-xl backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-emerald-300 uppercase block">On Track</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300">{data.summary.contactsOnTrack}</span>
            </div>
            <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <span className="text-[11px] font-semibold text-slate-300 uppercase block">Total Overdue Items</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300">{data.summary.totalOutstandingCommitments}</span>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Contact Cards List */}
      {data && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Commitment Status by Relationship
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {data.contacts.map((c) => {
              const needsAttention = c.status === 'NEEDS_ATTENTION';
              return (
                <div
                  key={c.contact.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    needsAttention
                      ? 'bg-white border-rose-400 shadow-lg shadow-rose-100/50 ring-2 ring-rose-400/20'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-inner ${
                            needsAttention
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.contact.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">{c.contact.name}</h3>
                            {c.contact.isDemoFocus && (
                              <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                                Demo Contact
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span>{c.contact.role}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-700 font-semibold">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {c.contact.company}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge & Action */}
                      <div className="flex items-center gap-3">
                        {needsAttention ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                            <Flame className="w-3.5 h-3.5" />
                            Needs Attention
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            On Track
                          </span>
                        )}

                        <Link
                          href={`/brief/${c.contact.id}`}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            needsAttention
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>Brief Me</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Commitments Details */}
                    <div className="pt-4">
                      {needsAttention ? (
                        <div className="space-y-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Outstanding Commitments ({c.overdueItems.length})
                          </span>
                          <div className="grid grid-cols-1 gap-2.5">
                            {c.overdueItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between text-rose-950 font-bold">
                                  <span className="text-sm">{item.title}</span>
                                  <span className="bg-rose-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                                    {item.daysOverdue}
                                  </span>
                                </div>
                                <p className="text-rose-900 leading-relaxed font-sans">{item.text}</p>
                                <div className="text-[10px] text-slate-500 font-mono pt-1">
                                  Source: {item.source} • Bank: {c.contact.bankId}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>No unfulfilled promises or overdue action items found. All past commitments are completed.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
