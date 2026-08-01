'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { refreshSession } from '@/lib/services/auth';

export default function AdminUsersPage() {
  const router = useRouter();

  useEffect(() => {
    refreshSession().then((s) => {
      if (!s || s.role !== 'admin') {
        router.replace('/');
      }
    });
  }, [router]);

  return (
    <div className="space-y-8 py-4 max-w-4xl mx-auto">
      <AdminHeader />
      <UserManagement />
    </div>
  );
}
