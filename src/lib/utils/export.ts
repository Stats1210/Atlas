import { db } from '$lib/db';

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const v = row[h];
        if (v === null || v === undefined) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(',')
    )
  ];
  return lines.join('\n');
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportCsv(fromDate?: string, toDate?: string) {
  const dateStr = new Date().toISOString().slice(0, 10);

  let sessionsQ = db.workoutSessions.toCollection();
  if (fromDate) sessionsQ = db.workoutSessions.where('started_at').aboveOrEqual(fromDate);

  const sessions = await sessionsQ.toArray();
  const filteredSessions = toDate
    ? sessions.filter(s => s.started_at <= toDate + 'T23:59:59')
    : sessions;

  const sessionIds = filteredSessions.map(s => s.id!);

  const [sets, exercises, cardio] = await Promise.all([
    db.sessionSets.where('workout_session_id').anyOf(sessionIds).toArray(),
    db.exercises.toArray(),
    db.cardioSessions.toArray()
  ]);

  const filteredCardio = toDate
    ? cardio.filter(c => c.started_at >= (fromDate ?? '') && c.started_at <= toDate + 'T23:59:59')
    : cardio;

  const setsFlat = sets.map(s => ({ ...s, primary_muscles: undefined, secondary_muscles: undefined }));

  const files: { name: string; content: string }[] = [
    { name: 'workout_sessions.csv', content: toCsv(filteredSessions as unknown as Record<string, unknown>[]) },
    { name: 'session_sets.csv',     content: toCsv(setsFlat as unknown as Record<string, unknown>[]) },
    { name: 'cardio_sessions.csv',  content: toCsv(filteredCardio as unknown as Record<string, unknown>[]) },
    { name: 'exercises.csv',        content: toCsv(exercises.map(e => ({
        ...e,
        primary_muscles:   e.primary_muscles.join('|'),
        secondary_muscles: e.secondary_muscles.join('|'),
        equipment:         e.equipment.join('|')
      })) as unknown as Record<string, unknown>[]
    )}
  ];

  // For multiple files, we zip them or download one by one
  // In prototype 1 we download individually
  for (const f of files) {
    if (f.content) {
      download(f.content, `atlas_${f.name.replace('.csv', '')}_${dateStr}.csv`, 'text/csv');
      await new Promise(r => setTimeout(r, 100));
    }
  }
}

export async function exportJson(fromDate?: string, toDate?: string) {
  const dateStr = new Date().toISOString().slice(0, 10);

  const [sessions, sets, exercises, cardio, prs] = await Promise.all([
    db.workoutSessions.toArray(),
    db.sessionSets.toArray(),
    db.exercises.toArray(),
    db.cardioSessions.toArray(),
    db.personalRecords.toArray()
  ]);

  const filter = (items: { started_at: string }[]) =>
    items.filter(i =>
      (!fromDate || i.started_at >= fromDate) &&
      (!toDate   || i.started_at <= toDate + 'T23:59:59')
    );

  const payload = {
    meta: {
      exported_at: new Date().toISOString(),
      schema_version: '1',
      app: 'Atlas'
    },
    exercises,
    workout_sessions: filter(sessions as { started_at: string }[]),
    session_sets: sets,
    cardio_sessions: filter(cardio as { started_at: string }[]),
    personal_records: prs
  };

  download(JSON.stringify(payload, null, 2), `atlas_export_${dateStr}.json`, 'application/json');
}
