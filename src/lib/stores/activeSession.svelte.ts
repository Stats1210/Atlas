import { db, type WorkoutSession, type SessionExercise, type SessionSet, type SetType, type TrainingRole } from '$lib/db';
import { calc } from '$lib/utils/e1rm';
import { nowIso } from '$lib/utils/format';
import { settings } from './settings.svelte';

export interface LiveSet {
  id?: number;
  tempId: string;
  set_number: number;
  set_type: SetType;
  weight_kg: number | null;
  reps_actual: number | null;
  reps_planned: number | null;
  rpe: number | null;
  confirmed: boolean;
  is_pr_weight: boolean;
  is_pr_e1rm: boolean;
  is_pr_reps: boolean;
  logged_at: string | null;
}

export interface LiveExercise {
  tempId: string;
  sessionExerciseId?: number;
  exercise_id: number;
  exercise_name: string;
  exercise_category: string;
  training_role: TrainingRole;
  order: number;
  rest_sec: number;
  notes: string;
  sets: LiveSet[];
  previousSets: { weight_kg: number | null; reps_actual: number | null; rpe: number | null }[];
}

class ActiveSessionStore {
  session    = $state<WorkoutSession | null>(null);
  exercises  = $state<LiveExercise[]>([]);
  restTimer  = $state<{ endsAt: number; exerciseTempId: string } | null>(null);
  showExercisePicker = $state(false);

  get isActive(): boolean { return this.session !== null; }
  get elapsedSec(): number {
    if (!this.session) return 0;
    return Math.floor((Date.now() - new Date(this.session.started_at).getTime()) / 1000);
  }

  // ── Start / Finish ────────────────────────────────────────────────────────

  async start(name = 'Workout') {
    const now = nowIso();
    const id = await db.workoutSessions.add({
      name,
      status: 'in_progress',
      is_completed_as_prescribed: null,
      started_at: now,
      finished_at: null,
      duration_sec: null,
      total_volume_kg: null,
      total_sets: null,
      notes: '',
      source: 'manual',
      created_at: now,
      updated_at: now
    });
    this.session = await db.workoutSessions.get(id) ?? null;
    this.exercises = [];
  }

  async resumeIfInProgress() {
    const existing = await db.workoutSessions
      .where('status').equals('in_progress')
      .first();
    if (!existing || !existing.id) return;
    this.session = existing;
    const dbExercises = await db.sessionExercises
      .where('workout_session_id').equals(existing.id)
      .sortBy('order');
    this.exercises = await Promise.all(dbExercises.map(async (se) => {
      const dbSets = await db.sessionSets
        .where('session_exercise_id').equals(se.id!)
        .sortBy('set_number');
      const prev = await this.loadPreviousSets(se.exercise_id, existing.id!);
      return {
        tempId: crypto.randomUUID(),
        sessionExerciseId: se.id,
        exercise_id: se.exercise_id,
        exercise_name: se.exercise_name,
        exercise_category: se.exercise_category,
        training_role: se.training_role,
        order: se.order,
        rest_sec: se.rest_sec ?? settings.restSec,
        notes: se.notes,
        sets: dbSets.map(s => ({
          id: s.id,
          tempId: crypto.randomUUID(),
          set_number: s.set_number,
          set_type: s.set_type,
          weight_kg: s.weight_kg,
          reps_actual: s.reps_actual,
          reps_planned: s.reps_planned,
          rpe: s.rpe,
          confirmed: true,
          is_pr_weight: s.is_pr_weight,
          is_pr_e1rm: s.is_pr_e1rm,
          is_pr_reps: s.is_pr_reps,
          logged_at: s.logged_at
        })),
        previousSets: prev
      } satisfies LiveExercise;
    }));
  }

  async repeatLastSession() {
    if (!this.session) return;
    const last = await db.workoutSessions
      .where('status').equals('completed')
      .reverse()
      .first();
    if (!last) return;
    const lastExercises = await db.sessionExercises
      .where('workout_session_id').equals(last.id!)
      .sortBy('order');
    for (const le of lastExercises) {
      await this.addExercise(le.exercise_id, le.exercise_name, le.exercise_category, le.training_role);
    }
  }

