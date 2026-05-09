<script lang="ts">
  import { db, type Exercise, type TrainingRole } from '$lib/db';

  let {
    onselect,
    onclose
  }: {
    onselect: (ex: Exercise) => void;
    onclose: () => void;
  } = $props();

  let query        = $state('');
  let exercises    = $state<Exercise[]>([]);
  let filtered     = $state<Exercise[]>([]);
  let catFilter    = $state('all');
  let roleFilter   = $state('all');
  let showCustom   = $state(false);

  // Custom exercise form
  let customName   = $state('');
  let customCat    = $state('push');
  let customRole   = $state<TrainingRole>('accessory');
  let customEquip  = $state('barbell');

  const categories = ['all','push','pull','legs','hinge','core','other'];
  const roles      = ['all','main','secondary','accessory','rehab_support','warmup'];

  $effect(() => {
    db.exercises.where('is_active').equals(1).sortBy('name').then(r => {
      exercises = r;
      applyFilter();
    });
  });

  function applyFilter() {
    let list = exercises;
    if (catFilter !== 'all')  list = list.filter(e => e.category === catFilter);
    if (roleFilter !== 'all') list = list.filter(e => e.training_role === roleFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(q) || e.primary_muscles.some(m => m.includes(q)));
    }
    filtered = list;
  }

  $effect(() => { query; catFilter; roleFilter; applyFilter(); });

  async function createCustom() {
    if (!customName.trim()) return;
    const id = await db.exercises.add({
      name: customName.trim(),
      slug: customName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: customCat,
      training_role: customRole,
      movement_pattern: 'other',
      primary_muscles: [],
      secondary_muscles: [],
      equipment: [customEquip],
      is_bilateral: true,
      is_bodyweight: false,
      default_bar_weight_kg: customEquip === 'barbell' ? 20 : 0,
      default_increment_kg: 2.5,
      is_system: false,
      is_active: true,
      notes: '',
      created_at: new Date().toISOString()
    });
    const created = await db.exercises.get(id);
    if (created) onselect(created);
  }

  const roleBadgeClass: Record<string, string> = {
    main: 'badge-main', secondary: 'badge-secondary',
    accessory: 'badge-accessory', rehab_support: 'badge-rehab', warmup: 'badge-warmup'
  };
</script>

<!-- Backdrop -->
<div class="sheet-backdrop" onclick={onclose} role="button" tabindex="-1" onkeydown={() => {}}></div>

<!-- Sheet -->
<div class="sheet" style="padding-bottom: max(env(safe-area-inset-bottom), 24px);">
  <div class="flex items-center justify-between px-4 pt-4 pb-2">
    <span class="text-display-sm">Add Exercise</span>
    <button onclick={onclose} class="btn btn-ghost" style="height:36px;padding:0 12px;">✕</button>
  </div>

  <!-- Search -->
  <div class="px-4 pb-2">
    <input
      bind:value={query}
      placeholder="Search exercises..."
      class="w-full px-3 py-3 rounded-lg text-body-md"
      style="background: var(--color-elevated); border: 1.5px solid var(--color-border); color: var(--color-primary); outline: none;"
      autofocus
    />
  </div>

  <!-- Category filters -->
  <div class="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-none">
    {#each categories as cat}
      <button
        onclick={() => catFilter = cat}
        class="badge whitespace-nowrap"
        style="cursor:pointer; border: 1px solid {catFilter === cat ? 'var(--color-accent)' : 'var(--color-border)'}; background: {catFilter === cat ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'var(--color-elevated)'}; color: {catFilter === cat ? 'var(--color-accent)' : 'var(--color-tertiary)'}; padding: 6px 12px; font-size: 0.75rem;"
      >{cat === 'all' ? 'All' : cat}</button>
    {/each}
  </div>

  <!-- List -->
  <div class="overflow-y-auto" style="max-height: 50dvh;">
    {#each filtered as ex (ex.id)}
      <button
        onclick={() => onselect(ex)}
        class="w-full flex items-center justify-between px-4 text-left transition-fast"
        style="min-height: 56px; border-bottom: 1px solid var(--color-border-subtle);"
      >
        <div>
          <div class="text-body-md" style="color: var(--color-primary);">{ex.name}</div>
          <div class="text-caption" style="color: var(--color-tertiary);">{ex.primary_muscles.slice(0,2).join(', ')}</div>
        </div>
        <span class="badge {roleBadgeClass[ex.training_role] ?? 'badge-accessory'}">{ex.training_role.replace('_',' ')}</span>
      </button>
    {/each}

    {#if filtered.length === 0}
      <div class="px-4 py-8 text-center" style="color: var(--color-tertiary);">
        <div class="text-body-md mb-4">No exercises found</div>
        <button onclick={() => showCustom = true} class="btn btn-secondary" style="width:auto;">
          + Create "{query || 'Custom'}"
        </button>
      </div>
    {/if}
  </div>

  <!-- Create custom -->
  <div class="px-4 pt-2 pb-2" style="border-top: 1px solid var(--color-border-subtle);">
    {#if showCustom}
      <div class="card-inner flex flex-col gap-3">
        <div class="text-label-sm" style="color: var(--color-tertiary);">Create Custom Exercise</div>
        <input bind:value={customName} placeholder="Exercise name" class="w-full px-3 py-2 rounded-lg text-body-md" style="background:var(--color-elevated);border:1.5px solid var(--color-border);color:var(--color-primary);outline:none;"/>
        <div class="flex gap-2">
          <select bind:value={customCat} class="flex-1 px-3 py-2 rounded-lg text-body-sm" style="background:var(--color-elevated);border:1px solid var(--color-border);color:var(--color-primary);">
            {#each ['push','pull','legs','hinge','core','other'] as c}<option value={c}>{c}</option>{/each}
          </select>
          <select bind:value={customRole} class="flex-1 px-3 py-2 rounded-lg text-body-sm" style="background:var(--color-elevated);border:1px solid var(--color-border);color:var(--color-primary);">
            {#each ['main','secondary','accessory','rehab_support','warmup'] as r}<option value={r}>{r.replace('_',' ')}</option>{/each}
          </select>
        </div>
        <select bind:value={customEquip} class="w-full px-3 py-2 rounded-lg text-body-sm" style="background:var(--color-elevated);border:1px solid var(--color-border);color:var(--color-primary);">
          {#each ['barbell','dumbbell','cable','machine','bodyweight','kettlebell','other'] as eq}<option value={eq}>{eq}</option>{/each}
        </select>
        <button onclick={createCustom} class="btn btn-primary" style="height:48px;">Create & Add</button>
      </div>
    {:else}
      <button onclick={() => showCustom = true} class="w-full flex items-center gap-2 py-3" style="color: var(--color-tertiary);">
        <span style="font-size:1.25rem;">+</span>
        <span class="text-body-sm">Create custom exercise</span>
      </button>
    {/if}
  </div>
</div>
