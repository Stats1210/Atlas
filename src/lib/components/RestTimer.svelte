<script lang="ts">
  import { activeSession } from '$lib/stores/activeSession.svelte';
  import { fmtDurationShort } from '$lib/utils/format';

  let remaining  = $state(0);
  let totalSec   = $state(0);
  let didVibrate = $state(false);

  $effect(() => {
    if (!activeSession.restTimer) { remaining = 0; didVibrate = false; return; }
    totalSec  = Math.round((activeSession.restTimer.endsAt - Date.now()) / 1000);
    remaining = Math.max(0, totalSec);

    const tick = setInterval(() => {
      if (!activeSession.restTimer) { clearInterval(tick); return; }
      const r = Math.max(0, Math.round((activeSession.restTimer.endsAt - Date.now()) / 1000));
      remaining = r;
      if (r === 0 && !didVibrate) {
        didVibrate = true;
        try { navigator.vibrate?.([200, 100, 200]); } catch {}
      }
    }, 250);

    return () => clearInterval(tick);
  });

  const progress = $derived(totalSec > 0 ? Math.max(0, remaining / totalSec) : 0);
</script>

{#if activeSession.restTimer}
  <div
    class="fixed left-0 right-0 z-20 flex items-center gap-3 px-4"
    style="bottom: 80px; height: 44px; background: var(--color-raised); border-top: 1px solid var(--color-border-subtle); border-bottom: 1px solid var(--color-border-subtle);"
  >
    <!-- Progress track -->
    <div class="flex-1 relative rounded-full overflow-hidden" style="height: 4px; background: var(--color-elevated);">
      <div
        class="absolute left-0 top-0 h-full rounded-full transition-all"
        style="width: {progress * 100}%; background: {remaining === 0 ? 'var(--color-success)' : 'var(--color-accent)'}; transition: width 0.25s linear;"
      ></div>
    </div>

    <!-- Countdown -->
    <span class="text-data-xs tabular w-10 text-right" style="color: {remaining === 0 ? 'var(--color-success)' : 'var(--color-primary)'};">
      {remaining === 0 ? 'Go' : fmtDurationShort(remaining)}
    </span>

    <!-- +30s -->
    <button
      onclick={() => activeSession.addRestTime(30)}
      class="text-caption px-2 py-1 rounded"
      style="background: var(--color-elevated); color: var(--color-secondary); min-width: 40px;"
    >+30</button>

    <!-- Dismiss -->
    <button
      onclick={() => activeSession.dismissRestTimer()}
      class="text-caption px-2 py-1 rounded"
      style="background: var(--color-elevated); color: var(--color-tertiary);"
    >✕</button>
  </div>
{/if}
