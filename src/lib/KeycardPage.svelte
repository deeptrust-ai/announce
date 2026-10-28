<script lang="ts">
  import { onMount } from 'svelte'

  const assets = `${import.meta.env.BASE_URL}branding/`
  const pressRelease = 'https://deeptrust.ai/press-release'
  const joining = 'is now a part of'
  const phases = [
    { id: 'card', name: 'Keycard arrival', start: 0 },
    { id: 'identity', name: 'DeepTrust', start: 0.6 },
    { id: 'join', name: 'A new chapter', start: 1.35 },
    { id: 'release', name: 'Read the release', start: 3.62 },
  ] as const
  const duration = 4.22
  const ease = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t) }
  let elapsed = $state(0)
  let reducedMotion = $state(false)
  let pitch = $state(0), yaw = $state(0)
  let shineX = $state(50), shineY = $state(35)
  let page: HTMLDivElement
  let frame = 0
  let previous: number | undefined
  const phaseIndex = $derived(phases.reduce<number>((current, phase, index) => elapsed >= phase.start ? index : current, 0))
  const cardReveal = $derived(ease(elapsed / 1.1))
  const deeptrustReveal = $derived(ease((elapsed - 0.6) / 0.6))
  const characters = $derived(Math.max(0, Math.min(joining.length, Math.floor((elapsed - 1.35) / 0.07))))
  const keycardReveal = $derived(ease((elapsed - 2.67) / 0.7))
  const actionReveal = $derived(elapsed >= duration - 1e-6 ? 1 : ease((elapsed - 3.62) / 0.6))

  function requestFrame() { if (!frame && !document.hidden && elapsed < duration) frame = requestAnimationFrame(tick) }
  function tick(time: number) {
    frame = 0
    if (previous !== undefined) elapsed = Math.min(duration, elapsed + (time - previous) / 1000)
    previous = time
    requestFrame()
  }
  function play(index: number) {
    const phase = phases[index]
    if (!phase) return
    elapsed = reducedMotion ? duration : phase.start
    previous = undefined
    pitch = yaw = 0
    page?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
    const url = new URL(window.location.href)
    url.hash = ''
    if (index === 0) url.searchParams.delete('start')
    else url.searchParams.set('start', phase.id)
    window.history.replaceState(window.history.state, '', url)
    requestFrame()
  }
  function tilt(event: PointerEvent) {
    if (reducedMotion) return
    const rect = event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : null
    if (!rect) return
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    yaw = (x - 0.5) * 24
    pitch = (0.5 - y) * 18
    shineX = x * 100; shineY = y * 100
  }
  function rest() { pitch = yaw = 0; shineX = 50; shineY = 35 }
  function keyTilt(event: KeyboardEvent) {
    if (!event.key.startsWith('Arrow')) return
    event.preventDefault()
    if (event.key === 'ArrowLeft') yaw = Math.max(-18, yaw - 5)
    if (event.key === 'ArrowRight') yaw = Math.min(18, yaw + 5)
    if (event.key === 'ArrowUp') pitch = Math.min(14, pitch + 5)
    if (event.key === 'ArrowDown') pitch = Math.max(-14, pitch - 5)
  }

  onMount(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => { reducedMotion = preference.matches; if (reducedMotion) elapsed = duration; previous = undefined; requestFrame() }
    const visibility = () => { previous = undefined; if (document.hidden) { cancelAnimationFrame(frame); frame = 0 } else requestFrame() }
    const initial = phases.findIndex((phase) => phase.id === new URLSearchParams(window.location.search).get('start'))
    elapsed = phases[Math.max(initial, 0)]!.start
    updateMotion()
    preference.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', visibility)
    return () => { cancelAnimationFrame(frame); preference.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', visibility) }
  })
</script>

<svelte:head><title>DeepTrust × Keycard — A new chapter</title></svelte:head>

