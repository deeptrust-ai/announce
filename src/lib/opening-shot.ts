import { MathUtils, PerspectiveCamera, Vector3 } from 'three'

export const OPENING_SHOT = {
  durationSeconds: 3,
  riseDelaySeconds: 2,
  // Finish the half-turn at azimuth 0, aligning the flat logo with the screen.
  startAzimuth: -180,
  turnDegrees: 180,
  startElevation: 4,
  endElevation: 90,
  startDistance: 0.24,
  pullbackRadius: 0.68,
  endDistance: 1.2,
  startFov: 58,
  endFov: 40,
} as const

export const OPENING_DURATION = OPENING_SHOT.durationSeconds

function ease(progress: number) {
  return (1 - Math.cos(Math.PI * MathUtils.clamp(progress, 0, 1))) / 2
}

/** Dolly backward at fixed low height, then rise overhead while narrowing the lens. */
export function applyOpeningShot(camera: PerspectiveCamera, focus: Vector3, elapsed: number) {
  const turnProgress = ease(elapsed / OPENING_DURATION)
  const dollyProgress = ease(elapsed / OPENING_SHOT.riseDelaySeconds)
  const riseProgress = ease(
    (elapsed - OPENING_SHOT.riseDelaySeconds)
      / (OPENING_DURATION - OPENING_SHOT.riseDelaySeconds),
  )
  const azimuth = MathUtils.degToRad(
    OPENING_SHOT.startAzimuth + OPENING_SHOT.turnDegrees * turnProgress,
  )
  const aspectScale = Math.max(1, 1 / camera.aspect)
  const startElevation = MathUtils.degToRad(OPENING_SHOT.startElevation)
  // Keep physical eye height fixed while pulling back, rather than letting a
  // fixed gaze angle lift the camera as its distance increases.
  const groundHeight = Math.sin(startElevation) * OPENING_SHOT.startDistance
  const groundRadius = MathUtils.lerp(
    Math.cos(startElevation) * OPENING_SHOT.startDistance,
    OPENING_SHOT.pullbackRadius,
    dollyProgress,
  ) * aspectScale
  const elevation = MathUtils.lerp(
    Math.atan2(groundHeight, groundRadius),
    MathUtils.degToRad(OPENING_SHOT.endElevation),
    riseProgress,
  )
  const distance = MathUtils.lerp(
    Math.hypot(groundRadius, groundHeight),
    OPENING_SHOT.endDistance * aspectScale,
    riseProgress,
  )
  const fov = MathUtils.lerp(OPENING_SHOT.startFov, OPENING_SHOT.endFov, riseProgress)
  if (camera.fov !== fov) {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }

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
