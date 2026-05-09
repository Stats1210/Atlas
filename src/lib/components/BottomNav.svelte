<script lang="ts">
  import { page } from '$app/stores';

  const tabs = [
    { href: '/',          label: 'Log',      icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { href: '/history',   label: 'History',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { href: '/analytics', label: 'Analyse',  icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
    { href: '/cardio',    label: 'Cardio',   icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { href: '/settings',  label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
  ];
</script>

<nav class="fixed bottom-0 left-0 right-0 z-30 pb-safe" style="background: var(--color-raised); border-top: 1px solid var(--color-border-subtle);">
  <div class="flex">
    {#each tabs as tab}
      {@const active = $page.url.pathname === tab.href || ($page.url.pathname.startsWith(tab.href) && tab.href !== '/')}
      <a
        href={tab.href}
        class="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-fast"
        style="color: {active ? 'var(--color-accent)' : 'var(--color-tertiary)'}; min-height: 64px;"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d={tab.icon}/>
        </svg>
        <span style="font-size: 0.625rem; font-weight: {active ? '600' : '400'}; letter-spacing: 0.03em;">
          {tab.label}
        </span>
      </a>
    {/each}
  </div>
</nav>
