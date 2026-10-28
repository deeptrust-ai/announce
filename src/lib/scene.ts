import {
  ACESFilmicToneMapping,
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
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
import { applyOpeningShot, OPENING_DURATION } from './opening-shot'

type SceneCallbacks = {
  onReady?: () => void
  onError?: (error: unknown) => void
}

function disposeModel(root: Object3D) {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
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

/** Mount the floor scene and return cleanup for Svelte unmounts and hot reloads. */
export function createScene(canvas: HTMLCanvasElement, callbacks: SceneCallbacks = {}): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: true })
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false

  const scene = new Scene()
  scene.background = new Color('#080d14')
  scene.fog = new Fog('#080d14', 10, 30)

  const camera = new PerspectiveCamera(40, 1, 0.02, 80)
  const logoFocus = new Vector3()

  const floor = new Mesh(
    new PlaneGeometry(200, 200),
    new MeshStandardMaterial({ color: '#111820', roughness: 0.92, metalness: 0.05 }),
  )
  floor.name = 'Floor'
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.001
  floor.receiveShadow = true
  scene.add(floor)

  scene.add(new HemisphereLight('#c5d8ed', '#29212c', 1.1))
  const key = new DirectionalLight('#fff0dc', 3)
  key.position.set(-3, 6, 4)
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
  scene.add(key)
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

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let disposed = false
  let frame = 0
  let loadedAssets = 0
  let ready = false
  let elapsed = 0
  let previousTime: number | undefined

  // Animate the opening once, then hold the overhead shot without a render loop.
  function requestRender() {
    if (!disposed && !document.hidden && !frame) frame = requestAnimationFrame(render)
  }

  function render(time: number) {
    frame = 0
    if (disposed) return
    if (ready && elapsed < OPENING_DURATION) {
      if (previousTime !== undefined) {
        elapsed = Math.min(OPENING_DURATION, elapsed + (time - previousTime) / 1000)
      }
      previousTime = time
    }
    applyOpeningShot(camera, logoFocus, elapsed)
    composer.render()
    if (ready && elapsed < OPENING_DURATION) requestRender()
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
    requestRender()
  }

  function updateMotionPreference() {
    if (ready && motionPreference.matches) elapsed = OPENING_DURATION
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
        if (loadedAssets === 2) {
          ready = true
          elapsed = motionPreference.matches ? OPENING_DURATION : 0
          previousTime = undefined
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
    logo.name = 'DeepTrust_Logo'
    // The logo arrives upright. Rotate its front face upward and rest its base on the floor.
    logo.rotation.x = -Math.PI / 2
    const bounds = new Box3().setFromObject(logo)
    logo.position.y -= bounds.min.y
    bounds.setFromObject(logo).getCenter(logoFocus)
  })

  loadAsset('hub-network.glb', (hub) => {
    // Keep its existing groups intact for the later travel and joining sequence.
    hub.name = 'Doppel_Hub'
    hub.position.set(12, 0, -12)
  })

  return () => {
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
}
