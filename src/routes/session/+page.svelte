<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { activeSession } from '$lib/stores/activeSession.svelte';
  import { fmtDuration } from '$lib/utils/format';
  import ExerciseBlock from '$lib/components/ExerciseBlock.svelte';
  import ExerciseSearch from '$lib/components/ExerciseSearch.svelte';
  import RestTimer from '$lib/components/RestTimer.svelte';
  import type { Exercise } from '$lib/db';

  let elapsed      = $state(0);
  let showPicker   = $state(false);
  let showFinish   = $state(false);
  let sessionNotes = $state('');
  let finishing    = $state(false);

  $effect(() => {
    if (!activeSession.isActive) { goto(base + '/'); return; }
    elapsed = activeSession.elapsedSec;
    const t = setInterval(() => { elapsed = activeSession.elapsedSec; }, 1000);
    return () => clearInterval(t);
  });

  async function addExercise(ex: Exercise) {
    showPicker = false;
    await activeSession.addExercise(ex.id!, ex.name, ex.category, ex.training_role);
  }

  async function finish() {
    finishing = true;
    await activeSession.finish(sessionNotes, null);
    goto(base + '/history');
  }

  async function discard() {
    if (!confirm('Discard this session? All logged sets will be deleted.')) return;
    await activeSession.discard();
    goto(base + '/');
  }

  const prCount = $derived(
    activeSession.exercises.reduce((acc, ex) =>
      acc + ex.sets.filter(s => s.confirmed && (s.is_pr_weight || s.is_pr_e1rm)).length, 0)
  );
  const totalSets = $derived(
    activeSession.exercises.reduce((acc, ex) =>
      acc + ex.sets.filter(s => s.confirmed && s.set_type !== 'warmup').length, 0)
  );
</script>

<!-- Sticky header -->
<div
  class="sticky top-0 z-10 flex items-center justify-between px-4 pt-safe"
  style="background: var(--color-base); border-bottom: 1px solid var(--color-border-subtle); min-height: 56px;"
>
  <div>
    <div class="text-body-md font-semibold" style="color: var(--color-primary);">
      {activeSession.session?.name ?? 'Workout'}
    </div>
    <div class="text-caption tabular" style="color: var(--color-tertiary);">{fmtDuration(elapsed)}</div>
  </div>
  <div class="flex gap-2">
    <button onclick={() => showFinish = true} class="btn btn-secondary" style="height: 40px; padding: 0 16px; font-size: 0.875rem;">
      Finish
    </button>
  </div>
</div>

<!-- Exercise blocks -->
<div class="px-4 pt-4 pb-32">
  {#if activeSession.exercises.length === 0}
    <div class="text-center py-12">
      <div class="text-body-md mb-2" style="color: var(--color-tertiary);">No exercises yet</div>
      <div class="text-body-sm mb-6" style="color: var(--color-disabled);">Add your first exercise below</div>
      <button onclick={() => showPicker = true} class="btn btn-primary" style="width: auto; padding: 0 32px;">
        + Add Exercise
      </button>
    </div>
  {:else}
    {#each activeSession.exercises as exercise (exercise.tempId)}
      <ExerciseBlock {exercise} />
    {/each}

    <!-- Session stats strip -->
    {#if totalSets > 0}
      <div class="flex gap-4 mb-4 px-1">
        <div class="text-body-sm" style="color: var(--color-tertiary);">{totalSets} working sets</div>
        {#if prCount > 0}
          <div class="text-body-sm" style="color: var(--color-accent);">★ {prCount} PR{prCount > 1 ? 's' : ''}</div>
        {/if}
      </div>
    {/if}
  {/if}

  <!-- Add exercise -->
  <button
    onclick={() => showPicker = true}
    class="w-full flex items-center justify-center gap-2 py-4 rounded-xl transition-fast"
    style="background: var(--color-raised); border: 1.5px dashed var(--color-border); color: var(--color-tertiary);"
  >
    <span style="font-size: 1.25rem;">+</span>
    <span class="text-body-sm">Add Exercise</span>
  </button>

  <!-- Discard -->
  <button onclick={discard} class="w-full mt-4 text-body-sm py-3" style="color: var(--color-error);">
    Discard session
  </button>
</div>

<!-- Rest timer -->
<RestTimer />

<!-- Exercise picker sheet -->
{#if showPicker}
  <ExerciseSearch onselect={addExercise} onclose={() => showPicker = false} />
{/if}

<!-- Finish sheet -->
{#if showFinish}
  <div class="sheet-backdrop" onclick={() => showFinish = false} role="button" tabindex="-1" onkeydown={() => {}}></div>
  <div class="sheet px-4 py-6" style="padding-bottom: max(env(safe-area-inset-bottom), 32px);">
    <h2 class="text-display-sm mb-4">Finish Session?</h2>

    <div class="mb-4">
      <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">Duration</div>
      <div class="text-data-md tabular" style="color: var(--color-primary);">{fmtDuration(elapsed)}</div>
    </div>

    <div class="mb-4">
      <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">Working sets</div>
      <div class="text-data-md tabular" style="color: var(--color-primary);">{totalSets}</div>
    </div>

    {#if prCount > 0}
      <div class="mb-4 px-4 py-3 rounded-xl surface-accent">
        <div class="text-body-sm" style="color: var(--color-accent);">★ {prCount} Personal Record{prCount > 1 ? 's' : ''} this session</div>
      </div>
    {/if}

    <div class="mb-6">
      <div class="text-label-sm mb-2" style="color: var(--color-tertiary);">Session Notes (optional)</div>
      <textarea
        bind:value={sessionNotes}
        placeholder="How did it go? Any notes..."
        rows="3"
        class="w-full px-3 py-3 rounded-lg text-body-md"
        style="background: var(--color-elevated); border: 1.5px solid var(--color-border); color: var(--color-primary); resize: none; outline: none;"
      ></textarea>
    </div>

    <button onclick={finish} disabled={finishing} class="btn btn-primary mb-3">
      {finishing ? 'Saving...' : 'Save Session'}
    </button>
    <button onclick={() => showFinish = false} class="btn btn-ghost w-full">
      Keep going
    </button>
  </div>
{/if}
