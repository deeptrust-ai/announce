import { MathUtils, Object3D, Vector3 } from 'three'

export const HUB_APPROACH = {
  delaySeconds: 2,
  durationSeconds: 8,
} as const

/** Drift the complete DeepTrust card into the north slot of the hub orbit. */
export function createHubApproach(card: Object3D, hub: Object3D, orbitRadius: number) {
  const origin = card.position.clone()
  const destination = new Vector3(
    hub.position.x, origin.y, hub.position.z - orbitRadius,
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
