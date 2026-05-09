<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { db, type CardioSession } from '$lib/db';
  import { fmtDate, fmtDuration, fmtDistance } from '$lib/utils/format';
  import { settings } from '$lib/stores/settings.svelte';

  const sessionId = $derived(parseInt($page.params.id));
  let session = $state<CardioSession | null>(null);

  $effect(() => {
    if (isNaN(sessionId)) return;
    db.cardioSessions.get(sessionId).then(s => { session = s ?? null; });
  });

  const cardioTypeColor: Record<string, string> = {
    zone2: 'var(--color-zone2)', threshold: 'var(--color-threshold)',
    vo2max: 'var(--color-vo2max)', hiit: 'var(--color-hiit)',
    recovery: 'var(--color-recovery)', other: 'var(--color-tertiary)'
  };
</script>

<div class="px-4 pt-6 pb-8">
  <button onclick={() => goto(base + '/history')} class="flex items-center gap-1 mb-4" style="color: var(--color-tertiary);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
    <span class="text-body-sm">History</span>
  </button>

  {#if !session}
    <div class="text-body-md" style="color: var(--color-tertiary);">Loading...</div>
  {:else}
    <div class="flex items-center gap-2 mb-1">
      <h1 class="text-display-sm" style="color: var(--color-primary);">
        {session.modality.charAt(0).toUpperCase() + session.modality.slice(1)}
      </h1>
      <span
        class="badge"
        style="background: color-mix(in srgb, {cardioTypeColor[session.session_type]} 15%, transparent); color: {cardioTypeColor[session.session_type]};"
      >{session.session_type}</span>
    </div>
    <div class="text-body-sm mb-6" style="color: var(--color-tertiary);">{fmtDate(session.started_at)}</div>

    <!-- Stats grid -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      {#each [
        { label: 'Duration', value: fmtDuration(session.duration_sec) },
        { label: 'Distance', value: session.distance_km ? fmtDistance(session.distance_km, settings.distUnit) : '—' },
        { label: 'Avg HR', value: session.avg_hr_bpm ? `${session.avg_hr_bpm} bpm` : '—' }
      ] as stat}
        <div class="card-inner text-center">
          <div class="text-data-sm tabular" style="color: var(--color-primary);">{stat.value}</div>
          <div class="text-label-sm mt-1" style="color: var(--color-tertiary);">{stat.label}</div>
        </div>
      {/each}
    </div>

    <!-- HR zones -->
    {#if session.z1_sec || session.z2_sec || session.z3_sec || session.z4_sec || session.z5_sec}
      <div class="card mb-4">
        <div class="text-label-sm mb-3" style="color: var(--color-tertiary);">HEART RATE ZONES</div>
        {#each [
          { label: 'Zone 1', sec: session.z1_sec, color: 'var(--color-zone2)' },
          { label: 'Zone 2', sec: session.z2_sec, color: 'var(--color-zone2)' },
          { label: 'Zone 3', sec: session.z3_sec, color: 'var(--color-threshold)' },
          { label: 'Zone 4', sec: session.z4_sec, color: 'var(--color-vo2max)' },
          { label: 'Zone 5', sec: session.z5_sec, color: 'var(--color-hiit)' }
        ].filter(z => z.sec) as z}
          <div class="flex items-center justify-between py-2" style="border-bottom: 1px solid var(--color-border-subtle);">
            <span class="text-body-sm" style="color: var(--color-secondary);">{z.label}</span>
            <span class="text-data-sm tabular" style="color: {z.color};">{fmtDuration(z.sec!)}</span>
          </div>
        {/each}
      </div>
    {/if}

    <!-- RPE -->
    {#if session.rpe}
      <div class="card mb-4">
        <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">RPE</div>
        <div class="text-data-md tabular" style="color: var(--color-primary);">{session.rpe} / 10</div>
      </div>
    {/if}

    <!-- Notes -->
    {#if session.notes}
      <div class="card">
        <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">NOTES</div>
        <p class="text-body-md" style="color: var(--color-secondary);">{session.notes}</p>
      </div>
    {/if}
  {/if}
</div>
