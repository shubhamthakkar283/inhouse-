// Utility functions for time normalization and timeline operations

function isBlank(v) {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function parseHHmmToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return null;
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return clamp(h, 0, 23) * 60 + clamp(m, 0, 59);
}

function minutesToHHmm(total) {
  // allow negatives by wrapping around 24h
  let mins = Math.round(total);
  mins = ((mins % 1440) + 1440) % 1440; // wrap to [0, 1439]
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function normalizeTime(raw, fallback = '09:00') {
  if (isBlank(raw)) return fallback;
  let s = String(raw).trim();

  // Handle compact numeric times like "900" or "0930"
  if (/^\d{3,4}$/.test(s)) {
    const padded = s.padStart(4, '0');
    const h = Number(padded.slice(0, 2));
    const m = Number(padded.slice(2));
    return minutesToHHmm((isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m));
  }

  // 12-hour format with optional minutes: 9 AM, 9:30 pm
  const twelve = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (twelve) {
    let h = Number(twelve[1]);
    const m = Number(twelve[2] || '0');
    const period = twelve[3].toLowerCase();
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return minutesToHHmm(h * 60 + m);
  }

  // 24-hour format HH:mm (allow single-digit hour)
  const twentyFour = s.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const h = clamp(Number(twentyFour[1]), 0, 23);
    const m = clamp(Number(twentyFour[2]), 0, 59);
    return minutesToHHmm(h * 60 + m);
  }

  // Try to strip stray AM/PM like "09:00 AM"
  const stray = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (stray) {
    let h = Number(stray[1]);
    const m = Number(stray[2]);
    const period = stray[3].toLowerCase();
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return minutesToHHmm(h * 60 + m);
  }

  // Fallback
  return fallback;
}

function parseDuration(input, defaultMinutes = 60) {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.max(0, Math.round(input));
  }
  if (isBlank(input)) return defaultMinutes;
  const s = String(input).trim().toLowerCase();

  // Formats: "90", "90m", "1h", "1h 30m", "1 hour 30 minutes", "1.5h"
  const numOnly = s.match(/^(\d+)$/);
  if (numOnly) return Math.max(0, parseInt(numOnly[1], 10));

  const hoursFloat = s.match(/^(\d+(?:\.\d+)?)\s*h/);
  const mins = s.match(/(\d+)\s*m/);

  let total = 0;
  if (hoursFloat) total += Math.round(parseFloat(hoursFloat[1]) * 60);
  if (mins) total += parseInt(mins[1], 10);

  if (total > 0) return total;

  // Handle "HH:MM" as duration (rare): treat as H hours M minutes
  const hhmm = s.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const h = parseInt(hhmm[1], 10);
    const m = parseInt(hhmm[2], 10);
    return Math.max(0, h * 60 + m);
  }

  return defaultMinutes;
}

function shiftTimelineToStart(timeline, targetStart) {
  if (!Array.isArray(timeline) || timeline.length === 0) return [];
  const start = normalizeTime(targetStart);
  const first = normalizeTime(timeline[0]?.time || timeline[0]?.startTime || '09:00');

  const startMin = parseHHmmToMinutes(start);
  const firstMin = parseHHmmToMinutes(first);
  if (startMin === null || firstMin === null) return timeline.map((it) => ({
    ...it,
    time: normalizeTime(it.time || it.startTime || '09:00'),
    duration: parseDuration(it.duration)
  }));

  const diff = startMin - firstMin;
  return timeline.map((it) => {
    const normTime = normalizeTime(it.time || it.startTime || '09:00');
    const mins = parseHHmmToMinutes(normTime);
    const shifted = minutesToHHmm(mins + diff);
    return {
      ...it,
      time: shifted,
      duration: parseDuration(it.duration)
    };
  });
}

module.exports = {
  normalizeTime,
  parseDuration,
  minutesToHHmm,
  parseHHmmToMinutes,
  shiftTimelineToStart,
};
