<script lang="ts">
  import { onMount } from 'svelte'
  import { createScene } from './scene'

  let canvas: HTMLCanvasElement
  let unavailable = $state(false)

  onMount(() => {
    try {
      return createScene(canvas)
    } catch (error) {
      console.error('Unable to start the Three.js scene.', error)
      unavailable = true
    }
  })
</script>

<div class="scene">
  <canvas
    bind:this={canvas}
    aria-label="A slowly rotating teal wireframe sculpture surrounded by stars"
  ></canvas>
  {#if unavailable}
    <p role="status">This scene needs a browser with WebGL 2 enabled.</p>
  {/if}
</div>

<style>
  .scene {
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse at center, #102638, #060b13 70%);
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  p {
    position: absolute;
    inset: 50% 1.5rem auto;
    margin: 0;
    text-align: center;
  }
</style>
