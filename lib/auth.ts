import { AdminUser, UserRole } from './types';
import { ADMIN_ACCOUNTS } from './mockData';

export const ADMIN_CREDENTIALS = [
  {
    email: 'jerrychu@soop.live',
    password: 'jerry1234!',
    user: ADMIN_ACCOUNTS[0],
  },
  {
    email: 'producer@jerrychu.com',
    password: 'admin1234!',
    user: ADMIN_ACCOUNTS[1],
  },
];

const AUTH_KEY = 'jerry_admin_session';

export function authenticateAdmin(email: string, password: string): AdminUser | null {
  const match = ADMIN_CREDENTIALS.find(
    (cred) => cred.email.trim().toLowerCase() === email.trim().toLowerCase() && cred.password === password
  );
  return match ? match.user : null;
}

export function getCurrentUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user: AdminUser | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    localStorage.removeItem(AUTH_KEY);
  } else {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  }
}

export function isAdminUser(user: AdminUser | null): boolean {
  if (!user) return false;
  return user.role === 'streamer' || user.role === 'producer';
}
