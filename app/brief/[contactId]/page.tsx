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
} from 'lucide-react';
import { BriefResponse } from '@/lib/types';

export default function BriefDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.contactId as string;

  const [data, setData] = useState<BriefResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live "Log this meeting" state
  const [outcomeText, setOutcomeText] = useState('');
  const [loggingOutcome, setLoggingOutcome] = useState(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);
  const [logErrorMessage, setLogErrorMessage] = useState<string | null>(null);

  const fetchBrief = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/brief/${contactId}`);
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
  const hasOverdue = data.withHindsight.synthesizedBrief.urgentOverdue.length > 0;

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

      {/* CORE SIDE-BY-SIDE COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN: WITHOUT MEMORY */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
          <div className="bg-slate-100/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <h2 className="font-bold text-slate-800 text-sm sm:text-base">
                WITHOUT MEMORY
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              Generic LLM Prompt
            </span>
          </div>

          <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-xs text-slate-600 leading-relaxed font-mono">
                &ldquo;No prior notes or history found for {contact.name}. Consider standard
                exploratory discovery questions.&rdquo;
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Generic Suggested Agenda / Discovery:
                </h3>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {data.withoutMemory.text}
                </div>
              </div>
            </div>

            {/* Critique Banner */}
            <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-700">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                What Generic Assistants Miss:
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Zero awareness that you promised to send a technical doc 6 weeks ago and never delivered it.
                Zero awareness that pricing was postponed specifically for this quarter.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WITH HINDSIGHT */}
        <div className="bg-white border-2 border-indigo-600 rounded-2xl overflow-hidden shadow-xl shadow-indigo-100/50 flex flex-col h-full ring-2 ring-indigo-600/10">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-200" />
              <h2 className="font-extrabold text-sm sm:text-base tracking-tight">
                WITH HINDSIGHT MEMORY
              </h2>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
              recall() + reflect()
            </span>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* 1. OUTSTANDING COMMITMENTS CALLOUT (THE "AHA!" MOMENT) */}
            {hasOverdue ? (
              <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4.5 shadow-sm space-y-2 relative overflow-hidden animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm uppercase tracking-wide">
                  <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
                  🚨 CRITICAL OVERDUE COMMITMENT DETECTED
                </div>
                {data.withHindsight.synthesizedBrief.urgentOverdue.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-xs sm:text-sm font-semibold text-rose-950 bg-white/80 p-3 rounded-lg border border-rose-200 leading-relaxed shadow-inner"
                  >
                    {item}
                  </div>
                ))}
                <p className="text-[11px] text-rose-800 font-medium">
                  ⚡ <strong>Action:</strong> Do not pitch pricing first. Address this unfulfilled promise within the first 60 seconds to restore trust.
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

            {/* 4. "MEMORY FOUND" TRANSPARENCY PANEL (PROVES REAL RECALL) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    🧠 Memory Found (Raw recall() transparency)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {data.withHindsight.rawMemories.length} memories matched
                </span>
              </div>

              <div className="p-4 space-y-2.5 max-h-56 overflow-y-auto">
                {data.withHindsight.rawMemories.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No matching memories returned from Hindsight bank. (Run seed script if unseeded)
                  </p>
                ) : (
                  data.withHindsight.rawMemories.map((mem, idx) => (
                    <div
                      key={mem.id || idx}
                      className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1 shadow-sm font-sans"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Result #{idx + 1}</span>
                        {mem.occurredStart && <span>{new Date(mem.occurredStart).toLocaleDateString()}</span>}
                      </div>
                      <p className="leading-relaxed">{mem.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 5. REFLECTION SYNTHESIS PANEL */}
            {data.withHindsight.reflectionText && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30">
                <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Hindsight reflect() Synthesis
                </div>
                <div className="p-4 text-xs text-slate-700 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line">
                  {data.withHindsight.reflectionText}
                </div>
              </div>
            )}
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
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3.5 rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{logSuccessMessage} (Brief refreshed automatically!)</span>
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
