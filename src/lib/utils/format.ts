export function fmtWeight(kg: number | null, unit: 'kg' | 'lbs' = 'kg'): string {
  if (kg === null || kg === undefined) return '—';
  const val = unit === 'lbs' ? kg * 2.20462 : kg;
  return Number.isInteger(val) ? `${val}` : val.toFixed(1);
}

export function fmtWeightUnit(unit: 'kg' | 'lbs'): string {
  return unit;
}

export function fmtDuration(sec: number | null): string {
  if (sec === null || sec === undefined) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0 && s === 0) return `${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function fmtDurationShort(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDistance(km: number | null, unit: 'km' | 'mi' = 'km'): string {
  if (km === null || km === undefined) return '—';
  const val = unit === 'mi' ? km * 0.621371 : km;
  return val.toFixed(2);
}

export function fmtPace(secPerKm: number | null, unit: 'km' | 'mi' = 'km'): string {
  if (!secPerKm) return '—';
  const adjusted = unit === 'mi' ? secPerKm / 0.621371 : secPerKm;
  const m = Math.floor(adjusted / 60);
  const s = Math.round(adjusted % 60);
  return `${m}:${String(s).padStart(2, '0')} /${unit === 'mi' ? 'mi' : 'km'}`;
}

export function elapsedSec(startIso: string): number {
  return Math.floor((Date.now() - new Date(startIso).getTime()) / 1000);
}

export function fmtVolume(kg: number | null): string {
  if (kg === null || kg === undefined) return '—';
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)} kg`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}
