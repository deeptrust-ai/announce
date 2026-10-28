import {
  ACESFilmicToneMapping,
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  LineSegments,
  Material,
  MathUtils,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Scene,
  Sphere,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { applyOpeningShot, OPENING_SHOT } from './opening-shot'
import { CARD_CONSTRUCTION, createCardConstruction } from './card-construction'
import { createArrivalEffect } from './arrival-effect'
import { createFloor, GRID_CARD_RATIO } from './floor'
import { createSouthConnection, SOUTH_CONNECTION } from './south-connection'
import { applyConnectionView, fitConnectionView, CONNECTION_SHOT } from './connection-camera'
import type { ConnectionView } from './connection-camera'
import { createHubApproach } from './hub-approach'
import { createHubExpansion } from './hub-expansion'
import { createHubBreathing } from './hub-breathing'
import { createHubOrbits } from './hub-orbits'
import { createSphereInteraction } from './sphere-interaction'
import { BRANDS } from './brand'
import type { BrandVariant } from './brand'
import { applyKeycardNetwork } from './keycard-network'
import { applyFinalHubView, fitFinalHubView } from './final-hub-camera'
import { ANNOUNCEMENT_DURATION } from './announcement'
import { ANNOUNCEMENT_START, APPROACH_START, ARRIVAL_START, CONNECTION_START, FINAL_HUB_START, FINAL_HUB_DURATION, HUB_SETTLE_TIME, LENS_RELEASE_START, ORBITS_START, SCENE_DURATION, TRANSITIONS, startingTransition, transitionAt } from './timeline'
import type { TransitionId } from './timeline'

type SceneCallbacks = {
  onReady?: () => void
  onError?: (error: unknown) => void
  onTransition?: (transition: TransitionId) => void
  onAnnouncement?: (progress: number) => void
}

export type SceneController = {
  playFrom: (transition: TransitionId) => void
  dispose: () => void
}

function disposeModel(root: Object3D) {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  root.traverse((object) => {
    if (!(object instanceof Mesh) && !(object instanceof LineSegments)) return
    geometries.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material)) {
        if (value instanceof Texture) textures.add(value)
      }
    }
  })
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
  textures.forEach((texture) => texture.dispose())
}

