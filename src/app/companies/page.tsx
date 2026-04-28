'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { applyUserTheme } from '@/lib/theme';

interface Company {
  key: string;
  name: string;
  domain: string | null;
  logo: string | null;
  total: number;
  approved: number;
  last_activity: string | null;
}

interface User {
  id: string;
  screen_name: string;
  avatar: string;
  color: string;
  role: string;
}

const DEFAULT_LOGOS: Record<string, string> = {
  cbt: 'images/company-logos/code-bridge.jpeg',
  cbs: 'images/company-logos/cornerstone.jpeg',
  kic: 'images/company-logos/kic-global.png',
  ppms: 'images/company-logos/pulse-point.jpeg',
};

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((u: User) => {
      setUser(u);
      if (u.color) applyUserTheme(u.color);
    }).catch(() => {});
    fetch('/api/companies').then((r) => r.json()).then(setCompanies).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function formatDate(iso: string | null) {
    if (!iso) return 'No activity yet';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="theme-bg min-h-screen">
      {/* Header */}
      <header className="glass-dark border-b border-white/10 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden user-glow">
              <img src="images/kic-logo.png" alt="KIC" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-white">KIC Collab Portal</h1>
              <p className="text-xs text-white/40">Kingdom International Consulting</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ background: `linear-gradient(135deg, rgba(var(--ur),var(--ug),var(--ub),0.6), rgba(var(--ur),var(--ug),var(--ub),0.25))` }}
                >
                  {user.avatar}
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user.screen_name}</p>
                  <p className="text-xs text-white/40">{user.role}</p>
                </div>
              </div>
            )}
            <Link
              href="/settings"
              className="text-xs px-3 py-1.5 rounded-lg glass-card text-white/60 hover:text-white transition-colors"
            >
              Settings
            </Link>
            {user?.role === 'Admin' && (
              <Link
                href="/admin"
                className="text-xs px-3 py-1.5 rounded-lg glass-card text-white/60 hover:text-white transition-colors"
              >
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg glass-card text-white/60 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Greeting */}
        {user && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl user-glow"
                style={{ background: `linear-gradient(135deg, rgba(var(--ur),var(--ug),var(--ub),0.8), rgba(var(--ur),var(--ug),var(--ub),0.35))` }}
              >
                {user.avatar}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Welcome, <span style={{ color: `rgba(var(--ur),var(--ug),var(--ub),1)` }}>{user.screen_name}</span>
                </h2>
                <p className="text-white/50 mt-0.5">Select a company to view and submit ideas.</p>
              </div>
            </div>
          </div>
        )}

        {/* Company grid */}
        {companies.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            No companies available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {companies.map((co) => {
              const pct = co.total > 0 ? Math.round((co.approved / co.total) * 100) : 0;
              const logoSrc = co.logo || DEFAULT_LOGOS[co.key] || '🏢';
              return (
                <Link
                  key={co.key}
                  href={`/portal/${co.key}`}
                  className="glass-card rounded-2xl p-6 group transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      {co.logo ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10">
                          <img src={co.logo} alt={co.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/10">
                          {DEFAULT_LOGOS[co.key] ? '🏢' : '🏢'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-white transition-colors leading-tight">
                          {co.name}
                        </h3>
                        <p className="text-xs text-white/40 mt-0.5">{co.domain}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-white/30 bg-white/5 px-2 py-1 rounded border border-white/10">
                      {co.key.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-white/60">
                      <span>{co.total} idea{co.total !== 1 ? 's' : ''}</span>
                      <span>{co.approved} approved</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, rgba(var(--ur),var(--ug),var(--ub),0.9), rgba(var(--ur),var(--ug),var(--ub),0.5))',
                        }}
                      />
                    </div>
                    <p className="text-xs text-white/30">
                      Last activity: {formatDate(co.last_activity)}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex justify-end mt-4">
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      style={{ background: 'rgba(var(--ur),var(--ug),var(--ub),0.2)', color: 'rgba(var(--ur),var(--ug),var(--ub),1)' }}
                    >
                      Enter portal →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
