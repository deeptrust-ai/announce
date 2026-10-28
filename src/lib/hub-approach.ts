import { MathUtils, Object3D, Vector3 } from 'three'

export const HUB_APPROACH = {
  delaySeconds: 2,
  durationSeconds: 8,
  stopDistanceGridCells: 8,
} as const

/** Drift the complete DeepTrust card south, stopping outside the existing orbit. */
export function createHubApproach(card: Object3D, hub: Object3D, gridCellSize: number) {
  const origin = card.position.clone()
  const destination = new Vector3(
    origin.x, origin.y, hub.position.z - gridCellSize * HUB_APPROACH.stopDistanceGridCells,
  )
  let previousProgress = -1

  function reset() {
    card.position.copy(origin)
    previousProgress = -1
  }

  function update(time: number) {
    const progress = MathUtils.smootherstep(time / HUB_APPROACH.durationSeconds, 0, 1)
    card.position.lerpVectors(origin, destination, progress)
    const changed = progress !== previousProgress
    previousProgress = progress
    return changed
  }

  return { update, reset }
}
