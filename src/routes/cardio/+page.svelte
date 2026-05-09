<script lang="ts">
  import { db, type CardioType, type CardioModality } from '$lib/db';
  import { nowIso, fmtDate, fmtDuration } from '$lib/utils/format';

  let view = $state<'log' | 'history'>('log');

  // Form state
  let sessionType  = $state<CardioType>('zone2');
  let modality     = $state<CardioModality>('run');
  let durationMin  = $state<number | null>(null);
  let distanceKm   = $state<number | null>(null);
  let rpe          = $state<number | null>(null);
  let notes        = $state('');
  let showHR       = $state(false);
  let showIntervals= $state(false);
  let saving       = $state(false);
  let savedOk      = $state(false);

  // HR fields
  let avgHr     = $state<number | null>(null);
  let maxHr     = $state<number | null>(null);
  let z1Min     = $state<number | null>(null);
  let z2Min     = $state<number | null>(null);
  let z3Min     = $state<number | null>(null);
  let z4Min     = $state<number | null>(null);
  let z5Min     = $state<number | null>(null);

  // Interval fields
  let intRounds  = $state<number | null>(null);
  let intWorkSec = $state<number | null>(null);
  let intRestSec = $state<number | null>(null);
  let intWorkZone= $state<number | null>(null);
  let intRpe     = $state<number | null>(null);

  // History
  let history = $state<Awaited<ReturnType<typeof db.cardioSessions.toArray>>>([]);

  $effect(() => {
    if (view === 'history') {
      db.cardioSessions.reverse().sortBy('started_at').then(r => { history = r; });
    }
  });

  const sessionTypes: { value: CardioType; label: string }[] = [
    { value: 'zone2', label: 'Zone 2' },
    { value: 'threshold', label: 'Threshold' },
    { value: 'vo2max', label: 'VO2max' },
    { value: 'hiit', label: 'HIIT' },
    { value: 'recovery', label: 'Recovery' },
    { value: 'other', label: 'Other' }
  ];

  const modalities: { value: CardioModality; label: string }[] = [
    { value: 'run', label: 'Run' },
    { value: 'row', label: 'Row' },
    { value: 'bike', label: 'Bike' },
    { value: 'air_bike', label: 'Air Bike' },
    { value: 'ski_erg', label: 'Ski Erg' },
    { value: 'swim', label: 'Swim' },
    { value: 'walk', label: 'Walk' },
    { value: 'elliptical', label: 'Elliptical' },
    { value: 'other', label: 'Other' }
  ];

  async function save() {
    if (!durationMin) return;
    saving = true;
    try {
      const now = nowIso();
      const cardioId = await db.cardioSessions.add({
        session_type: sessionType,
        modality,
        status: 'completed',
        is_completed_as_prescribed: null,
        started_at: now,
        finished_at: now,
        duration_sec: durationMin * 60,
        distance_km: distanceKm,
        avg_hr_bpm: avgHr,
        max_hr_bpm: maxHr,
        avg_pace_sec_per_km: (distanceKm && durationMin) ? Math.round((durationMin * 60) / distanceKm) : null,
        avg_power_watts: null,
        calories_kcal: null,
        z1_sec: z1Min ? z1Min * 60 : null,
        z2_sec: z2Min ? z2Min * 60 : null,
        z3_sec: z3Min ? z3Min * 60 : null,
        z4_sec: z4Min ? z4Min * 60 : null,
        z5_sec: z5Min ? z5Min * 60 : null,
        rpe,
        notes,
        source: 'manual',
        external_id: null,
        created_at: now,
        updated_at: now
      });

      if (showIntervals && intRounds && intWorkSec) {
        await db.cardioIntervals.add({
          cardio_session_id: cardioId,
          rounds: intRounds,
          work_duration_sec: intWorkSec,
          rest_duration_sec: intRestSec ?? 0,
          work_zone: intWorkZone,
          rest_zone: null,
          rpe: intRpe,
          notes: ''
        });
      }

      // Reset form
      durationMin = null; distanceKm = null; rpe = null; notes = '';
      avgHr = null; maxHr = null; z1Min = z2Min = z3Min = z4Min = z5Min = null;
      intRounds = intWorkSec = intRestSec = intWorkZone = intRpe = null;
      showHR = showIntervals = false;
      savedOk = true;
      setTimeout(() => { savedOk = false; }, 3000);
    } finally {
      saving = false;
    }
  }

  function numInput(value: number | null, setter: (v: number | null) => void) {
    return {
      value: value ?? '',
      oninput: (e: Event) => {
        const v = parseFloat((e.target as HTMLInputElement).value);
        setter(isNaN(v) ? null : v);
      }
    };
  }

  const cardioTypeColor: Record<string, string> = {
    zone2: 'var(--color-zone2)', threshold: 'var(--color-threshold)',
    vo2max: 'var(--color-vo2max)', hiit: 'var(--color-hiit)',
    recovery: 'var(--color-recovery)', other: 'var(--color-tertiary)'
  };
</script>

