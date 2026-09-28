import Link from 'next/link';
import { SEEDED_CONTACTS } from '@/lib/contacts';
import { Brain, ArrowRight, Sparkles, AlertCircle, History, Building2, User, CheckCircle2, Flame } from 'lucide-react';

export default function ContactsPage() {
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

      {/* Contacts List Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Seeded Contacts & Memory Banks
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href="/commitments"
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>View Commitments Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">3 Active Banks</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SEEDED_CONTACTS.map((contact) => {
            const isDemo = contact.isDemoFocus;
            return (
              <div
                key={contact.id}
                className={`relative rounded-2xl transition-all duration-200 flex flex-col justify-between ${
                  isDemo
                    ? 'bg-white border-2 border-indigo-500 shadow-lg shadow-indigo-100/50 ring-2 ring-indigo-500/20'
                    : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm'
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
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {contact.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{contact.role}</p>
                      </div>
                    </div>

                    {/* Relationship Health Badge */}
                    {contact.meetings.some((m) => m.hasOutstandingCommitment) ? (
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
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">{contact.company}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      <Brain className="w-3.5 h-3.5 text-indigo-500" />
                      <span>bank: {contact.bankId}</span>
                    </div>
                    <p className="text-slate-600 pt-1 leading-relaxed italic">
                      &quot;{contact.tagline}&quot;
                    </p>
                  </div>

                  {/* Seeded Meetings Summary */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <History className="w-3 h-3 text-slate-400" />
                      Logged Past Meetings ({contact.meetings.length})
                    </div>
                    <ul className="space-y-1.5">
                      {contact.meetings.map((m, idx) => (
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
                </div>

                {/* Action Button */}
                <div className="p-6 pt-0">
                  <Link
                    href={`/brief/${contact.id}`}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-sm ${
                      isDemo
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>Brief me</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
