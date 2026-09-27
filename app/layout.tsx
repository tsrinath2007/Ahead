import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Brain, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'MEETUP MEMORY | AI Meeting-Prep Agent with Hindsight',
  description:
    'AI meeting-prep agent that remembers past meetings, surfaces overdue promises, and briefs you with context generic assistants forget.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    MEETUP MEMORY
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Hindsight Powered
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  AI Pre-Meeting Intelligence & Overdue Commitment Tracker
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Hindsight Bank Active</span>
              </div>
              <Link
                href="/"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                Contacts List
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              Built for Hackathon Demo • Powered by{' '}
              <a
                href="https://github.com/vectorize-io/hindsight"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-indigo-600 hover:underline"
              >
                Hindsight (@vectorize-io/hindsight-client)
              </a>{' '}
              & Groq LLM
            </p>
            <div className="flex items-center gap-4 text-slate-400">
              <span>retain()</span>
              <span>•</span>
              <span>recall()</span>
              <span>•</span>
              <span>reflect()</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
