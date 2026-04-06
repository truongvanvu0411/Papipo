import type {
  AdminDashboardOverview,
  AdminUserActivity,
  AdminUserDetail,
  AdminUserListItem,
  AuthResponse
} from '@papipo/contracts';
import { requireAdminToken } from './session';

const DEFAULT_BASE_URL = 'http://localhost:4000';

function getBaseUrl() {
  return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await requireAdminToken();
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function loginAdmin(email: string, password: string) {
  const response = await fetch(`${getBaseUrl()}/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password }),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Invalid admin credentials');
  }

  return response.json() as Promise<AuthResponse>;
}

export async function getAdminOverview(): Promise<AdminDashboardOverview | null> {
  try {
    return await apiFetch<AdminDashboardOverview>('/admin/dashboard/overview');
  } catch {
    return null;
  }
}

export async function getAdminUsers(query: Record<string, string | undefined> = {}): Promise<AdminUserListItem[]> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value && value.trim() !== '') {
      params.set(key, value);
    }
  });

  const suffix = params.toString() ? `?${params.toString()}` : '';

  try {
    return await apiFetch<AdminUserListItem[]>(`/admin/users${suffix}`);
  } catch {
    return [];
  }
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  try {
    return await apiFetch<AdminUserDetail>(`/admin/users/${userId}`);
  } catch {
    return null;
  }
}

export async function getAdminUserActivity(userId: string): Promise<AdminUserActivity | null> {
  try {
    return await apiFetch<AdminUserActivity>(`/admin/users/${userId}/activity`);
  } catch {
    return null;
  }
}

export async function updateAdminUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
  return apiFetch<{ id: string; status: 'ACTIVE' | 'SUSPENDED' }>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}
