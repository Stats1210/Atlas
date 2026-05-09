<script lang="ts">
  import { settings } from '$lib/stores/settings.svelte';
  import { exportCsv, exportJson } from '$lib/utils/export';
  import { db } from '$lib/db';

  let exportFrom  = $state('');
  let exportTo    = $state('');
  let exporting   = $state(false);
  let exportMsg   = $state('');

  async function doExportCsv() {
    exporting = true; exportMsg = '';
    try {
      await exportCsv(exportFrom || undefined, exportTo || undefined);
      exportMsg = 'CSV exported';
    } catch { exportMsg = 'Export failed'; }
    exporting = false;
  }

  async function doExportJson() {
    exporting = true; exportMsg = '';
    try {
      await exportJson(exportFrom || undefined, exportTo || undefined);
      exportMsg = 'JSON exported';
    } catch { exportMsg = 'Export failed'; }
    exporting = false;
  }

  async function clearAllData() {
    if (!confirm('Delete ALL training data? This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure? All sessions, sets, and PRs will be permanently deleted.')) return;
    await Promise.all([
      db.workoutSessions.clear(),
      db.sessionExercises.clear(),
      db.sessionSets.clear(),
      db.personalRecords.clear(),
      db.cardioSessions.clear(),
      db.cardioIntervals.clear(),
    ]);
    exportMsg = 'All data cleared';
  }

  const unitOptions   = [{ v: 'kg', l: 'Kilograms (kg)' }, { v: 'lbs', l: 'Pounds (lbs)' }] as const;
  const distOptions   = [{ v: 'km', l: 'Kilometres (km)' }, { v: 'mi', l: 'Miles (mi)' }] as const;
  const formulaOpts   = [{ v: 'epley', l: 'Epley' }, { v: 'brzycki', l: 'Brzycki' }] as const;
</script>

