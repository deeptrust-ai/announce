<script lang="ts">
  import { onMount } from 'svelte'
  import { createScene } from './scene'

  let canvas: HTMLCanvasElement
  let status = $state<'loading' | 'ready' | 'error'>('loading')
  let errorMessage = $state('')

  onMount(() => {
    try {
      return createScene(canvas, {
        onReady: () => {
          status = 'ready'
        },
        onError: (error) => {
          console.error('Unable to load the hub model.', error)
          errorMessage = 'The hub model could not be loaded. Reload the page to try again.'
          status = 'error'
        },
      })
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
    aria-label="A three-dimensional hub network resting on a dark floor"
    title="Drag to orbit. Scroll or pinch to zoom."
  ></canvas>
  {#if status !== 'ready'}
    <p role="status">{status === 'loading' ? 'Loading hub…' : errorMessage}</p>
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
</style>