/** Mount the floor scene and return playback and cleanup controls. */
export function createScene(canvas: HTMLCanvasElement, callbacks: SceneCallbacks = {}, variant: BrandVariant = 'doppel'): SceneController {
  const brand = BRANDS[variant]
  const renderer = new WebGLRenderer({ canvas, antialias: true })
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = false

  const scene = new Scene()
  scene.background = new Color(brand.background)
  const fog = new Fog(brand.background, 10, 30)
  scene.fog = fog

  const camera = new PerspectiveCamera(OPENING_SHOT.endFov, 1, 0.02, 1000)
  const logoFocus = new Vector3()

  const floor = createFloor(variant)
  scene.add(floor.mesh)

  scene.add(new HemisphereLight(brand.hemisphere, brand.groundLight, 1.1))
  const key = new DirectionalLight(brand.keyLight, 3)
  const keyOffset = new Vector3(-3, 6, 4)
  key.position.copy(keyOffset)
  scene.add(key, key.target)
  const fill = new DirectionalLight(brand.fillLight, 1)
  fill.position.set(4, 3, -3)
  scene.add(fill)

  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  const bloomPass = new UnrealBloomPass(new Vector2(1, 1), brand.bloom, 0.4, 1.1)
  const outputPass = new OutputPass()
  composer.addPass(renderPass)
  composer.addPass(bloomPass)
  composer.addPass(outputPass)

  const arrival = createArrivalEffect(brand.arrival)
  scene.add(arrival.root)

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let requestedTransition = startingTransition(window.location.search)
  let disposed = false
  let frame = 0
  let loadedAssets = 0
  let ready = false
  let elapsed = TRANSITIONS.find((transition) => transition.id === requestedTransition)?.start ?? 0
  let animationOrigin = elapsed
  let previousTime: number | undefined
  let ambientElapsed = 0
  let logoModel: Object3D | undefined
  let hubModel: Object3D | undefined
  let card: ReturnType<typeof createCardConstruction> | undefined
  let connection: ReturnType<typeof createSouthConnection> | undefined
  let connectionView: ConnectionView | undefined
  let connectionBounds: Box3 | undefined
  let approach: ReturnType<typeof createHubApproach> | undefined
  let expansion: ReturnType<typeof createHubExpansion> | undefined
  let breathing: ReturnType<typeof createHubBreathing> | undefined
  let orbits: ReturnType<typeof createHubOrbits> | undefined
  let settledHubView: ReturnType<typeof fitFinalHubView> | undefined
  let reportedTransition: TransitionId | undefined
  const interactionSphere = new Sphere()
  const interaction = createSphereInteraction(canvas, camera, () => {
    const orbit = orbits
    if (!orbit?.settled) return undefined
    const bounds = orbit.getBounds()
    if (!bounds) return undefined
    orbit.center.getWorldPosition(interactionSphere.center)
    interactionSphere.radius = (bounds.max.x - bounds.min.x) / 2
    return interactionSphere
  }, requestRender, () => motionPreference.matches)

  function reportTransition() {
    callbacks.onAnnouncement?.(MathUtils.clamp((elapsed - ANNOUNCEMENT_START) / ANNOUNCEMENT_DURATION, 0, 1))
    const current = transitionAt(elapsed)
    if (current !== reportedTransition) {
      reportedTransition = current
      callbacks.onTransition?.(current)
    }
  }

  function playFrom(transition: TransitionId) {
    if (disposed) return
    requestedTransition = transition
    const start = TRANSITIONS.find((item) => item.id === transition)?.start ?? 0
    elapsed = motionPreference.matches ? SCENE_DURATION : start
    animationOrigin = elapsed
    previousTime = undefined
    ambientElapsed = 0
    settledHubView = undefined
    card?.reset()
    arrival.reset()
    connection?.reset()
    approach?.reset()
    expansion?.reset()
    orbits?.reset()
    interaction.reset()
    floor.lensing.reset()
    reportTransition()
    requestRender()
  }

  // Play the camera shot and card construction once, then hold the completed node.
  function requestRender() {
    if (!disposed && !document.hidden && !frame) frame = requestAnimationFrame(render)
  }

  function render(time: number) {
    frame = 0
    if (disposed) return
    let delta = 0
    if (ready) {
      if (previousTime !== undefined) {
        delta = (time - previousTime) / 1000
        elapsed = Math.min(SCENE_DURATION, elapsed + delta)
        ambientElapsed += delta
      }
      previousTime = time
    }
    applyOpeningShot(camera, logoFocus, elapsed)
    card?.update(elapsed - CARD_CONSTRUCTION.startSeconds)
    approach?.update(elapsed - APPROACH_START)
    expansion?.update(elapsed - APPROACH_START)
    arrival.update(ready ? elapsed - ARRIVAL_START : -1, camera, motionPreference.matches)
    connection?.update(elapsed - CONNECTION_START)
    const interacting = interaction.update(Math.min(delta, 0.05), motionPreference.matches)
    orbits?.update(animationOrigin + ambientElapsed - ORBITS_START, motionPreference.matches, interaction.rotation)
    if (card) {
      if (orbits?.active) orbits.center.getWorldPosition(key.target.position)
      else key.target.position.copy(card.root.position)
      key.position.copy(key.target.position).add(keyOffset)
    }
    if (connectionView && elapsed >= CONNECTION_START) {
      applyConnectionView(camera, logoFocus, connectionView,
        (elapsed - CONNECTION_START) / CONNECTION_SHOT.riseSeconds)
    }
    if (elapsed >= FINAL_HUB_START && connectionView && card && hubModel && logoModel) {
      // Refit the moving card and hub each frame rather than caching an early pose.
      const finalHubView = settledHubView ?? fitFinalHubView(camera, hubModel,
        card.root.getObjectByName('DeepTrust_Card_Body')!, logoModel, orbits?.getBounds())
      if (elapsed >= HUB_SETTLE_TIME && (!orbits?.active || orbits.settled)) settledHubView = finalHubView
      applyFinalHubView(camera, connectionView.target, finalHubView,
        (elapsed - FINAL_HUB_START) / FINAL_HUB_DURATION)
    }
    orbits?.faceCamera(camera)
    // Keep the distant objects clear as the view widens; fog must not hide them at altitude.
    fog.near = Math.max(10, camera.position.y * 1.8)
    fog.far = Math.max(30, camera.position.y * 4)
    if (card && hubModel) {
      floor.lensing.update(elapsed - APPROACH_START, elapsed - LENS_RELEASE_START,
        card.root, hubModel, motionPreference.matches)
    }
    if (ready) reportTransition()
    breathing?.update(ambientElapsed, motionPreference.matches)
    composer.render()
    if (ready && (elapsed < SCENE_DURATION || !motionPreference.matches || interacting)) requestRender()
  }

  function refreshConnectionView() {
    if (!card || !hubModel) return
    // Keep the original composition through travel, replay, and resize.
    if (!connectionBounds) {
      card.root.updateWorldMatrix(true, true)
      hubModel.updateWorldMatrix(true, true)
      const body = card.root.getObjectByName('DeepTrust_Card_Body')!
      connectionBounds = new Box3().setFromObject(body).union(new Box3().setFromObject(hubModel))
    }
    connectionView = fitConnectionView(camera, logoFocus, connectionBounds)
  }

  function resize() {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(width, height, false)
    composer.setPixelRatio(pixelRatio)
    composer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    settledHubView = undefined
    refreshConnectionView()
    requestRender()
  }

  function updateMotionPreference() {
    if (ready && motionPreference.matches) {
      elapsed = SCENE_DURATION
      animationOrigin = elapsed
      ambientElapsed = 0
    }
    previousTime = undefined
    requestRender()
  }

  function updateVisibility() {
    previousTime = undefined
    if (document.hidden) {
      interaction.cancel()
      cancelAnimationFrame(frame)
      frame = 0
    } else {
      resize()
    }
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  document.addEventListener('visibilitychange', updateVisibility)
  motionPreference.addEventListener('change', updateMotionPreference)
  updateMotionPreference()
  resize()

  const loader = new GLTFLoader()
  function loadAsset(filename: string, place: (model: Object3D) => void) {
    loader.load(
      `${import.meta.env.BASE_URL}models/${filename}`,
      (gltf) => {
        if (disposed) {
          disposeModel(gltf.scene)
          return
        }
        const model = gltf.scene
        place(model)
        model.traverse((object) => {
          if (object instanceof Mesh) {
            object.castShadow = false
            object.receiveShadow = false
          }
        })
        scene.add(model)
        loadedAssets += 1
        if (loadedAssets === 2 && logoModel && hubModel) {
          try {
            card = createCardConstruction(logoModel, hubModel)
            floor.setCardWidth(card.width)
            hubModel.position.set(0, 0, card.width * GRID_CARD_RATIO * SOUTH_CONNECTION.hubDistanceGridCells)
            card.root.add(arrival.root)
            scene.add(card.root)
            connection = createSouthConnection(card.root, card.width, hubModel)
            scene.add(connection.root)
            expansion = createHubExpansion(hubModel)
            approach = createHubApproach(card.root, hubModel, expansion.orbitRadius)
            refreshConnectionView()
            orbits = createHubOrbits(hubModel, card.root, connection.root, expansion.orbitRadius)
            breathing = createHubBreathing(hubModel)
          } catch (error) {
            callbacks.onError?.(error)
            requestRender()
            return
          }
          ready = true
          playFrom(requestedTransition)
          callbacks.onReady?.()
        }
        requestRender()
      },
      undefined,
      (error) => {
        if (!disposed) callbacks.onError?.(error)
      },
    )
  }

  loadAsset('inner-truth.glb', (logo) => {
    logoModel = logo
    logo.name = 'DeepTrust_Logo'
    // The logo arrives upright. Rotate its front face upward and rest its base on the floor.
    logo.rotation.x = -Math.PI / 2
    const bounds = new Box3().setFromObject(logo)
    logo.position.y -= bounds.min.y
    bounds.setFromObject(logo).getCenter(logoFocus)
  })

  loadAsset('hub-network.glb', (hub) => {
    hubModel = hub
    // Keep its existing groups intact for the later travel and joining sequence.
    hub.name = `${brand.name}_Hub`
    if (variant === 'keycard') applyKeycardNetwork(hub)
    const plate = hub.getObjectByName('Hub_Plate')
    const rings = hub.getObjectByName('Orbit_Rings')
    if (plate) plate.visible = false
    if (rings) rings.visible = false
  })

  function dispose() {
    disposed = true
    cancelAnimationFrame(frame)
    interaction.dispose()
    resizeObserver.disconnect()
    document.removeEventListener('visibilitychange', updateVisibility)
    motionPreference.removeEventListener('change', updateMotionPreference)
    disposeModel(scene)
    bloomPass.dispose()
    outputPass.dispose()
    renderPass.dispose()
    composer.dispose()
    renderer.dispose()
  }

  return { playFrom, dispose }
}
