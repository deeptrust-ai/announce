<script lang="ts">
  import { onMount } from 'svelte'
  import { createScene } from './scene'
  import type { SceneController } from './scene'
  import { TRANSITIONS, startingTransition } from './timeline'
  import type { TransitionId } from './timeline'
  import { ANNOUNCEMENT_TEXT, announcementState } from './announcement'

  let canvas: HTMLCanvasElement
  let status = $state<'loading' | 'ready' | 'error'>('loading')
  let errorMessage = $state('')
  let currentTransition = $state<TransitionId>('camera')
  let announcementProgress = $state(0)
  const reveal = $derived(announcementState(announcementProgress))
  let controller: SceneController | undefined
  const brandingBase = `${import.meta.env.BASE_URL}branding/`
  const pressReleaseUrl = 'https://deeptrust.ai/press-release'
  const transitionIndex = $derived(Math.max(0, TRANSITIONS.findIndex((item) => item.id === currentTransition)))
  const current = $derived(TRANSITIONS[transitionIndex]!)

  function stepTransition(direction: -1 | 1) {
    const next = TRANSITIONS[transitionIndex + direction]
    if (next) playTransition(next.id)
  }

  function playTransition(transition: TransitionId) {
    const url = new URL(window.location.href)
    if (transition === 'camera') url.searchParams.delete('start')
    else url.searchParams.set('start', transition)
    window.history.replaceState(window.history.state, '', url)
    controller?.playFrom(transition)
  }

  onMount(() => {
    try {
      currentTransition = startingTransition(window.location.search)
      controller = createScene(canvas, {
        onReady: () => {
          status = 'ready'
        },
        onError: (error) => {
          console.error('Unable to load the scene models.', error)
          errorMessage = 'The scene models could not be loaded. Reload the page to try again.'
          status = 'error'
        },
        onTransition: (transition) => {
          currentTransition = transition
        },
        onAnnouncement: (progress) => {
          announcementProgress = progress
        },
      })
      return () => {
        controller?.dispose()
        controller = undefined
      }
    } catch (error) {
      console.error('Unable to start the Three.js scene.', error)
      errorMessage = 'This scene needs a browser with WebGL 2 enabled.'
      status = 'error'
    }
  })
</script>

