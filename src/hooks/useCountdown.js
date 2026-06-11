import { useState, useEffect, useMemo } from 'react';
import { PREDICTION_LOCK_HOURS, PREDICTION_OPEN_HOURS } from '../config/app';

/**
 * Convert a Firestore Timestamp, Date, or seconds number to epoch milliseconds.
 * @param {*} time
 * @returns {number|null}
 */
function toEpochMs(time) {
  if (!time) return null;
  // Firestore Timestamp — has .toDate()
  if (typeof time?.toDate === 'function') return time.toDate().getTime();
  // Native Date
  if (time instanceof Date) return time.getTime();
  // Unix seconds (number)
  if (typeof time === 'number') return time > 1e12 ? time : time * 1000;
  // ISO string
  if (typeof time === 'string') {
    const ms = Date.parse(time);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

/**
 * Countdown hook for fixture kickoff times.
 *
 * @param {import('firebase/firestore').Timestamp | Date | number | string} kickoffTime
 * @returns {{
 *   days: number,
 *   hours: number,
 *   minutes: number,
 *   seconds: number,
 *   isClosed: boolean,
 *   totalSeconds: number
 * }}
 */
export function useCountdown(kickoffTime) {
  const kickoffMs = useMemo(() => toEpochMs(kickoffTime), [kickoffTime]);
  const lockMs = useMemo(
    () => (kickoffMs ? kickoffMs - PREDICTION_LOCK_HOURS * 60 * 60 * 1000 : null),
    [kickoffMs]
  );

  const openMs = useMemo(
    () => (kickoffMs ? kickoffMs - PREDICTION_OPEN_HOURS * 60 * 60 * 1000 : null),
    [kickoffMs]
  );

  const computeState = () => {
    if (!lockMs || !openMs) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isClosed: true, isTooEarly: false, totalSeconds: 0 };
    }

    const now = Date.now();
    const diff = lockMs - now; // ms until lock
    const isClosed = diff <= 0;
    const isTooEarly = now < openMs;

    if (isClosed) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isClosed: true, isTooEarly: false, totalSeconds: 0 };
    }

    if (isTooEarly) {
      // Countdown is essentially to the opening time
      const diffToOpen = openMs - now;
      const totalSeconds = Math.floor(diffToOpen / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return { days, hours, minutes, seconds, isClosed: false, isTooEarly: true, totalSeconds };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds, isClosed, isTooEarly: false, totalSeconds };
  };

  const [state, setState] = useState(computeState);

  useEffect(() => {
    // Re-compute immediately when kickoffTime changes
    setState(computeState());

    if (!lockMs) return;

    const interval = setInterval(() => {
      const next = computeState();
      setState(next);

      // Stop ticking once closed
      if (next.isClosed) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kickoffMs, lockMs]);

  return state;
}

export default useCountdown;
