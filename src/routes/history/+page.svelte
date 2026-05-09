<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { db, type WorkoutSession, type CardioSession } from '$lib/db';
  import { fmtDate, fmtDuration, fmtVolume } from '$lib/utils/format';

  type AnySession = (WorkoutSession & { kind: 'strength' }) | (CardioSession & { kind: 'cardio' });

  let sessions = $state<AnySession[]>([]);
  let filter   = $state<'all' | 'strength' | 'cardio'>('all');

  $effect(() => {
    Promise.all([
      db.workoutSessions.where('status').anyOf(['completed','partial']).reverse().sortBy('started_at'),
      db.cardioSessions.reverse().sortBy('started_at')
    ]).then(([strength, cardio]) => {
      const all: AnySession[] = [
        ...strength.map(s => ({ ...s, kind: 'strength' as const })),
        ...cardio.map(s => ({ ...s, kind: 'cardio' as const }))
      ];
      all.sort((a, b) => b.started_at.localeCompare(a.started_at));
      sessions = all;
    });
  });

  const filtered = $derived(
    filter === 'all' ? sessions : sessions.filter(s => s.kind === filter)
  );

  const cardioTypeColor: Record<string, string> = {
    zone2: 'var(--color-zone2)', threshold: 'var(--color-threshold)',
    vo2max: 'var(--color-vo2max)', hiit: 'var(--color-hiit)',
    recovery: 'var(--color-recovery)', other: 'var(--color-tertiary)'
  };
</script>

<div class="px-4 pt-6 pb-4">
  <h1 class="text-display-md mb-4" style="color: var(--color-primary);">History</h1>

  <!-- Filter tabs -->
  <div class="flex gap-2 mb-4">
    {#each (['all','strength','cardio'] as const) as f}
      <button
        onclick={() => filter = f}
        class="px-4 py-2 rounded-lg text-body-sm font-medium transition-fast"
        style="background: {filter === f ? 'var(--color-accent)' : 'var(--color-elevated)'}; color: {filter === f ? '#0F0F11' : 'var(--color-secondary)'};"
      >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div class="text-center py-16">
      <div class="text-body-md" style="color: var(--color-tertiary);">No sessions yet</div>
      <div class="text-body-sm mt-2" style="color: var(--color-disabled);">Start a workout on the Log tab</div>
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      {#each filtered as session (session.id)}
        {#if session.kind === 'strength'}
          <button
            onclick={() => goto(base + `/session/${session.id}`)}
            class="card w-full text-left"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="text-body-md font-semibold" style="color: var(--color-primary);">{session.name}</div>
                <div class="text-caption mt-1" style="color: var(--color-tertiary);">{fmtDate(session.started_at)}</div>
                {#if (session as WorkoutSession).total_sets}
                  <div class="text-caption mt-1" style="color: var(--color-tertiary);">{(session as WorkoutSession).total_sets} sets</div>
                {/if}
              </div>
              <div class="text-right flex-shrink-0 ml-4">
                <div class="text-data-sm tabular" style="color: var(--color-accent);">
                  {fmtVolume((session as WorkoutSession).total_volume_kg)}
                </div>
                <div class="text-caption mt-1" style="color: var(--color-tertiary);">
                  {fmtDuration((session as WorkoutSession).duration_sec)}
                </div>
              </div>
            </div>
          </button>
        {:else}
          {@const cs = session as CardioSession}
          <button
            onclick={() => goto(base + `/session/cardio-${session.id}`)}
            class="card w-full text-left"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-body-md font-semibold" style="color: var(--color-primary);">
                    {cs.modality.charAt(0).toUpperCase() + cs.modality.slice(1)}
                  </span>
                  <span
                    class="badge text-xs"
                    style="background: color-mix(in srgb, {cardioTypeColor[cs.session_type]} 15%, transparent); color: {cardioTypeColor[cs.session_type]};"
                  >{cs.session_type}</span>
                </div>
                <div class="text-caption mt-1" style="color: var(--color-tertiary);">{fmtDate(cs.started_at)}</div>
                {#if cs.distance_km}
                  <div class="text-caption mt-1" style="color: var(--color-tertiary);">{cs.distance_km.toFixed(2)} km</div>
                {/if}
              </div>
              <div class="text-right flex-shrink-0 ml-4">
                <div class="text-data-sm tabular" style="color: var(--color-primary);">{fmtDuration(cs.duration_sec)}</div>
                {#if cs.avg_hr_bpm}
                  <div class="text-caption mt-1" style="color: var(--color-tertiary);">{cs.avg_hr_bpm} bpm avg</div>
                {/if}
              </div>
            </div>
          </button>
        {/if}
      {/each}
    </div>
  {/if}
</div>
