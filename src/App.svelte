<script lang="ts">
  import Scene from './lib/Scene.svelte'
  import type { BrandVariant } from './lib/brand'

  const variant: BrandVariant = /(?:^|\/)keycard(?:\/index\.html)?\/?$/.test(window.location.pathname) ? 'keycard' : 'doppel'
</script>

<main aria-label="Announce landing page">
  <Scene {variant} />
</main>
