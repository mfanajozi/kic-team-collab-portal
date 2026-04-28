'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const COMPANY_INFO: Record<string, { name: string; icon: string }> = {
  cbt: { name: 'Code Bridge Technologies', icon: '💻' },
  cbs: { name: 'Cornerstone Business Consulting', icon: '🏛️' },
  kic: { name: 'K-I-C Global Group', icon: '🌐' },
  ppms: { name: 'Pulse Point Marketing Services', icon: '📣' },
};

const STATUS_COLOURS: Record<string, string> = {
  proposed: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

interface Section {
  id: string;
  name: string;
  description: string | null;
  status: string;
  votes_up: number;
  votes_down: number;
  created_by: string;
  created_at: string;
  author_name: string;
  author_avatar: string;
  user_vote: 'up' | 'down' | null;
}

interface User {
  id: string;
  screen_name: string;
  avatar: string;
  color: string;
  role: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export default function SectionsPage() {
  const params = useParams();
  const router = useRouter();
  const company = params.company as string;
  const info = COMPANY_INFO[company];

  const [sections, setSections] = useState<Section[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadSections() {
    const res = await fetch(`/api/sections?company=${company}`);
    if (res.ok) setSections(await res.json());
  }

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then(setUser).catch(() => {});
    loadSections();
  }, [company]);

  async function vote(sectionId: string, direction: 'up' | 'down') {
    await fetch(`/api/sections/${sectionId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });
    loadSections();
  }

  async function adminStatus(sectionId: string, status: 'approved' | 'rejected') {
    await fetch(`/api/admin/sections/${sectionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadSections();
  }

  async function handlePropose(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    const res = await fetch('/api/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, name: name.trim(), description }),
    });
    setLoading(false);
    if (res.ok) { setName(''); setDescription(''); setShowForm(false); loadSections(); }
    else { const d = await res.json(); setError(d.error ?? 'Failed to propose section'); }
  }

  if (!info) return <div className="p-8">Unknown company</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/portal/${company}`} className="text-slate-400 hover:text-slate-700 text-sm transition-colors">
              ← Back
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xl">{info.icon}</span>
            <div>
              <h1 className="font-semibold text-slate-900 text-sm">{info.name}</h1>
              <p className="text-xs text-slate-500">Website Sections</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            + Propose Section
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Propose form */}
        {showForm && (
          <form onSubmit={handlePropose} className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Propose a New Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section Name</label>
                <input
                  type="text"
                  maxLength={40}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Hero Banner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Why should this section exist?"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60">
                  {loading ? 'Submitting…' : 'Propose'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Sections list */}
        <div className="space-y-3">
          {sections.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">🗂️</div>
              <p className="font-medium">No sections yet</p>
              <p className="text-sm mt-1">Propose the first one above!</p>
            </div>
          )}
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{section.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOURS[section.status]}`}>
                      {section.status.charAt(0).toUpperCase() + section.status.slice(1)}
                    </span>
                  </div>
                  {section.description && (
                    <p className="text-sm text-slate-500">{section.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {section.author_avatar} {section.author_name} · {timeAgo(section.created_at)}
                    {section.status === 'proposed' && (
                      <span className="ml-2 text-slate-500">· {3 - section.votes_up} more vote{3 - section.votes_up !== 1 ? 's' : ''} to auto-approve</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {user?.role === 'Admin' && section.status === 'proposed' && (
                    <>
                      <button onClick={() => adminStatus(section.id, 'approved')}
                        className="text-xs px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
                        Approve
                      </button>
                      <button onClick={() => adminStatus(section.id, 'rejected')}
                        className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
                        Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => vote(section.id, 'up')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      section.user_vote === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                    }`}>
                    👍 {section.votes_up}
                  </button>
                  <button onClick={() => vote(section.id, 'down')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      section.user_vote === 'down' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 hover:bg-red-50'
                    }`}>
                    👎 {section.votes_down}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
