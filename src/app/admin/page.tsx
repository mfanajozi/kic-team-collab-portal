'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  last_login_at: string | null;
}

interface Company {
  key: string;
  name: string;
  domain: string | null;
  logo: string | null;
  total: number;
  approved: number;
  last_activity: string | null;
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'companies'>('users');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ key: '', name: '', domain: '', logo: '' });
  const [companyError, setCompanyError] = useState('');
  const [companySuccess, setCompanySuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function loadUsers() {
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
  }

  async function loadCompanies() {
    const res = await fetch('/api/companies');
    if (res.ok) setCompanies(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, []);

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !active }),
    });
    loadUsers();
  }

  async function handleAddCompany(e: React.FormEvent) {
    e.preventDefault();
    setCompanyError('');
    setCompanySuccess(false);

    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyForm),
    });

    if (!res.ok) {
      const data = await res.json();
      setCompanyError(data.error || 'Failed to add company');
      return;
    }

    setCompanySuccess(true);
    setCompanyForm({ key: '', name: '', domain: '', logo: '' });
    loadCompanies();
    setTimeout(() => { setShowAddCompany(false); setCompanySuccess(false); }, 1500);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setCompanyError('');

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/admin/companies/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setCompanyError(data.error || 'Upload failed');
        setUploadingLogo(false);
        return;
      }

      const data = await res.json();
      setCompanyForm({ ...companyForm, logo: data.logo });
    } catch {
setCompanyError('Upload failed');
    }

    setUploadingLogo(false);
  }

  async function handleDeleteCompany(key: string) {
    if (!confirm(`Delete company "${key}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/companies?key=${key}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        alert(data.message || 'Company deleted');
        loadCompanies();
      } else {
        alert(data.error || 'Failed to delete company');
      }
    } catch (e) {
      alert('Failed to delete company');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/companies" className="text-slate-400 hover:text-white text-sm transition-colors">
              ← Portal
            </Link>
            <span className="text-slate-700">|</span>
            <h1 className="font-bold text-lg">Admin Panel</h1>
          </div>
          <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white transition-colors">
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'companies' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Companies ({companies.length})
          </button>
        </div>

        {activeTab === 'users' ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">User Management</h2>
                <p className="text-slate-500 text-sm mt-0.5">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/export"
                  className="px-4 py-2 rounded-xl glass-card text-white/60 hover:text-white text-sm font-medium transition-colors"
                >
                  Export Ideas
                </Link>
                <Link
                  href="/admin/users/new"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                >
                  + Add User
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-slate-400">Loading…</div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Login</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className={`border-b border-slate-100 ${!u.is_active ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                              style={{ backgroundColor: u.color ?? '#5C6BC0' }}>
                              {u.avatar ?? '👤'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{u.screen_name ?? u.real_name}</p>
                              <p className="text-xs text-slate-400">{u.real_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">{timeAgo(u.last_login_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/users/${u.id}`}
                              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                              Edit
                            </Link>
                            <button
                              onClick={() => toggleActive(u.id, u.is_active)}
                              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                                u.is_active
                                  ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Company Management</h2>
                <p className="text-slate-500 text-sm mt-0.5">{companies.length} company{companies.length !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => setShowAddCompany(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                + Add Company
              </button>
            </div>

            {showAddCompany && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Company</h3>
                  <form onSubmit={handleAddCompany} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Company Key</label>
                      <input
                        type="text"
                        value={companyForm.key}
                        onChange={(e) => setCompanyForm({ ...companyForm, key: e.target.value.toLowerCase() })}
                        placeholder="e.g., myco"
                        maxLength={10}
                        required
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-400 mt-1">Short code (max 10 chars)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={companyForm.name}
                        onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                        placeholder="e.g., My Company"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Domain (optional)</label>
                      <input
                        type="text"
                        value={companyForm.domain}
                        onChange={(e) => setCompanyForm({ ...companyForm, domain: e.target.value })}
                        placeholder="e.g., mycompany.co.za"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Company Logo (optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {uploadingLogo && <p className="text-sm text-slate-500 mt-1">Uploading...</p>}
                      {companyForm.logo && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={companyForm.logo} alt="Logo" className="w-10 h-10 object-contain rounded-lg bg-slate-100" />
                          <span className="text-xs text-slate-500">{companyForm.logo.split('/').pop()}</span>
                        </div>
                      )}
                    </div>
                    {companyError && <p className="text-sm text-red-600">{companyError}</p>}
                    {companySuccess && <p className="text-sm text-emerald-600">Company added successfully!</p>}
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowAddCompany(false); setCompanyError(''); }}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                      >
                        Add Company
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-16 text-slate-400">Loading…</div>
            ) : companies.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                No companies yet. Click "Add Company" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((co) => (
                  <div key={co.key} className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg">
                          🏢
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{co.name}</p>
                          <p className="text-xs text-slate-500">{co.domain}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        {co.key.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t border-slate-100">
                      <span>{co.total} idea{co.total !== 1 ? 's' : ''}</span>
                      <span>{co.approved} approved</span>
                      <span>{timeAgo(co.last_activity)}</span>
                    </div>
                    <div className="flex justify-end mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleDeleteCompany(co.key)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
