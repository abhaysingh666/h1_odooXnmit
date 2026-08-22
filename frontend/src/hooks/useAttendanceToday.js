import { useCallback, useEffect, useRef, useState } from 'react';

import { attendanceAPI } from '@/services/api';
import { errorMessage } from '@/lib/utils';

/**
 * Shared state for `GET /api/attendance/today` — the check-in widget, the
 * employee dashboard and the attendance page all read the same shape.
 *
 * The `anchor` ref is what makes the live timer trustworthy: instead of
 * counting up from the server's `check_in` timestamp (which would drift by the
 * difference between the two clocks), we remember how many work minutes the
 * server reported and when that answer arrived locally, then add wall-clock
 * time since. Breaks are already deducted by the API, so they stay deducted.
 */
export function useAttendanceToday({ enabled = true } = {}) {
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const anchor = useRef({ at: 0, minutes: 0 });
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const absorb = useCallback((data) => {
    anchor.current = { at: Date.now(), minutes: Number(data?.work_minutes ?? 0) };
    if (alive.current) setToday(data);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await attendanceAPI.today();
      absorb(data);
      if (alive.current) setError('');
      return data;
    } catch (err) {
      if (alive.current) setError(errorMessage(err, 'Could not load today’s attendance.'));
      return null;
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [absorb]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    refresh();
  }, [enabled, refresh]);

  const act = useCallback(
    async (request) => {
      if (alive.current) {
        setBusy(true);
        setError('');
      }
      try {
        const { data } = await request();
        absorb(data);
        return data;
      } catch (err) {
        const message = errorMessage(err, 'Could not update your attendance.');
        if (alive.current) setError(message);
        throw err;
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    [absorb]
  );

  const checkIn = useCallback((note) => act(() => attendanceAPI.checkIn(note ? { note } : {})), [act]);
  const checkOut = useCallback((note) => act(() => attendanceAPI.checkOut(note ? { note } : {})), [act]);

  return { today, loading, error, busy, refresh, checkIn, checkOut, anchor };
}

/**
 * Seconds worked so far, recomputed once a second while the clock is running.
 * Returns the frozen server total once the employee has checked out.
 */
export function useLiveSeconds(anchor, running) {
  const [seconds, setSeconds] = useState(() => Math.round((anchor?.current?.minutes ?? 0) * 60));

  useEffect(() => {
    const read = () => {
      const { at, minutes } = anchor?.current ?? { at: 0, minutes: 0 };
      const drift = running && at ? (Date.now() - at) / 1000 : 0;
      setSeconds(Math.max(0, Math.round(minutes * 60 + drift)));
    };

    read();
    if (!running) return undefined;

    const id = setInterval(read, 1000);
    return () => clearInterval(id);
  }, [anchor, running]);

  return seconds;
}

/** 07:12:45 — the running day timer. */
export function formatStopwatch(totalSeconds) {
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
