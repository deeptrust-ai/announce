import { MathUtils, PerspectiveCamera, Quaternion, Raycaster, Sphere, Vector2, Vector3 } from 'three'

/** Pointer steering and drag inertia rotate the constellation, never the camera. */
export function createSphereInteraction(
  canvas: HTMLCanvasElement,
  camera: PerspectiveCamera,
  getSphere: () => Sphere | undefined,
  requestRender: () => void,
  prefersReducedMotion: () => boolean,
) {
  const rotation = new Quaternion(), dragged = new Quaternion()
  const hoverRotation = new Quaternion(), turn = new Quaternion(), pitch = new Quaternion()
  const right = new Vector3(), up = new Vector3(), hit = new Vector3(), projected = new Vector3()
  const pointer = new Vector2(), hover = new Vector2(), hoverTarget = new Vector2(), velocity = new Vector2()
  const sampledVelocity = new Vector2()
  const raycaster = new Raycaster()
  let pointerId: number | undefined
  let lastX = 0, lastY = 0, lastTime = 0

  function hitsSphere(event: PointerEvent) {
    const sphere = getSphere()
    if (!sphere) return false
    const rect = canvas.getBoundingClientRect()
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      1 - (event.clientY - rect.top) / rect.height * 2)
    camera.updateMatrixWorld()
    raycaster.setFromCamera(pointer, camera)
    return raycaster.ray.intersectSphere(sphere, hit) !== null
  }

  function axes() {
    camera.updateMatrixWorld()
    right.setFromMatrixColumn(camera.matrixWorld, 0)
    up.setFromMatrixColumn(camera.matrixWorld, 1)
  }

  function rotate(x: number, y: number) {
    axes()
    turn.setFromAxisAngle(up, x)
    pitch.setFromAxisAngle(right, y)
    dragged.premultiply(turn.multiply(pitch)).normalize()
  }

  function down(event: PointerEvent) {
    if (pointerId !== undefined || event.button !== 0 || !hitsSphere(event)) return
    pointerId = event.pointerId
    lastX = event.clientX; lastY = event.clientY; lastTime = event.timeStamp
    velocity.set(0, 0)
    hoverTarget.set(0, 0)
    canvas.setPointerCapture(event.pointerId)
    canvas.style.cursor = 'grabbing'
    canvas.focus({ preventScroll: true })
    requestRender()
  }

  function move(event: PointerEvent) {
    if (pointerId !== undefined) {
      if (event.pointerId !== pointerId) return
      const size = Math.max(1, Math.min(canvas.clientWidth, canvas.clientHeight))
      const x = (event.clientX - lastX) / size * Math.PI
      const y = (event.clientY - lastY) / size * Math.PI
      const seconds = Math.max(0.008, (event.timeStamp - lastTime) / 1000)
      rotate(x, y)
      sampledVelocity.set(MathUtils.clamp(x / seconds, -3, 3), MathUtils.clamp(y / seconds, -3, 3))
      velocity.lerp(sampledVelocity, 0.5)
      lastX = event.clientX; lastY = event.clientY; lastTime = event.timeStamp
      requestRender()
      return
    }
    const inside = event.pointerType === 'mouse' && hitsSphere(event)
    canvas.style.cursor = inside ? 'grab' : ''
    if (inside && !prefersReducedMotion()) {
      projected.copy(getSphere()!.center).project(camera)
      hoverTarget.set(MathUtils.clamp((pointer.x - projected.x) * 0.12, -0.16, 0.16),
        MathUtils.clamp((projected.y - pointer.y) * 0.12, -0.16, 0.16))
    } else hoverTarget.set(0, 0)
    if (!prefersReducedMotion()) requestRender()
  }

  function end(event: PointerEvent) {
    if (event.pointerId !== pointerId) return
    pointerId = undefined
    if (event.type === 'pointercancel' || event.timeStamp - lastTime > 120) velocity.set(0, 0)
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    canvas.style.cursor = ''
    requestRender()
  }

  function leave() {
    if (pointerId !== undefined) return
    hoverTarget.set(0, 0)
    canvas.style.cursor = ''
    requestRender()
  }

  function cancel() {
    const captured = pointerId
    pointerId = undefined
    if (captured !== undefined && canvas.hasPointerCapture(captured)) canvas.releasePointerCapture(captured)
    velocity.set(0, 0)
    hoverTarget.set(0, 0)
    canvas.style.cursor = ''
  }

  function lostCapture() { if (pointerId !== undefined) cancel() }

  function key(event: KeyboardEvent) {
    if (!getSphere() || event.altKey || event.metaKey || event.ctrlKey) return
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12],
    }
    const direction = directions[event.key]
    if (!direction) return
    event.preventDefault()
    velocity.set(0, 0)
    rotate(...direction)
    requestRender()
  }

  function update(delta: number, reducedMotion: boolean) {
    if (reducedMotion) {
      velocity.set(0, 0); hover.set(0, 0); hoverTarget.set(0, 0)
    } else {
      if (pointerId === undefined && velocity.lengthSq() > 0.00001) {
        const decay = Math.exp(-delta * 4)
        rotate(velocity.x * (1 - decay) / 4, velocity.y * (1 - decay) / 4)
        velocity.multiplyScalar(decay)
      }
      hover.x = MathUtils.damp(hover.x, hoverTarget.x, 5, delta)
      hover.y = MathUtils.damp(hover.y, hoverTarget.y, 5, delta)
    }
    axes()
    turn.setFromAxisAngle(up, hover.x)
    pitch.setFromAxisAngle(right, hover.y)
    hoverRotation.copy(turn).multiply(pitch)
    rotation.copy(hoverRotation).multiply(dragged)
    return !reducedMotion && (velocity.lengthSq() > 0.00001 || hover.distanceToSquared(hoverTarget) > 0.000001)
  }

  function reset() {
    cancel()
    dragged.identity(); rotation.identity(); hover.set(0, 0)
  }

  canvas.addEventListener('pointerdown', down)
  canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerup', end)
  canvas.addEventListener('pointercancel', end)
  canvas.addEventListener('lostpointercapture', lostCapture)
  canvas.addEventListener('pointerleave', leave)
  canvas.addEventListener('keydown', key)
  window.addEventListener('blur', cancel)

  function dispose() {
    cancel()
    canvas.removeEventListener('pointerdown', down)
    canvas.removeEventListener('pointermove', move)
    canvas.removeEventListener('pointerup', end)
    canvas.removeEventListener('pointercancel', end)
    canvas.removeEventListener('lostpointercapture', lostCapture)
    canvas.removeEventListener('pointerleave', leave)
    canvas.removeEventListener('keydown', key)
    window.removeEventListener('blur', cancel)
  }

  return { rotation, update, reset, cancel, dispose }
}