<div class="scene" aria-busy={status === 'loading'}>
  <canvas
    bind:this={canvas}
    aria-label="The DeepTrust logo becoming a blue card, drawing a connection south, and drifting toward the hub with gravitational lensing around both objects"
  ></canvas>
  <section
    class="editorial"
    style:--reveal={reveal.deeptrustOpacity}
    aria-label="Announcement"
    aria-hidden={status !== 'ready' || announcementProgress === 0}
  >
    <div class="editorial-copy">
      <h1 aria-label="Deep Trust is now a part of Doppel">
        <img class="deeptrust-logo" src={`${brandingBase}logo-full.svg`} alt="" width="173" height="28" />
        <span class="joining" aria-hidden="true">
          <span class="joining-reserve">{ANNOUNCEMENT_TEXT}</span>
          <span class="joining-typed">{ANNOUNCEMENT_TEXT.slice(0, reveal.characters)}</span>
        </span>
        <img class="doppel-logo" style:opacity={reveal.doppelOpacity} src={`${brandingBase}doppel-lockup.svg`} alt="" width="146" height="32" />
      </h1>
      <a
        class="press-release"
        href={pressReleaseUrl}
        target="_blank"
        rel="noopener noreferrer"
        style:opacity={reveal.pressReleaseOpacity}
        style:visibility={reveal.pressReleaseOpacity > 0 ? 'visible' : 'hidden'}
        style:pointer-events={reveal.pressReleaseOpacity === 1 ? 'auto' : 'none'}
        tabindex={reveal.pressReleaseOpacity === 1 ? 0 : -1}
      >Read the Press Release <span aria-hidden="true">=&gt;</span></a>

    </div>
  </section>
  <nav class="transition-controls" aria-label="Animation transitions">
    <div class="current-transition">
      <span class="transition-count">{String(transitionIndex + 1).padStart(2, '0')} / {String(TRANSITIONS.length).padStart(2, '0')}</span>
      <span>{current.name}</span>
    </div>
    <div class="transition-actions">
      <button type="button" disabled={status !== 'ready' || transitionIndex === 0} onclick={() => stepTransition(-1)}>Back</button>
      <button type="button" disabled={status !== 'ready'} aria-label="Restart current transition" onclick={() => playTransition(currentTransition)}>Restart</button>
      <button type="button" disabled={status !== 'ready' || transitionIndex === TRANSITIONS.length - 1} onclick={() => stepTransition(1)}>Next</button>
    </div>
  </nav>
  {#if status !== 'ready'}
    <p role="status">{status === 'loading' ? 'Loading scene…' : errorMessage}</p>
  {/if}
</div>

<style>
  .scene {
    position: fixed;
    inset: 0;
    background: #080d14;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  .editorial {
    --page-margin: clamp(1.5rem, 4vw, 5rem);
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: clamp(0.75rem, 1.5vw, 1.5rem);
    padding: var(--page-margin);
    background: linear-gradient(90deg, rgb(8 13 20 / 76%), rgb(8 13 20 / 24%) 48%, transparent 78%);
    pointer-events: none;
    opacity: var(--reveal);
  }

  .editorial-copy {
    grid-column: 1 / span 5;
    align-self: center;
    transform: translateY(calc(16px - var(--reveal) * 16px));
  }

  h1 {
    display: grid;
    justify-items: start;
    gap: clamp(1.5rem, 3.75vh, 3rem);
    margin: 0;
    color: #f3f7ff;
    text-align: left;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: clamp(1.125rem, 2.2vw, 2rem);
    font-weight: 500;
    line-height: 1.25;
    letter-spacing: -0.025em;
  }

  h1 img {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .deeptrust-logo {
    width: clamp(11rem, 19vw, 19rem);
  }

  .joining {
    display: inline-grid;
    color: #c6d0db;
    font-weight: 400;
    white-space: pre;
  }

  .joining span { grid-area: 1 / 1; }
  .joining-reserve { visibility: hidden; }

  .doppel-logo {
    width: clamp(11.25rem, 21vw, 21.75rem);
    filter: brightness(0) invert(1);
  }

  .press-release {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    max-width: 100%;
    min-height: 3rem;
    margin-top: clamp(1.5rem, 3.75vh, 3rem);
    padding: 0.85rem 1.125rem;
    border: 1px solid #e7eef6;
    background: #e7eef6;
    color: #080d14;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
  }

  .press-release:not(:disabled):hover {
    background: #e6ffb5;
    border-color: #e6ffb5;
  }

  .press-release:focus-visible {
    outline: 2px solid #e6ffb5;
    outline-offset: 4px;
  }


  p {
    position: absolute;
    inset: 50% 1.5rem auto;
    margin: 0;
    text-align: center;
    pointer-events: none;
  }

  .transition-controls {
    position: absolute;
    right: clamp(1rem, 2vw, 2rem);
    bottom: clamp(1rem, 2vw, 2rem);
    width: min(19rem, calc(100% - 2rem));
    border: 1px solid #314359;
    background: rgb(8 13 20 / 88%);
    backdrop-filter: blur(12px);
  }

  .current-transition {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    padding: 0.7rem 0.8rem;
    border-bottom: 1px solid #314359;
    color: #c5d3e1;
    font-size: 0.7rem;
  }

  .transition-count {
    color: #8398ad;
    font-variant-numeric: tabular-nums;
  }

  .transition-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  button {
    min-height: 2.75rem;
    border: 0;
    background: transparent;
    color: #e0eaf5;
    font: inherit;
    font-size: 0.75rem;
    cursor: pointer;
  }

  button + button {
    border-left: 1px solid #314359;
  }

  button:hover:enabled {
    background: #152338;
  }

  button:focus-visible {
    outline: 2px solid #a6cdff;
    outline-offset: -3px;
  }

  button:disabled {
    opacity: 0.35;
    cursor: default;
  }

  @media (max-width: 640px) {
    .editorial {
      grid-template-columns: repeat(6, minmax(0, 1fr));
      background: linear-gradient(90deg, rgb(8 13 20 / 78%), rgb(8 13 20 / 30%) 65%, transparent);
    }

    .editorial-copy {
      grid-column: 1 / -1;
      max-width: 85%;
      align-self: start;
      margin-top: 8vh;
    }

    h1 {
      gap: 1.125rem;
    }

    .deeptrust-logo { width: 11rem; }
    .doppel-logo { width: min(12.75rem, 75%); }
  }

  @media (max-height: 500px) {
    h1 { font-size: 1.125rem; gap: 0.75rem; }
    .deeptrust-logo { width: 9rem; }
    .doppel-logo { width: 9rem; }
  }
</style>
