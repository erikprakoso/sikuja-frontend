'use client';

import React from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function UsersPage() {
  return (
    <RequireAuth roles={['admin']}>
      <div className="space-y-8 py-4 max-w-4xl mx-auto">
        <AdminHeader
          badge="Manajemen Akun Panitia"
          title="Kelola Pengguna & Akses"
          subtitle="Atur akun panitia, peran (penjual, pos, mc, verifikator, admin), dan status aktif setiap pengguna."
        />
        <UserManagement />
      </div>
    </RequireAuth>
  );
}
