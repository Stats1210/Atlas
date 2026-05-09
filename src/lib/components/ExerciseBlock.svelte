<script lang="ts">
  import { activeSession, type LiveExercise, type LiveSet } from '$lib/stores/activeSession.svelte';
  import { fmtWeight } from '$lib/utils/format';
  import { settings } from '$lib/stores/settings.svelte';
  import SetRow from './SetRow.svelte';

  let { exercise }: { exercise: LiveExercise } = $props();

  let showMenu = $state(false);

  const roleBadgeClass: Record<string, string> = {
    main: 'badge-main', secondary: 'badge-secondary',
    accessory: 'badge-accessory', rehab_support: 'badge-rehab', warmup: 'badge-warmup'
  };

  const prevLabel = $derived(
    exercise.previousSets.length > 0
      ? exercise.previousSets
          .filter(s => s.weight_kg !== null)
          .map(s => fmtWeight(s.weight_kg, settings.unit))
          .join(' · ')
      : null
  );

  function update(setTempId: string, patch: Partial<LiveSet>) {
    activeSession.updateSet(exercise.tempId, setTempId, patch);
  }
  function confirm(setTempId: string) {
    activeSession.confirmSet(exercise.tempId, setTempId);
  }
  function remove(setTempId: string) {
    activeSession.removeSet(exercise.tempId, setTempId);
  }
</script>

<div class="card mb-3" style="padding: 0; overflow: hidden;">
  <!-- Header -->
  <div class="flex items-start justify-between px-4 pt-3 pb-2">
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-body-lg font-semibold" style="color: var(--color-primary);">{exercise.exercise_name}</span>
        <span class="badge {roleBadgeClass[exercise.training_role] ?? 'badge-accessory'}">{exercise.training_role.replace('_',' ')}</span>
      </div>
      {#if prevLabel}
        <div class="text-caption mt-1" style="color: var(--color-tertiary);">
          Last: {prevLabel} {settings.unit}
        </div>
      {:else}
        <div class="text-caption mt-1" style="color: var(--color-disabled);">No previous data</div>
      {/if}
    </div>

    <!-- Options -->
    <div class="relative flex-shrink-0">
      <button
        onclick={() => showMenu = !showMenu}
        class="flex items-center justify-center rounded-lg"
        style="width: 36px; height: 36px; color: var(--color-tertiary);"
        aria-label="Exercise options"
      >⋯</button>

      {#if showMenu}
        <!-- Backdrop -->
        <div class="fixed inset-0 z-40" onclick={() => showMenu = false} role="presentation"></div>
        <div class="absolute right-0 top-10 z-50 rounded-xl overflow-hidden shadow-lg" style="background: var(--color-raised); border: 1px solid var(--color-border); min-width: 180px;">
          {#each [
            { label: '+ Working set',  action: () => { activeSession.addSet(exercise.tempId, 'working'); showMenu = false; } },
            { label: '+ Warm-up set',  action: () => { activeSession.addSet(exercise.tempId, 'warmup'); showMenu = false; } },
            { label: '+ Back-off set', action: () => { activeSession.addSet(exercise.tempId, 'back_off'); showMenu = false; } },
            { label: '+ Drop set',     action: () => { activeSession.addSet(exercise.tempId, 'drop_set'); showMenu = false; } },
            { label: 'Duplicate last', action: () => { activeSession.duplicateLastSet(exercise.tempId); showMenu = false; } },
          ] as item}
            <button onclick={item.action} class="w-full text-left px-4 py-3 text-body-sm transition-fast" style="color: var(--color-secondary); border-bottom: 1px solid var(--color-border-subtle);">
              {item.label}
            </button>
          {/each}
          <button
            onclick={() => { activeSession.removeExercise(exercise.tempId); showMenu = false; }}
            class="w-full text-left px-4 py-3 text-body-sm"
            style="color: var(--color-error);"
          >Remove exercise</button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Column headers -->
  <div class="flex items-center gap-2 px-4 pb-1" style="border-bottom: 1px solid var(--color-border-subtle);">
    <div class="w-7 text-label-sm" style="color: var(--color-disabled);">SET</div>
    <div class="flex-1 text-label-sm" style="color: var(--color-disabled);">WEIGHT</div>
    <div class="w-12 text-label-sm text-center" style="color: var(--color-disabled);">REPS</div>
    <div class="w-14"></div>
  </div>

  <!-- Set rows -->
  {#each exercise.sets as set (set.tempId)}
    <SetRow
      {set}
      exTempId={exercise.tempId}
      onupdate={(patch) => update(set.tempId, patch)}
      onconfirm={() => confirm(set.tempId)}
      onremove={() => remove(set.tempId)}
    />
  {/each}

  <!-- Quick-add row -->
  <div class="flex gap-2 px-4 py-2" style="border-top: 1px solid var(--color-border-subtle);">
    <button
      onclick={() => activeSession.addSet(exercise.tempId, 'working')}
      class="text-body-sm flex items-center gap-1 py-2 px-3 rounded-lg"
      style="color: var(--color-tertiary); background: var(--color-elevated);"
    >+ Set</button>
    <button
      onclick={() => activeSession.addSet(exercise.tempId, 'warmup')}
      class="text-body-sm flex items-center gap-1 py-2 px-3 rounded-lg"
      style="color: var(--color-tertiary); background: var(--color-elevated);"
    >+ Warm-up</button>
    <button
      onclick={() => activeSession.duplicateLastSet(exercise.tempId)}
      class="text-body-sm flex items-center gap-1 py-2 px-3 rounded-lg"
      style="color: var(--color-tertiary); background: var(--color-elevated);"
    >⎘ Duplicate</button>
  </div>
</div>
