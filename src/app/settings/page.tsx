'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { applyUserTheme, COLOUR_OPTIONS, AVATAR_OPTIONS } from '@/lib/theme';

interface User {
  id: string;
  screen_name: string | null;
  avatar: string | null;
  color: string | null;
  email: string;
  real_name: string;
  role: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [screenName, setScreenName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [color, setColor] = useState('#5C6BC0');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((u: User) => {
        setUser(u);
        setScreenName(u.screen_name ?? u.real_name);
        setAvatar(u.avatar ?? '🚀');
        const c = u.color ?? '#5C6BC0';
        setColor(c);
        applyUserTheme(c);
      });
  }, []);

  // Live-preview theme as user picks colour
  useEffect(() => { applyUserTheme(color); }, [color]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    if (!screenName.trim()) { setError('Screen name is required'); return; }
    if (!avatar) { setError('Please select an avatar'); return; }
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screen_name: screenName.trim(), avatar, color }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else { const d = await res.json(); setError(d.error ?? 'Failed to save'); }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="theme-bg min-h-screen">
      {/* Header */}
      <header className="glass-dark border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/companies" className="text-white/50 hover:text-white text-sm transition-colors">
              ← Back
            </Link>
            <span className="text-white/20">|</span>
            <h1 className="text-white font-semibold">Profile Settings</h1>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{user.avatar}</span>
                <span className="text-white/70 text-sm">{user.screen_name ?? user.real_name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Profile preview card */}
        {user && (
          <div className="glass rounded-2xl p-6 mb-8 user-glow">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Preview</p>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                style={{ background: `linear-gradient(135deg, ${color}, rgba(var(--ur),var(--ug),var(--ub),0.5))` }}
              >
                {avatar}
              </div>
              <div>
                <p className="text-white font-bold text-xl">{screenName || user.real_name}</p>
                <p className="text-white/50 text-sm">{user.email}</p>
                <span
                  className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ background: `rgba(var(--ur),var(--ug),var(--ub),0.35)`, border: `1px solid rgba(var(--ur),var(--ug),var(--ub),0.5)` }}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Screen Name */}
          <div className="glass rounded-2xl p-6">
            <label className="block text-white/70 text-sm font-medium mb-3">Screen Name</label>
            <input
              type="text"
              maxLength={20}
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm"
              placeholder="Your display name"
            />
            <p className="text-white/30 text-xs mt-1.5 text-right">{screenName.length}/20</p>
          </div>

          {/* Avatar */}
          <div className="glass rounded-2xl p-6">
            <label className="block text-white/70 text-sm font-medium mb-3">Avatar</label>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  type="button"
                  title={label}
                  onClick={() => setAvatar(emoji)}
                  className={`text-2xl py-2 rounded-xl border transition-all ${
                    avatar === emoji
                      ? 'border-white/40 scale-110 bg-white/10'
                      : 'border-white/10 hover:border-white/25 hover:bg-white/5'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Colour */}
          <div className="glass rounded-2xl p-6">
            <label className="block text-white/70 text-sm font-medium mb-3">
              Colour Theme
              <span className="text-white/30 font-normal ml-2">— live preview updates as you pick</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {COLOUR_OPTIONS.map(({ hex, name }) => (
                <button
                  key={hex}
                  type="button"
                  title={name}
                  onClick={() => setColor(hex)}
                  className={`relative h-14 rounded-xl border-4 transition-all overflow-hidden ${
                    color === hex ? 'border-white scale-105' : 'border-transparent hover:scale-102'
                  }`}
                  style={{ backgroundColor: hex }}
                >
                  {color === hex && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-bold drop-shadow">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="w-7 h-7 rounded-lg user-glow" style={{ backgroundColor: color }} />
              <span className="text-white/60 text-sm">
                {COLOUR_OPTIONS.find((c) => c.hex === color)?.name ?? color}
              </span>
            </div>
          </div>

          {error && (
            <div className="glass rounded-xl px-4 py-3 border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
              {error}
            </div>
          )}
          {saved && (
            <div className="glass rounded-xl px-4 py-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm">
              ✓ Profile saved successfully
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="user-btn w-full py-3.5 rounded-xl font-semibold text-sm"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </main>
    </div>
  );
}
