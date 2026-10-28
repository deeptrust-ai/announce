import { Box3, MathUtils, Object3D, PerspectiveCamera, Vector3 } from 'three'

export const FINAL_HUB_SHOT = { durationSeconds: 3, frameCoverage: 0.84 } as const

export type FinalHubView = { position: Vector3; target: Vector3 }

/** Measure the settled eight-node layout, excluding the old logo origin and pulse. */
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
  const height = Math.max(size.z / 2, size.x / (2 * camera.aspect))
    / (halfFov * FINAL_HUB_SHOT.frameCoverage)
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
