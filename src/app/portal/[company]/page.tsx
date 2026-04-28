'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { applyUserTheme } from '@/lib/theme';

const COMPANY_INFO: Record<string, { name: string; icon: string }> = {
  cbt: { name: 'Code Bridge Technologies', icon: '💻' },
  cbs: { name: 'Cornerstone Business Consulting', icon: '🏛️' },
  kic: { name: 'K-I-C Global Group', icon: '🌐' },
  ppms: { name: 'Pulse Point Marketing Services', icon: '📣' },
};

const CATEGORIES = ['Content', 'Design', 'Strategy', 'About'] as const;
type Category = (typeof CATEGORIES)[number];

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  discussed: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  approved: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  implemented: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
};

const CAT_STYLES: Record<string, string> = {
  Content: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  Design: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  Strategy: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  About: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
};

interface User {
  id: string;
  screen_name: string;
  avatar: string;
  color: string;
  role: string;
  real_name: string;
}

interface Idea {
  id: string;
  company: string;
  category: string;
  section_id: string | null;
  title: string;
  description: string | null;
  status: string;
  votes_up: number;
  votes_down: number;
  created_by: string;
  created_at: string;
  author_name: string;
  author_avatar: string;
  user_vote: 'up' | 'down' | null;
  note_count: number;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string;
}

interface Section {
  id: string;
  name: string;
  status: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export default function PortalPage() {
  const params = useParams();
  const router = useRouter();
  const company = params.company as string;
  const info = COMPANY_INFO[company];

  const [user, setUser] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [myIdeasOnly, setMyIdeasOnly] = useState(false);
  const [showUnvotedOnly, setShowUnvotedOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showNewIdea, setShowNewIdea] = useState(false);
  const [detailIdea, setDetailIdea] = useState<Idea | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editIdea, setEditIdea] = useState<Idea | null>(null);

