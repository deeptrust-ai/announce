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
  Mesh,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
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
import { applyFinalHubView, fitFinalHubView } from './final-hub-camera'
import { APPROACH_START, ARRIVAL_START, CONNECTION_START, FINAL_HUB_START, FINAL_HUB_DURATION, LENS_RELEASE_START, SCENE_DURATION, TRANSITIONS, startingTransition, transitionAt } from './timeline'
import type { TransitionId } from './timeline'

type SceneCallbacks = {
  onReady?: () => void
  onError?: (error: unknown) => void
  onTransition?: (transition: TransitionId) => void
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
export function createScene(canvas: HTMLCanvasElement, callbacks: SceneCallbacks = {}): SceneController {
  const renderer = new WebGLRenderer({ canvas, antialias: true })
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  renderer.shadowMap.autoUpdate = false

  const scene = new Scene()
  scene.background = new Color('#080d14')
  const fog = new Fog('#080d14', 10, 30)
  scene.fog = fog

  const camera = new PerspectiveCamera(OPENING_SHOT.endFov, 1, 0.02, 1000)
  const logoFocus = new Vector3()

  const floor = createFloor()
  scene.add(floor.mesh)

  scene.add(new HemisphereLight('#c5d8ed', '#29212c', 1.1))
  const key = new DirectionalLight('#fff0dc', 3)
  const keyOffset = new Vector3(-3, 6, 4)
  key.position.copy(keyOffset)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -1
  key.shadow.camera.right = 1
  key.shadow.camera.top = 1
  key.shadow.camera.bottom = -1
  key.shadow.camera.near = 0.1
  key.shadow.camera.far = 15
  key.shadow.bias = -0.00001
  key.shadow.normalBias = 0.0003
  scene.add(key, key.target)
  const fill = new DirectionalLight('#a5c8ff', 1)
  fill.position.set(4, 3, -3)
  scene.add(fill)

  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  const bloomPass = new UnrealBloomPass(new Vector2(1, 1), 0.35, 0.4, 1.1)
  const outputPass = new OutputPass()
  composer.addPass(renderPass)
  composer.addPass(bloomPass)
  composer.addPass(outputPass)

  const arrival = createArrivalEffect()
  scene.add(arrival.root)

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let requestedTransition = startingTransition(window.location.search)
  let disposed = false
  let frame = 0
  let loadedAssets = 0
  let ready = false
  let elapsed = TRANSITIONS.find((transition) => transition.id === requestedTransition)?.start ?? 0
  let previousTime: number | undefined
  let logoModel: Object3D | undefined
  let hubModel: Object3D | undefined
  let card: ReturnType<typeof createCardConstruction> | undefined
  let connection: ReturnType<typeof createSouthConnection> | undefined
  let connectionView: ConnectionView | undefined
  let connectionBounds: Box3 | undefined
  let approach: ReturnType<typeof createHubApproach> | undefined
  let expansion: ReturnType<typeof createHubExpansion> | undefined
  let reportedTransition: TransitionId | undefined

  function reportTransition() {
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
    previousTime = undefined
    card?.reset()
    arrival.reset()
    connection?.reset()
    approach?.reset()
    expansion?.reset()
    floor.lensing.reset()
    renderer.shadowMap.needsUpdate = true
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
    if (ready && elapsed < SCENE_DURATION) {
      if (previousTime !== undefined) {
        elapsed = Math.min(SCENE_DURATION, elapsed + (time - previousTime) / 1000)
      }
      previousTime = time
    }
    applyOpeningShot(camera, logoFocus, elapsed)
    if (card?.update(elapsed - CARD_CONSTRUCTION.startSeconds)) renderer.shadowMap.needsUpdate = true
    if (approach?.update(elapsed - APPROACH_START)) renderer.shadowMap.needsUpdate = true
    if (expansion?.update(elapsed - APPROACH_START)) renderer.shadowMap.needsUpdate = true
    if (card) {
      key.target.position.copy(card.root.position)
      key.position.copy(card.root.position).add(keyOffset)
    }
    arrival.update(ready ? elapsed - ARRIVAL_START : -1, camera, motionPreference.matches)
    if (connection?.update(elapsed - CONNECTION_START)) renderer.shadowMap.needsUpdate = true
    if (connectionView && elapsed >= CONNECTION_START) {
      applyConnectionView(camera, logoFocus, connectionView,
        (elapsed - CONNECTION_START) / CONNECTION_SHOT.riseSeconds)
    }
    if (elapsed >= FINAL_HUB_START && connectionView && card && hubModel && logoModel) {
      // Refit the moving card and hub each frame rather than caching an early pose.
      const finalHubView = fitFinalHubView(camera, hubModel,
        card.root.getObjectByName('DeepTrust_Card_Body')!, logoModel)
      applyFinalHubView(camera, connectionView.target, finalHubView,
        (elapsed - FINAL_HUB_START) / FINAL_HUB_DURATION)
    }
    // Keep the distant objects clear as the view widens; fog must not hide them at altitude.
    fog.near = Math.max(10, camera.position.y * 1.8)
    fog.far = Math.max(30, camera.position.y * 4)
    if (card && hubModel) {
      floor.lensing.update(elapsed - APPROACH_START, elapsed - LENS_RELEASE_START,
        card.root, hubModel, motionPreference.matches)
    }
    if (ready) reportTransition()
    composer.render()
    if (ready && elapsed < SCENE_DURATION) requestRender()
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
    refreshConnectionView()
    requestRender()
  }

  function updateMotionPreference() {
    if (ready && motionPreference.matches) elapsed = SCENE_DURATION
    previousTime = undefined
    requestRender()
  }

  function updateVisibility() {
    previousTime = undefined
    if (document.hidden) {
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
            object.castShadow = true
            object.receiveShadow = true
          }
        })
        scene.add(model)
        renderer.shadowMap.needsUpdate = true
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
    hub.name = 'Doppel_Hub'
  })

  function dispose() {
    disposed = true
    cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    document.removeEventListener('visibilitychange', updateVisibility)
    motionPreference.removeEventListener('change', updateMotionPreference)
    disposeModel(scene)
    key.shadow.dispose()
    bloomPass.dispose()
    outputPass.dispose()
    renderPass.dispose()
    composer.dispose()
    renderer.dispose()
  }

  return { playFrom, dispose }
}
