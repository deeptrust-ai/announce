import {
  ACESFilmicToneMapping,
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Material,
  MathUtils,
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
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

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
  camera.position.set(0, 3.3, 3.8)
  const controls = new OrbitControls(camera, canvas)
  controls.enablePan = false
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minPolarAngle = 0.15
  controls.maxPolarAngle = Math.PI * 0.38
  controls.minDistance = 1.5
  controls.maxDistance = 18
  controls.target.set(0, 0, 0)
  controls.update()

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
  key.shadow.camera.left = -2
  key.shadow.camera.right = 2
  key.shadow.camera.top = 2
  key.shadow.camera.bottom = -2
  key.shadow.camera.near = 0.1
  key.shadow.camera.far = 15
  key.shadow.bias = -0.0001
  key.shadow.normalBias = 0.002
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

  const bounds = new Box3()
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let disposed = false
  let frame = 0

  // The hub stays still. Draw only while loading, resizing, or moving the camera.
  function requestRender() {
    if (!disposed && !document.hidden && !frame) frame = requestAnimationFrame(render)
  }

  function render() {
    frame = 0
    if (disposed) return
    controls.update()
    composer.render()
  }

  function fitCamera() {
    if (bounds.isEmpty()) return
    const center = bounds.getCenter(new Vector3())
    const direction = camera.position.clone().sub(controls.target).normalize()
    const right = new Vector3().crossVectors(camera.up, direction).normalize()
    const up = new Vector3().crossVectors(direction, right).normalize()
    const tanVertical = Math.tan(MathUtils.degToRad(camera.fov / 2))
    const tanHorizontal = tanVertical * camera.aspect
    let distance = 0
    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const corner = new Vector3(x, y, z).sub(center)
          distance = Math.max(
            distance,
            corner.dot(direction) + Math.abs(corner.dot(right)) / tanHorizontal,
            corner.dot(direction) + Math.abs(corner.dot(up)) / tanVertical,
          )
        }
      }
    }
    controls.target.copy(center)
    camera.position.copy(center).addScaledVector(direction, distance * 1.16)
    controls.maxDistance = Math.max(18, distance * 2)
    controls.update()
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
    fitCamera()
    requestRender()
  }

  function updateMotionPreference() {
    controls.enableDamping = !motionPreference.matches
    requestRender()
  }

  function updateVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame)
      frame = 0
    } else {
      resize()
    }
  }

  controls.addEventListener('change', requestRender)
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  document.addEventListener('visibilitychange', updateVisibility)
  motionPreference.addEventListener('change', updateMotionPreference)
  updateMotionPreference()
  resize()

  new GLTFLoader().load(
    `${import.meta.env.BASE_URL}models/hub-network.glb`,
    (gltf) => {
      if (disposed) {
        disposeModel(gltf.scene)
        return
      }
      // The GLB is already Y-up and rests at Y=0. Preserve node groups for animation.
      const hub = gltf.scene
      hub.traverse((object) => {
        if (object instanceof Mesh) {
          object.castShadow = true
          object.receiveShadow = true
        }
      })
      scene.add(hub)
      bounds.setFromObject(hub)
      renderer.shadowMap.needsUpdate = true
      fitCamera()
      requestRender()
      callbacks.onReady?.()
    },
    undefined,
    (error) => {
      if (!disposed) callbacks.onError?.(error)
    },
  )

  return () => {
    disposed = true
    cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    controls.removeEventListener('change', requestRender)
    controls.dispose()
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