  const loadIdeas = useCallback(async () => {
    const p = new URLSearchParams({ company });
    if (activeCategory !== 'All') p.set('category', activeCategory);
    if (search) p.set('search', search);
    const res = await fetch(`/api/ideas?${p}`);
    if (res.ok) setIdeas(await res.json());
  }, [company, activeCategory, search]);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((u: User) => {
      setUser(u);
      if (u.color) applyUserTheme(u.color);
    }).catch(() => {});
    fetch(`/api/sections?company=${company}`).then((r) => r.json()).then(setSections).catch(() => {});
  }, [company]);

  useEffect(() => { loadIdeas(); }, [loadIdeas]);

  async function loadNotes(ideaId: string) {
    const res = await fetch(`/api/ideas/${ideaId}/notes`);
    if (res.ok) setNotes(await res.json());
  }

  async function openDetail(idea: Idea) {
    setDetailIdea(idea);
    await loadNotes(idea.id);
  }

  async function vote(ideaId: string, direction: 'up' | 'down') {
    const res = await fetch(`/api/ideas/${ideaId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });
    if (res.ok) {
      loadIdeas();
      if (detailIdea?.id === ideaId) {
        const updated = await fetch(`/api/ideas?company=${company}`);
        if (updated.ok) {
          const all: Idea[] = await updated.json();
          const found = all.find((i) => i.id === ideaId);
          if (found) setDetailIdea(found);
        }
      }
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const filteredIdeas = ideas.filter((idea) => {
    if (myIdeasOnly && idea.created_by !== user?.id) return false;
    if (showUnvotedOnly && idea.user_vote !== null) return false;
    return true;
  });

  if (!info) return <div className="p-8 text-white">Unknown company</div>;

  return (
    <div className="flex h-screen theme-bg overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 glass-dark flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Company info */}
        <div className="px-5 pt-6 pb-4 border-b border-white/10">
          <Link
            href="/companies"
            className="flex items-center gap-2 mb-5 text-white/40 hover:text-white text-xs transition-colors"
          >
            ← All Companies
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(var(--ur),var(--ug),var(--ub),0.25)', border: '1px solid rgba(var(--ur),var(--ug),var(--ub),0.4)' }}
            >
              {info.icon}
            </div>
            <div>
              <p className="font-semibold text-white text-sm leading-tight">{info.name}</p>
              <p className="text-xs text-white/30 uppercase tracking-wide mt-0.5">{company}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {['All', ...CATEGORIES].map((cat) => {
            const isActive = activeCategory === cat && !myIdeasOnly && !showUnvotedOnly;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setMyIdeasOnly(false);
                  setShowUnvotedOnly(false);
                  setSidebarOpen(false);
                }}
                className={`nav-item w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'nav-active' : 'text-white/50 hover:text-white'
                }`}
              >
                {cat === 'All' ? '📋 All Ideas' :
                 cat === 'Content' ? '✍️ Content' :
                 cat === 'Design' ? '🎨 Design' :
                 cat === 'Strategy' ? '📈 Strategy' :
                 '🏢 About Business'}
              </button>
            );
          })}

          <div className="pt-2 border-t border-white/10 mt-2">
            <Link
              href={`/portal/${company}/sections`}
              className="nav-item block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all"
            >
              🗂️ Sections
            </Link>
          </div>
        </nav>

        {/* User block */}
        {user && (
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ background: `linear-gradient(135deg, rgba(var(--ur),var(--ug),var(--ub),0.7), rgba(var(--ur),var(--ug),var(--ub),0.3))` }}
              >
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.real_name}</p>
                <p className="text-xs text-white/50">@{user.screen_name}</p>
                <p className="text-xs text-white/40">{user.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/settings"
                className="flex-1 text-center text-xs py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/15 hover:text-white transition-colors"
              >
                Settings
              </Link>
              {user.role === 'Admin' && (
                <Link
                  href="/admin"
                  className="flex-1 text-center text-xs py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/15 hover:text-white transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex-1 text-xs py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/15 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="glass-dark border-b border-white/10 px-6 py-4 flex items-center gap-4">
          <button
            className="lg:hidden text-white/60 hover:text-white text-xl"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ideas…"
              className="glass-input w-full max-w-md px-4 py-2 rounded-xl text-sm"
            />
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ background: `linear-gradient(135deg, rgba(var(--ur),var(--ug),var(--ub),0.7), rgba(var(--ur),var(--ug),var(--ub),0.3))` }}
                >
                  {user.avatar}
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm text-white font-medium block">{user.real_name}</span>
                  <span className="text-xs text-white/50">@{user.screen_name}</span>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowNewIdea(true)}
            className="user-btn px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
          >
            + New Idea
          </button>
        </header>

        {/* Quick action cards */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'New Idea', icon: '💡', action: () => setShowNewIdea(true), active: false },
              { label: 'New Section', icon: '🗂️', action: () => router.push(`/portal/${company}/sections`), active: false },
              { label: 'My Ideas', icon: '👤', action: () => { setMyIdeasOnly(!myIdeasOnly); setShowUnvotedOnly(false); setActiveCategory('All'); }, active: myIdeasOnly },
              { label: 'Voting Queue', icon: '🗳️', action: () => { setShowUnvotedOnly(!showUnvotedOnly); setMyIdeasOnly(false); setActiveCategory('All'); }, active: showUnvotedOnly },
            ].map(({ label, icon, action, active }) => (
              <button
                key={label}
                onClick={action}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'text-white border'
                    : 'glass-card text-white/70 hover:text-white'
                }`}
                style={active ? {
                  background: 'rgba(var(--ur),var(--ug),var(--ub),0.2)',
                  borderColor: 'rgba(var(--ur),var(--ug),var(--ub),0.5)',
                } : {}}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Ideas list */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white/80">
              {activeCategory === 'All' ? 'All Ideas' : activeCategory}
              {myIdeasOnly ? ' · My Ideas' : ''}
              {showUnvotedOnly ? ' · Voting Queue' : ''}
              <span className="ml-2 text-white/30 font-normal text-sm">({filteredIdeas.length})</span>
            </h2>
          </div>

          {filteredIdeas.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <div className="text-5xl mb-4">💭</div>
              <p className="font-medium text-white/50">No ideas yet</p>
              <p className="text-sm mt-1">Be the first to submit one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIdeas.map((idea) => (
                <div key={idea.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_STYLES[idea.category]}`}>
                          {idea.category === 'About' ? 'About Business' : idea.category}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[idea.status]}`}>
                          {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white">{idea.title}</h3>
                      {idea.description && (
                        <p className="text-sm text-white/50 mt-1 line-clamp-2">{idea.description}</p>
                      )}
                    </div>
                    {user && idea.created_by === user.id && (
                      <button
                        onClick={() => setEditIdea(idea)}
                        className="text-xs text-white/30 hover:text-white/70 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                      >
                        Edit
                      </button>
                    )}
                    {user?.role === 'Admin' && (
                      <AdminIdeaActions idea={idea} onRefresh={loadIdeas} />
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{idea.author_avatar}</span>
                      <span className="text-white/50">{idea.author_name}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-white/30">{timeAgo(idea.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                        💬 {idea.note_count}
                      </span>
                      <button
                        onClick={() => vote(idea.id, 'up')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          idea.user_vote === 'up'
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                            : 'bg-white/5 text-white/50 hover:bg-emerald-500/15 hover:text-emerald-300 border border-white/10'
                        }`}
                      >
                        👍 {idea.votes_up}
                      </button>
                      <button
                        onClick={() => vote(idea.id, 'down')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          idea.user_vote === 'down'
                            ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                            : 'bg-white/5 text-white/50 hover:bg-red-500/15 hover:text-red-300 border border-white/10'
                        }`}
                      >
                        👎 {idea.votes_down}
                      </button>
                      <button
                        onClick={() => openDetail(idea)}
                        className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all border text-white/70 hover:text-white"
                        style={{ background: 'rgba(var(--ur),var(--ug),var(--ub),0.15)', borderColor: 'rgba(var(--ur),var(--ug),var(--ub),0.35)' }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewIdea && (
        <NewIdeaModal
          company={company}
          sections={sections}
          onClose={() => setShowNewIdea(false)}
          onCreated={() => { setShowNewIdea(false); loadIdeas(); }}
        />
      )}

      {detailIdea && (
        <DetailModal
          idea={detailIdea}
          notes={notes}
          user={user}
          onClose={() => { setDetailIdea(null); setNotes([]); }}
          onVote={vote}
          onNoteAdded={() => loadNotes(detailIdea.id)}
        />
      )}

      {editIdea && (
        <EditIdeaModal
          idea={editIdea}
          sections={sections}
          onClose={() => setEditIdea(null)}
          onSaved={() => { setEditIdea(null); loadIdeas(); }}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AdminIdeaActions({ idea, onRefresh }: { idea: Idea; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);

  async function setStatus(status: string) {
    setOpen(false);
    await fetch(`/api/admin/ideas/${idea.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onRefresh();
  }

  async function deleteIdea() {
    if (!confirm(`Delete "${idea.title}"?`)) return;
    setOpen(false);
    await fetch(`/api/admin/ideas/${idea.id}`, { method: 'DELETE' });
    onRefresh();
  }

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-white/30 hover:text-white/70 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
      >
        ⚙️
      </button>
      {open && (
        <div className="absolute right-0 top-8 glass rounded-xl shadow-2xl z-10 w-40 py-1 border border-white/15">
          {['new', 'discussed', 'approved', 'implemented'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className="w-full text-left px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/10 capitalize transition-colors"
            >
              → {s}
            </button>
          ))}
          <div className="border-t border-white/10 mt-1 pt-1">
            <button
              onClick={deleteIdea}
              className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              🗑 Delete idea
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewIdeaModal({ company, sections, onClose, onCreated }: {
  company: string; sections: Section[]; onClose: () => void; onCreated: () => void;
}) {
  const [category, setCategory] = useState('Content');
  const [sectionId, setSectionId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const approvedSections = sections.filter((s) => s.status === 'approved');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, category, section_id: sectionId || null, title: title.trim(), description }),
    });
    setLoading(false);
    if (res.ok) onCreated();
    else { const d = await res.json(); setError(d.error ?? 'Failed to create idea'); }
  }

  return (
    <GlassModal title="New Idea" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="glass-input w-full px-3 py-2.5 rounded-xl text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'About' ? 'About Business' : c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Website Section</label>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}
            className="glass-input w-full px-3 py-2.5 rounded-xl text-sm">
            <option value="">General</option>
            {approvedSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Title</label>
          <input type="text" maxLength={80} required value={title} onChange={(e) => setTitle(e.target.value)}
            className="glass-input w-full px-3 py-2.5 rounded-xl text-sm" placeholder="Idea title" />
          <p className="text-xs text-white/30 mt-1 text-right">{title.length}/80</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="glass-input w-full px-3 py-2.5 rounded-xl text-sm resize-none"
            placeholder="Describe your idea (optional)" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-card text-sm font-medium text-white/60 hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 rounded-xl user-btn text-sm font-semibold disabled:opacity-50">
            {loading ? 'Submitting…' : 'Submit Idea'}
          </button>
        </div>
      </form>
    </GlassModal>
  );
}

function EditIdeaModal({ idea, sections, onClose, onSaved }: {
  idea: Idea; sections: Section[]; onClose: () => void; onSaved: () => void;
}) {
  const [category, setCategory] = useState(idea.category);
  const [sectionId, setSectionId] = useState(idea.section_id ?? '');
  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const approvedSections = sections.filter((s) => s.status === 'approved');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    const res = await fetch(`/api/ideas/${idea.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, section_id: sectionId || null, title: title.trim(), description }),
    });
    setLoading(false);
    if (res.ok) onSaved();
    else { const d = await res.json(); setError(d.error ?? 'Failed to save'); }
  }

  return (
    <GlassModal title="Edit Idea" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="glass-input w-full px-3 py-2.5 rounded-xl text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'About' ? 'About Business' : c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Website Section</label>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}
            className="glass-input w-full px-3 py-2.5 rounded-xl text-sm">
            <option value="">General</option>
            {approvedSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Title</label>
          <input type="text" maxLength={80} required value={title} onChange={(e) => setTitle(e.target.value)}
            className="glass-input w-full px-3 py-2.5 rounded-xl text-sm" />
          <p className="text-xs text-white/30 mt-1 text-right">{title.length}/80</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="glass-input w-full px-3 py-2.5 rounded-xl text-sm resize-none" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-card text-sm font-medium text-white/60 hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 rounded-xl user-btn text-sm font-semibold disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </GlassModal>
  );
}

function DetailModal({ idea, notes, user, onClose, onVote, onNoteAdded }: {
  idea: Idea; notes: Note[]; user: User | null;
  onClose: () => void; onVote: (id: string, dir: 'up' | 'down') => void; onNoteAdded: () => void;
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/ideas/${idea.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() }),
    });
    setLoading(false);
    if (res.ok) { setContent(''); onNoteAdded(); }
  }

  return (
    <GlassModal title={idea.title} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_STYLES[idea.category]}`}>
            {idea.category === 'About' ? 'About Business' : idea.category}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[idea.status]}`}>
            {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
          </span>
          <span className="text-xs text-white/40 flex items-center gap-1">
            {idea.author_avatar} {idea.author_name} · {timeAgo(idea.created_at)}
          </span>
        </div>

        {idea.description && (
          <p className="text-white/70 text-sm leading-relaxed">{idea.description}</p>
        )}

        <div className="flex items-center gap-3">
          <button onClick={() => onVote(idea.id, 'up')}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              idea.user_vote === 'up'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-white/50 hover:bg-emerald-500/15 hover:text-emerald-300 border border-white/10'
            }`}>
            👍 {idea.votes_up}
          </button>
          <button onClick={() => onVote(idea.id, 'down')}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              idea.user_vote === 'down'
                ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                : 'bg-white/5 text-white/50 hover:bg-red-500/15 hover:text-red-300 border border-white/10'
            }`}>
            👎 {idea.votes_down}
          </button>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-3">Notes & Comments ({notes.length})</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4 scrollbar-thin">
            {notes.length === 0 && (
              <p className="text-white/30 text-sm">No notes yet. Add one below!</p>
            )}
            {notes.map((note) => (
              <div key={note.id} className="flex gap-3 p-3 glass rounded-xl">
                <span className="text-xl shrink-0">{note.author_avatar}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{note.author_name}</span>
                    <span className="text-xs text-white/30">{timeAgo(note.created_at)}</span>
                  </div>
                  <p className="text-sm text-white/60">{note.content}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={addNote} className="flex gap-2">
            <input
              type="text"
              maxLength={300}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a note… (max 300 chars)"
              className="glass-input flex-1 px-3 py-2 rounded-xl text-sm"
            />
            <button type="submit" disabled={loading || !content.trim()}
              className="px-4 py-2 rounded-xl user-btn text-sm font-semibold disabled:opacity-50">
              Add
            </button>
          </form>
        </div>
      </div>
    </GlassModal>
  );
}

function GlassModal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`glass rounded-2xl w-full ${wide ? 'max-w-xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto scrollbar-thin`}
        style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white text-2xl leading-none transition-colors">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
