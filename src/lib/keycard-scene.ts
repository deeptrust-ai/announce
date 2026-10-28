import {
  CanvasTexture,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  HemisphereLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Shape,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'
import { createKeycardLaser } from './keycard-laser'
import { createKeycardMotionBlur } from './keycard-motion-blur'
import { ANNOUNCEMENT_DURATION } from './announcement'

/** The card story resolves before the editorial announcement appears. */
export const KEYCARD_OPENING = {
  pause: 0.8,
  etch: 4.8,
  cool: 0.35,
  pulse: 1.7,
  lift: 2,
  spin: 3,
  turns: 6.5,
  hero: 0.9,
} as const
const ETCH_END = KEYCARD_OPENING.pause + KEYCARD_OPENING.etch
const PULSE_START = ETCH_END + KEYCARD_OPENING.cool
const LIFT_START = PULSE_START + KEYCARD_OPENING.pulse
const SPIN_START = LIFT_START + KEYCARD_OPENING.lift
const HERO_START = SPIN_START + KEYCARD_OPENING.spin
const ANNOUNCEMENT_START = HERO_START + KEYCARD_OPENING.hero
const END = ANNOUNCEMENT_START + ANNOUNCEMENT_DURATION
export const KEYCARD_STAGES = [
  { id: 'floor', name: 'Card on grid', start: 0 },
  { id: 'etch', name: 'DeepTrust etching', start: KEYCARD_OPENING.pause },
  { id: 'pulse', name: 'Grid shockwave', start: PULSE_START },
  { id: 'lift', name: 'Lift upright', start: LIFT_START },
  { id: 'spin', name: 'Rapid spin', start: SPIN_START },
  { id: 'hero', name: 'Keycard hero', start: HERO_START },
  { id: 'announcement', name: 'Acquisition announcement', start: ANNOUNCEMENT_START },
] as const
const clamp = (value: number) => Math.max(0, Math.min(1, value))
function ease(value: number) { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10) }
function applyCardPose(object: Object3D, time: number) {
  const lift = ease((time - LIFT_START) / KEYCARD_OPENING.lift)
  const spin = ease((time - SPIN_START) / KEYCARD_OPENING.spin)
  // Clear the floor with the bottom edge throughout the tilt, not just at rest.
  const height = HEIGHT / 2 * Math.sin(lift * Math.PI / 2) + .22 * lift
  object.position.set(0, .003 + DEPTH / 2 + height, 0)
  object.rotation.set(-Math.PI / 2 * (1 - lift) + .025 * lift, spin * Math.PI * 2 * KEYCARD_OPENING.turns - .12 * lift, .015 * lift)
}
const WIDTH = 2.52
const HEIGHT = 3.96
const DEPTH = 0.045
const LOGO_SIZE = 0.72
const LOGO_CENTER_Y = 1 - 288 / 792

function roundedCard() {
  const x = -WIDTH / 2, y = -HEIGHT / 2, radius = 0.13
  const shape = new Shape()
  shape.moveTo(x + radius, y)
  shape.lineTo(x + WIDTH - radius, y)
  shape.quadraticCurveTo(x + WIDTH, y, x + WIDTH, y + radius)
  shape.lineTo(x + WIDTH, y + HEIGHT - radius)
  shape.quadraticCurveTo(x + WIDTH, y + HEIGHT, x + WIDTH - radius, y + HEIGHT)
  shape.lineTo(x + radius, y + HEIGHT)
  shape.quadraticCurveTo(x, y + HEIGHT, x, y + HEIGHT - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)
  return shape
}

/** Preserve the eight original SVG shapes, including their rounded corners.
 * The time map etches each solid bar left to right, top to bottom. */
