<script lang="ts">
  import { onMount } from 'svelte'
  import { createKeycardScene, KEYCARD_STAGES } from './keycard-scene'

  let canvas: HTMLCanvasElement
  let failed = $state(false)
  let ready = $state(false)
  let stage = $state(0)
  let controller: Awaited<ReturnType<typeof createKeycardScene>>

  onMount(() => {
    const abort = new AbortController()
    createKeycardScene(canvas, abort.signal, (index) => { stage = index }).then((scene) => {
      if (abort.signal.aborted) scene?.dispose()
      else { controller = scene; ready = !!scene }
    }).catch((error: unknown) => {
      if (!abort.signal.aborted) {
        failed = true
        console.error('Keycard scene could not load.', error)
      }
    })
    return () => { abort.abort(); controller?.dispose() }
  })
</script>

<svelte:head><title>DeepTrust × Keycard</title></svelte:head>

<main class="keycard-opening" aria-label="DeepTrust's next chapter with Keycard">
  <canvas bind:this={canvas} role="img" aria-label="A Keycard lies on a dark grid while a glowing blue laser from off-screen etches DeepTrust into its center as flat circuit lines. A shockwave expands, the card lifts upright, spins six times, then reveals the original Keycard K and KEYCARD.AI artwork in its final hero view." />
  {#if failed}<p class="error" role="alert">The card could not load. Please refresh to try again.</p>{/if}
  <nav class="playback" aria-label="Keycard scene playback">
    <div class="playback-label"><span>{String(stage + 1).padStart(2, '0')} / {String(KEYCARD_STAGES.length).padStart(2, '0')}</span><span>{KEYCARD_STAGES[stage]!.name}</span></div>
    <div class="playback-actions">
      <button disabled={!ready || stage === 0} onclick={() => controller?.playFrom(stage - 1)}>Previous</button>
      <button disabled={!ready} aria-label="Restart current scene" onclick={() => controller?.playFrom(stage)}>Restart</button>
      <button disabled={!ready || stage === KEYCARD_STAGES.length - 1} onclick={() => controller?.playFrom(stage + 1)}>Next</button>
    </div>
  </nav>
</main>

<style>
  .keycard-opening { position: relative; width: 100%; height: 100dvh; overflow: hidden; background: #030b10; }
  canvas { display: block; width: 100%; height: 100%; }
  .error { position: absolute; inset: 45% 1.5rem auto; text-align: center; color: #c5d2d9; font: 0.875rem 'Keycard Geist', sans-serif; }
  .playback { position: absolute; right: max(1rem, env(safe-area-inset-right)); bottom: max(1rem, env(safe-area-inset-bottom)); padding: .9rem 1rem; border: 1px solid #9eb5ca29; border-radius: 7px; background: #071017d9; color: #d1dee6; backdrop-filter: blur(14px); font-family: 'Keycard Mono', monospace; }
  .playback-label { display: flex; justify-content: space-between; gap: 1.5rem; color: #90a4b2; font-size: .625rem; }
  .playback-label span:first-child { color: #b5d6e2; }
  .playback-actions { display: flex; gap: .45rem; margin-top: .7rem; }
  button { min-height: 2.2rem; padding: .45rem .7rem; border: 1px solid #b8ced333; border-radius: 3px; background: transparent; color: inherit; font: .6875rem 'Keycard Mono', monospace; cursor: pointer; }
  button:hover:enabled { border-color: #c3e677; color: #c3e677; }
  button:disabled { opacity: .3; cursor: default; }
  button:focus-visible { outline: 2px solid #c3e677; outline-offset: 3px; }
  @media (max-width: 480px) { .playback { padding: .7rem; } button { min-height: 2.75rem; } }
</style>
