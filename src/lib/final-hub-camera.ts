import { Box3, MathUtils, Object3D, PerspectiveCamera, Vector3 } from 'three'

export const FINAL_HUB_SHOT = {
  wideHoldSeconds: 0.4,
  frameCoverage: 0.68,
  maxWidthFraction: 0.42,
  screenCenterX: 0.73,
} as const

export type FinalHubView = { position: Vector3; target: Vector3 }

/** Fit the live layout as the gap closes, excluding the old logo origin and pulse. */
export function fitFinalHubView(
  camera: PerspectiveCamera, hub: Object3D, cardBody: Object3D, logo: Object3D,
): FinalHubView {
  hub.updateWorldMatrix(true, true)
  cardBody.updateWorldMatrix(true, true)
  logo.updateWorldMatrix(true, true)
  const bounds = new Box3().setFromObject(hub)
    .union(new Box3().setFromObject(cardBody))
    .union(new Box3().setFromObject(logo))
  const target = bounds.getCenter(new Vector3())
  const size = bounds.getSize(new Vector3())
  const halfFov = Math.tan(MathUtils.degToRad(camera.fov / 2))
  const screenCenterY = camera.aspect < 1 ? 0.62 : 0.5
  const ndcX = FINAL_HUB_SHOT.screenCenterX * 2 - 1
  const ndcY = 1 - screenCenterY * 2
  const coverageX = Math.min(FINAL_HUB_SHOT.maxWidthFraction, 1 - Math.abs(ndcX) - 0.08)
  const coverageY = Math.min(FINAL_HUB_SHOT.frameCoverage, 1 - Math.abs(ndcY) - 0.08)
  const height = Math.max(size.z / (2 * coverageY), size.x / (2 * camera.aspect * coverageX)) / halfFov
  const distance = height + size.y / 2
  // Move the camera and its gaze together to keep the hub square overhead,
  // with its screen position clear of the left-hand editorial columns.
  target.x -= ndcX * distance * halfFov * camera.aspect
  target.z += ndcY * distance * halfFov
  const position = target.clone()
  position.y = bounds.max.y + height
  return { position, target }
}

/** Ease from the wide connection pose into a square overhead view of the hub. */
export function applyFinalHubView(
  camera: PerspectiveCamera, wideTarget: Vector3, view: FinalHubView, progress: number,
) {
  const amount = MathUtils.smootherstep(progress, 0, 1)
  camera.position.lerp(view.position, amount)
  camera.lookAt(new Vector3().lerpVectors(wideTarget, view.target, amount))
}