function createEtchMaps(source: string) {
  const svg = new DOMParser().parseFromString(source, 'image/svg+xml')
  const paths = [...svg.querySelectorAll('path')].map((element) => {
    const length = element.getTotalLength()
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
    for (let index = 0; index <= 256; index++) {
      const point = element.getPointAtLength(length * index / 256)
      left = Math.min(left, point.x); right = Math.max(right, point.x)
      top = Math.min(top, point.y)
      bottom = Math.max(bottom, point.y)
    }
    return { path: new Path2D(element.getAttribute('d')!), left, right, top, bottom }
  }).sort((a, b) => a.top - b.top || a.left - b.left)
  if (!paths.length) throw new Error('The DeepTrust SVG has no paths.')

  const mask = document.createElement('canvas'), timing = document.createElement('canvas')
  mask.width = mask.height = timing.width = timing.height = 512
  const maskContext = mask.getContext('2d')!, timeContext = timing.getContext('2d')!
  maskContext.scale(8, 8); timeContext.scale(8, 8)
  const segments: { left: number; right: number; y: number; start: number; end: number }[] = []
  maskContext.fillStyle = 'white'
  timeContext.fillStyle = 'white'; timeContext.fillRect(0, 0, 64, 64)
  paths.forEach(({ path, left, right, top, bottom }, index) => {
    maskContext.fill(path)
    const gradient = timeContext.createLinearGradient(left, 0, right, 0)
    const start = Math.round((0.015 + index / paths.length * 0.97) * 255)
    const end = Math.round((0.015 + (index + 0.94) / paths.length * 0.97) * 255)
    segments.push({ left, right, y: (top + bottom) / 2, start: start / 255, end: end / 255 })
    gradient.addColorStop(0, `rgb(${start},${start},${start})`)
    gradient.addColorStop(1, `rgb(${end},${end},${end})`)
    timeContext.fillStyle = gradient; timeContext.fill(path)
  })
  return { mask: new CanvasTexture(mask), timing: new CanvasTexture(timing), segments }
}

const vertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vWorld = (modelMatrix * vec4(position, 1.)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.);
  }
