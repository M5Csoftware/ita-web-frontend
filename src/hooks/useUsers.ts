'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UserAccount } from '@/types/iata';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

export function useUsers() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/users`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
      const data = await res.json();
      // Backend returns { success, count, users: [{ id, username, fullName, role, ... }] }
      setUsers(
        (data.users ?? []).map((u: any) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          role: u.role,
          email: u.email ?? '',
          stationCode: u.stationCode ?? '',
          isActive: u.isActive !== false,
          permissions: u.permissions ?? [],
        }))
      );
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- Mutations (only master admin will ever call these) ----

  const updatePermissions = useCallback(async (userId: string, permissions: string[]) => {
    const res = await fetch(`${API}/api/users/${userId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ permissions }),
    });
    if (!res.ok) throw new Error('Failed to update permissions');
    await refresh();
  }, [refresh]);

  const updateRole = useCallback(async (userId: string, role: 'admin' | 'user') => {
    const res = await fetch(`${API}/api/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
    await refresh();
  }, [refresh]);

  const toggleStatus = useCallback(async (userId: string) => {
    const res = await fetch(`${API}/api/users/${userId}/status`, {
      method: 'PATCH',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to toggle status');
    await refresh();
  }, [refresh]);

  const deleteUser = useCallback(async (userId: string) => {
    const res = await fetch(`${API}/api/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete user');
    await refresh();
  }, [refresh]);

  const createUser = useCallback(async (payload: {
    username: string;
    password: string;
    fullName: string;
    role: 'admin' | 'user';
    email?: string;
    stationCode?: string;
    permissions: string[];
  }) => {
    const res = await fetch(`${API}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.message ?? 'Failed to create user');
    }
    await refresh();
  }, [refresh]);

  return {
    users, loading, error, refresh,
    updatePermissions, updateRole, toggleStatus, deleteUser, createUser,
  };
}