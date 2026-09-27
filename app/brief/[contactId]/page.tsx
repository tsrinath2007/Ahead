'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Send,
  RefreshCw,
  Sparkles,
  Info,
  Clock,
  ShieldAlert,
  Flame,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BriefResponse } from '@/lib/types';

export default function BriefDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.contactId as string;

  const [data, setData] = useState<BriefResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whyBriefOpen, setWhyBriefOpen] = useState(true);

  // Live "Log this meeting" state
  const [outcomeText, setOutcomeText] = useState('');
  const [loggingOutcome, setLoggingOutcome] = useState(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);
  const [logErrorMessage, setLogErrorMessage] = useState<string | null>(null);

  const fetchBrief = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/brief/${contactId}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || `HTTP error ${res.status}`);
      }
      const json: BriefResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Failed to load pre-meeting brief:', err);
      setError(err?.message || 'Failed to fetch brief');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contactId) {
      fetchBrief();
    }
  }, [contactId]);

  // Live Retain Handler
  const handleLogMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeText.trim()) return;

    setLoggingOutcome(true);
    setLogSuccessMessage(null);
    setLogErrorMessage(null);

    try {
      const res = await fetch('/api/retain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          outcomeText: outcomeText.trim(),
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to retain meeting outcome');
      }

      setLogSuccessMessage(
        `Memory retained live via client.retain() to bank "${data?.contact.bankId}"!`
      );
      setOutcomeText('');

      // Refresh memories to show the newly retained memory in real time!
      setTimeout(() => {
        fetchBrief();
      }, 1200);
    } catch (err: any) {
      console.error('Error logging meeting outcome:', err);
      setLogErrorMessage(err?.message || 'Failed to log meeting outcome');
    } finally {
      setLoggingOutcome(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/4" />
        <div className="h-28 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200 rounded-2xl" />
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Contacts
        </Link>

        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 text-rose-900 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            <h2 className="text-lg font-bold">Memory System or API Error</h2>
          </div>
          <p className="text-sm">{error || 'Unable to retrieve pre-meeting brief.'}</p>
          <div className="bg-white p-4 rounded-xl border border-rose-200 text-xs font-mono text-slate-700">
            Check that <code>.env.local</code> contains valid <code>HINDSIGHT_API_KEY</code> and{' '}
            <code>GROQ_API_KEY</code>.
          </div>
          <button
            onClick={fetchBrief}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const contact = data.contact;
  const isDemo = contact.isDemoFocus;
  const rawMemoriesContainOverdue = data.withHindsight.rawMemories?.some((m) => {
    const text = m.text.toLowerCase();
    return (
      text.includes('not been sent') ||
      text.includes('outstanding') ||
      text.includes('unfulfilled') ||
      text.includes('overdue')
    );
  });
  const hasOverdue =
    data.withHindsight.synthesizedBrief.urgentOverdue.length > 0 ||
    Boolean(rawMemoriesContainOverdue);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm w-fit transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Contacts
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBrief}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Regenerate Brief
          </button>
        </div>
      </div>

      {/* Contact Profile Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-inner ${
              isDemo
                ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-100'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {contact.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Meeting Brief: {contact.name}
              </h1>
              {isDemo && (
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Target Demo
                </span>
              )}
              {hasOverdue ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-sm">
                  <Flame className="w-3 h-3" />
                  Needs Attention
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  On Track
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
              <span>{contact.role}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-700 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {contact.company}
              </span>
              <span>•</span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-[11px]">
                bank: {contact.bankId}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl">
          <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Upcoming Event
            </span>
            <span className="font-bold text-slate-800">
              Meeting #4 (Today) • Strategy & Working Session
            </span>
          </div>
        </div>
      </div>

      {/* Diagnostics / Error Notice if any */}
      {data.withHindsight.error && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm text-amber-900">
            <span className="font-bold">Hindsight Status:</span> {data.withHindsight.error}
          </div>
        </div>
      )}

      {/* LLM Synthesis Error Notice if Groq failed */}
      {(data.withHindsight.llmError || data.withoutMemory.error?.toLowerCase().includes('llm') || data.diagnostics.errors?.some(e => e.toLowerCase().includes('llm') || e.toLowerCase().includes('groq'))) && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm text-amber-900">
            <span className="font-bold">LLM Synthesis Status:</span> {data.withHindsight.llmError || data.withoutMemory.error || 'LLM error generating prose brief. Displaying deterministic brief directly from Hindsight memory.'}
          </div>
        </div>
      )}

      {/* CORE SIDE-BY-SIDE COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN: WITHOUT MEMORY (Muted / Gray card style) */}
        <div className="bg-slate-100/70 border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full opacity-90">
          <div className="bg-slate-200/90 px-6 py-4 border-b border-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <h2 className="font-bold text-slate-700 text-sm sm:text-base">
                WITHOUT MEMORY (Generic LLM)
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-300 text-slate-700">
              No Episodic Context
            </span>
          </div>

          <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-white/80 p-4 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 leading-relaxed font-mono">
                &ldquo;No prior notes or history found for {contact.name}. Consider standard
                exploratory discovery questions.&rdquo;
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Generic Suggested Agenda / Discovery:
                </h3>
                <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-white/60 p-4 rounded-xl border border-slate-200">
                  {data.withoutMemory.text}
                </div>
              </div>
            </div>

            {/* Critique Banner */}
            <div className="mt-4 bg-slate-200/80 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-slate-800">
                <ShieldAlert className="w-4 h-4 text-slate-500" />
                What Generic Assistants Miss:
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Zero awareness that you promised to send a technical doc 6 weeks ago and never delivered it.
                Zero awareness that pricing was postponed specifically for this quarter.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WITH HINDSIGHT (Accent border / Highlighted) */}
        <div className="bg-white border-2 border-indigo-600 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-100 flex flex-col h-full ring-4 ring-indigo-500/15">
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-200" />
              <h2 className="font-extrabold text-sm sm:text-base tracking-tight">
                WITH HINDSIGHT MEMORY
              </h2>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/25">
              recall() + reflect()
            </span>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* 1. OUTSTANDING COMMITMENTS CALLOUT (THE "AHA!" MOMENT - VISUALLY POPS) */}
            {hasOverdue ? (
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 border-2 border-rose-500 rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden ring-2 ring-rose-500/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-black tracking-wider uppercase shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                    <span>⚠ Overdue Commitment</span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                    High Urgency
                  </span>
                </div>
                {(data.withHindsight.synthesizedBrief.urgentOverdue.length > 0
                  ? data.withHindsight.synthesizedBrief.urgentOverdue
                  : ['CRITICAL: Promised technical follow-up doc on integration support was never sent — outstanding commitment (40+ days overdue)!']
                ).map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs sm:text-sm font-bold text-rose-950 bg-white p-3.5 rounded-xl border-l-4 border-rose-600 shadow-sm leading-relaxed"
                  >
                    {item}
                  </div>
                ))}
                <p className="text-[11px] text-rose-900 font-semibold bg-rose-100/50 p-2.5 rounded-lg border border-rose-200/60">
                  ⚡ <strong>Strategic Rule:</strong> Do not pitch pricing first. Address and deliver this unfulfilled promise in the first 60 seconds to restore trust.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>No outstanding unfulfilled commitments found for this contact.</span>
              </div>
            )}

            {/* 2. AGENDA REVISIT THIS QUARTER */}
            {data.withHindsight.synthesizedBrief.agendaRevisit.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Agenda To Revisit This Quarter:
                </div>
                <ul className="space-y-1.5">
                  {data.withHindsight.synthesizedBrief.agendaRevisit.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-amber-950 font-medium bg-white/90 p-2.5 rounded-lg border border-amber-100"
                    >
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. STRATEGIC OPENING RECOMMENDATION */}
            {data.withHindsight.synthesizedBrief.strategicLead && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Recommended Opening (First 2 Minutes):
                </div>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed bg-white/80 p-3 rounded-lg border border-indigo-100">
                  {data.withHindsight.synthesizedBrief.strategicLead}
                </p>
              </div>
            )}

            {/* 4. "MEMORY FOUND" TRANSPARENCY PANEL (PROVES REAL RECALL - EVIDENCE INSPECTOR) */}
            <div className="border border-slate-700/80 rounded-2xl overflow-hidden bg-slate-900 text-slate-100 shadow-md">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold tracking-wide text-slate-100 uppercase">
                    🧠 Memory Found (Raw recall() Evidence)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    Live Hindsight Recall
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {data.withHindsight.rawMemories.length} matches
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2.5 max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                {data.withHindsight.rawMemories.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No matching memories returned from Hindsight bank. (Run seed script if unseeded)
                  </p>
                ) : (
                  data.withHindsight.rawMemories.map((mem, idx) => (
                    <div
                      key={mem.id || idx}
                      className="pt-2.5 first:pt-0 space-y-1 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-indigo-400 font-semibold">[Memory #{idx + 1}]</span>
                        {mem.occurredStart && (
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                            {new Date(mem.occurredStart).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed text-slate-200 font-sans text-xs bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                        {mem.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 5. REFLECTION SYNTHESIS PANEL */}
            {data.withHindsight.reflectionText && (
              <div className="border border-indigo-200/80 rounded-2xl overflow-hidden bg-indigo-50/40">
                <div className="px-4 py-2.5 bg-indigo-100/70 border-b border-indigo-200 text-xs font-bold text-indigo-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Hindsight reflect() Synthesis (Strategic Intent)</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 bg-white/80 px-2 py-0.5 rounded border border-indigo-200">
                    High-Level Synthesis
                  </span>
                </div>
                <div className="p-4 text-xs text-slate-700 leading-relaxed max-h-44 overflow-y-auto whitespace-pre-line bg-white/60">
                  {data.withHindsight.reflectionText}
                </div>
              </div>
            )}

            {/* 6. "WHY THIS BRIEF?" EXPANDABLE AUDIT PANEL (REASONING CHAIN) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/70 shadow-sm transition-all">
              <button
                type="button"
                onClick={() => setWhyBriefOpen(!whyBriefOpen)}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200/80 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Why This Brief? (Audit Reasoning Chain)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                  <span>{whyBriefOpen ? 'Hide Chain' : 'Expand Reasoning'}</span>
                  {whyBriefOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {whyBriefOpen && (
                <div className="p-4 space-y-3.5 text-xs bg-white/95">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Step 1: Previous meeting */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        1. Previous Meeting
                      </span>
                      <p className="font-semibold text-slate-800 text-[11px] leading-snug">
                        {hasOverdue
                          ? 'Meeting #2 (Dec 19, 2025): Client raised serious integration concern regarding legacy system.'
                          : 'Previous logged meetings: Standard technical & compliance alignment.'}
                      </p>
                    </div>

                    {/* Step 2: What was promised */}
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        2. What Was Promised
                      </span>
                      <p className="font-semibold text-amber-950 text-[11px] leading-snug">
                        {hasOverdue
                          ? 'Promised to send a technical follow-up document on integration support within 48 hours.'
                          : 'Standard roadmap documents and vendor review items delivered.'}
                      </p>
                    </div>

                    {/* Step 3: Whether it was fulfilled */}
                    <div
                      className={`p-3 rounded-xl border space-y-1 ${
                        hasOverdue ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider block ${
                          hasOverdue ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        3. Fulfillment Status
                      </span>
                      <p
                        className={`font-semibold text-[11px] leading-snug ${
                          hasOverdue ? 'text-rose-950' : 'text-emerald-950'
                        }`}
                      >
                        {hasOverdue
                          ? '❌ Unfulfilled & Overdue (40+ days elapsed without delivery).'
                          : '✓ Fulfilled: All commitments recorded as satisfied.'}
                      </p>
                    </div>

                    {/* Step 4: Why this matters now */}
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                        4. Why This Matters Now
                      </span>
                      <p className="font-semibold text-indigo-950 text-[11px] leading-snug">
                        {hasOverdue
                          ? 'Walking into Meeting #4 without acknowledging this destroys trust and prevents closing pricing.'
                          : 'Clear relationship runway to proceed straight to expansion or agreement.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 text-[10px] text-slate-400 font-mono italic">
                    Reasoning derived directly from Hindsight memory bank &quot;{contact.bankId}&quot; recall/reflect trace.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE "LOG THIS MEETING" FORM (SECOND DEMO BEAT) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              +
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Log Today&apos;s Meeting (Watch it learn live)
              </h2>
              <p className="text-xs text-slate-500">
                Add a one-line outcome from today. Calls Hindsight&apos;s <code>client.retain()</code> live to update the memory bank in real time.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogMeeting} className="space-y-4">
            <div>
              <textarea
                value={outcomeText}
                onChange={(e) => setOutcomeText(e.target.value)}
                placeholder="e.g., Met with Jordan today. Hand-delivered the technical integration doc. Jordan accepted and we agreed to send enterprise pricing proposal by Thursday."
                rows={3}
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <button
                type="submit"
                disabled={loggingOutcome || !outcomeText.trim()}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
              >
                {loggingOutcome ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Retaining to Bank...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Retain Meeting Outcome Live</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-400">
                Directly invokes <code>POST /api/retain</code> &rarr; <code>client.retain(bankId, content)</code>
              </span>
            </div>
          </form>

          {/* Success Banner */}
          {logSuccessMessage && (
            <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />
              <div>
                <span className="font-bold text-sm block">✓ Saved to memory</span>
                <span className="text-emerald-100 text-xs">{logSuccessMessage} (Brief refreshed live!)</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {logErrorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{logErrorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
