'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { User, KeyRound, Plus, UserPlus, RefreshCw, CheckCircle2, XCircle, Trash2, Pencil, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { RoleType } from '@/types';

const ROLE_OPTIONS: { value: RoleType; label: string }[] = [
  { value: 'penjual', label: 'Penjualan' },
  { value: 'pos', label: 'Pos Check-In' },
  { value: 'mc', label: 'MC / Undian' },
  { value: 'verifikator', label: 'Verifikasi' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_BADGE: Record<RoleType, string> = {
  penjual: 'bg-blue-50 text-blue-700 border-blue-200',
  pos: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  mc: 'bg-violet-50 text-violet-700 border-violet-200',
  verifikator: 'bg-amber-50 text-amber-700 border-amber-200',
  admin: 'bg-red-50 text-red-700 border-red-200',
};

interface UserRow {
  id: string;
  name: string;
  role: RoleType;
  active: boolean;
  created_at: string;
}

interface PinReveal {
  name: string;
  pin: string;
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Terjadi kesalahan');
  }
  return data as T;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<RoleType>('penjual');
  const [submitting, setSubmitting] = useState(false);
  const [pinReveal, setPinReveal] = useState<PinReveal | null>(null);

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<{ users: UserRow[] }>('/api/users');
        if (!cancelled) setUsers(data.users || []);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const totalCount = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, startIndex, endIndex]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || submitting) return;
    setSubmitting(true);
    try {
      const data = await api<{ user: UserRow; pin: string }>('/api/users', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), role: newRole }),
      });
      setUsers((prev) => [...prev, data.user]);
      setPinReveal({ name: data.user.name, pin: data.pin });
      setNewName('');
      setNewRole('penjual');
      setShowAdd(false);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPin = async (u: UserRow) => {
    try {
      const data = await api<{ user: UserRow; pin: string }>('/api/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: u.id, resetPin: true }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? data.user : x)));
      setPinReveal({ name: u.name, pin: data.pin });
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleToggleActive = async (u: UserRow) => {
    try {
      const data = await api<{ user: UserRow }>('/api/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: u.id, active: !u.active }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? data.user : x)));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleChangeRole = async (u: UserRow, role: RoleType) => {
    try {
      const data = await api<{ user: UserRow }>('/api/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: u.id, role }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? data.user : x)));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRename = async (u: UserRow) => {
    const next = window.prompt('Nama baru petugas:', u.name);
    if (!next || !next.trim() || next.trim() === u.name) return;
    try {
      const data = await api<{ user: UserRow }>('/api/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: u.id, name: next.trim() }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? data.user : x)));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (u: UserRow) => {
    if (!window.confirm(`Hapus petugas "${u.name}" dari sistem?`)) return;
    try {
      await api('/api/users?id=' + encodeURIComponent(u.id), { method: 'DELETE' });
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#E70013]" />
            Manajemen Petugas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap petugas mendapat PIN unik 6 digit. PIN hanya tampil sekali — simpan & serahkan ke yang bersangkutan.
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#E70013] hover:bg-[#E70013]/90 shadow-xs transition-all cursor-pointer active:scale-95"
        >
          {showAdd ? <XCircle className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showAdd ? 'Batal' : 'Tambah Petugas'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {error}
        </div>
      )}

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Nama Petugas</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="cth: Budi (Panitia Penjualan)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#E70013]/40"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Role / Akses</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as RoleType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#E70013]/40 bg-white"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || !newName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {submitting ? 'Membuat...' : 'Buat & Tampilkan PIN'}
          </button>
        </form>
      )}

      {pinReveal && (
        <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <KeyRound className="w-4 h-4" />
            PIN untuk {pinReveal.name}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-black tracking-[0.3em] text-slate-900">
              {pinReveal.pin}
            </span>
          </div>
          <p className="text-xs text-emerald-700">
            PIN ini hanya ditampilkan sekali. Catat & serahkan ke petugas. Bisa di-reset kapan saja dari halaman ini.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama petugas atau role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#E70013] focus:outline-none transition-all text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500 font-medium">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 per hlm</option>
              <option value={25}>25 per hlm</option>
              <option value={50}>50 per hlm</option>
            </select>
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-bold">Nama</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-xs">
                    Memuat data petugas...
                  </td>
                </tr>
              )}
              {!loading && paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-xs">
                    {searchQuery ? 'Petugas tidak ditemukan.' : 'Belum ada petugas. Tambahkan lewat tombol di atas.'}
                  </td>
                </tr>
              )}
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <User className="w-4 h-4" />
                      </span>
                      <span className="font-semibold text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u, e.target.value as RoleType)}
                      className={`px-2 py-1 rounded-lg border text-xs font-bold cursor-pointer bg-white ${ROLE_BADGE[u.role]}`}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                        u.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {u.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {u.active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleResetPin(u)}
                        title="Reset PIN"
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRename(u)}
                        title="Ubah Nama"
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        title="Hapus"
                        className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalCount > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            <span>
              Menampilkan <strong className="font-black text-slate-900">{startIndex + 1}</strong>–
              <strong className="font-black text-slate-900">{endIndex}</strong> dari{' '}
              <strong className="font-black text-slate-900">{totalCount}</strong> petugas
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer active:scale-95"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (safeCurrentPage > 3) {
                      pageNum = safeCurrentPage - 2 + i;
                    }
                    if (pageNum > totalPages) {
                      pageNum = totalPages - (4 - i);
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer active:scale-95 border ${
                        safeCurrentPage === pageNum
                          ? 'bg-[#E70013] border-[#E70013] text-white shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer active:scale-95"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
