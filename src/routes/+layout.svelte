<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initDB } from '$lib/db';
  import { settings } from '$lib/stores/settings.svelte';
  import { activeSession } from '$lib/stores/activeSession.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import ActiveSessionBanner from '$lib/components/ActiveSessionBanner.svelte';

  let { children } = $props();
  let ready = $state(false);

  onMount(async () => {
    await initDB();
    await settings.load();
    await activeSession.resumeIfInProgress();
    ready = true;
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

{#if ready}
  <div class="flex flex-col min-h-dvh" style="background: var(--color-base);">
    <ActiveSessionBanner />
    <main class="flex-1 overflow-y-auto" style="padding-bottom: 80px;">
      {@render children()}
    </main>
    <BottomNav />
  </div>
{:else}
  <div class="flex items-center justify-center min-h-dvh" style="background: var(--color-base);">
    <div style="color: var(--color-tertiary);" class="text-body-sm">Loading...</div>
  </div>
{/if}