`

const cardFragment = /* glsl */`
  uniform sampler2D uCard;
  uniform sampler2D uMask;
  uniform sampler2D uTiming;
  uniform float uEtch;
  uniform float uOriginal;
  uniform float uOpacity;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec3 color = texture2D(uCard, vUv).rgb;
    // Clear the baked-in K inside the innermost circuit frame; preserve all tracks.
    vec2 center = vec2(0.5, ${LOGO_CENTER_Y});
    vec2 aperture = abs(vUv - center) - vec2(84. / 504., 73. / 792.);
    float blank = 1. - smoothstep(-.002, .001, max(aperture.x, aperture.y));
    float grain = (hash(vUv * vec2(504., 792.)) - .5) * .006;
    vec3 unmarkedMetal = texture2D(uCard, vec2(.5, 1. - 215. / 792.)).rgb;
    color = mix(color, unmarkedMetal + grain, blank);

    // The website label is absent on the DeepTrust face.
    vec2 labelBounds = abs(vUv - vec2(.5, .08)) - vec2(.25, .055);
    float label = 1. - smoothstep(-.002, .002, max(labelBounds.x, labelBounds.y));
    vec3 blankLabel = texture2D(uCard, vec2(.5, .16)).rgb;
    color = mix(color, blankLabel + grain, label);

    // The mark is in the face's material, not a raised or floating logo mesh.
    vec2 logoUv = (vUv - center) / vec2(${LOGO_SIZE / WIDTH}, ${LOGO_SIZE / HEIGHT}) + .5;
    float inside = step(0., logoUv.x) * step(logoUv.x, 1.) * step(0., logoUv.y) * step(logoUv.y, 1.);
    float mask = texture2D(uMask, logoUv).a * inside;
    float arrival = texture2D(uTiming, logoUv).r;
    float cut = smoothstep(arrival, arrival + .009, uEtch) * mask;
    cut = mix(cut, mask, step(1., uEtch));
    float head = exp(-pow((uEtch - arrival - .005) / .006, 2.)) * mask;
    head *= step(.001, uEtch) * (1. - step(1., uEtch));
    // Flat original logo shapes: no relief, bevel, bump, or edge shading.
    vec3 lineColor = mix(vec3(.55, .64, .67), vec3(.68, .57, .68), logoUv.x);
    color = mix(color, lineColor, cut);
    color += vec3(.5, .85, 1.) * head * 2.;
    // The back face always uses the untouched original K and KEYCARD.AI label.
    color = mix(color, texture2D(uCard, vUv).rgb, uOriginal);
    gl_FragColor = vec4(color, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const floorFragment = /* glsl */`
  uniform float uPulse;
  uniform float uPulseActive;
  varying vec3 vWorld;
  float grid(vec2 p) {
    vec2 uv = p / .42;
    vec2 width = max(fwidth(uv), vec2(.00001));
    vec2 distanceToLine = abs(fract(uv - .5) - .5) / width;
    float pixelFade = 1. - smoothstep(.1, 1., max(width.x, width.y));
    return (1. - smoothstep(.25, 1.25, min(distanceToLine.x, distanceToLine.y))) * pixelFade;
  }
  void main() {
    vec2 p = vWorld.xz;
    float distanceFromCard = length(p);
    float radius = mix(.25, 9., uPulse);
    float front = distanceFromCard - radius;
    float envelope = sin(uPulse * 3.14159265) * (1. - uPulse) * uPulseActive;
    float compression = exp(-front * front / .055);
    float rebound = exp(-pow((front + .32) / .24, 2.));
    vec2 displaced = p + p / max(distanceFromCard, .001) * (compression - rebound * .55) * envelope * .16;
    float fade = exp(-distanceFromCard * .12);
    vec3 color = vec3(.0025, .007, .01);
    color += vec3(.018, .032, .038) * grid(displaced) * fade;
    color += mix(vec3(.07, .24, .27), vec3(.15, .09, .24), uPulse) * compression * envelope * .8;
    float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - .5) * .003;
    gl_FragColor = vec4(color, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export async function createKeycardScene(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
  onStage: (index: number) => void,
  onAnnouncement: (progress: number) => void,
) {
  const assets = `${import.meta.env.BASE_URL}branding/`
  // Load the SVG before creating any GPU resources, so failures cannot leak a renderer.
  const response = await fetch(`${assets}logo-mark.svg`, { signal })
  if (!response.ok) throw new Error('The DeepTrust mark could not be loaded.')
  const svg = await response.text()
  if (signal.aborted) return
  const cardTexture = await new TextureLoader().loadAsync(`${assets}keycard/credential-card.png`)
  if (signal.aborted) { cardTexture.dispose(); return }
  cardTexture.colorSpace = SRGBColorSpace
  let pendingMaps: ReturnType<typeof createEtchMaps> | undefined
  let renderer: WebGLRenderer
  try {
    pendingMaps = createEtchMaps(svg)
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false })
  } catch (error) {
    cardTexture.dispose(); pendingMaps?.mask.dispose(); pendingMaps?.timing.dispose()
    throw error
  }
  const maps = pendingMaps
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = false
  const scene = new Scene()
  scene.background = new Color('#030b10')
  const camera = new PerspectiveCamera(38, 1, .1, 100)
  scene.add(new HemisphereLight('#cee7ee', '#15131e', 2))
  const light = new DirectionalLight('#d9e9ff', 3)
  light.position.set(-3, 5, 2); scene.add(light)

  const card = new Group()
  scene.add(card)
  const bodyGeometry = new ExtrudeGeometry(roundedCard(), { depth: DEPTH, bevelEnabled: false, curveSegments: 16 })
  bodyGeometry.translate(0, 0, -DEPTH / 2)
  const bodyMaterial = new MeshStandardMaterial({ color: '#24282d', roughness: .65, metalness: .45 })
  const body = new Mesh(bodyGeometry, bodyMaterial)
  card.add(body)

  const faceGeometry = new PlaneGeometry(WIDTH, HEIGHT)
  const faceMaterial = new ShaderMaterial({
    vertexShader, fragmentShader: cardFragment,
    uniforms: { uCard: { value: cardTexture }, uMask: { value: maps.mask }, uTiming: { value: maps.timing }, uEtch: { value: 0 }, uOriginal: { value: 0 }, uOpacity: { value: 1 } },
  })
  const face = new Mesh(faceGeometry, faceMaterial)
  face.position.z = DEPTH / 2 + .001
  // Rounded corners match the actual body rather than a rectangular image plane.
  faceMaterial.fragmentShader = faceMaterial.fragmentShader.replace('vec3 color = texture2D', `
    vec2 corner = abs((vUv - .5) * vec2(${WIDTH}, ${HEIGHT})) - vec2(${WIDTH / 2 - .13}, ${HEIGHT / 2 - .13});
    if (length(max(corner, 0.)) + min(max(corner.x, corner.y), 0.) > .13) discard;
    vec3 color = texture2D`)
  card.add(face)
  const backMaterial = new ShaderMaterial({
    vertexShader, fragmentShader: faceMaterial.fragmentShader,
    uniforms: { ...faceMaterial.uniforms, uOriginal: { value: 1 } },
  })
  const back = new Mesh(faceGeometry, backMaterial)
  back.position.z = -face.position.z
  back.rotation.y = Math.PI
  card.add(back)


  const floorGeometry = new PlaneGeometry(100, 100)
  const floorMaterial = new ShaderMaterial({ vertexShader, fragmentShader: floorFragment, uniforms: { uPulse: { value: 0 }, uPulseActive: { value: 0 } } })
  const floor = new Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)
  const laser = createKeycardLaser()
  scene.add(laser.mesh)
  const motionBlur = createKeycardMotionBlur(renderer)

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let elapsed = 0, frame = 0, previous: number | undefined, disposed = false
  let reportedStage = -1
  let floorDistance = 10, heroDistance = 10, closeDistance = 1.9
  const floorDirection = new Vector3(0, 1, .32).normalize()
  const target = new Vector3()
  const etchFocus = new Vector3()
  const heroOffset = new Vector3()
  const laserHit = new Vector3()
  const framingOffset = new Vector3()
  const cameraUp = new Vector3()
  const cameraRight = new Vector3()
  const start = new URLSearchParams(window.location.search).get('start')
  elapsed = start === 'complete' ? END : KEYCARD_STAGES.find((stage) => stage.id === start)?.start ?? 0
  if (preference.matches) elapsed = END

  function render() {
    faceMaterial.uniforms.uEtch!.value = Math.max(0, Math.min(1, (elapsed - KEYCARD_OPENING.pause) / KEYCARD_OPENING.etch))
    floorMaterial.uniforms.uPulse!.value = Math.max(0, Math.min(1, (elapsed - PULSE_START) / KEYCARD_OPENING.pulse))
    floorMaterial.uniforms.uPulseActive!.value = !preference.matches && elapsed > PULSE_START && elapsed < LIFT_START ? 1 : 0
    const spinProgress = clamp((elapsed - SPIN_START) / KEYCARD_OPENING.spin)
    applyCardPose(card, elapsed)
    card.updateMatrixWorld(true)
    const pullback = ease(faceMaterial.uniforms.uEtch!.value)
    const lift = ease((elapsed - LIFT_START) / KEYCARD_OPENING.lift)
    const layout = ease((elapsed - ANNOUNCEMENT_START) / 1.2)
    const stacked = camera.aspect <= .85
    const tangent = Math.tan(camera.fov * Math.PI / 360)
    const editorialDistance = Math.max(
      HEIGHT / (2 * tangent * (stacked ? .42 : .66)),
      WIDTH / (2 * tangent * camera.aspect * (stacked ? .65 : .38)),
    ) + .2
    heroOffset.z = heroDistance + (editorialDistance - heroDistance) * layout
    etchFocus.set(0, (LOGO_CENTER_Y - .5) * HEIGHT, DEPTH / 2 + .001).applyMatrix4(card.matrixWorld)
    target.copy(etchFocus).lerp(card.position, pullback)
    // A restrained quarter-turn crane move, starting low from the card's side.
    const swing = -Math.PI / 2 * (1 - pullback)
    const startElevation = 4 * Math.PI / 180
    const elevation = startElevation + (Math.atan2(floorDirection.y, floorDirection.z) - startElevation) * pullback
    camera.position.set(Math.sin(swing) * Math.cos(elevation), Math.sin(elevation), Math.cos(swing) * Math.cos(elevation))
      .multiplyScalar(closeDistance + (floorDistance - closeDistance) * pullback)
      .lerp(heroOffset, lift).add(target)
    camera.lookAt(target)
    // Shift the optical center without rotating the card away from its hero pose.
    const halfHeight = camera.position.distanceTo(target) * tangent
    cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion)
    cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion)
    framingOffset.copy(cameraRight).multiplyScalar((stacked ? 0 : -.46) * halfHeight * camera.aspect * layout)
      .addScaledVector(cameraUp, (stacked ? -.48 : 0) * halfHeight * layout)
    camera.position.add(framingOffset); target.add(framingOffset)
    camera.lookAt(target)
    camera.updateMatrixWorld()
    // Match the quantized time map and the shader's .005 cutting-front offset.
    const cuttingTime = faceMaterial.uniforms.uEtch!.value - .005
    const segment = elapsed >= KEYCARD_OPENING.pause && elapsed < ETCH_END && !preference.matches
      ? maps.segments.find((line) => cuttingTime >= line.start && cuttingTime <= line.end)
      : undefined
    if (segment) {
      const progress = clamp((cuttingTime - segment.start) / (segment.end - segment.start))
      const x = segment.left + (segment.right - segment.left) * progress
      laserHit.set(
        (x / 64 - .5) * LOGO_SIZE,
        (LOGO_CENTER_Y - .5) * HEIGHT + (.5 - segment.y / 64) * LOGO_SIZE,
        DEPTH / 2 + .002,
      ).applyMatrix4(card.matrixWorld)
    }
    laser.update(segment ? laserHit : undefined, camera, elapsed)
    const blur = elapsed >= SPIN_START && elapsed <= HERO_START ? Math.pow(Math.sin(spinProgress * Math.PI), 2) : 0
    const stage = KEYCARD_STAGES.reduce<number>((index, candidate, next) => elapsed >= candidate.start ? next : index, 0)
    if (stage !== reportedStage) { reportedStage = stage; onStage(stage) }
    onAnnouncement(clamp((elapsed - ANNOUNCEMENT_START) / ANNOUNCEMENT_DURATION))
    if (blur > .01 && !preference.matches) {
      // Integrate the complete two-sided card over a short exposure.
      motionBlur.render(elapsed, blur / 30, SPIN_START, (time) => {
        applyCardPose(card, time)
        renderer.render(scene, camera)
      })
      applyCardPose(card, elapsed)
    } else renderer.render(scene, camera)
  }
  function requestFrame() { if (!disposed && !frame && !document.hidden && elapsed < END) frame = requestAnimationFrame(tick) }
  function tick(time: number) {
    frame = 0
    if (previous !== undefined) elapsed = Math.min(END, elapsed + Math.min((time - previous) / 1000, .1))
    previous = time
    render(); requestFrame()
  }
  function resize() {
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight)
    renderer.setSize(width, height, false)
    laser.resize(canvas.width, canvas.height, renderer.getPixelRatio())
    motionBlur.resize(width, height)
    camera.aspect = width / height
    // Fit the card's projected corners with room for the shockwave on every aspect.
    camera.position.copy(floorDirection).multiplyScalar(10)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix(); camera.updateMatrixWorld()
    const corner = new Vector3()
    let coverage = 0
    for (const x of [-WIDTH / 2, WIDTH / 2]) for (const z of [-HEIGHT / 2, HEIGHT / 2]) {
      corner.set(x, DEPTH, z).project(camera)
      coverage = Math.max(coverage, Math.abs(corner.x) / .65, Math.abs(corner.y) / .72)
    }
    // Perspective fit is conservative because the nearer corners enlarge at close range.
    floorDistance = Math.max(6.4, 10 * coverage + 1)
    const tangent = Math.tan(camera.fov * Math.PI / 360)
    closeDistance = Math.max(1.9, 1.1 / (2 * tangent * camera.aspect * .8))
    heroDistance = Math.max(HEIGHT / (2 * tangent * .73), WIDTH / (2 * tangent * camera.aspect * .68)) + .2
    heroOffset.set(0, .18, heroDistance)
    render()
  }
  function visibility() {
    previous = undefined
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0 } else requestFrame()
  }
  function motion() {
    if (preference.matches) { elapsed = END; cancelAnimationFrame(frame); frame = 0; render() }
    previous = undefined
    requestFrame()
  }
  function restart(event: KeyboardEvent) {
    if (event.key.toLowerCase() !== 'r' || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
    elapsed = preference.matches ? END : KEYCARD_STAGES[Math.max(reportedStage, 0)]!.start
    previous = undefined
    render(); requestFrame()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  document.addEventListener('visibilitychange', visibility)
  preference.addEventListener('change', motion)
  window.addEventListener('keydown', restart)
  resize(); requestFrame()

  return {
    playFrom(index: number) {
      const stage = KEYCARD_STAGES[index]
      if (!stage) return
      elapsed = preference.matches ? END : stage.start
      previous = undefined
      const url = new URL(window.location.href)
      if (index === 0) url.searchParams.delete('start')
      else url.searchParams.set('start', stage.id)
      window.history.replaceState(window.history.state, '', url)
      render(); requestFrame()
    },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      preference.removeEventListener('change', motion)
      window.removeEventListener('keydown', restart)
      bodyGeometry.dispose(); bodyMaterial.dispose(); faceGeometry.dispose(); faceMaterial.dispose(); backMaterial.dispose()
      motionBlur.dispose()
      laser.dispose()
      floorGeometry.dispose(); floorMaterial.dispose(); cardTexture.dispose(); maps.mask.dispose(); maps.timing.dispose()
      renderer.dispose()
    },
  }
}