<div class="keycard-page" bind:this={page}>
  <header class="masthead">
    <a class="home" href="#chapter" aria-label="Back to announcement"><img src={`${assets}keycard/wordmark.svg`} width="599" height="158" alt="Keycard" /></a>
    <span class="masthead-note">A new chapter in trust</span>
    <a href="#together" class="chapter-link">Better together <span aria-hidden="true">↘</span></a>
  </header>

  <main class="page-content">
  <section class="hero" id="chapter" aria-label="DeepTrust joins Keycard">
    <div class="hero-copy">
      <div class="eyebrow" style:opacity={deeptrustReveal}><span class="status-dot"></span> Identity meets intelligence</div>
      <h1 aria-label="DeepTrust is now a part of Keycard">
        <img class="deeptrust-wordmark" style:opacity={deeptrustReveal} src={`${assets}logo-full.svg`} width="173" height="28" alt="" />
        <span class="joining" aria-hidden="true"><span class="reserve">{joining}</span><span>{joining.slice(0, characters)}</span></span>
        <img class="keycard-wordmark" style:opacity={keycardReveal} src={`${assets}keycard/wordmark.svg`} width="599" height="158" alt="" />
      </h1>
      <p class="hero-description" style:opacity={keycardReveal}>A new home for trusted intelligence.<br />A shared belief in what comes next.</p>
      <a class="press-release" href={pressRelease} target="_blank" rel="noopener noreferrer" style:opacity={actionReveal} style:visibility={actionReveal > 0 ? 'visible' : 'hidden'} tabindex={actionReveal === 1 ? 0 : -1} style:pointer-events={actionReveal === 1 ? 'auto' : 'none'}>Read the Press Release <span aria-hidden="true">→</span></a>
    </div>

    <figure class="hero-art" style:--arrival={cardReveal}>
      <div class="credential-aura"></div>
      <div class="card-arrival">
        <div class="card-float">
          <button class="credential" style:--pitch={`${pitch}deg`} style:--yaw={`${yaw}deg`} style:--shine-x={`${shineX}%`} style:--shine-y={`${shineY}%`} onpointermove={tilt} onpointerleave={rest} onpointercancel={rest} onblur={rest} onkeydown={keyTilt} onclick={rest} aria-label="Interactive Keycard. Move your pointer or use arrow keys to tilt; click to reset.">
            <img src={`${assets}keycard/credential-card.png`} width="504" height="792" alt="" fetchpriority="high" />
            <span class="card-foil"></span>
          </button>
        </div>
      </div>
      <figcaption style:opacity={keycardReveal}><span class="caption-line"></span> DeepTrust × Keycard <span class="caption-line"></span></figcaption>
    </figure>
    <a class="scroll-cue" href="#together">Our next chapter <span aria-hidden="true">↓</span></a>
  </section>

  <section class="next-chapter" id="together" aria-labelledby="together-title">
    <div class="section-copy">
      <span class="eyebrow">Better together</span>
      <h2 id="together-title">Trust, in<br /><span class="pearl-text">good company.</span></h2>
      <p>DeepTrust is joining Keycard.<br />The next chapter starts with the same thing that brought us here: trust.</p>
    </div>

    <div class="credential-stack" aria-label="DeepTrust joining Keycard, illustrated as a credential exchange">
      <div class="context-block">
        <div class="agent-avatar"><img src={`${assets}logo-mark.svg`} width="64" height="64" alt="DeepTrust" /></div>
        <div class="context-copy">
          <div class="context-title">Intelligence, <span>meet identity.</span></div>
          <div class="context-fields">
            <div><span class="field-label">Bringing</span><span>DeepTrust</span></div>
            <div><span class="field-label">Joining</span><span>Keycard</span></div>
          </div>
        </div>
      </div>
      <div class="edge-ticks"></div>
      <div class="issued-block">
        <div class="chip-rail"><span class="rail-pattern"></span><img src={`${assets}keycard/mark.svg`} width="39" height="34" alt="" /><span class="rail-pattern"></span></div>
        <div class="issued-body">
          <div class="issued-heading"><span>One shared future</span><span class="field-label">A new chapter</span></div>
          <ul class="trust-signals">
            <li><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M6 16v-1l3-2 3 2v1m3-7h3m-3 4h3" /></svg>Intelligence recognized</li>
            <li><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 8 4-1 9-7 5-7-5-1-9 8-4Z" /><path d="m8 12 3 3 5-6" /></svg>Trust connected</li>
            <li><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>A new chapter begins</li>
          </ul>
        </div>
      </div>
      <div class="edge-ticks"></div>
      <div class="resource-block">
        <div class="resource-row" aria-hidden="true">
          <div class="resource selected"><svg viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="4" /><path d="m11 11 9 9m-3-3 2-2m-5-1 2-2" /></svg></div>
          <div class="resource selected"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></svg></div>
          <div class="resource"><svg viewBox="0 0 24 24" fill="none"><path d="m12 3 8 5v8l-8 5-8-5V8l8-5Zm0 0v18M4 8l8 5 8-5" /></svg></div>
          <div class="resource selected"><img src={`${assets}keycard/chip.svg`} width="32" height="29" alt="" /></div>
          <div class="resource"><svg viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8m-8 4h8m-8 4h5" /></svg></div>
        </div>
        <p>Built on a shared belief in <strong>trust.</strong></p>
      </div>
    </div>
  </section>

  </main>
  <footer class="footer"><span>DeepTrust × Keycard</span><a href={pressRelease} target="_blank" rel="noopener noreferrer">Read the announcement <span aria-hidden="true">↗</span></a></footer>

  <nav class="playback" aria-label="Announcement playback">
    <div class="playback-label"><span>{String(phaseIndex + 1).padStart(2, '0')} / 04</span><span>{phases[phaseIndex]!.name}</span></div>
    <div class="playback-actions"><button disabled={phaseIndex === 0} onclick={() => play(phaseIndex - 1)}>Back</button><button aria-label="Restart current transition" onclick={() => play(phaseIndex)}>Restart</button><button disabled={phaseIndex === phases.length - 1} onclick={() => play(phaseIndex + 1)}>Next</button></div>
  </nav>
