<script lang="ts">
  import { settings } from '$lib/stores/settings.svelte';
  import { fmtWeight } from '$lib/utils/format';
  import type { LiveSet } from '$lib/stores/activeSession.svelte';

  let {
    set,
    exTempId,
    onupdate,
    onconfirm,
    onremove
  }: {
    set: LiveSet;
    exTempId: string;
    onupdate: (patch: Partial<LiveSet>) => void;
    onconfirm: () => void;
    onremove: () => void;
  } = $props();

  let editingWeight = $state(false);
  let editingReps   = $state(false);
  let weightInput   = $state('');
  let repsInput     = $state('');
  let showRpe       = $state(false);

  function startWeightEdit() {
    if (set.confirmed) return;
    editingWeight = true;
    weightInput   = set.weight_kg != null ? String(set.weight_kg) : '';
  }
  function commitWeight() {
    editingWeight = false;
    const v = parseFloat(weightInput);
    if (!isNaN(v) && v >= 0) onupdate({ weight_kg: v });
  }
  function startRepsEdit() {
    if (set.confirmed) return;
    editingReps = true;
    repsInput   = set.reps_actual != null ? String(set.reps_actual) : '';
  }
  function commitReps() {
    editingReps = false;
    const v = parseInt(repsInput);
    if (!isNaN(v) && v >= 0) onupdate({ reps_actual: v });
  }

  function stepWeight(delta: number) {
    if (set.confirmed) return;
    const inc  = settings.increment;
    const curr = set.weight_kg ?? 0;
    onupdate({ weight_kg: Math.max(0, Math.round((curr + delta * inc) * 10) / 10) });
  }
  function stepReps(delta: number) {
    if (set.confirmed) return;
    const curr = set.reps_actual ?? 0;
    onupdate({ reps_actual: Math.max(0, curr + delta) });
  }

  function handleConfirm() {
    if (set.confirmed) return;
    onconfirm();
    if (settings.rpeEnabled) showRpe = true;
  }

  const setTypeLabel: Record<string, string> = {
    warmup: 'W', working: '', top_set: 'T', back_off: 'B', drop_set: 'D', amrap: 'A'
  };

  const isWarmup  = $derived(set.set_type === 'warmup');
  const isPR      = $derived(set.confirmed && (set.is_pr_weight || set.is_pr_e1rm || set.is_pr_reps));
</script>

<div
  class="flex items-center gap-2 px-4 transition-fast"
  style="min-height: {set.confirmed ? '48px' : '64px'}; border-bottom: 1px solid var(--color-border-subtle); background: {!set.confirmed ? 'var(--color-elevated)' : 'transparent'}; opacity: {isWarmup && set.confirmed ? '0.65' : '1'};"
>
  <!-- Set number / type -->
  <div class="w-7 text-center flex-shrink-0">
    {#if isWarmup}
      <span class="text-label-sm" style="color: var(--color-tertiary);">W</span>
    {:else if set.set_type !== 'working'}
      <span class="text-label-sm" style="color: var(--color-tertiary);">{setTypeLabel[set.set_type]}</span>
    {:else}
      <span class="text-data-xs tabular" style="color: var(--color-tertiary);">{set.set_number - (isWarmup ? 0 : 0)}</span>
    {/if}
  </div>

  <!-- Weight -->
  {#if set.confirmed}
    <div class="flex-1 text-data-sm tabular" style="color: var(--color-primary);">
      {fmtWeight(set.weight_kg, settings.unit)} {settings.unit}
    </div>
  {:else}
    <div class="flex-1 stepper" style="max-width: 180px;">
      <button class="stepper-btn" onclick={() => stepWeight(-1)} aria-label="decrease">−</button>
      {#if editingWeight}
        <input
          bind:value={weightInput}
          type="number"
          inputmode="decimal"
          class="stepper-value"
          style="width: 80px; background: var(--color-elevated); border: 1.5px solid var(--color-accent); outline: none;"
          onblur={commitWeight}
          onkeydown={e => e.key === 'Enter' && commitWeight()}
          autofocus
        />
      {:else}
        <button class="stepper-value" onclick={startWeightEdit}>
          {set.weight_kg != null ? fmtWeight(set.weight_kg, settings.unit) : '—'}
        </button>
      {/if}
      <button class="stepper-btn" onclick={() => stepWeight(1)} aria-label="increase">+</button>
    </div>
  {/if}

  <!-- Reps -->
  {#if set.confirmed}
    <div class="w-12 text-center text-data-sm tabular" style="color: var(--color-secondary);">
      {set.reps_actual ?? '—'}
    </div>
  {:else}
    <div class="stepper" style="max-width: 100px;">
      <button class="stepper-btn" style="width:40px;height:52px;" onclick={() => stepReps(-1)}>−</button>
      {#if editingReps}
        <input
          bind:value={repsInput}
          type="number"
          inputmode="numeric"
          class="stepper-value"
          style="width: 52px; background: var(--color-elevated); border: 1.5px solid var(--color-accent); outline:none;"
          onblur={commitReps}
          onkeydown={e => e.key === 'Enter' && commitReps()}
          autofocus
        />
      {:else}
        <button class="stepper-value" style="min-width:52px;" onclick={startRepsEdit}>
          {set.reps_actual ?? '—'}
        </button>
      {/if}
      <button class="stepper-btn" style="width:40px;height:52px;" onclick={() => stepReps(1)}>+</button>
    </div>
  {/if}

  <!-- RPE (inline after confirm) -->
  {#if set.confirmed && set.rpe}
    <div class="w-10 text-center">
      <span class="text-caption" style="color: var(--color-tertiary);">RPE {set.rpe}</span>
    </div>
  {/if}

  <!-- PR badge -->
  {#if isPR}
    <span class="badge-pr">★</span>
  {/if}

  <!-- Confirm / checkmark -->
  {#if !set.confirmed}
    <button
      onclick={handleConfirm}
      class="flex items-center justify-center rounded-lg flex-shrink-0 transition-fast"
      style="width: 52px; height: 52px; background: var(--color-elevated); border: 1.5px solid var(--color-border); color: var(--color-tertiary);"
      aria-label="Confirm set"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </button>
  {:else}
    <div
      class="flex items-center justify-center rounded-lg flex-shrink-0"
      style="width: 40px; height: 40px; color: var(--color-success);"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
    </div>
  {/if}
</div>

<!-- RPE picker (appears after confirming) -->
{#if showRpe && set.confirmed && settings.rpeEnabled}
  <div class="px-4 py-2 flex items-center gap-2" style="border-bottom: 1px solid var(--color-border-subtle);">
    <span class="text-caption flex-shrink-0" style="color: var(--color-tertiary);">RPE</span>
    <div class="rpe-row flex-wrap">
      {#each [6,7,7.5,8,8.5,9,9.5,10] as r}
        <button
          class="rpe-dot {set.rpe === r ? 'active' : ''}"
          onclick={() => { onupdate({ rpe: r }); showRpe = false; }}
          style="width: 32px; height: 32px; font-size: 0.625rem;"
        >{r}</button>
      {/each}
      <button onclick={() => showRpe = false} class="text-caption px-2" style="color: var(--color-tertiary);">skip</button>
    </div>
  </div>
{/if}
