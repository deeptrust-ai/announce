<script lang="ts">
  import { onMount } from 'svelte'
  import { createKeycardScene, KEYCARD_STAGES } from './keycard-scene'
  import { ANNOUNCEMENT_TEXT, announcementState } from './announcement'

  let canvas: HTMLCanvasElement
  let failed = $state(false)
  let ready = $state(false)
  let stage = $state(0)
  let announcementProgress = $state(0)
  let openingOpacity = $state(0)
  const reveal = $derived(announcementState(announcementProgress))
  const assets = `${import.meta.env.BASE_URL}branding/`
  const pressRelease = 'https://deeptrust.ai/press-release'
  let controller: Awaited<ReturnType<typeof createKeycardScene>>

  onMount(() => {
    const abort = new AbortController()
    createKeycardScene(
      canvas, abort.signal,
      (index) => { stage = index },
      (progress) => { announcementProgress = progress },
      (opacity) => { openingOpacity = opacity },
    ).then((scene) => {
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
  <canvas bind:this={canvas} style:opacity={openingOpacity} role="img" aria-label="A moving side view fades in over a Keycard on a dark grid. A glowing blue laser etches the original DeepTrust mark while the camera cranes upward. The shockwave gives the card a small rattle and a brief orange-and-yellow launch flash, then it jumps and spins, finishing with the original Keycard artwork facing the camera." />
  <section class="editorial" style:--reveal={reveal.deeptrustOpacity} aria-label="Acquisition announcement" aria-hidden={!ready || announcementProgress === 0}>
    <div class="editorial-copy">
      <h1 aria-label="DeepTrust is now a part of Keycard">
        <img class="deeptrust-wordmark" src={`${assets}logo-full.svg`} width="173" height="28" alt="" />
        <span class="joining" aria-hidden="true"><span class="reserve">{ANNOUNCEMENT_TEXT}</span><span>{ANNOUNCEMENT_TEXT.slice(0, reveal.characters)}</span></span>
        <span class="keycard-lockup" style:opacity={reveal.doppelOpacity} aria-hidden="true"><img src={`${assets}keycard/wordmark.svg`} width="599" height="158" alt="" /></span>
      </h1>
      <a class="press-release" href={pressRelease} target="_blank" rel="noopener noreferrer" style:opacity={reveal.pressReleaseOpacity} style:visibility={reveal.pressReleaseOpacity > 0 ? 'visible' : 'hidden'} style:pointer-events={reveal.pressReleaseOpacity === 1 ? 'auto' : 'none'} tabindex={reveal.pressReleaseOpacity === 1 ? 0 : -1}>Read the Press Release <span aria-hidden="true">→</span></a>
    </div>
  </section>
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
  .editorial { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: clamp(.75rem, 1.5vw, 1.5rem); padding: clamp(1.5rem, 4vw, 5rem); background: linear-gradient(90deg, #030b10bd, #030b103d 48%, transparent 78%); pointer-events: none; opacity: var(--reveal); }
  .editorial-copy { grid-column: 1 / span 5; align-self: center; transform: translateY(calc(16px - var(--reveal) * 16px)); }
  h1 { display: grid; justify-items: start; gap: clamp(1.5rem, 3.75vh, 3rem); margin: 0; color: #ecf3f5; font: 400 clamp(1.125rem, 2.2vw, 2rem)/1.25 'Keycard Geist', Arial, sans-serif; letter-spacing: -.025em; }
  h1 img { display: block; height: auto; max-width: 100%; }
  .deeptrust-wordmark { width: clamp(11rem, 19vw, 19rem); }
  .joining { display: inline-grid; white-space: pre; color: #b8c8d2; }
  .joining span { grid-area: 1 / 1; }
  .reserve { visibility: hidden; }
  .keycard-lockup { display: block; max-width: 100%; }
  .keycard-lockup img { width: clamp(12rem, 23vw, 21rem); min-width: 0; }
  .press-release { display: inline-flex; align-items: center; justify-content: space-between; gap: 1.5rem; max-width: 100%; min-height: 3rem; margin-top: clamp(3rem, 7vh, 5rem); padding: .85rem 1.125rem; border: 1px solid #c5d6df88; background: transparent; color: #e1edf2; font: 400 .875rem 'Keycard Geist', Arial, sans-serif; text-decoration: none; }
  .press-release:hover { border-color: #c3e677; color: #c3e677; }
  .press-release:focus-visible { outline: 2px solid #c3e677; outline-offset: 4px; }
  @media (max-aspect-ratio: 17/20) {
    .editorial { --mobile-gutter: clamp(1.25rem, 5vw, 2rem); display: flex; padding: 0; background: linear-gradient(transparent 45%, #030b1073); }
    .editorial-copy { grid-column: auto; position: absolute; left: var(--mobile-gutter); right: var(--mobile-gutter); top: 50%; max-width: 30rem; margin-inline: auto; display: flex; flex-direction: column; align-items: center; text-align: center; }
    h1 { width: 100%; justify-items: center; gap: clamp(.65rem, 1.7dvh, 1.05rem); font-size: clamp(1rem, 4vw, 1.3rem); }
    .deeptrust-wordmark { width: clamp(10.5rem, 52vw, 15rem); max-width: 85%; }
    .keycard-lockup { display: flex; justify-content: center; width: min(100%, 20rem); }
    .keycard-lockup img { width: min(66vw, 16rem); }
    .press-release { width: min(100%, 22rem); margin-top: clamp(1.25rem, 3dvh, 2rem); min-height: 3rem; padding: .8rem 1rem; font-size: .875rem; }
  }
  @media (max-height: 700px) and (max-aspect-ratio: 17/20) {
    .editorial-copy { top: 43%; }
    h1 { gap: .8rem; }
    .deeptrust-wordmark { width: 10.5rem; }
    .keycard-lockup img { width: 12rem; }
    .press-release { margin-top: 1.25rem; }
  }
  @media (max-height: 600px) and (min-aspect-ratio: 17/20) {
    h1 { gap: .8rem; }
    .deeptrust-wordmark { width: 11rem; }
    .keycard-lockup img { width: 12rem; }
    .press-release { margin-top: 1.5rem; }
  }
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
  @media (max-aspect-ratio: 17/20) {
    .playback { left: max(1rem, env(safe-area-inset-left)); right: max(1rem, env(safe-area-inset-right)); bottom: max(.75rem, env(safe-area-inset-bottom)); max-width: 28rem; margin-inline: auto; padding: .65rem .75rem; }
    .playback-label { gap: .75rem; font-size: .5625rem; }
    .playback-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; margin-top: .5rem; }
    .playback-actions button { min-width: 0; min-height: 2.5rem; padding-inline: .4rem; }
  }
</style>
