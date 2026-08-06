'use client';

import React from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { UserManagement } from '@/components/admin/UserManagement';

export default function UsersPage() {
  return (
    <RequireAuth roles={['admin']}>
      <div className="space-y-8 py-4 max-w-4xl mx-auto">
        <UserManagement />
      </div>
    </RequireAuth>
  );
}
