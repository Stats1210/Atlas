<script lang="ts">
  import { db, type Exercise, type SessionSet, type PersonalRecord } from '$lib/db';
  import { fmtWeight, fmtDateShort } from '$lib/utils/format';
  import { settings } from '$lib/stores/settings.svelte';

  let exercises      = $state<Exercise[]>([]);
  let selectedEx     = $state<Exercise | null>(null);
  let sets           = $state<SessionSet[]>([]);
  let prs            = $state<PersonalRecord[]>([]);
  let searchQuery    = $state('');
  let showSearch     = $state(false);
  let dateRange      = $state<'3m' | '6m' | '1y' | 'all'>('6m');

  // Load exercises that have been trained
  $effect(() => {
    db.sessionSets.orderBy('exercise_id').uniqueKeys().then(async ids => {
      const exs = await Promise.all((ids as number[]).map(id => db.exercises.get(id)));
      exercises = exs.filter(Boolean) as Exercise[];
      if (exercises.length > 0 && !selectedEx) {
        // Default: most recently trained
        const lastSet = await db.sessionSets.orderBy('logged_at').reverse().first();
        const lastEx  = lastSet ? exercises.find(e => e.id === lastSet.exercise_id) : null;
        selectedEx = lastEx ?? exercises[0];
      }
    });
  });

  // Load sets + PRs when exercise changes
  $effect(() => {
    if (!selectedEx?.id) return;
    const cutoff = dateRangeCutoff(dateRange);
    db.sessionSets
      .where('exercise_id').equals(selectedEx.id)
      .filter(s => !cutoff || s.logged_at >= cutoff)
      .sortBy('logged_at')
      .then(s => { sets = s; });
    db.personalRecords
      .where('exercise_id').equals(selectedEx.id)
      .sortBy('achieved_at')
      .then(p => { prs = p.reverse(); });
  });

  function dateRangeCutoff(range: string): string | null {
    const now = new Date();
    if (range === '3m') { now.setMonth(now.getMonth() - 3); return now.toISOString(); }
    if (range === '6m') { now.setMonth(now.getMonth() - 6); return now.toISOString(); }
    if (range === '1y') { now.setFullYear(now.getFullYear() - 1); return now.toISOString(); }
    return null;
  }

  // Build e1RM trend data (one point per session)
  const e1rmTrend = $derived(() => {
    const bySession: Record<number, { date: string; e1rm: number }> = {};
    for (const s of sets) {
      if (s.e1rm_kg && s.set_type !== 'warmup' && s.workout_session_id) {
        if (!bySession[s.workout_session_id] || s.e1rm_kg > bySession[s.workout_session_id].e1rm) {
          bySession[s.workout_session_id] = { date: s.logged_at.slice(0, 10), e1rm: s.e1rm_kg };
        }
      }
    }
    return Object.values(bySession).sort((a, b) => a.date.localeCompare(b.date));
  });

  // Spark chart: map e1rm data to SVG path
  const chartPath = $derived(() => {
    const data = e1rmTrend();
    if (data.length < 2) return '';
    const W = 300, H = 80;
    const vals = data.map(d => d.e1rm);
    const min  = Math.min(...vals);
    const max  = Math.max(...vals);
    const range = max - min || 1;
    const points = data.map((d, i) => ({
      x: (i / (data.length - 1)) * W,
      y: H - ((d.e1rm - min) / range) * H
    }));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  });

  // Current e1RM and delta
  const currentE1rm = $derived(e1rmTrend().at(-1)?.e1rm ?? null);
  const firstE1rm   = $derived(e1rmTrend().at(0)?.e1rm ?? null);
  const delta       = $derived(currentE1rm && firstE1rm ? currentE1rm - firstE1rm : null);

  // Last 5 sessions summary
  const last5 = $derived(() => {
    const bySession: Record<number, SessionSet[]> = {};
    for (const s of sets) {
      if (!bySession[s.workout_session_id]) bySession[s.workout_session_id] = [];
      bySession[s.workout_session_id].push(s);
    }
    return Object.entries(bySession)
      .sort((a, b) => (bySession[+b][0].logged_at ?? '').localeCompare(bySession[+a][0].logged_at ?? ''))
      .slice(0, 5)
      .map(([, s]) => {
        const working = s.filter(x => x.set_type !== 'warmup' && x.reps_actual);
        const maxW    = Math.max(...working.map(x => x.weight_kg ?? 0));
        const date    = fmtDateShort(s[0].logged_at);
        const reps    = working.map(x => x.reps_actual).filter(Boolean).join('/');
        return { date, sets: working.length, maxWeight: maxW, reps };
      });
  });

  // Rep PRs table: 1RM, 3RM, 5RM, 8RM, 10RM
  const repPRs = $derived(
    [1, 3, 5, 8, 10].map(reps => ({
      reps,
      pr: prs.find(p => p.pr_type === 'reps_at_weight' && p.rep_count === reps && p.is_current)
    })).filter(p => p.pr)
  );

  const filtered = $derived(
    exercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
</script>

<div class="px-4 pt-6 pb-8">
  <h1 class="text-display-md mb-4" style="color: var(--color-primary);">Analytics</h1>

  {#if exercises.length === 0}
    <div class="text-center py-16">
      <div class="text-body-md" style="color: var(--color-tertiary);">No training data yet</div>
      <div class="text-body-sm mt-2" style="color: var(--color-disabled);">Log your first session to see analytics</div>
    </div>
  {:else}
    <!-- Exercise selector -->
    <button
      onclick={() => showSearch = !showSearch}
      class="w-full flex items-center justify-between px-4 py-3 mb-4 rounded-xl"
      style="background: var(--color-raised); border: 1px solid var(--color-border);"
    >
      <span class="text-body-md font-semibold" style="color: var(--color-primary);">
        {selectedEx?.name ?? 'Select exercise'}
      </span>
      <span style="color: var(--color-tertiary);">▾</span>
    </button>

    <!-- Exercise search dropdown -->
    {#if showSearch}
      <div class="mb-4 rounded-xl overflow-hidden" style="background: var(--color-raised); border: 1px solid var(--color-border);">
        <input
          bind:value={searchQuery}
          placeholder="Search..."
          class="w-full px-4 py-3 text-body-md"
          style="background: var(--color-elevated); border-bottom: 1px solid var(--color-border); color: var(--color-primary); outline: none;"
          autofocus
        />
        {#each filtered.slice(0, 12) as ex (ex.id)}
          <button
            onclick={() => { selectedEx = ex; showSearch = false; searchQuery = ''; }}
            class="w-full text-left px-4 py-3 text-body-sm transition-fast"
            style="border-bottom: 1px solid var(--color-border-subtle); color: var(--color-secondary);"
          >{ex.name}</button>
        {/each}
      </div>
    {/if}

    {#if selectedEx && e1rmTrend().length > 0}
      <!-- e1RM trend card -->
      <div class="card mb-4">
        <div class="text-label-sm mb-1" style="color: var(--color-tertiary);">e1RM TREND — {selectedEx.name.toUpperCase()}</div>
        <div class="flex items-baseline gap-3 mb-3">
          <div class="text-data-lg tabular" style="color: var(--color-primary);">
            {fmtWeight(currentE1rm, settings.unit)} {settings.unit}
          </div>
          {#if delta !== null}
            <div class="text-body-sm font-semibold" style="color: {delta >= 0 ? 'var(--color-success)' : 'var(--color-error)'};">
              {delta >= 0 ? '+' : ''}{fmtWeight(delta, settings.unit)} {settings.unit}
            </div>
          {/if}
        </div>

        <!-- Date range selector -->
        <div class="flex gap-2 mb-4">
          {#each (['3m','6m','1y','all'] as const) as r}
            <button
              onclick={() => dateRange = r}
              class="px-3 py-1 rounded text-body-sm"
              style="background: {dateRange === r ? 'var(--color-accent)' : 'var(--color-elevated)'}; color: {dateRange === r ? '#0F0F11' : 'var(--color-tertiary)'};"
            >{r}</button>
          {/each}
        </div>

        <!-- SVG line chart -->
        {#if chartPath()}
          <div class="w-full overflow-hidden rounded-lg" style="background: var(--color-elevated); padding: 12px;">
            <svg viewBox="0 0 300 80" class="w-full" style="height: 80px;" preserveAspectRatio="none">
              <!-- Gridlines -->
              {#each [0, 0.25, 0.5, 0.75, 1] as t}
                <line x1="0" y1={t * 80} x2="300" y2={t * 80} stroke="var(--color-border-subtle)" stroke-width="0.5"/>
              {/each}
              <!-- Trend line -->
              <path d={chartPath()} fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Data points -->
              {#each e1rmTrend() as point, i}
                {@const W = 300; @const H = 80}
                {@const vals = e1rmTrend().map(d => d.e1rm)}
                {@const min = Math.min(...vals); @const max = Math.max(...vals); @const range = max - min || 1}
                <circle
                  cx={(i / Math.max(e1rmTrend().length - 1, 1)) * W}
                  cy={H - ((point.e1rm - min) / range) * H}
                  r="3"
                  fill="var(--color-accent)"
                />
              {/each}
            </svg>
            <div class="flex justify-between mt-1">
              <span class="text-caption" style="color: var(--color-disabled);">{e1rmTrend().at(0)?.date ?? ''}</span>
              <span class="text-caption" style="color: var(--color-disabled);">Today</span>
            </div>
          </div>
        {:else}
          <div class="text-body-sm text-center py-4" style="color: var(--color-tertiary);">Log at least 2 sessions to see the trend</div>
        {/if}
      </div>

      <!-- Rep PRs -->
      {#if repPRs.length > 0}
        <div class="card mb-4">
          <div class="text-label-sm mb-3" style="color: var(--color-tertiary);">PERSONAL RECORDS</div>
          {#each repPRs as { reps, pr }}
            <div class="flex items-center justify-between py-2" style="border-bottom: 1px solid var(--color-border-subtle);">
              <span class="text-body-sm" style="color: var(--color-secondary);">{reps}RM</span>
              <div class="text-right">
                <span class="text-data-sm tabular" style="color: var(--color-accent);">
                  {fmtWeight(pr!.value_kg, settings.unit)} {settings.unit}
                </span>
                <span class="text-caption ml-2" style="color: var(--color-tertiary);">{fmtDateShort(pr!.achieved_at)}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Last 5 sessions -->
      {#if last5().length > 0}
        <div class="card mb-4">
          <div class="text-label-sm mb-3" style="color: var(--color-tertiary);">LAST {last5().length} SESSIONS</div>
          {#each last5() as s}
            <div class="flex items-center justify-between py-2" style="border-bottom: 1px solid var(--color-border-subtle);">
              <div>
                <span class="text-body-sm" style="color: var(--color-secondary);">{s.date}</span>
                <span class="text-caption ml-2" style="color: var(--color-tertiary);">{s.sets} sets</span>
              </div>
              <div class="text-right">
                <span class="text-data-sm tabular" style="color: var(--color-primary);">
                  {fmtWeight(s.maxWeight, settings.unit)} {settings.unit}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}

    {:else if selectedEx}
      <div class="text-center py-12">
        <div class="text-body-md" style="color: var(--color-tertiary);">No data for {selectedEx.name}</div>
        <div class="text-body-sm mt-2" style="color: var(--color-disabled);">Log this exercise to see analytics</div>
      </div>
    {/if}
  {/if}
</div>