</div>

<style>
  .keycard-page {
    --ink: #030b10;
    --paper: #e5edf0;
    --muted: #a2b1ba;
    --lime: #c3e677;
    --line: rgb(183 209 222 / 13%);
    --margin: clamp(1.5rem, 5vw, 6rem);
    height: 100dvh;
    overflow: auto;
    scroll-behavior: smooth;
    color: var(--paper);
    background: radial-gradient(ellipse at 75% 22%, #10302a55, transparent 38%), radial-gradient(ellipse at 25% 65%, #161c334d, transparent 50%), var(--ink);
    font-family: 'Keycard Geist', Arial, sans-serif;
    isolation: isolate;
  }
  .keycard-page::before, .keycard-page::after { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: -1; }
  .keycard-page::before { background-image: linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: 56px 56px; opacity: 0.5; mask-image: linear-gradient(transparent, #000 24%, #000); }
  .keycard-page::after { z-index: 10; opacity: 0.055; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' opacity='.65' filter='url(%23noise)'/%3E%3C/svg%3E"); }
  a { color: inherit; text-decoration: none; }
  .page-content { height: auto; }
  button { font: inherit; }
  .masthead { min-height: 104px; margin: 0 var(--margin); display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; border-bottom: 1px solid var(--line); }
  .home img { display: block; width: 120px; height: auto; }
  .masthead-note, .eyebrow, .field-label, figcaption, .scroll-cue, .footer, .playback { font-family: 'Keycard Mono', monospace; }
  .masthead-note { color: #8e9ea7; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.12em; }
  .chapter-link { font-size: 0.75rem; color: #c6d3db; display: flex; gap: 1.5rem; }
  .hero { min-height: min(810px, calc(100dvh - 104px)); position: relative; display: grid; grid-template-columns: 1fr 1fr; align-items: center; column-gap: clamp(2rem, 5vw, 6rem); padding: 5rem var(--margin) 7rem; max-width: 1600px; margin: auto; }
  .hero-copy { max-width: 36rem; }
  .eyebrow { display: flex; align-items: center; gap: 0.7rem; color: var(--lime); font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.16em; line-height: 1.5; }
  .status-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 12px #c3e67766; }
  h1 { display: grid; justify-items: start; gap: clamp(1.25rem, 3vh, 2rem); margin: 2.25rem 0 0; font-size: clamp(1.2rem, 2.2vw, 2rem); font-weight: 400; letter-spacing: -0.035em; line-height: 1.2; }
  h1 img { height: auto; max-width: 100%; display: block; }
  .deeptrust-wordmark { width: clamp(12rem, 21vw, 20rem); }
  .keycard-wordmark { width: clamp(14rem, 26vw, 25rem); }
  .joining { display: inline-grid; color: #bdcbd2; white-space: pre; }
  .joining span { grid-area: 1 / 1; }
  .reserve { visibility: hidden; }
  .hero-description { margin: 2rem 0 0; color: var(--muted); line-height: 1.7; font-size: clamp(0.875rem, 1.1vw, 1rem); letter-spacing: -0.01em; }
  .press-release { display: inline-flex; align-items: center; gap: 2.25rem; min-height: 3.1rem; padding: 0.8rem 1.2rem; margin-top: 3rem; border: 1px solid #c4d4e466; border-radius: 3px; background: linear-gradient(115deg, #c6f3e906, #bd99ff0a); font-size: 0.8125rem; transition: color 180ms, border-color 180ms; }
  .press-release span { font-size: 1.15rem; }
  .press-release:hover { color: var(--lime); border-color: var(--lime); }
  .hero-art { position: relative; margin: 0; display: grid; justify-items: center; perspective: 1100px; }
  .credential-aura { position: absolute; width: 115%; height: 110%; top: -5%; background: radial-gradient(ellipse, #9ac6eb14, #8a53a70c 45%, transparent 70%); filter: blur(25px); }
  .card-arrival { opacity: var(--arrival); transform: translateY(calc(40px - var(--arrival) * 40px)) rotateY(calc(-28deg + var(--arrival) * 28deg)); transform-style: preserve-3d; }
  .card-float { animation: credential-float 9s ease-in-out infinite; }
  .credential { position: relative; display: block; padding: 0; width: clamp(230px, 24vw, 345px); aspect-ratio: 504 / 792; border: 1px solid #c1d9e23d; border-radius: 17px; background: #17191d; overflow: hidden; transform: perspective(1000px) rotateX(calc(5deg + var(--pitch))) rotateY(calc(-12deg + var(--yaw))); transition: transform 450ms cubic-bezier(.2,.75,.25,1); cursor: grab; box-shadow: inset 0 1px 1px #fff2; }
  .credential img { width: 100%; height: 100%; display: block; object-fit: cover; pointer-events: none; }
  .card-foil { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at var(--shine-x) var(--shine-y), #b8e2fb26, transparent 60%), linear-gradient(135deg, #c5f3e314, transparent 40%, #b19ae51c 65%, transparent); mix-blend-mode: screen; }
  figcaption { display: flex; align-items: center; justify-content: center; gap: 0.8rem; margin-top: 2rem; color: #8c9da6; font-size: 0.625rem; letter-spacing: 0.06em; }
  .caption-line { width: 1.25rem; height: 1px; background: #a1b5bf40; }
  .scroll-cue { position: absolute; bottom: 2.5rem; left: var(--margin); display: flex; align-items: center; gap: 1.5rem; font-size: 0.625rem; color: #8c9da6; }
  .next-chapter { display: grid; grid-template-columns: 0.85fr 1.15fr; align-items: center; gap: clamp(3rem, 6vw, 7rem); padding: 8rem var(--margin) 9rem; border-top: 1px solid var(--line); max-width: 1600px; margin: auto; scroll-margin-top: 2rem; }
  h2 { margin: 1.5rem 0; font-weight: 400; font-size: clamp(2.25rem, 4.5vw, 4.75rem); line-height: 1.07; letter-spacing: -0.055em; }
  .pearl-text { color: #d6daec; background: linear-gradient(95deg, #c4ede4, #e4d2ed 50%, #bdc5ec); background-clip: text; -webkit-text-fill-color: transparent; }
  .section-copy > p { max-width: 25rem; color: var(--muted); font-size: 0.9375rem; line-height: 1.8; }
  .credential-stack { position: relative; width: 100%; max-width: 650px; margin: auto; border: 1px solid #b7d0e13b; border-radius: 14px; background: linear-gradient(140deg, #a4e9e910, #b9a6ec12 55%, #91c5b508); }
  .context-block { padding: 1.75rem 1.5rem 1.5rem; display: grid; grid-template-columns: 3.25rem 1fr; gap: 1.25rem; }
  .agent-avatar { width: 3.25rem; height: 3.25rem; padding: 0.75rem; border: 1px dashed #d1dce57a; border-radius: 50%; display: grid; place-items: center; }
  .agent-avatar img { width: 100%; height: auto; border-radius: 2px; }
  .context-title { font-size: clamp(1rem, 1.5vw, 1.375rem); line-height: 1.5; color: #b2c2cd; }
  .context-title span { color: #edf2f5; }
  .context-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.25rem; padding: 1rem; background: #02090fa3; border-radius: 4px; }
  .context-fields > div { display: grid; gap: 0.5rem; font-size: 0.8125rem; }
  .field-label { font-size: 0.5625rem; color: #a4adbc; line-height: 1.5; text-transform: uppercase; letter-spacing: 0.12em; }
  .edge-ticks { height: 12px; margin: 0 0.6rem; background: repeating-linear-gradient(90deg, #a9cad552 0 1px, transparent 1px 5px); opacity: 0.65; }
  .issued-block { position: relative; margin-inline: -0.6rem; display: grid; grid-template-columns: 3.75rem 1fr; border: 1px solid #b5dce477; border-radius: 3px; background: linear-gradient(115deg, #70c1e936, #7a59ac4d 42%, #beb4c82e 70%, #6ebdbe40); background-size: 160% 160%; animation: foil-shift 14s ease-in-out infinite; }
  .chip-rail { display: grid; grid-template-rows: 1fr auto 1fr; justify-items: center; border-right: 1px solid #c4e1f146; overflow: hidden; }
  .chip-rail > img { width: 2rem; height: auto; margin: 0.75rem 0; }
  .rail-pattern { width: 100%; min-height: 26px; background-image: repeating-conic-gradient(#afc8ec4d 0 25%, transparent 0 50%); background-size: 9px 11px; mask-image: linear-gradient(90deg, transparent 10%, #000); }
  .issued-body { padding: 1.4rem 1.5rem; }
  .issued-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; font-size: 0.75rem; color: #dbe7ec; }
  .issued-heading .field-label { text-align: right; }
  .trust-signals { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.8rem; }
  .trust-signals li { display: flex; align-items: center; gap: 0.75rem; font-size: clamp(0.8125rem, 1.3vw, 1.125rem); }
  .trust-signals svg { width: 1.3rem; height: 1.3rem; stroke: var(--lime); stroke-width: 1.5; flex-shrink: 0; }
  .resource-block { padding: 1.5rem 1.75rem 2rem; }
  .resource-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.65rem; padding: 0.75rem; border-radius: 4px; background: #030a0b94; }
  .resource { display: grid; place-items: center; aspect-ratio: 1; min-width: 0; border: 1px solid #c9dbe016; border-radius: 4px; background: #d9e8ed08; color: #8b9fa35c; }
  .resource.selected { color: #c3e677; border-color: #b6d9714d; background: #94bf4221; }
  .resource svg { width: 55%; height: 55%; stroke: currentColor; stroke-width: 1.5; }
  .resource img { width: 55%; height: auto; }
  .resource-block > p { margin: 1.25rem 0 0; color: #acbbc4; font-size: 0.875rem; line-height: 1.65; text-align: center; }
  .resource-block strong { color: #e5eded; font-weight: 400; }
  .footer { padding: 2rem var(--margin) 8rem; display: flex; justify-content: space-between; gap: 2rem; border-top: 1px solid var(--line); color: #8d9fa9; font-size: 0.625rem; letter-spacing: 0.03em; max-width: 1600px; margin: auto; }
  .footer a { color: #c6d5dd; }
  .playback { position: fixed; bottom: 1rem; right: 1rem; width: min(19rem, calc(100% - 2rem)); z-index: 20; border: 1px solid #31434e; border-radius: 3px; background: #071018e8; backdrop-filter: blur(12px); }
  .playback-label { padding: 0.6rem 0.8rem; display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #31434e; color: #bdcbd5; font-size: 0.625rem; }
  .playback-label > span:first-child { color: #9fba7a; }
  .playback-actions { display: grid; grid-template-columns: repeat(3, 1fr); }
  .playback-actions button { min-height: 42px; border: 0; color: #d5e0e6; background: transparent; font-size: 0.6875rem; cursor: pointer; }
  .playback-actions button + button { border-left: 1px solid #31434e; }
  .playback-actions button:hover:enabled { background: #14242d; }
  .playback-actions button:disabled { opacity: 0.3; cursor: default; }
  a:focus-visible, button:focus-visible { outline: 2px solid #c4dda3; outline-offset: 5px; }
  @keyframes credential-float { 0%,100% { transform: translateY(0) rotateZ(-1deg); } 50% { transform: translateY(-14px) rotateZ(1deg); } }
  @keyframes foil-shift { 0%,100% { background-position: 0% 35%; } 50% { background-position: 100% 65%; } }
  @media (max-width: 760px) {
    .masthead { min-height: 82px; }
    .home img { width: 100px; }
    .masthead-note { display: none; }
    .chapter-link { font-size: 0.6875rem; gap: 0.5rem; }
    .hero { min-height: auto; grid-template-columns: 1fr; padding-top: 3.5rem; padding-bottom: 5rem; gap: 4.5rem; }
    .hero-copy { max-width: 100%; }
    h1 { margin-top: 1.5rem; gap: 1.25rem; }
    .deeptrust-wordmark { width: 13rem; }
    .keycard-wordmark { width: 16rem; }
    .hero-description { margin-top: 1.5rem; }
    .press-release { margin-top: 2.25rem; }
    .credential { width: min(62vw, 290px); }
    .hero-art { justify-self: center; width: 100%; }
    .scroll-cue { display: none; }
    .next-chapter { grid-template-columns: 1fr; gap: 3rem; padding-top: 4.5rem; padding-bottom: 5rem; }
    .section-copy > p { max-width: 30rem; }
    .credential-stack { max-width: 560px; }
    .context-block { padding: 1.25rem 1rem; gap: 0.8rem; grid-template-columns: 2.5rem 1fr; }
    .agent-avatar { width: 2.5rem; height: 2.5rem; padding: 0.55rem; }
    .context-title { font-size: 0.9375rem; }
    .context-fields { margin-top: 0.875rem; padding: 0.875rem; gap: 0.75rem; }
    .context-fields > div { font-size: 0.6875rem; }
    .field-label { font-size: 0.5rem; }
    .issued-block { grid-template-columns: 2.75rem 1fr; margin-inline: -0.3rem; }
    .issued-body { padding: 1.25rem 1rem; }
    .issued-heading { align-items: start; font-size: 0.6875rem; }
    .issued-heading .field-label { max-width: 4.5rem; }
    .trust-signals li { font-size: 0.875rem; gap: 0.5rem; }
    .resource-block { padding: 1.25rem 1rem 1.5rem; }
    .resource-row { gap: 0.4rem; padding: 0.55rem; }
    .resource-block > p { font-size: 0.8125rem; }
    .footer { flex-direction: column; gap: 1rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .keycard-page { scroll-behavior: auto; }
    .card-float, .issued-block { animation: none; }
    .credential { transition: none; }
  }
</style>
