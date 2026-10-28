import { MathUtils, PerspectiveCamera, Vector3 } from 'three'

export const OPENING_SHOT = {
  durationSeconds: 3,
  riseExponent: 2,
  // Finish the half-turn at azimuth 0, aligning the flat logo with the screen.
  startAzimuth: -180,
  turnDegrees: 180,
  startElevation: 4,
  startDistance: 0.24,
  pullbackRadius: 0.56,
  endDistance: 1.2,
  startFov: 58,
  endFov: 40,
} as const

export const OPENING_DURATION = OPENING_SHOT.durationSeconds

function ease(progress: number) {
  return (1 - Math.cos(Math.PI * MathUtils.clamp(progress, 0, 1))) / 2
}

/** One accelerating parabolic climb with a continuous pullback arc and lens change. */
export function applyOpeningShot(camera: PerspectiveCamera, focus: Vector3, elapsed: number) {
  const progress = MathUtils.clamp(elapsed / OPENING_DURATION, 0, 1)
  const turnProgress = ease(progress)
  // Physical camera height accelerates across the whole move: no hold or
  // separate takeoff stage. The lens follows this same slow-to-fast progress.
  const riseProgress = progress ** OPENING_SHOT.riseExponent
  const azimuth = MathUtils.degToRad(
    OPENING_SHOT.startAzimuth + OPENING_SHOT.turnDegrees * turnProgress,
  )
  const aspectScale = Math.max(1, 1 / camera.aspect)
  const startElevation = MathUtils.degToRad(OPENING_SHOT.startElevation)
  const startHeight = Math.sin(startElevation) * OPENING_SHOT.startDistance
  const startRadius = Math.cos(startElevation) * OPENING_SHOT.startDistance
  // One smooth radial arc pulls away early, then converges above the logo.
  // Both ends have zero horizontal velocity; there is no phase switch.
  const radius = (
    startRadius * (1 - turnProgress)
      + (OPENING_SHOT.pullbackRadius - startRadius / 2) * Math.sin(Math.PI * progress) ** 2
  ) * aspectScale
  const height = MathUtils.lerp(
    startHeight,
    OPENING_SHOT.endDistance * aspectScale,
    riseProgress,
  )
  const elevation = Math.atan2(height, radius)
  const fov = MathUtils.lerp(OPENING_SHOT.startFov, OPENING_SHOT.endFov, riseProgress)
  if (camera.fov !== fov) {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }

  if (elapsed >= OPENING_DURATION) {
    // Exact overhead position, with no residual horizontal orbit radius.
    camera.position.copy(focus)
    camera.position.y += height
  } else {
    camera.position.set(
      focus.x + Math.sin(azimuth) * radius,
      focus.y + height,
      focus.z + Math.cos(azimuth) * radius,
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
