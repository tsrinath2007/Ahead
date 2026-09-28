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
  Users,
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
  Mail,
  Copy,
  Check,
  Briefcase,
  Plus,
  X,
  Tag,
  MessageSquare,
  ListTodo,
} from 'lucide-react';
import { BriefResponse, MeetingNote, ExtractedCommitments } from '@/lib/types';
import { MarkdownContent } from '@/components/MarkdownContent';

export default function BriefDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.contactId as string;

  const [data, setData] = useState<BriefResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whyBriefOpen, setWhyBriefOpen] = useState(true);
  const [showAllMemories, setShowAllMemories] = useState(false);

  // Live "Log this meeting" state
  const [outcomeText, setOutcomeText] = useState('');
  const [loggingOutcome, setLoggingOutcome] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [logSuccessMessage, setLogSuccessMessage] = useState<string | null>(null);
  const [logErrorMessage, setLogErrorMessage] = useState<string | null>(null);

  // Feature: Draft follow-up email
  const [draftingEmail, setDraftingEmail] = useState(false);
  const [followupDraft, setFollowupDraft] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Feature: Handoff brief
  const [generatingHandoff, setGeneratingHandoff] = useState(false);
  const [handoffData, setHandoffData] = useState<{
    relationshipSummary: string;
    openCommitments: Array<{ commitment: string; isOverdue: boolean }>;
    whatTheyCareAbout: string[];
    firstWeekActions: string[];
  } | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  // Feature: Meeting Notes Tabs & Modal State
  const [activeTab, setActiveTab] = useState<'brief' | 'notes'>('brief');
  const [notesList, setNotesList] = useState<MeetingNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showAddNotesModal, setShowAddNotesModal] = useState(false);

  // New Note Form State
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteType, setNoteType] = useState('Working Session');
  const [noteText, setNoteText] = useState('');
  const [extractingCommitments, setExtractingCommitments] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<ExtractedCommitments | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

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

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/notes/${contactId}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        setNotesList(json.notes || []);
      }
    } catch (err) {
      console.error('Failed to load meeting notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (contactId) {
      fetchBrief();
      fetchNotes();
    }
  }, [contactId]);

  const handleExtractCommitments = async () => {
    if (!noteText.trim()) return;
    setExtractingCommitments(true);
    setExtractError(null);
    try {
      const res = await fetch('/api/notes/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          notesText: noteText.trim(),
          meetingTitle: noteTitle.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to extract commitments');
      }
      setExtractedPreview(json.extracted);
    } catch (err: any) {
      console.error('Error extracting commitments:', err);
      setExtractError(err?.message || 'Failed to extract commitments');
    } finally {
      setExtractingCommitments(false);
    }
  };

  const handleSaveMeetingNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);
    try {
      const finalTitle = noteTitle.trim() || `${noteType} with ${data?.contact.name || 'Client'}`;
      const res = await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          date: noteDate,
          title: finalTitle,
          notes: noteText.trim(),
          type: noteType,
          promisesYouMade: extractedPreview?.promisesYouMade || [],
          promisesTheyMade: extractedPreview?.promisesTheyMade || [],
          keyDecisions: extractedPreview?.keyDecisions || [],
          resolvesPastOverdue: Boolean(extractedPreview?.resolvesPastOverdue),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save meeting note');
      }

      setSaveSuccessMessage('Meeting note saved & retained into Hindsight memory bank!');
      await fetchNotes();
      fetchBrief();

      setTimeout(() => {
        setShowAddNotesModal(false);
        setNoteText('');
        setNoteTitle('');
        setExtractedPreview(null);
        setSaveSuccessMessage(null);
        setActiveTab('notes');
      }, 1200);
    } catch (err: any) {
      console.error('Error saving meeting note:', err);
      setSaveErrorMessage(err?.message || 'Failed to save meeting note');
    } finally {
      setSavingNote(false);
    }
  };

  const handlePrefillDemoNote = () => {
    setNoteDate(new Date().toISOString().split('T')[0]);
    setNoteTitle('Technical Integration Hand-off & Pricing Follow-up');
    setNoteType('Working Session');
    setNoteText(
      'Met with Jordan today for 40 minutes. Hand-delivered the overdue technical integration documentation for their legacy warehouse management system (WMS). Jordan accepted the spec and was relieved to have it resolved. In return, I promised to send an updated enterprise pricing proposal with multi-year tier options by this Thursday at 5 PM. Jordan agreed to review the proposal with their CFO before next Monday.'
    );
  };

  // Live Retain Handler: initiate confirmation
  const handleInitiateLogMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeText.trim()) return;
    setShowConfirmModal(true);
  };

  // Confirmed Retain Execution
  const handleLogMeetingConfirmed = async () => {
    setShowConfirmModal(false);
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

  // Feature: Draft Follow-up Email Handler
  const handleDraftFollowup = async () => {
    setDraftingEmail(true);
    setDraftError(null);
    try {
      const res = await fetch(`/api/followup/${contactId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to draft follow-up email');
      }
      setFollowupDraft(resJson.draft);
    } catch (err: any) {
      console.error('Error generating follow-up draft:', err);
      setDraftError(err?.message || 'Failed to draft email');
    } finally {
      setDraftingEmail(false);
    }
  };

  // Feature: Copy Draft to Clipboard Handler
  const handleCopyDraft = () => {
    if (!followupDraft) return;
    navigator.clipboard.writeText(followupDraft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  // Feature: Account Handoff Brief Handler
  const handleGenerateHandoff = async () => {
    setGeneratingHandoff(true);
    setHandoffError(null);
    try {
      const res = await fetch(`/api/handoff/${contactId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to generate account handoff brief');
      }
      setHandoffData(resJson.handoff);
    } catch (err: any) {
      console.error('Error generating handoff brief:', err);
      setHandoffError(err?.message || 'Failed to generate handoff brief');
    } finally {
      setGeneratingHandoff(false);
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

  // Deduplicate raw memories (case-insensitive exact text & core statement match)
  const rawMemories = data.withHindsight.rawMemories || [];
  const seenMemories = new Set<string>();
  const dedupedMemories: typeof rawMemories = [];

  for (const mem of rawMemories) {
    const fullClean = mem.text.trim().toLowerCase();
    // Extract main sentence before metadata tags like " | When: ..."
    const coreClean = fullClean.split('|')[0].trim();

    if (!seenMemories.has(fullClean) && !seenMemories.has(coreClean)) {
      seenMemories.add(fullClean);
      seenMemories.add(coreClean);
      dedupedMemories.push(mem);
    }
  }

  const DEFAULT_MEMORY_LIMIT = 4;
  const displayedMemories = showAllMemories
    ? dedupedMemories
    : dedupedMemories.slice(0, DEFAULT_MEMORY_LIMIT);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header: Breadcrumb, Tab Switcher & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm w-fit transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Contacts
        </Link>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('brief')}
            className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'brief'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pre-Meeting Brief</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'notes'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Meeting Notes & History</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-full">
              {notesList.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddNotesModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Meeting Notes</span>
          </button>

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

      {/* ========================================================================= */}
      {/* TAB 1: PRE-MEETING STRATEGIC BRIEF                                        */}
      {/* ========================================================================= */}
      {activeTab === 'brief' && (
        <div className="space-y-8">
          {/* ACCOUNT HANDOFF BRIEF (FEATURE: SECTION 5) */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Account Transition: Taking Over This Account?
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 border border-white/15">
                  Hindsight reflect() Synthesis
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Generate an executive handoff brief based on the complete multi-meeting episodic memory bank.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateHandoff}
            disabled={generatingHandoff}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto whitespace-nowrap"
          >
            {generatingHandoff ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Handoff...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>{handoffData ? 'Regenerate Handoff Brief' : 'Generate Handoff Brief'}</span>
              </>
            )}
          </button>
        </div>

        {/* Handoff Error Banner */}
        {handoffError && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{handoffError}</span>
          </div>
        )}

        {/* Handoff Generated Content */}
        {handoffData && (
          <div className="p-6 space-y-6 bg-slate-50/70 border-t border-slate-200 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* 1. Relationship Summary */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span>1. Relationship Summary</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {handoffData.relationshipSummary}
                </p>
              </div>

              {/* 2. Open Commitments (Overdue Flagged) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>2. Open Commitments & Deliverables</span>
                </div>
                <div className="space-y-2">
                  {handoffData.openCommitments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No open commitments recorded.</p>
                  ) : (
                    handoffData.openCommitments.map((c, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border text-xs sm:text-sm font-medium flex items-start gap-2.5 ${
                          c.isOverdue ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        {c.isOverdue ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white flex-shrink-0 mt-0.5">
                            OVERDUE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700 flex-shrink-0 mt-0.5">
                            PENDING
                          </span>
                        )}
                        <span className="leading-snug">{c.commitment}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. What They Care About */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>3. What They Care About (Priorities & Constraints)</span>
                </div>
                <ul className="space-y-1.5">
                  {handoffData.whatTheyCareAbout.map((item, i) => (
                    <li key={i} className="text-xs sm:text-sm text-slate-700 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. First-Week Actions */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>4. First-Week Action Items (New Owner Plan)</span>
                </div>
                <div className="space-y-2">
                  {handoffData.firstWeekActions.map((action, i) => (
                    <div key={i} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs sm:text-sm text-emerald-950 font-medium flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-snug">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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
              <div className="bg-white/90 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed italic">
                &ldquo;No prior notes or history found for {contact.name}. Generating baseline exploratory discovery questions.&rdquo;
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Generic Suggested Agenda / Discovery:
                </h3>
                <div className="text-xs text-slate-600 leading-relaxed bg-white/80 p-4 rounded-xl border border-slate-200">
                  <MarkdownContent content={data.withoutMemory.text} />
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
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 border-2 border-rose-500 rounded-2xl p-5 shadow-md space-y-3.5 relative overflow-hidden ring-2 ring-rose-500/20">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-black tracking-wider uppercase shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                      <span>⚠ Overdue Commitment</span>
                    </div>
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                      High Urgency
                    </span>
                  </div>

                  {/* Feature: Draft follow-up email button */}
                  <button
                    type="button"
                    onClick={handleDraftFollowup}
                    disabled={draftingEmail}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    {draftingEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Drafting Email...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Draft follow-up email</span>
                      </>
                    )}
                  </button>
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

                {/* Follow-up Draft Error */}
                {draftError && (
                  <div className="bg-white border border-rose-300 text-rose-900 text-xs p-3 rounded-xl flex items-center gap-2 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{draftError}</span>
                  </div>
                )}

                {/* Follow-up Draft Card */}
                {followupDraft && (
                  <div className="bg-white border-2 border-rose-300 rounded-xl p-4 shadow-sm space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Mail className="w-4 h-4 text-rose-600" />
                        <span>Accountable Follow-up Email Draft</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyDraft}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition-colors"
                      >
                        {copiedDraft ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Draft</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-lg text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap border border-slate-200">
                      {followupDraft}
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      Grounded in raw memory facts. Acknowledges delay, proposes delivery, zero defensive excuses.
                    </p>
                  </div>
                )}
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

            {/* 4. EXECUTIVE SUMMARY CONTEXT */}
            {data.withHindsight.synthesizedBrief.summary && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Executive Relationship Summary:
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200 font-medium">
                  {data.withHindsight.synthesizedBrief.summary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WHY THIS BRIEF? (FULL-WIDTH AUDIT REASONING CHAIN) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Why This Brief? (Audit Reasoning Chain)
              </h2>
              <p className="text-xs text-slate-500">
                Deterministic epistemic trace from Hindsight memory bank &quot;{contact.bankId}&quot; to strategic recommendations.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setWhyBriefOpen(!whyBriefOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors w-fit"
          >
            <span>{whyBriefOpen ? 'Hide Chain' : 'Show Chain'}</span>
            {whyBriefOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {whyBriefOpen && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1: Previous meeting */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    1. Previous Meeting Context
                  </span>
                  <p className="font-semibold text-slate-800 text-xs sm:text-sm leading-relaxed">
                    {hasOverdue
                      ? 'Meeting #2 (Dec 19, 2025): Client raised serious integration concern regarding legacy system.'
                      : 'Previous logged meetings: Standard technical & compliance alignment.'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Input Signal</span>
              </div>

              {/* Step 2: What was promised */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    2. What Was Promised
                  </span>
                  <p className="font-semibold text-amber-950 text-xs sm:text-sm leading-relaxed">
                    {hasOverdue
                      ? 'Promised to send a technical follow-up document on integration support within 48 hours.'
                      : 'Standard roadmap documents and vendor review items delivered.'}
                  </p>
                </div>
                <span className="text-[10px] text-amber-700/80 font-mono">Explicit Commitment</span>
              </div>

              {/* Step 3: Fulfillment status */}
              <div
                className={`p-4 rounded-xl border space-y-2 flex flex-col justify-between ${
                  hasOverdue ? 'bg-rose-50/80 border-rose-200' : 'bg-emerald-50/80 border-emerald-200'
                }`}
              >
                <div className="space-y-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider block ${
                      hasOverdue ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    3. Fulfillment Status
                  </span>
                  <p
                    className={`font-bold text-xs sm:text-sm leading-relaxed ${
                      hasOverdue ? 'text-rose-950' : 'text-emerald-950'
                    }`}
                  >
                    {hasOverdue
                      ? '❌ Unfulfilled & Overdue (40+ days elapsed without delivery).'
                      : '✓ Fulfilled: All commitments recorded as satisfied.'}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold ${
                    hasOverdue ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {hasOverdue ? 'Critical Action Needed' : 'Verified Satisfied'}
                </span>
              </div>

              {/* Step 4: Why this matters now */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                    4. Strategic Implication
                  </span>
                  <p className="font-semibold text-indigo-950 text-xs sm:text-sm leading-relaxed">
                    {hasOverdue
                      ? 'Walking into Meeting #4 without acknowledging this destroys trust and prevents closing pricing.'
                      : 'Clear relationship runway to proceed straight to expansion or agreement.'}
                  </p>
                </div>
                <span className="text-[10px] text-indigo-600 font-mono font-semibold">
                  Ahead Strategic Directive
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DUAL EVIDENCE & AUDIT CONSOLE (FULL-WIDTH 2-COLUMN GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT COLUMN: MEMORY FOUND (RAW RECALL EVIDENCE) */}
        <div className="border border-slate-700/80 rounded-2xl overflow-hidden bg-slate-900 text-slate-100 shadow-md">
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Brain className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold tracking-wide text-slate-100 uppercase">
                  🧠 Memory Found (Raw recall() Evidence)
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Direct episodic recall from Hindsight bank
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                Live Recall
              </span>
              <span className="text-xs font-mono text-slate-400">
                {displayedMemories.length} of {dedupedMemories.length} distinct
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4 divide-y divide-slate-800/80">
            {dedupedMemories.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No matching memories returned from Hindsight bank. (Run seed script if unseeded)
              </p>
            ) : (
              displayedMemories.map((mem, idx) => {
                const parts = mem.text.split('|').map((s) => s.trim());
                const mainStatement = parts[0] || mem.text;
                const whenPart = parts.find((p) => p.startsWith('When:'))?.replace('When:', '').trim();
                const involvingPart = parts.find((p) => p.startsWith('Involving:'))?.replace('Involving:', '').trim();
                const extraNote = parts.slice(1).find((p) => !p.startsWith('When:') && !p.startsWith('Involving:'));

                return (
                  <div
                    key={mem.id || idx}
                    className="pt-4 first:pt-0 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-indigo-400 font-bold font-mono text-[10px] uppercase tracking-wider">
                        Memory #{idx + 1}
                      </span>
                      {mem.occurredStart && (
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                          Logged: {new Date(mem.occurredStart).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p className="leading-relaxed text-slate-100 font-sans text-xs sm:text-sm bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 font-medium">
                      {mainStatement}
                    </p>

                    {/* Clean Metadata Badges instead of raw pipe characters */}
                    {(whenPart || involvingPart || extraNote) && (
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        {whenPart && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-800/90 text-indigo-300 px-2.5 py-0.5 rounded-md border border-slate-700">
                            <Calendar className="w-3 h-3 text-indigo-400" />
                            {whenPart}
                          </span>
                        )}
                        {involvingPart && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-800/90 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700">
                            <Users className="w-3 h-3 text-slate-400" />
                            {involvingPart}
                          </span>
                        )}
                        {extraNote && (
                          <span className="text-[10px] text-slate-400 font-sans">
                            • {extraNote}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Show all N raw memories toggle */}
            {dedupedMemories.length > DEFAULT_MEMORY_LIMIT && (
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setShowAllMemories(!showAllMemories)}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 rounded-xl border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors"
                >
                  {showAllMemories ? (
                    <>
                      <span>Show top {DEFAULT_MEMORY_LIMIT} relevant memories</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Show all {dedupedMemories.length} raw memories ({dedupedMemories.length - DEFAULT_MEMORY_LIMIT} more)</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REFLECTION SYNTHESIS PANEL */}
        <div className="bg-white border-2 border-indigo-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
          <div className="px-6 py-4 bg-indigo-50/70 border-b border-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-indigo-950">
                  Hindsight reflect() Synthesis Trace
                </h3>
                <p className="text-[10px] text-indigo-600">
                  Cross-interaction strategic intent
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
              Strategic Intent
            </span>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/70">
              <MarkdownContent content={data.withHindsight.reflectionText || 'No reflective synthesis available for this bank.'} />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>
                Generated via Hindsight <code>reflect()</code> synthesis across logged interactions.
              </span>
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

          <form onSubmit={handleInitiateLogMeeting} className="space-y-4">
            <div>
              <textarea
                value={outcomeText}
                onChange={(e) => setOutcomeText(e.target.value)}
                placeholder="e.g., Met with Jordan today. Hand-delivered the technical integration doc. Jordan accepted and we agreed to send enterprise pricing proposal by Thursday."
                rows={3}
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-none"
              />
            </div>

            {showConfirmModal ? (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3">
                <div className="flex items-start gap-2 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    This will permanently update {contact.name}&apos;s live memory bank in Hindsight — continue?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLogMeetingConfirmed}
                    disabled={loggingOutcome}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                  >
                    {loggingOutcome ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Retaining to Bank...</span>
                      </>
                    ) : (
                      <span>Yes, Confirm &amp; Retain</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    disabled={loggingOutcome}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={loggingOutcome || !outcomeText.trim()}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Retain Meeting Outcome Live</span>
                </button>

                <span className="text-[11px] text-slate-400">
                  Directly invokes <code>POST /api/retain</code> &rarr; <code>client.retain(bankId, content)</code>
                </span>
              </div>
            )}
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
  )}

  {/* ========================================================================= */}
  {/* TAB 2: CHRONOLOGICAL MEETING NOTES & COMMITMENT HISTORY                   */}
  {/* ========================================================================= */}
  {activeTab === 'notes' && (
    <div className="space-y-6">
      {/* Notes Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Chronological Meeting Notes & Relationship History
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Every meeting note is retained into Hindsight memory bank{' '}
            <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">{contact.bankId}</code>. Ahead extracts and tracks promises until kept.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddNotesModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Meeting Notes</span>
        </button>
      </div>

      {/* Notes Feed */}
      {loadingNotes ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
        </div>
      ) : notesList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No meeting notes recorded yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Add your first meeting note to begin tracking relationship history and commitments with {contact.name}.
          </p>
          <button
            type="button"
            onClick={() => setShowAddNotesModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meeting Notes</span>
          </button>
        </div>
      ) : (
        <div className="relative border-l-2 border-indigo-200 ml-4 pl-6 space-y-8">
          {notesList.map((note, idx) => {
            const isOverdue = note.hasOutstandingCommitment && !note.resolvesPastOverdue;
            const isResolved = note.resolvesPastOverdue;

            return (
              <div key={note.id || idx} className="relative group">
                {/* Timeline Node Dot */}
                <div
                  className={`absolute -left-[31px] top-6 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                    isOverdue
                      ? 'bg-rose-600 ring-4 ring-rose-100'
                      : isResolved
                      ? 'bg-emerald-600 ring-4 ring-emerald-100'
                      : 'bg-indigo-600 ring-4 ring-indigo-100'
                  }`}
                />

                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  {/* Note Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Meeting #{notesList.length - idx}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {new Date(note.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {note.type && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {note.type}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{note.title}</h3>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2">
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-600 text-white shadow-sm">
                          <AlertTriangle className="w-3 h-3" />
                          Outstanding Commitment
                        </span>
                      )}
                      {isResolved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Fulfilled Past Promise
                        </span>
                      )}
                      {!isOverdue && !isResolved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          <Check className="w-3 h-3 text-slate-500" />
                          On Track
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notes Body */}
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    {note.notes}
                  </div>

                  {/* Extracted Sections Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Promises You Made (Tracked Commitments) */}
                    {note.promisesYouMade && note.promisesYouMade.length > 0 && (
                      <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>Promises You Made (Ahead Tracks These)</span>
                        </div>
                        <ul className="space-y-1">
                          {note.promisesYouMade.map((p, i) => (
                            <li key={i} className="text-xs text-rose-950 font-medium bg-white p-2 rounded-lg border border-rose-100 flex items-start gap-1.5">
                              <span className="text-rose-600 font-bold">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Counterpart Commitments */}
                    {note.promisesTheyMade && note.promisesTheyMade.length > 0 && (
                      <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Counterpart Commitments ({contact.name})</span>
                        </div>
                        <ul className="space-y-1">
                          {note.promisesTheyMade.map((p, i) => (
                            <li key={i} className="text-xs text-blue-950 font-medium bg-white p-2 rounded-lg border border-blue-100 flex items-start gap-1.5">
                              <span className="text-blue-600 font-bold">•</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Key Decisions Agreed */}
                    {note.keyDecisions && note.keyDecisions.length > 0 && (
                      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 space-y-2 md:col-span-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Key Decisions & Alignment</span>
                        </div>
                        <ul className="space-y-1">
                          {note.keyDecisions.map((d, i) => (
                            <li key={i} className="text-xs text-emerald-950 font-medium bg-white p-2 rounded-lg border border-emerald-100 flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )}

  {/* ========================================================================= */}
  {/* MODAL: ADD MEETING NOTES & COMMITMENT EXTRACTOR                           */}
  {/* ========================================================================= */}
  {showAddNotesModal && (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Add Meeting Notes & Extract Commitments
              </h3>
              <p className="text-xs text-slate-500">
                Meeting with <strong>{contact.name}</strong> ({contact.role} at {contact.company})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddNotesModal(false)}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prefill Scenario for Jordan Reyes Demo */}
        {isDemo && (
          <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded-xl flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-indigo-900">
              <span className="font-bold">⚡ Demo Shortcut:</span> Prefill notes that deliver the overdue technical doc & promise pricing.
            </div>
            <button
              type="button"
              onClick={handlePrefillDemoNote}
              className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 shadow-xs transition-colors"
            >
              Prefill Demo Notes
            </button>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meeting Date
              </label>
              <input
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meeting Type
              </label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
              >
                <option value="Working Session">Working Session</option>
                <option value="Executive Review">Executive Review</option>
                <option value="Contract & Pricing">Contract & Pricing</option>
                <option value="Technical Architecture">Technical Architecture</option>
                <option value="Discovery">Discovery</option>
                <option value="Check-in">Check-in</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Meeting Title / Topic
            </label>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="e.g. Technical Integration Hand-off & Pricing Follow-up"
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Discussion Notes / Raw Bullets
              </label>
              <span className="text-[11px] text-slate-400">
                Paste notes, promises made, or key outcomes
              </span>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
              placeholder="e.g. Met with Jordan today. Hand-delivered the technical integration doc. Jordan accepted. I promised to send an updated enterprise pricing proposal by Thursday..."
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
            />
          </div>

          {/* Extract Action Button */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleExtractCommitments}
              disabled={extractingCommitments || !noteText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors"
            >
              <Sparkles className={`w-3.5 h-3.5 ${extractingCommitments ? 'animate-spin' : 'text-indigo-600'}`} />
              <span>{extractingCommitments ? 'Analyzing with AI...' : 'Extract Commitments & Decisions with AI'}</span>
            </button>

            <span className="text-[11px] text-slate-400">
              Runs Groq commitment parser before saving
            </span>
          </div>

          {/* Extraction Error */}
          {extractError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{extractError}</span>
            </div>
          )}

          {/* Extracted Preview Card */}
          {extractedPreview && (
            <div className="bg-slate-50 border-2 border-indigo-200 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Extracted Commitments & Decisions:
                </span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  AI Verified
                </span>
              </div>

              {extractedPreview.resolvesPastOverdue && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-950 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>✓ Detected resolution of past overdue commitment!</span>
                </div>
              )}

              {/* Promises You Made */}
              {extractedPreview.promisesYouMade.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-rose-800 block">
                    • Promises You Made (Ahead Tracks These):
                  </span>
                  {extractedPreview.promisesYouMade.map((p, i) => (
                    <div key={i} className="text-xs bg-white p-2 rounded border border-rose-200 text-rose-950 font-medium">
                      {p}
                    </div>
                  ))}
                </div>
              )}

              {/* Promises They Made */}
              {extractedPreview.promisesTheyMade.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-blue-800 block">
                    • Counterpart Commitments ({contact.name}):
                  </span>
                  {extractedPreview.promisesTheyMade.map((p, i) => (
                    <div key={i} className="text-xs bg-white p-2 rounded border border-blue-200 text-blue-950 font-medium">
                      {p}
                    </div>
                  ))}
                </div>
              )}

              {/* Key Decisions */}
              {extractedPreview.keyDecisions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    • Key Decisions Agreed:
                  </span>
                  {extractedPreview.keyDecisions.map((d, i) => (
                    <div key={i} className="text-xs bg-white p-2 rounded border border-emerald-200 text-emerald-950 font-medium">
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowAddNotesModal(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveMeetingNote}
            disabled={savingNote || !noteText.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            {savingNote ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Retaining to Bank...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Retain in Memory</span>
              </>
            )}
          </button>
        </div>

        {/* Success Message Banner */}
        {saveSuccessMessage && (
          <div className="p-4 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Error Message Banner */}
        {saveErrorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{saveErrorMessage}</span>
          </div>
        )}
      </div>
    </div>
  )}
    </div>
  );
}



