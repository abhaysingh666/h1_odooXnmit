export function formatTime(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

export function hoursBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  const mins = (outH * 60 + outM) - (inH * 60 + inM);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/**
 * Generates a Login ID in the format:
 * [Company Prefix][First two letters of first+last name][Year of joining][Serial number]
 * Example: OIJODO20220001
 */
export function formatINR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '₹0';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function generateLoginId({ companyPrefix = 'OI', firstName = '', lastName = '', year, serial = 1 }) {
  const nameCode = `${(firstName || '').slice(0, 2)}${(lastName || '').slice(0, 2)}`.toUpperCase();
  const y = year || new Date().getFullYear();
  const serialCode = String(serial).padStart(4, '0');
  return `${companyPrefix}${nameCode}${y}${serialCode}`;
}
