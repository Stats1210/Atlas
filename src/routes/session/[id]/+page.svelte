<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { db, type WorkoutSession, type SessionExercise, type SessionSet } from '$lib/db';
  import { fmtDate, fmtDuration, fmtWeight, fmtVolume } from '$lib/utils/format';
  import { settings } from '$lib/stores/settings.svelte';

  const sessionId = $derived(parseInt($page.params.id));

  let session   = $state<WorkoutSession | null>(null);
  let exercises = $state<(SessionExercise & { sets: SessionSet[] })[]>([]);

  $effect(() => {
    if (isNaN(sessionId)) return;
    loadSession(sessionId);
  });

  async function loadSession(id: number) {
    session = await db.workoutSessions.get(id) ?? null;
    if (!session) return;
    const exs = await db.sessionExercises.where('workout_session_id').equals(id).sortBy('order');
    exercises = await Promise.all(exs.map(async ex => ({
      ...ex,
      sets: await db.sessionSets.where('session_exercise_id').equals(ex.id!).sortBy('set_number')
    })));
  }

  const roleBadge: Record<string, string> = {
    main: 'badge-main', secondary: 'badge-secondary',
    accessory: 'badge-accessory', rehab_support: 'badge-rehab', warmup: 'badge-warmup'
  };

  const sessionPRs = $derived(
    exercises.flatMap(ex => ex.sets.filter(s => s.is_pr_weight || s.is_pr_e1rm))
  );
</script>

<div class="px-4 pt-6 pb-8">
  <!-- Back -->
  <button onclick={() => goto('/history')} class="flex items-center gap-1 mb-4" style="color: var(--color-tertiary);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
    <span class="text-body-sm">History</span>
  </button>

  {#if !session}
    <div class="text-body-md" style="color: var(--color-tertiary);">Loading...</div>
  {:else}
    <!-- Title -->
    <h1 class="text-display-sm mb-1" style="color: var(--color-primary);">{session.name}</h1>
    <div class="text-body-sm mb-4" style="color: var(--color-tertiary);">{fmtDate(session.started_at)}</div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      {#each [
        { label: 'Volume', value: fmtVolume(session.total_volume_kg) },
        { label: 'Duration', value: fmtDuration(session.duration_sec) },
        { label: 'Sets', value: String(session.total_sets ?? '—') }
      ] as stat}
        <div class="card-inner text-center">
          <div class="text-data-sm tabular" style="color: var(--color-primary);">{stat.value}</div>
          <div class="text-label-sm mt-1" style="color: var(--color-tertiary);">{stat.label}</div>
        </div>
      {/each}
    </div>

    <!-- PRs -->
    {#if sessionPRs.length > 0}
      <div class="mb-6 px-4 py-3 rounded-xl surface-accent">
        <div class="text-label-sm mb-2" style="color: var(--color-accent);">PERSONAL RECORDS</div>
        {#each sessionPRs as s}
          <div class="text-body-sm" style="color: var(--color-accent);">
            ★ {s.exercise_name} — {fmtWeight(s.weight_kg, settings.unit)} {settings.unit} × {s.reps_actual}
            {#if s.e1rm_kg}<span style="color: var(--color-tertiary);"> · e1RM {fmtWeight(s.e1rm_kg, settings.unit)}</span>{/if}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Exercise list -->
    {#each exercises as ex}
      <div class="card mb-3" style="padding: 0; overflow: hidden;">
        <div class="flex items-center gap-2 px-4 py-3" style="border-bottom: 1px solid var(--color-border-subtle);">
          <span class="text-body-md font-semibold" style="color: var(--color-primary);">{ex.exercise_name}</span>
          <span class="badge {roleBadge[ex.training_role] ?? 'badge-accessory'}">{ex.training_role.replace('_',' ')}</span>
        </div>

        <!-- Set table header -->
        <div class="flex gap-2 px-4 py-2" style="border-bottom: 1px solid var(--color-border-subtle);">
          <span class="w-8 text-label-sm" style="color: var(--color-disabled);">SET</span>
          <span class="flex-1 text-label-sm" style="color: var(--color-disabled);">WEIGHT</span>
          <span class="w-12 text-label-sm text-center" style="color: var(--color-disabled);">REPS</span>
          <span class="w-16 text-label-sm text-right" style="color: var(--color-disabled);">RPE</span>
        </div>

        {#each ex.sets as s}
          <div
            class="flex gap-2 items-center px-4"
            style="min-height: 44px; border-bottom: 1px solid var(--color-border-subtle); opacity: {s.set_type === 'warmup' ? 0.6 : 1};"
          >
            <span class="w-8 text-data-xs tabular" style="color: var(--color-tertiary);">
              {s.set_type === 'warmup' ? 'W' : s.set_number}
            </span>
            <span class="flex-1 text-data-sm tabular" style="color: var(--color-primary);">
              {fmtWeight(s.weight_kg, settings.unit)} {settings.unit}
              {#if s.is_pr_weight || s.is_pr_e1rm}<span class="badge-pr ml-1">★</span>{/if}
            </span>
            <span class="w-12 text-center text-data-sm tabular" style="color: var(--color-secondary);">
              {s.reps_actual ?? '—'}
            </span>
            <span class="w-16 text-right text-caption" style="color: var(--color-tertiary);">
              {s.rpe ? `RPE ${s.rpe}` : '—'}
            </span>
          </div>
        {/each}

        <!-- Volume footer -->
        <div class="px-4 py-2 flex justify-between">
          <span class="text-caption" style="color: var(--color-tertiary);">Volume</span>
          <span class="text-caption tabular" style="color: var(--color-secondary);">{fmtVolume(ex.volume_kg)}</span>
        </div>
      </div>
    {/each}

    {#if session.notes}
      <div class="card mt-4">
        <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">NOTES</div>
        <p class="text-body-md" style="color: var(--color-secondary);">{session.notes}</p>
      </div>
    {/if}
  {/if}
</div>
