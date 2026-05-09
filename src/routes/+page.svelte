<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { activeSession } from '$lib/stores/activeSession.svelte';
  import { db } from '$lib/db';
  import { fmtDate, fmtDuration, fmtVolume } from '$lib/utils/format';

  let lastSession = $state<{ name: string; started_at: string; duration_sec: number | null; total_volume_kg: number | null } | null>(null);
  let showRecoverPrompt = $state(false);

  $effect(() => {
    db.workoutSessions.where('status').equals('completed').reverse().first().then(s => {
      if (s) lastSession = s;
    });
    // If session is already in progress and user navigated away, show it
    if (activeSession.isActive) showRecoverPrompt = false;
  });

  async function startBlankSession() {
    await activeSession.start('Workout');
    goto(base + '/session');
  }

  async function repeatLastSession() {
    await activeSession.start(lastSession?.name ?? 'Workout');
    await activeSession.repeatLastSession();
    goto(base + '/session');
  }
</script>

<div class="px-4 pt-6 pb-4">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="text-display-md" style="color: var(--color-primary);">Atlas</h1>
    <p class="text-body-sm mt-1" style="color: var(--color-tertiary);">
      {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
    </p>
  </div>

  <!-- Active session CTA -->
  {#if activeSession.isActive}
    <button onclick={() => goto(base + '/session')} class="btn btn-primary mb-4">
      Return to active session →
    </button>
  {:else}
    <!-- Start strength session -->
    <div class="card mb-3">
      <div class="text-label-lg mb-3" style="color: var(--color-tertiary);">Strength</div>

      <button onclick={startBlankSession} class="btn btn-primary mb-3">
        + Start Workout
      </button>

      {#if lastSession}
        <button
          onclick={repeatLastSession}
          class="w-full flex items-center justify-between py-3 px-1"
          style="color: var(--color-secondary);"
        >
          <span class="text-body-sm">Repeat last: {lastSession.name}</span>
          <span class="text-caption" style="color: var(--color-tertiary);">→</span>
        </button>
      {/if}
    </div>

    <!-- Cardio CTA -->
    <div class="card mb-3">
      <div class="text-label-lg mb-3" style="color: var(--color-tertiary);">Cardio</div>
      <button onclick={() => goto(base + '/cardio')} class="btn btn-secondary w-full">
        + Log Cardio Session
      </button>
    </div>

    <!-- Last session preview -->
    {#if lastSession}
      <div class="mt-6">
        <div class="text-label-sm mb-3" style="color: var(--color-tertiary);">Last Session</div>
        <button onclick={() => goto(base + '/history')} class="card w-full text-left">
          <div class="flex items-start justify-between">
            <div>
              <div class="text-body-md font-semibold" style="color: var(--color-primary);">{lastSession.name}</div>
              <div class="text-caption mt-1" style="color: var(--color-tertiary);">{fmtDate(lastSession.started_at)}</div>
            </div>
            <div class="text-right">
              <div class="text-data-sm tabular" style="color: var(--color-accent);">{fmtVolume(lastSession.total_volume_kg)}</div>
              <div class="text-caption" style="color: var(--color-tertiary);">{fmtDuration(lastSession.duration_sec)}</div>
            </div>
          </div>
        </button>
      </div>
    {:else}
      <div class="mt-8 text-center py-8">
        <div class="text-body-md mb-2" style="color: var(--color-tertiary);">No sessions yet</div>
        <div class="text-body-sm" style="color: var(--color-disabled);">Start your first workout above</div>
      </div>
    {/if}
  {/if}
</div>
