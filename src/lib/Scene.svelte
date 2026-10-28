<script lang="ts">
  import { onMount } from 'svelte'
  import { createScene } from './scene'
  import type { SceneController } from './scene'
  import { TRANSITIONS, startingTransition } from './timeline'
  import type { TransitionId } from './timeline'

  let canvas: HTMLCanvasElement
  let status = $state<'loading' | 'ready' | 'error'>('loading')
  let errorMessage = $state('')
  let currentTransition = $state<TransitionId>('camera')
  let controller: SceneController | undefined

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
  <nav class="transitions" aria-label="Animation transitions">
    <h2>Preview transitions</h2>
    <ol>
      {#each TRANSITIONS as transition}
        <li>
          <button
            type="button"
            disabled={status !== 'ready'}
            aria-current={currentTransition === transition.id ? 'step' : undefined}
            onclick={() => playTransition(transition.id)}
          >
            <span>{transition.name}</span>
            <span class="duration">{Number(transition.duration.toFixed(1))} s</span>
          </button>
        </li>
      {/each}
    </ol>
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

  p {
    position: absolute;
    inset: 50% 1.5rem auto;
    margin: 0;
    text-align: center;
    pointer-events: none;
  }

  .transitions {
    position: absolute;
    top: 1.25rem;
    left: 1.25rem;
    width: 13.5rem;
    max-width: calc(100% - 2.5rem);
    padding: 0.75rem;
    border: 1px solid #314359;
    border-radius: 0.75rem;
    background: rgb(8 13 20 / 92%);
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgb(0 0 0 / 20%);
  }

  h2 {
    margin: 0 0 0.5rem;
    padding: 0 0.5rem;
    color: #9bafc6;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  ol {
    display: grid;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    padding: 0.65rem 0.5rem;
    border: 1px solid transparent;
    border-radius: 0.4rem;
    background: transparent;
    color: #e0eaf5;
    font: inherit;
    font-size: 0.8rem;
    text-align: left;
    cursor: pointer;
  }

  button:hover:enabled {
    background: #152338;
  }

  button[aria-current='step'] {
    border-color: #3e6eac;
    background: #102648;
  }

  button:focus-visible {
    outline: 2px solid #a6cdff;
    outline-offset: 2px;
  }

  button:disabled {
    opacity: 0.5;
    cursor: wait;
  }

  .duration {
    color: #a6bdd8;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
</style>
