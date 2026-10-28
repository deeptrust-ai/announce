import { Box3, MathUtils, Object3D, PerspectiveCamera, Vector3 } from 'three'

export const FINAL_HUB_SHOT = {
  wideHoldSeconds: 0.4,
  frameCoverage: 1.45,
  maxWidthFraction: 1.35,
  screenCenterX: 1.04,
} as const

export type FinalHubView = { position: Vector3; target: Vector3 }

/** Fit the live layout as the gap closes, excluding the old logo origin and pulse. */
export function fitFinalHubView(
  camera: PerspectiveCamera, hub: Object3D, cardBody: Object3D, logo: Object3D, orbitBounds?: Box3,
): FinalHubView {
  hub.updateWorldMatrix(true, true)
  cardBody.updateWorldMatrix(true, true)
  logo.updateWorldMatrix(true, true)
  const bounds = new Box3().setFromObject(hub)
    .union(new Box3().setFromObject(cardBody))
    .union(new Box3().setFromObject(logo))
  // Keep the final crop stable as individual nodes repel and orbit off-screen.
  if (orbitBounds) bounds.copy(orbitBounds)
  const target = bounds.getCenter(new Vector3())
  const size = bounds.getSize(new Vector3())
  const halfFov = Math.tan(MathUtils.degToRad(camera.fov / 2))
  const screenCenterY = camera.aspect < 1 ? 1.06 : 1.04
  const ndcX = FINAL_HUB_SHOT.screenCenterX * 2 - 1
  const ndcY = 1 - screenCenterY * 2
  const coverageX = camera.aspect < 1 ? 1.6 : FINAL_HUB_SHOT.maxWidthFraction
  const coverageY = FINAL_HUB_SHOT.frameCoverage
  const distance = Math.max(
    Math.max(size.z / (2 * coverageY), size.x / (2 * camera.aspect * coverageX)) / halfFov,
    size.y / 2 + camera.near + 0.35,
  )
  // Put the sphere center beyond the lower-right corner: only its northwest
  // portion remains in view, with the left side available for the typography.
  target.x -= ndcX * distance * halfFov * camera.aspect
  target.z += ndcY * distance * halfFov
  const position = target.clone()
  position.y = target.y + distance
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