  async finish(notes = '', isAsPrescibed: boolean | null = null) {
    if (!this.session?.id) return;
    const now = nowIso();
    const durationSec = Math.floor((Date.now() - new Date(this.session.started_at).getTime()) / 1000);
    const allSets = await db.sessionSets
      .where('workout_session_id').equals(this.session.id)
      .toArray();
    const workingSets = allSets.filter(s => s.set_type !== 'warmup' && s.status === 'completed');
    const totalVolume = workingSets.reduce((acc, s) =>
      acc + (s.weight_kg ?? 0) * (s.reps_actual ?? 0), 0);
    await db.workoutSessions.update(this.session.id, {
      status: 'completed',
      finished_at: now,
      duration_sec: durationSec,
      total_volume_kg: Math.round(totalVolume * 10) / 10,
      total_sets: workingSets.length,
      notes,
      is_completed_as_prescribed: isAsPrescibed,
      updated_at: now
    });
    this.session = null;
    this.exercises = [];
    this.restTimer = null;
  }

  async discard() {
    if (!this.session?.id) return;
    await db.workoutSessions.update(this.session.id, { status: 'discarded', updated_at: nowIso() });
    this.session = null;
    this.exercises = [];
    this.restTimer = null;
  }

  // ── Exercises ─────────────────────────────────────────────────────────────

  async addExercise(
    exerciseId: number,
    name: string,
    category: string,
    role: TrainingRole
  ) {
    if (!this.session?.id) return;
    const order = this.exercises.length;
    const prev = await this.loadPreviousSets(exerciseId, this.session.id);
    const seId = await db.sessionExercises.add({
      workout_session_id: this.session.id,
      exercise_id: exerciseId,
      exercise_name: name,
      exercise_category: category,
      training_role: role,
      order,
      superset_group_id: null,
      superset_order: null,
      was_substituted: false,
      planned_sets: null,
      planned_reps_min: null,
      planned_reps_max: null,
      planned_rpe_target: null,
      rest_sec: settings.restSec,
      is_completed_as_prescribed: null,
      notes: '',
      volume_kg: 0
    });
    const liveEx: LiveExercise = {
      tempId: crypto.randomUUID(),
      sessionExerciseId: seId,
      exercise_id: exerciseId,
      exercise_name: name,
      exercise_category: category,
      training_role: role,
      order,
      rest_sec: settings.restSec,
      notes: '',
      sets: [],
      previousSets: prev
    };
    // Pre-fill one empty working set
    this.exercises = [...this.exercises, liveEx];
    await this.addSet(liveEx.tempId, 'working');
  }

  removeExercise(tempId: string) {
    this.exercises = this.exercises.filter(e => e.tempId !== tempId);
  }

  // ── Sets ──────────────────────────────────────────────────────────────────

  async addSet(exTempId: string, type: SetType = 'working') {
    const ex = this.exercises.find(e => e.tempId === exTempId);
    if (!ex) return;

    const workingSets = ex.sets.filter(s => s.set_type !== 'warmup');
    const lastWorking = [...workingSets].reverse().find(s => s.confirmed);
    const lastSet     = [...ex.sets].reverse().find(s => s.confirmed);
    const setNumber   = ex.sets.length + 1;

    let weight: number | null = null;
    let reps: number | null   = null;

    if (type === 'warmup') {
      const ref = lastWorking?.weight_kg ?? ex.previousSets[0]?.weight_kg ?? null;
      weight = ref ? Math.round((ref * 0.5) / 2.5) * 2.5 : 20;
      reps   = 10;
    } else if (type === 'back_off') {
      const ref = lastWorking?.weight_kg ?? ex.previousSets[0]?.weight_kg ?? null;
      weight = ref ? Math.round((ref * 0.9) / 2.5) * 2.5 : null;
      reps   = lastWorking?.reps_actual ?? ex.previousSets[0]?.reps_actual ?? null;
    } else {
      // Default: mirror previous session or last confirmed set
      const prevSet = ex.previousSets[workingSets.length] ?? ex.previousSets[ex.previousSets.length - 1];
      weight = lastSet?.weight_kg ?? prevSet?.weight_kg ?? null;
      reps   = lastSet?.reps_actual ?? prevSet?.reps_actual ?? null;
    }

    const newSet: LiveSet = {
      tempId: crypto.randomUUID(),
      set_number: setNumber,
      set_type: type,
      weight_kg: weight,
      reps_actual: reps,
      reps_planned: reps,
      rpe: null,
      confirmed: false,
      is_pr_weight: false,
      is_pr_e1rm: false,
      is_pr_reps: false,
      logged_at: null
    };

    ex.sets = [...ex.sets, newSet];
    this.exercises = [...this.exercises];
  }

