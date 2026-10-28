import { MathUtils, PerspectiveCamera, Vector3 } from 'three'

export const OPENING_SHOT = {
  durationSeconds: 3,
  riseDelaySeconds: 2,
  // Finish the half-turn at azimuth 0, aligning the flat logo with the screen.
  startAzimuth: -180,
  turnDegrees: 180,
  startElevation: 4,
  endElevation: 90,
  startDistance: 0.68,
  endDistance: 1.2,
} as const

export const OPENING_DURATION = OPENING_SHOT.durationSeconds

function ease(progress: number) {
  return (1 - Math.cos(Math.PI * MathUtils.clamp(progress, 0, 1))) / 2
}

/** Turn continuously, staying low for two seconds before the final overhead rise. */
export function applyOpeningShot(camera: PerspectiveCamera, focus: Vector3, elapsed: number) {
  const turnProgress = ease(elapsed / OPENING_DURATION)
  const riseProgress = ease(
    (elapsed - OPENING_SHOT.riseDelaySeconds)
      / (OPENING_DURATION - OPENING_SHOT.riseDelaySeconds),
  )
  const azimuth = MathUtils.degToRad(
    OPENING_SHOT.startAzimuth + OPENING_SHOT.turnDegrees * turnProgress,
  )
  const elevation = MathUtils.degToRad(
    MathUtils.lerp(OPENING_SHOT.startElevation, OPENING_SHOT.endElevation, riseProgress),
  )
  const distance = MathUtils.lerp(
    OPENING_SHOT.startDistance,
    OPENING_SHOT.endDistance,
    riseProgress,
  ) * Math.max(1, 1 / camera.aspect)

  if (elapsed >= OPENING_DURATION) {
    // Exact overhead position, with no residual horizontal orbit radius.
    camera.position.copy(focus)
    camera.position.y += distance
  } else {
    camera.position.set(
      focus.x + Math.sin(azimuth) * Math.cos(elevation) * distance,
      focus.y + Math.sin(elevation) * distance,
      focus.z + Math.cos(azimuth) * Math.cos(elevation) * distance,
    )
  }

  // A moving up vector stays perpendicular to the view at the overhead pole.
  // Keeping world Y as up there would cause an unstable camera roll.
  camera.up.set(
    -Math.sin(azimuth) * Math.sin(elevation),
    Math.cos(elevation),
    -Math.cos(azimuth) * Math.sin(elevation),
  )
  camera.lookAt(focus)
}
