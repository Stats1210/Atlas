import Dexie, { type Table } from 'dexie';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TrainingRole = 'main' | 'secondary' | 'accessory' | 'rehab_support' | 'warmup';
export type SetType = 'warmup' | 'working' | 'top_set' | 'back_off' | 'drop_set' | 'amrap';
export type SetStatus = 'completed' | 'failed' | 'skipped';
export type SessionStatus = 'in_progress' | 'completed' | 'partial' | 'discarded';
export type LoadType = 'fixed_kg' | 'pct_1rm' | 'rpe_target' | 'rep_range' | 'bodyweight';
export type CardioType = 'zone2' | 'threshold' | 'vo2max' | 'hiit' | 'recovery' | 'other';
export type CardioModality = 'run' | 'row' | 'bike' | 'air_bike' | 'ski_erg' | 'swim' | 'walk' | 'elliptical' | 'other';
export type DataSource = 'manual' | 'garmin_import' | 'apple_health' | 'csv_import';

export interface Exercise {
  id?: number;
  name: string;
  slug: string;
  category: string;
  training_role: TrainingRole;
  movement_pattern: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string[];
  is_bilateral: boolean;
  is_bodyweight: boolean;
  default_bar_weight_kg: number;
  default_increment_kg: number;
  is_system: boolean;
  is_active: boolean;
  notes: string;
  created_at: string;
}

export interface WorkoutSession {
  id?: number;
  name: string;
  status: SessionStatus;
  is_completed_as_prescribed: boolean | null;
  started_at: string;
  finished_at: string | null;
  duration_sec: number | null;
  total_volume_kg: number | null;
  total_sets: number | null;
  notes: string;
  source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface SessionExercise {
  id?: number;
  workout_session_id: number;
  exercise_id: number;
  exercise_name: string;
  exercise_category: string;
  training_role: TrainingRole;
  order: number;
  superset_group_id: string | null;
  superset_order: number | null;
  was_substituted: boolean;
  planned_sets: number | null;
  planned_reps_min: number | null;
  planned_reps_max: number | null;
  planned_rpe_target: number | null;
  rest_sec: number | null;
  is_completed_as_prescribed: boolean | null;
  notes: string;
  volume_kg: number;
}

export interface SessionSet {
  id?: number;
  session_exercise_id: number;
  workout_session_id: number;
  exercise_id: number;
  exercise_name: string;
  set_number: number;
  set_type: SetType;
  status: SetStatus;
  weight_kg: number | null;
  reps_planned: number | null;
  reps_actual: number | null;
  rpe: number | null;
  duration_sec: number | null;
  e1rm_kg: number | null;
  is_pr_weight: boolean;
  is_pr_reps: boolean;
  is_pr_e1rm: boolean;
  notes: string;
  logged_at: string;
}

export interface PersonalRecord {
  id?: number;
  exercise_id: number;
  exercise_name: string;
  pr_type: 'weight' | 'reps_at_weight' | 'e1rm';
  rep_count: number | null;
  value_kg: number;
  previous_value_kg: number | null;
  session_set_id: number;
  workout_session_id: number;
  achieved_at: string;
  is_current: boolean;
  created_at: string;
}

export interface CardioSession {
  id?: number;
  session_type: CardioType;
  modality: CardioModality;
  status: 'completed' | 'partial';
  is_completed_as_prescribed: boolean | null;
  started_at: string;
  finished_at: string | null;
  duration_sec: number;
  distance_km: number | null;
  avg_hr_bpm: number | null;
  max_hr_bpm: number | null;
  avg_pace_sec_per_km: number | null;
  avg_power_watts: number | null;
  calories_kcal: number | null;
  z1_sec: number | null;
  z2_sec: number | null;
  z3_sec: number | null;
  z4_sec: number | null;
  z5_sec: number | null;
  rpe: number | null;
  notes: string;
  source: DataSource;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardioInterval {
  id?: number;
  cardio_session_id: number;
  rounds: number;
  work_duration_sec: number;
  rest_duration_sec: number;
  work_zone: number | null;
  rest_zone: number | null;
  rpe: number | null;
  notes: string;
}

export interface AppSettings {
  id?: number;
  unit_weight: 'kg' | 'lbs';
  unit_distance: 'km' | 'mi';
  default_bar_weight_kg: number;
  default_increment_kg: number;
  e1rm_formula: 'epley' | 'brzycki';
  hr_max_bpm: number | null;
  hr_resting_bpm: number | null;
  default_rest_sec: number;
  rpe_enabled: boolean;
  theme: 'dark' | 'light' | 'system';
  onboarding_complete: boolean;
}

// ─── Database ─────────────────────────────────────────────────────────────────

class AtlasDB extends Dexie {
  exercises!: Table<Exercise>;
  workoutSessions!: Table<WorkoutSession>;
  sessionExercises!: Table<SessionExercise>;
  sessionSets!: Table<SessionSet>;
  personalRecords!: Table<PersonalRecord>;
  cardioSessions!: Table<CardioSession>;
  cardioIntervals!: Table<CardioInterval>;
  settings!: Table<AppSettings>;

  constructor() {
    super('AtlasDB');

    this.version(1).stores({
      exercises:       '++id, name, category, training_role, is_system, is_active, slug',
      workoutSessions: '++id, status, started_at',
      sessionExercises:'++id, workout_session_id, exercise_id, order',
      sessionSets:     '++id, session_exercise_id, workout_session_id, exercise_id, logged_at',
      personalRecords: '++id, exercise_id, pr_type, rep_count, is_current, workout_session_id',
      cardioSessions:  '++id, session_type, modality, started_at, source',
      cardioIntervals: '++id, cardio_session_id',
      settings:        '++id'
    });
  }
}

export const db = new AtlasDB();

// ─── Initialise ───────────────────────────────────────────────────────────────

export async function initDB(): Promise<void> {
  const count = await db.exercises.count();
  if (count === 0) {
    const { seedExercises } = await import('./seed');
    await db.exercises.bulkAdd(seedExercises);
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      unit_weight: 'kg',
      unit_distance: 'km',
      default_bar_weight_kg: 20,
      default_increment_kg: 2.5,
      e1rm_formula: 'epley',
      hr_max_bpm: null,
      hr_resting_bpm: null,
      default_rest_sec: 180,
      rpe_enabled: true,
      theme: 'dark',
      onboarding_complete: false
    });
  }
}

export async function getSettings(): Promise<AppSettings> {
  const s = await db.settings.toCollection().first();
  if (!s) throw new Error('Settings not initialised');
  return s;
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const s = await db.settings.toCollection().first();
  if (s?.id) await db.settings.update(s.id, patch);
}
