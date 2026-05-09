<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { activeSession } from '$lib/stores/activeSession.svelte';
  import { fmtDuration } from '$lib/utils/format';

  let elapsed = $state(0);

  $effect(() => {
    if (!activeSession.isActive) { elapsed = 0; return; }
    elapsed = activeSession.elapsedSec;
    const interval = setInterval(() => { elapsed = activeSession.elapsedSec; }, 1000);
    return () => clearInterval(interval);
  });

  function goToSession() {
    goto('/session');
  }

  const onSession = $derived($page.url.pathname === '/session');
</script>

{#if activeSession.isActive && !onSession}
  <button
    onclick={goToSession}
    class="w-full flex items-center justify-between px-4 transition-fast"
    style="background: color-mix(in srgb, var(--color-accent) 10%, var(--color-raised)); border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent); height: 44px;"
  >
    <div class="flex items-center gap-2">
      <span class="inline-block w-2 h-2 rounded-full animate-pulse" style="background: var(--color-accent);"></span>
      <span class="text-body-sm font-medium" style="color: var(--color-primary);">
        {activeSession.session?.name ?? 'Workout'}
      </span>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-data-xs tabular" style="color: var(--color-accent);">{fmtDuration(elapsed)}</span>
      <span class="text-caption" style="color: var(--color-secondary);">Return →</span>
    </div>
  </button>
{/if}