  duplicateLastSet(exTempId: string) {
    const ex = this.exercises.find(e => e.tempId === exTempId);
    if (!ex) return;
    const last = [...ex.sets].reverse().find(s => s.confirmed);
    if (!last) { this.addSet(exTempId); return; }
    const newSet: LiveSet = {
      tempId: crypto.randomUUID(),
      set_number: ex.sets.length + 1,
      set_type: last.set_type,
      weight_kg: last.weight_kg,
      reps_actual: last.reps_actual,
      reps_planned: last.reps_planned,
      rpe: null,
      confirmed: false,
      is_pr_weight: false,
      is_pr_e1rm: false,
      is_pr_reps: false,
      logged_at: null
    };
    ex.sets = [...ex.sets, newSet];
    this.exercises = [...this.exercises];
  }

  updateSet(exTempId: string, setTempId: string, patch: Partial<LiveSet>) {
    const ex = this.exercises.find(e => e.tempId === exTempId);
    if (!ex) return;
    ex.sets = ex.sets.map(s => s.tempId === setTempId ? { ...s, ...patch } : s);
    this.exercises = [...this.exercises];
  }

  async confirmSet(exTempId: string, setTempId: string) {
    const ex = this.exercises.find(e => e.tempId === exTempId);
    if (!ex?.sessionExerciseId || !this.session?.id) return;
    const liveSet = ex.sets.find(s => s.tempId === setTempId);
    if (!liveSet) return;

    const now = nowIso();
    const formula = settings.formula;
    const e1rm = (liveSet.weight_kg && liveSet.reps_actual)
      ? calc(liveSet.weight_kg, liveSet.reps_actual, formula)
      : null;

    const { isPrWeight, isPrReps, isPrE1rm } = await this.checkPRs(
      ex.exercise_id, ex.exercise_name,
      liveSet.weight_kg, liveSet.reps_actual, e1rm,
      this.session.id
    );

    const setId = await db.sessionSets.add({
      session_exercise_id: ex.sessionExerciseId,
      workout_session_id: this.session.id,
      exercise_id: ex.exercise_id,
      exercise_name: ex.exercise_name,
      set_number: liveSet.set_number,
      set_type: liveSet.set_type,
      status: 'completed',
      weight_kg: liveSet.weight_kg,
      reps_planned: liveSet.reps_planned,
      reps_actual: liveSet.reps_actual,
      rpe: liveSet.rpe,
      duration_sec: null,
      e1rm_kg: e1rm,
      is_pr_weight: isPrWeight,
      is_pr_reps: isPrReps,
      is_pr_e1rm: isPrE1rm,
      notes: '',
      logged_at: now
    });

    ex.sets = ex.sets.map(s =>
      s.tempId === setTempId
        ? { ...s, id: setId, confirmed: true, is_pr_weight: isPrWeight, is_pr_reps: isPrReps, is_pr_e1rm: isPrE1rm, logged_at: now }
        : s
    );
    this.exercises = [...this.exercises];

    // Auto-add next set if all sets are confirmed
    const unconfirmed = ex.sets.filter(s => !s.confirmed);
    if (unconfirmed.length === 0) await this.addSet(exTempId, 'working');

    // Start rest timer
    this.startRestTimer(exTempId, ex.rest_sec);
  }

  removeSet(exTempId: string, setTempId: string) {
    const ex = this.exercises.find(e => e.tempId === exTempId);
    if (!ex) return;
    ex.sets = ex.sets.filter(s => s.tempId !== setTempId);
    ex.sets = ex.sets.map((s, i) => ({ ...s, set_number: i + 1 }));
    this.exercises = [...this.exercises];
  }