<div class="px-4 pt-6 pb-8">
  <h1 class="text-display-md mb-6" style="color: var(--color-primary);">Settings</h1>

  {#if !settings.loaded}
    <div class="text-body-md" style="color: var(--color-tertiary);">Loading…</div>
  {:else}

  <!-- Units -->
  <section class="mb-6">
    <div class="text-label-sm mb-3" style="color: var(--color-tertiary);">UNITS</div>
    <div class="card" style="padding: 0; overflow: hidden;">

      <div class="flex items-center justify-between px-4 py-3" style="border-bottom: 1px solid var(--color-border-subtle);">
        <span class="text-body-sm" style="color: var(--color-secondary);">Weight</span>
        <div class="flex gap-1">
          {#each unitOptions as opt}
            <button
              onclick={() => settings.set('unit_weight', opt.v)}
              class="px-3 py-1 rounded text-body-sm transition-fast"
              style="background: {settings.unit === opt.v ? 'var(--color-accent)' : 'var(--color-elevated)'}; color: {settings.unit === opt.v ? '#0F0F11' : 'var(--color-tertiary)'};"
            >{opt.v}</button>
          {/each}
        </div>
      </div>

      <div class="flex items-center justify-between px-4 py-3">
        <span class="text-body-sm" style="color: var(--color-secondary);">Distance</span>
        <div class="flex gap-1">
          {#each distOptions as opt}
            <button
              onclick={() => settings.set('unit_distance', opt.v)}
              class="px-3 py-1 rounded text-body-sm transition-fast"
              style="background: {settings.distUnit === opt.v ? 'var(--color-accent)' : 'var(--color-elevated)'}; color: {settings.distUnit === opt.v ? '#0F0F11' : 'var(--color-tertiary)'};"
            >{opt.v}</button>
          {/each}
        </div>
      </div>

    </div>
  </section>

  <!-- Lifting defaults -->
  <section class="mb-6">
    <div class="text-label-sm mb-3" style="color: var(--color-tertiary);">LIFTING</div>
    <div class="card" style="padding: 0; overflow: hidden;">

      <div class="flex items-center justify-between px-4 py-3" style="border-bottom: 1px solid var(--color-border-subtle);">
        <span class="text-body-sm" style="color: var(--color-secondary);">Bar weight ({settings.unit})</span>
        <div class="flex items-center gap-2">
          <button
            onclick={() => settings.set('default_bar_weight_kg', Math.max(0, settings.barWeight - 2.5))}
            class="stepper">−</button>
          <span class="text-data-sm tabular w-12 text-center" style="color: var(--color-primary);">{settings.barWeight}</span>
          <button
            onclick={() => settings.set('default_bar_weight_kg', settings.barWeight + 2.5)}
            class="stepper">+</button>
        </div>
      </div>

      <div class="flex items-center justify-between px-4 py-3" style="border-bottom: 1px solid var(--color-border-subtle);">
        <span class="text-body-sm" style="color: var(--color-secondary);">Increment ({settings.unit})</span>
        <div class="flex items-center gap-2">
          <button
            onclick={() => settings.set('default_increment_kg', Math.max(0.5, settings.increment - 0.5))}
            class="stepper">−</button>
          <span class="text-data-sm tabular w-12 text-center" style="color: var(--color-primary);">{settings.increment}</span>
          <button
            onclick={() => settings.set('default_increment_kg', settings.increment + 0.5)}
            class="stepper">+</button>
        </div>
      </div>

      <div class="flex items-center justify-between px-4 py-3">
        <span class="text-body-sm" style="color: var(--color-secondary);">1RM formula</span>
        <div class="flex gap-1">
          {#each formulaOpts as opt}
            <button
              onclick={() => settings.set('e1rm_formula', opt.v)}
              class="px-3 py-1 rounded text-body-sm transition-fast"
              style="background: {settings.formula === opt.v ? 'var(--color-accent)' : 'var(--color-elevated)'}; color: {settings.formula === opt.v ? '#0F0F11' : 'var(--color-tertiary)'};"
            >{opt.l}</button>
          {/each}
        </div>
      </div>

    </div>
  </section>

  <!-- Session defaults -->
  <section class="mb-6">
    <div class="text-label-sm mb-3" style="color: var(--color-tertiary);">SESSION</div>
    <div class="card" style="padding: 0; overflow: hidden;">

      <div class="flex items-center justify-between px-4 py-3" style="border-bottom: 1px solid var(--color-border-subtle);">
        <span class="text-body-sm" style="color: var(--color-secondary);">Default rest (seconds)</span>
        <div class="flex items-center gap-2">
          <button
            onclick={() => settings.set('default_rest_sec', Math.max(30, settings.restSec - 15))}
            class="stepper">−</button>
          <span class="text-data-sm tabular w-14 text-center" style="color: var(--color-primary);">{settings.restSec}s</span>
          <button
            onclick={() => settings.set('default_rest_sec', Math.min(600, settings.restSec + 15))}
            class="stepper">+</button>
        </div>
      </div>

      <div class="flex items-center justify-between px-4 py-3">
        <div>
          <span class="text-body-sm" style="color: var(--color-secondary);">RPE logging</span>
          <div class="text-caption mt-0.5" style="color: var(--color-disabled);">Rate of perceived exertion after each set</div>
        </div>
        <button
          onclick={() => settings.set('rpe_enabled', !settings.rpeEnabled)}
          class="relative flex-shrink-0 w-12 h-7 rounded-full transition-fast"
          style="background: {settings.rpeEnabled ? 'var(--color-accent)' : 'var(--color-elevated)'};"
        >
          <span
            class="absolute top-1 w-5 h-5 rounded-full transition-fast"
            style="left: {settings.rpeEnabled ? '24px' : '4px'}; background: {settings.rpeEnabled ? '#0F0F11' : 'var(--color-tertiary)'};"
          ></span>
        </button>
      </div>

    </div>
  </section>

  <!-- Heart rate -->
  <section class="mb-6">
    <div class="text-label-sm mb-3" style="color: var(--color-tertiary);">HEART RATE</div>
    <div class="card" style="padding: 0; overflow: hidden;">
      <div class="flex items-center justify-between px-4 py-3">
        <span class="text-body-sm" style="color: var(--color-secondary);">Max HR (bpm)</span>
        <div class="flex items-center gap-2">
          <button
            onclick={() => settings.set('hr_max_bpm', Math.max(120, settings.hrMax - 1))}
            class="stepper">−</button>
          <span class="text-data-sm tabular w-14 text-center" style="color: var(--color-primary);">{settings.hrMax}</span>
          <button
            onclick={() => settings.set('hr_max_bpm', Math.min(220, settings.hrMax + 1))}
            class="stepper">+</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Export -->
  <section class="mb-6">
    <div class="text-label-sm mb-3" style="color: var(--color-tertiary);">EXPORT DATA</div>
    <div class="card">
      <div class="text-body-sm mb-3" style="color: var(--color-secondary);">Optional date range</div>
      <div class="flex gap-3 mb-4">
        <div class="flex-1">
          <div class="text-caption mb-1" style="color: var(--color-tertiary);">From</div>
          <input
            type="date"
            bind:value={exportFrom}
            class="w-full px-3 py-2 rounded-lg text-body-sm"
            style="background: var(--color-elevated); border: 1px solid var(--color-border); color: var(--color-primary); outline: none; color-scheme: dark;"
          />
        </div>
        <div class="flex-1">
          <div class="text-caption mb-1" style="color: var(--color-tertiary);">To</div>
          <input
            type="date"
            bind:value={exportTo}
            class="w-full px-3 py-2 rounded-lg text-body-sm"
            style="background: var(--color-elevated); border: 1px solid var(--color-border); color: var(--color-primary); outline: none; color-scheme: dark;"
          />
        </div>
      </div>

      <div class="flex gap-3 mb-3">
        <button
          onclick={doExportCsv}
          disabled={exporting}
          class="flex-1 btn btn-secondary"
          style="height: 44px; font-size: 0.875rem;"
        >
          {exporting ? '…' : 'Export CSV'}
        </button>
        <button
          onclick={doExportJson}
          disabled={exporting}
          class="flex-1 btn btn-secondary"
          style="height: 44px; font-size: 0.875rem;"
        >
          {exporting ? '…' : 'Export JSON'}
        </button>
      </div>

      {#if exportMsg}
        <div class="text-body-sm text-center" style="color: {exportMsg.includes('fail') ? 'var(--color-error)' : 'var(--color-success)'};">{exportMsg}</div>
      {/if}
    </div>
  </section>

  <!-- Danger zone -->
  <section class="mb-6">
    <div class="text-label-sm mb-3" style="color: var(--color-error);">DANGER ZONE</div>
    <div class="card">
      <p class="text-body-sm mb-4" style="color: var(--color-secondary);">
        Permanently delete all sessions, sets, and personal records. Your exercise library will be kept.
      </p>
      <button
        onclick={clearAllData}
        class="w-full py-3 rounded-xl text-body-sm font-semibold transition-fast"
        style="background: color-mix(in srgb, var(--color-error) 12%, transparent); color: var(--color-error); border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);"
      >
        Clear all training data
      </button>
    </div>
  </section>

  <!-- App version -->
  <div class="text-center">
    <div class="text-caption" style="color: var(--color-disabled);">Atlas · v0.1.0 · Local-first</div>
  </div>

  {/if}
</div>
