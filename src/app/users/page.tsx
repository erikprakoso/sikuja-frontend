'use client';

import React from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function UsersPage() {
  return (
    <RequireAuth roles={['admin']}>
      <div className="space-y-8 py-4 max-w-4xl mx-auto">
        <AdminHeader />
        <UserManagement />
      </div>
    </RequireAuth>
  );
}
