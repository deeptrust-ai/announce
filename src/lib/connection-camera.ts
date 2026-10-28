import { Box3, MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { applyOpeningShot, OPENING_DURATION } from './opening-shot'

export type ConnectionView = { target: Vector3; height: number }

/** Fit both endpoints while lifting vertically above the logo's original position. */
export function fitConnectionView(
  camera: PerspectiveCamera, focus: Vector3, bounds: Box3,
): ConnectionView {
  const target = bounds.getCenter(new Vector3())
  const candidate = camera.clone()
  const corners: Vector3[] = []
  for (const x of [bounds.min.x, bounds.max.x]) {
    for (const y of [bounds.min.y, bounds.max.y]) {
      for (const z of [bounds.min.z, bounds.max.z]) corners.push(new Vector3(x, y, z))
    }
  }
  function fits(height: number) {
    applyOpeningShot(candidate, focus, OPENING_DURATION)
    candidate.position.y = focus.y + height
    candidate.lookAt(target)
    candidate.updateMatrixWorld(true)
    return corners.every((corner) => {
      const projected = corner.clone().project(candidate)
      return Math.abs(projected.x) <= 0.86 && Math.abs(projected.y) <= 0.86
        && projected.z >= -1 && projected.z <= 1
    })
  }
  let low = 1.2
  let high = 64
  while (!fits(high) && high < 512) high *= 2
  for (let index = 0; index < 32; index += 1) {
    const middle = (low + high) / 2
    if (fits(middle)) high = middle
    else low = middle
  }
  return { target, height: high }
}

/** Keep X/Z fixed; only lift the camera and ease its gaze toward the diagram center. */
export function applyConnectionView(
  camera: PerspectiveCamera,
  focus: Vector3,
  view: ConnectionView,
  progress: number,
) {
  const amount = MathUtils.smootherstep(progress, 0, 1)
  camera.position.y = MathUtils.lerp(camera.position.y, focus.y + view.height, amount)
  const target = new Vector3().lerpVectors(focus, view.target, amount)
  camera.lookAt(target)
}
