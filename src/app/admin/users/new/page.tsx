'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [realName, setRealName] = useState('');
  const [role, setRole] = useState('User');
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tempPassword.length < 8) { setError('Temporary password must be at least 8 characters'); return; }
    setLoading(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, real_name: realName, role, password: tempPassword }),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/admin');
    } else {
      const d = await res.json();
      setError(d.error ?? 'Failed to create user');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white text-sm transition-colors">← Admin</Link>
          <span className="text-slate-700">|</span>
          <h1 className="font-bold">Add New User</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Real Name</label>
            <input type="text" required value={realName} onChange={(e) => setRealName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Temporary Password</label>
            <input type="password" required minLength={8} value={tempPassword} onChange={(e) => setTempPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Min 8 characters" />
            <p className="text-xs text-slate-400 mt-1">User will be asked to change this on first login.</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
          <div className="flex gap-3 pt-2">
            <Link href="/admin" className="flex-1 text-center py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60">
              {loading ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
