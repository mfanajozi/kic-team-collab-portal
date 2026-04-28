'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  real_name: string;
  role: string;
  is_active: boolean;
  screen_name: string | null;
  avatar: string | null;
  color: string | null;
  profile_complete: boolean;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [realName, setRealName] = useState('');
  const [role, setRole] = useState('User');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((users: User[]) => {
        const found = users.find((u) => u.id === id);
        if (found) {
          setUser(found);
          setEmail(found.email);
          setRealName(found.real_name);
          setRole(found.role);
        }
      });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, real_name: realName, role }),
    });
    setLoading(false);
    if (res.ok) setSuccess('Changes saved.');
    else { const d = await res.json(); setError(d.error ?? 'Failed to save'); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    const res = await fetch(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    setPwLoading(false);
    if (res.ok) { setNewPassword(''); setPwSuccess('Password reset. User will be forced to change on next login.'); }
    else { const d = await res.json(); setPwError(d.error ?? 'Failed to reset password'); }
  }

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-400">Loading…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white text-sm transition-colors">← Admin</Link>
          <span className="text-slate-700">|</span>
          <h1 className="font-bold">Edit User</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Edit profile */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-8 space-y-5">
          <h2 className="font-semibold text-slate-800">Profile Details</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Real Name</label>
            <input type="text" required value={realName} onChange={(e) => setRealName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">{success}</div>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        {/* Reset password */}
        <form onSubmit={handleResetPassword} className="bg-white rounded-2xl border border-slate-200 p-8 space-y-5">
          <h2 className="font-semibold text-slate-800">Reset Password</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Temporary Password</label>
            <input type="password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Min 8 characters" />
            <p className="text-xs text-slate-400 mt-1">User will be forced to change this on next login.</p>
          </div>
          {pwError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{pwError}</div>}
          {pwSuccess && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">{pwSuccess}</div>}
          <button type="submit" disabled={pwLoading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-60">
            {pwLoading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </main>
    </div>
  );
}
