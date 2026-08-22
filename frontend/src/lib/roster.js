/**
 * Device-local record of employees this admin has created.
 *
 * The backend currently exposes no "list employees" endpoint — the auth router
 * only has create/promote/me — so there is no way to render a real server-side
 * directory. Rather than invent numbers, the admin UI keeps a local log of the
 * accounts it created on this device. Everything derived from it is labelled as
 * device-local in the UI so it is never mistaken for a company-wide roster.
 *
 * Temporary passwords are intentionally NOT persisted; they are shown once, in
 * the reveal dialog, and then discarded.
 */

const KEY = 'dayflow-created-employees';
const LIMIT = 50;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, LIMIT)));
  } catch {
    // Storage full or blocked — the roster is a convenience, not a source of truth.
  }
  return entries;
}

export function getRoster() {
  return read().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function addToRoster(entry) {
  const entries = read().filter((e) => e.loginId !== entry.loginId);
  entries.unshift({ ...entry, createdAt: entry.createdAt ?? new Date().toISOString() });
  write(entries);
  return getRoster();
}

export function updateRosterEntry(loginId, patch) {
  const entries = read().map((e) => (e.loginId === loginId ? { ...e, ...patch } : e));
  write(entries);
  return getRoster();
}

export function removeFromRoster(loginId) {
  write(read().filter((e) => e.loginId !== loginId));
  return getRoster();
}

export function clearRoster() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  return [];
}

/** Counts for the admin dashboard tiles. */
export function rosterStats(entries = getRoster()) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    total: entries.length,
    thisMonth: entries.filter((e) => new Date(e.createdAt) >= startOfMonth).length,
    thisWeek: entries.filter((e) => new Date(e.createdAt) >= weekAgo).length,
    admins: entries.filter((e) => e.role === 'admin').length,
    // A registration token is valid for 7 days from creation (see the backend's
    // admin_create_employee), so anything older has certainly expired.
    expired: entries.filter(
      (e) => new Date(e.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000 < now.getTime()
    ).length,
  };
}

/** Days remaining on an employee's 7-day registration window. */
export function tokenDaysLeft(createdAt) {
  const expiry = new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000;
  const days = Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000));
  return days;
}
