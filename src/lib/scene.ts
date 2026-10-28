import {
  BufferGeometry,
  Float32BufferAttribute,
  FogExp2,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  TorusKnotGeometry,
  Vector2,
  WebGLRenderer,
  WireframeGeometry,
} from 'three'

/** Mount the scene and return cleanup for Svelte unmounts and hot reloads. */
export function createScene(canvas: HTMLCanvasElement): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  const scene = new Scene()
  scene.fog = new FogExp2('#060b13', 0.055)

  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.z = 7

  // Replace this group to build the final landing-page scene.
  const sculpture = new Group()
  const geometry = new TorusKnotGeometry(1.25, 0.38, 180, 20)
  const surfaceMaterial = new MeshBasicMaterial({ color: '#081822' })
  const surface = new Mesh(geometry, surfaceMaterial)
  const wireGeometry = new WireframeGeometry(geometry)
  const wireMaterial = new LineBasicMaterial({
    color: '#77ddd1',
    transparent: true,
    opacity: 0.65,
  })
  const wire = new LineSegments(wireGeometry, wireMaterial)
  wire.scale.setScalar(1.002)
  sculpture.add(surface, wire)
  sculpture.rotation.set(0.3, 0, 0.2)
  scene.add(sculpture)

  const positions = new Float32Array(600 * 3)
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = MathUtils.randFloatSpread(24)
    positions[i + 1] = MathUtils.randFloatSpread(18)
    positions[i + 2] = MathUtils.randFloat(-18, 2)
  }
  const starsGeometry = new BufferGeometry()
  starsGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const starsMaterial = new PointsMaterial({
    color: '#91bacb',
    size: 0.018,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  })
  const stars = new Points(starsGeometry, starsMaterial)
  scene.add(stars)

  const pointer = new Vector2()
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let previousTime: number | undefined

  function render(time: number) {
    const delta = previousTime === undefined ? 0 : Math.min((time - previousTime) / 1000, 0.05)
    previousTime = time

    if (!motionPreference.matches) {
      sculpture.rotation.y += delta * 0.12
      sculpture.rotation.x += delta * 0.045
      stars.rotation.y += delta * 0.008
      camera.position.x = MathUtils.damp(camera.position.x, pointer.x * 0.35, 3, delta)
      camera.position.y = MathUtils.damp(camera.position.y, pointer.y * 0.25, 3, delta)
      camera.lookAt(0, 0, 0)
    }

    renderer.render(scene, camera)
  }

  function resize() {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // Keep the sculpture inside the viewport on narrow screens.
    camera.position.z = camera.aspect < 1 ? 7 / camera.aspect : 7
    camera.updateProjectionMatrix()
    render(performance.now())
  }

  function movePointer(event: PointerEvent) {
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    )
  }

  function resetPointer() {
    pointer.set(0, 0)
  }

  function updateAnimation() {
    previousTime = undefined
    renderer.setAnimationLoop(null)
    if (!document.hidden && !motionPreference.matches) {
      renderer.setAnimationLoop(render)
    } else if (!document.hidden) {
      camera.position.x = 0
      camera.position.y = 0
      camera.lookAt(0, 0, 0)
      render(performance.now())
    }
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  window.addEventListener('pointermove', movePointer, { passive: true })
  document.documentElement.addEventListener('pointerleave', resetPointer)
  document.addEventListener('visibilitychange', updateAnimation)
  motionPreference.addEventListener('change', updateAnimation)
  resize()
  updateAnimation()

  return () => {
    renderer.setAnimationLoop(null)
    resizeObserver.disconnect()
    window.removeEventListener('pointermove', movePointer)
    document.documentElement.removeEventListener('pointerleave', resetPointer)
    document.removeEventListener('visibilitychange', updateAnimation)
    motionPreference.removeEventListener('change', updateAnimation)
    geometry.dispose()
    surfaceMaterial.dispose()
    wireGeometry.dispose()
    wireMaterial.dispose()
    starsGeometry.dispose()
    starsMaterial.dispose()
    renderer.dispose()
  }
}
