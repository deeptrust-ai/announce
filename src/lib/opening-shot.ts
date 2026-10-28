import { MathUtils, PerspectiveCamera, Vector3 } from 'three'

export const OPENING_SHOT = {
  orbitSeconds: 18,
  overheadSeconds: 6,
  startAzimuth: 45,
  startElevation: 4,
  orbitEndElevation: 65,
  startDistance: 0.68,
  orbitEndDistance: 0.92,
  overheadDistance: 1.2,
} as const

export const OPENING_DURATION = OPENING_SHOT.orbitSeconds + OPENING_SHOT.overheadSeconds

function ease(progress: number) {
  return (1 - Math.cos(Math.PI * MathUtils.clamp(progress, 0, 1))) / 2
}

/** Keep the camera focused on the logo through one orbit and the overhead rise. */
export function applyOpeningShot(camera: PerspectiveCamera, focus: Vector3, elapsed: number) {
  const orbit = ease(elapsed / OPENING_SHOT.orbitSeconds)
  const rise = ease((elapsed - OPENING_SHOT.orbitSeconds) / OPENING_SHOT.overheadSeconds)
  const azimuth = MathUtils.degToRad(OPENING_SHOT.startAzimuth) + Math.PI * 2 * orbit
  const elevation = MathUtils.degToRad(
    MathUtils.lerp(OPENING_SHOT.startElevation, OPENING_SHOT.orbitEndElevation, orbit)
      + (90 - OPENING_SHOT.orbitEndElevation) * rise,
  )
  const distance = MathUtils.lerp(
    MathUtils.lerp(OPENING_SHOT.startDistance, OPENING_SHOT.orbitEndDistance, orbit),
    OPENING_SHOT.overheadDistance,
    rise,
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