  // ── PRs ───────────────────────────────────────────────────────────────────

  private async checkPRs(
    exerciseId: number, exerciseName: string,
    weight: number | null, reps: number | null, e1rm: number | null,
    sessionId: number
  ): Promise<{ isPrWeight: boolean; isPrReps: boolean; isPrE1rm: boolean }> {
    const currentPRs = await db.personalRecords
      .where('exercise_id').equals(exerciseId)
      .and(r => r.is_current)
      .toArray();

    const now = nowIso();
    let isPrWeight = false, isPrReps = false, isPrE1rm = false;

    if (weight && reps) {
      // Weight PR
      const weightPR = currentPRs.find(r => r.pr_type === 'weight');
      if (!weightPR || weight > weightPR.value_kg) {
        isPrWeight = true;
        if (weightPR?.id) await db.personalRecords.update(weightPR.id, { is_current: false });
        await db.personalRecords.add({
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          pr_type: 'weight',
          rep_count: null,
          value_kg: weight,
          previous_value_kg: weightPR?.value_kg ?? null,
          session_set_id: 0,
          workout_session_id: sessionId,
          achieved_at: now,
          is_current: true,
          created_at: now
        });
      }

      // Reps-at-weight PR
      const repsPR = currentPRs.find(r => r.pr_type === 'reps_at_weight' && r.rep_count === reps);
      if (!repsPR || weight > repsPR.value_kg) {
        isPrReps = true;
        if (repsPR?.id) await db.personalRecords.update(repsPR.id, { is_current: false });
        await db.personalRecords.add({
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          pr_type: 'reps_at_weight',
          rep_count: reps,
          value_kg: weight,
          previous_value_kg: repsPR?.value_kg ?? null,
          session_set_id: 0,
          workout_session_id: sessionId,
          achieved_at: now,
          is_current: true,
          created_at: now
        });
      }
    }

    // e1RM PR
    if (e1rm) {
      const e1rmPR = currentPRs.find(r => r.pr_type === 'e1rm');
      if (!e1rmPR || e1rm > e1rmPR.value_kg) {
        isPrE1rm = true;
        if (e1rmPR?.id) await db.personalRecords.update(e1rmPR.id, { is_current: false });
        await db.personalRecords.add({
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          pr_type: 'e1rm',
          rep_count: null,
          value_kg: e1rm,
          previous_value_kg: e1rmPR?.value_kg ?? null,
          session_set_id: 0,
          workout_session_id: sessionId,
          achieved_at: now,
          is_current: true,
          created_at: now
        });
      }
    }

    return { isPrWeight, isPrReps, isPrE1rm };
  }

  // ── Previous performance ──────────────────────────────────────────────────

  private async loadPreviousSets(
    exerciseId: number,
    currentSessionId: number
  ): Promise<{ weight_kg: number | null; reps_actual: number | null; rpe: number | null }[]> {
    const recentSets = await db.sessionSets
      .where('exercise_id').equals(exerciseId)
      .reverse()
      .toArray();
    const prev = recentSets.find(s => s.workout_session_id !== currentSessionId);
    if (!prev) return [];
    const sessionSets = recentSets
      .filter(s => s.workout_session_id === prev.workout_session_id)
      .sort((a, b) => a.set_number - b.set_number);
    return sessionSets.map(s => ({
      weight_kg: s.weight_kg,
      reps_actual: s.reps_actual,
      rpe: s.rpe
    }));
  }

  // ── Rest timer ────────────────────────────────────────────────────────────

  startRestTimer(exTempId: string, durationSec: number) {
    this.restTimer = {
      endsAt: Date.now() + durationSec * 1000,
      exerciseTempId: exTempId
    };
  }

  addRestTime(sec: number) {
    if (this.restTimer) {
      this.restTimer = { ...this.restTimer, endsAt: this.restTimer.endsAt + sec * 1000 };
    }
  }

  dismissRestTimer() {
    this.restTimer = null;
  }
}

export const activeSession = new ActiveSessionStore();