<div class="px-4 pt-6 pb-8">
  <div class="flex items-center justify-between mb-4">
    <h1 class="text-display-md" style="color: var(--color-primary);">Cardio</h1>
    <div class="flex gap-1">
      {#each (['log','history'] as const) as v}
        <button
          onclick={() => view = v}
          class="px-3 py-1 rounded text-body-sm"
          style="background: {view === v ? 'var(--color-accent)' : 'var(--color-elevated)'}; color: {view === v ? '#0F0F11' : 'var(--color-tertiary)'};"
        >{v === 'log' ? 'Log' : 'History'}</button>
      {/each}
    </div>
  </div>

  {#if view === 'log'}
    <!-- Session type grid -->
    <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">SESSION TYPE</div>
    <div class="session-type-grid mb-5">
      {#each sessionTypes as t}
        <button
          onclick={() => sessionType = t.value}
          class="session-type-btn {sessionType === t.value ? `selected-${t.value}` : ''}"
        >{t.label}</button>
      {/each}
    </div>

    <!-- Modality -->
    <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">MODALITY</div>
    <div class="flex gap-2 mb-5 overflow-x-auto scrollbar-none pb-1">
      {#each modalities as m}
        <button
          onclick={() => modality = m.value}
          class="flex-shrink-0 px-4 py-2 rounded-lg text-body-sm font-medium transition-fast"
          style="background: {modality === m.value ? 'var(--color-accent)' : 'var(--color-elevated)'}; color: {modality === m.value ? '#0F0F11' : 'var(--color-secondary)'}; border: 1px solid {modality === m.value ? 'transparent' : 'var(--color-border)'};"
        >{m.label}</button>
      {/each}
    </div>

    <!-- Duration + Distance -->
    <div class="grid grid-cols-2 gap-3 mb-5">
      <div>
        <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">DURATION (min)</div>
        <input
          type="number"
          inputmode="decimal"
          placeholder="45"
          {...numInput(durationMin, v => durationMin = v)}
          class="w-full px-3 py-3 rounded-lg text-data-sm tabular"
          style="background: var(--color-elevated); border: 1.5px solid {durationMin ? 'var(--color-accent)' : 'var(--color-border)'}; color: var(--color-primary); outline: none;"
        />
      </div>
      <div>
        <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">DISTANCE (km)</div>
        <input
          type="number"
          inputmode="decimal"
          placeholder="8.2"
          {...numInput(distanceKm, v => distanceKm = v)}
          class="w-full px-3 py-3 rounded-lg text-data-sm tabular"
          style="background: var(--color-elevated); border: 1.5px solid var(--color-border); color: var(--color-primary); outline: none;"
        />
      </div>
    </div>

    <!-- RPE -->
    <div class="mb-5">
      <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">RPE</div>
      <div class="rpe-row flex-wrap gap-2">
        {#each [1,2,3,4,5,6,7,8,9,10] as r}
          <button
            class="rpe-dot {rpe === r ? 'active' : ''}"
            onclick={() => rpe = rpe === r ? null : r}
          >{r}</button>
        {/each}
      </div>
    </div>

    <!-- HR data toggle -->
    <button
      onclick={() => showHR = !showHR}
      class="w-full flex items-center justify-between px-4 py-3 mb-3 rounded-xl"
      style="background: var(--color-elevated); border: 1px solid var(--color-border-subtle);"
    >
      <span class="text-body-sm" style="color: {showHR ? 'var(--color-primary)' : 'var(--color-tertiary)'};">
        {showHR ? '▲' : '▼'} HR data
      </span>
      {#if avgHr}
        <span class="text-caption" style="color: var(--color-secondary);">Avg {avgHr} bpm</span>
      {/if}
    </button>

    {#if showHR}
      <div class="card-inner mb-3">
        <div class="grid grid-cols-2 gap-3 mb-3">
          {#each [
            { label: 'AVG HR (bpm)', getter: avgHr, setter: (v: number | null) => avgHr = v },
            { label: 'MAX HR (bpm)', getter: maxHr, setter: (v: number | null) => maxHr = v }
          ] as field}
            <div>
              <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">{field.label}</div>
              <input
                type="number" inputmode="numeric" placeholder="—"
                value={field.getter ?? ''}
                oninput={(e) => field.setter(parseInt((e.target as HTMLInputElement).value) || null)}
                class="w-full px-3 py-2 rounded-lg text-data-xs tabular"
                style="background: var(--color-elevated); border: 1px solid var(--color-border); color: var(--color-primary); outline: none;"
              />
            </div>
          {/each}
        </div>
        <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">TIME IN ZONES (minutes)</div>
        <div class="grid grid-cols-5 gap-2">
          {#each [
            { label: 'Z1', getter: z1Min, setter: (v: number | null) => z1Min = v },
            { label: 'Z2', getter: z2Min, setter: (v: number | null) => z2Min = v },
            { label: 'Z3', getter: z3Min, setter: (v: number | null) => z3Min = v },
            { label: 'Z4', getter: z4Min, setter: (v: number | null) => z4Min = v },
            { label: 'Z5', getter: z5Min, setter: (v: number | null) => z5Min = v }
          ] as z}
            <div class="text-center">
              <div class="text-label-sm mb-1" style="color: var(--color-disabled);">{z.label}</div>
              <input
                type="number" inputmode="numeric" placeholder="0"
                value={z.getter ?? ''}
                oninput={(e) => z.setter(parseInt((e.target as HTMLInputElement).value) || null)}
                class="w-full px-2 py-2 rounded text-center text-caption"
                style="background: var(--color-elevated); border: 1px solid var(--color-border); color: var(--color-primary); outline: none;"
              />
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Interval toggle -->
    <button
      onclick={() => showIntervals = !showIntervals}
      class="w-full flex items-center justify-between px-4 py-3 mb-3 rounded-xl"
      style="background: var(--color-elevated); border: 1px solid var(--color-border-subtle);"
    >
      <span class="text-body-sm" style="color: {showIntervals ? 'var(--color-primary)' : 'var(--color-tertiary)'};">
        {showIntervals ? '▲' : '▼'} Interval structure
      </span>
    </button>

    {#if showIntervals}
      <div class="card-inner mb-3">
        <div class="grid grid-cols-2 gap-3 mb-3">
          {#each [
            { label: 'ROUNDS', getter: intRounds, setter: (v: number | null) => intRounds = v },
            { label: 'RPE', getter: intRpe, setter: (v: number | null) => intRpe = v }
          ] as field}
            <div>
              <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">{field.label}</div>
              <input type="number" inputmode="numeric" placeholder="—"
                value={field.getter ?? ''}
                oninput={(e) => field.setter(parseInt((e.target as HTMLInputElement).value) || null)}
                class="w-full px-3 py-2 rounded-lg text-data-xs tabular"
                style="background: var(--color-elevated); border: 1px solid var(--color-border); color: var(--color-primary); outline: none;"
              />
            </div>
          {/each}
        </div>
        <div class="grid grid-cols-2 gap-3">
          {#each [
            { label: 'WORK (sec)', getter: intWorkSec, setter: (v: number | null) => intWorkSec = v },
            { label: 'REST (sec)', getter: intRestSec, setter: (v: number | null) => intRestSec = v }
          ] as field}
            <div>
              <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">{field.label}</div>
              <input type="number" inputmode="numeric" placeholder="60"
                value={field.getter ?? ''}
                oninput={(e) => field.setter(parseInt((e.target as HTMLInputElement).value) || null)}
                class="w-full px-3 py-2 rounded-lg text-data-xs tabular"
                style="background: var(--color-elevated); border: 1px solid var(--color-border); color: var(--color-primary); outline: none;"
              />
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Notes -->
    <div class="mb-6">
      <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">NOTES</div>
      <textarea
        bind:value={notes}
        placeholder="How did it feel? Route, conditions..."
        rows="3"
        class="w-full px-3 py-3 rounded-lg text-body-md"
        style="background: var(--color-elevated); border: 1.5px solid var(--color-border); color: var(--color-primary); resize: none; outline: none;"
      ></textarea>
    </div>

    {#if savedOk}
      <div class="mb-3 px-4 py-3 rounded-xl surface-success text-center">
        <span class="text-body-sm" style="color: var(--color-success);">✓ Cardio session saved</span>
      </div>
    {/if}

    <button
      onclick={save}
      disabled={!durationMin || saving}
      class="btn btn-primary"
    >{saving ? 'Saving...' : 'Save Session'}</button>

  {:else}
    <!-- History view -->
    {#if history.length === 0}
      <div class="text-center py-16">
        <div class="text-body-md" style="color: var(--color-tertiary);">No cardio sessions yet</div>
      </div>
    {:else}
      <div class="flex flex-col gap-3">
        {#each history as session (session.id)}
          <div class="card">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-body-md font-semibold" style="color: var(--color-primary);">
                    {modalities.find(m => m.value === session.modality)?.label ?? session.modality}
                  </span>
                  <span
                    class="badge"
                    style="background: color-mix(in srgb, {cardioTypeColor[session.session_type]} 15%, transparent); color: {cardioTypeColor[session.session_type]};"
                  >{session.session_type}</span>
                </div>
                <div class="text-caption" style="color: var(--color-tertiary);">{fmtDate(session.started_at)}</div>
                {#if session.distance_km}
                  <div class="text-caption mt-1" style="color: var(--color-tertiary);">{session.distance_km.toFixed(2)} km</div>
                {/if}
                {#if session.rpe}
                  <div class="text-caption mt-1" style="color: var(--color-tertiary);">RPE {session.rpe}</div>
                {/if}
              </div>
              <div class="text-right">
                <div class="text-data-sm tabular" style="color: var(--color-primary);">{fmtDuration(session.duration_sec)}</div>
                {#if session.avg_hr_bpm}
                  <div class="text-caption mt-1" style="color: var(--color-tertiary);">{session.avg_hr_bpm} bpm avg</div>
                {/if}
              </div>
            </div>
            {#if session.notes}
              <div class="text-body-sm mt-2" style="color: var(--color-tertiary);">{session.notes}</div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
