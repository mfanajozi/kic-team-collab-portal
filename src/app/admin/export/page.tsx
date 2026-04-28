'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { applyUserTheme, DEFAULT_COLOR } from '@/lib/theme';

interface Idea {
  id: string;
  company: string;
  category: string;
  title: string;
  description: string | null;
  status: string;
  votes_up: number;
  votes_down: number;
  created_at: string;
  author_name: string;
  author_avatar: string;
}

const COMPANY_NAMES: Record<string, string> = {
  cbt: 'Code Bridge Technologies',
  cbs: 'Cornerstone Business Consulting',
  kic: 'K-I-C Global Group',
  ppms: 'Pulse Point Marketing Services',
};

const CATEGORIES = ['Content', 'Design', 'Strategy', 'About'] as const;

const CAT_STYLES: Record<string, string> = {
  Content: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  Design: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  Strategy: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  About: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
};

export default function ExportPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  useEffect(() => {
    applyUserTheme(DEFAULT_COLOR);
    fetch('/api/admin/export')
      .then((r) => r.json())
      .then(setIdeas)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredIdeas = selectedCompany === 'all' 
    ? ideas 
    : ideas.filter((i) => i.company === selectedCompany);

  const groupedByCompany = filteredIdeas.reduce((acc, idea) => {
    if (!acc[idea.company]) acc[idea.company] = {};
    if (!acc[idea.company][idea.category]) acc[idea.company][idea.category] = [];
    acc[idea.company][idea.category].push(idea);
    return acc;
  }, {} as Record<string, Record<string, Idea[]>>);

  const companies = Array.from(new Set(ideas.map((i) => i.company)));
  const totalIdeas = filteredIdeas.length;

  function downloadCSV() {
    const headers = ['Company', 'Category', 'Title', 'Description', 'Status', 'Up Votes', 'Down Votes', 'Author', 'Created At'];
    const rows = filteredIdeas.map((idea) => [
      COMPANY_NAMES[idea.company] || idea.company,
      idea.category,
      `"${(idea.title || '').replace(/"/g, '""')}"`,
      `"${(idea.description || '').replace(/"/g, '""')}"`,
      idea.status,
      idea.votes_up,
      idea.votes_down,
      idea.author_name,
      new Date(idea.created_at).toLocaleDateString('en-ZA'),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kic-ideas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="theme-bg min-h-screen">
      <header className="glass-dark border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/companies" className="text-white/40 hover:text-white text-sm transition-colors">
              ← Portal
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/admin" className="text-white/40 hover:text-white text-sm transition-colors">
              Admin
            </Link>
            <span className="text-white/20">|</span>
            <h1 className="font-bold text-white text-lg">Export Ideas</h1>
          </div>
          <button onClick={handleLogout} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">Export Ideas to CSV</h2>
            <p className="text-white/50 text-sm mt-0.5">
              {totalIdeas} idea{totalIdeas !== 1 ? 's' : ''} across {companies.length} companies
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="glass-input px-4 py-2 rounded-xl text-sm"
            >
              <option value="all">All Companies</option>
              {companies.map((c) => (
                <option key={c} value={c}>{COMPANY_NAMES[c] || c}</option>
              ))}
            </select>
            <button
              onClick={downloadCSV}
              disabled={loading || filteredIdeas.length === 0}
              className="user-btn px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              Download CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/40">Loading…</div>
        ) : filteredIdeas.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-white/50 font-medium">No ideas found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByCompany).map(([company, categories]) => (
              <div key={company} className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-lg">
                    {COMPANY_NAMES[company] || company}
                    <span className="ml-2 text-white/30 font-normal text-sm">
                      ({Object.values(categories).flat().length} ideas)
                    </span>
                  </h3>
                </div>

                <div className="space-y-4">
                  {CATEGORIES.map((cat) => {
                    const catIdeas = categories[cat] || [];
                    if (catIdeas.length === 0) return null;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_STYLES[cat]}`}>
                            {cat === 'About' ? 'About Business' : cat}
                          </span>
                          <span className="text-white/40 text-xs">{catIdeas.length} ideas</span>
                        </div>
                        <div className="space-y-2">
                          {catIdeas.map((idea) => (
                            <div key={idea.id} className="flex items-center justify-between p-3 glass-card rounded-xl">
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{idea.title}</p>
                                <p className="text-white/40 text-xs mt-0.5">
                                  by {idea.author_name} · {new Date(idea.created_at).toLocaleDateString('en-ZA')}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                  idea.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                  idea.status === 'implemented' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                                  idea.status === 'discussed' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                  'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                }`}>
                                  {idea.status}
                                </span>
                                <span className="text-white/30 text-xs">👍 {idea.votes_up}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}