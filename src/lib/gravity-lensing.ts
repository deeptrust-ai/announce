import { MathUtils, Object3D, Vector2, Vector3 } from 'three'

export const GRID_LENS_RELEASE = { durationSeconds: 1.2 } as const
export const GRID_LENS = {
  strength: 0.3,
  pulseDepth: 0.22,
  pulseFrequencyHz: 0.75,
} as const

/** Applied only to floor-grid lookup coordinates, never to the rendered scene. */
export const GRAVITY_LENS_GLSL = `
  uniform vec2 uGridLogoCenter;
  uniform vec2 uGridHubCenter;
  uniform float uGridLensStrength;
  uniform float uGridLensRelease;
  uniform float uGridShockStrength;

  vec2 gridDeflection(vec2 position, vec2 center, float radius) {
    vec2 delta = position - center;
    float r = length(delta) / radius;
    float band = exp(-pow((r - 0.72) / 0.38, 2.0));
    return -delta * band * uGridLensStrength;
  }

  vec2 gridShockwave(vec2 position) {
    vec2 delta = position - uGridHubCenter;
    float distanceToHub = length(delta);
    float travel = 1.0 - pow(1.0 - uGridLensRelease, 2.0);
    float radius = mix(0.45, 3.4, travel);
    float front = (distanceToHub - radius) / 0.14;
    // A narrow compression front followed by a rebound reads as a wave
    // travelling through the grid, rather than a widening magnifying lens.
    float compression = -front * exp(-2.0 * front * front);
    return delta / max(distanceToHub, 0.00001) * compression * uGridShockStrength;
  }
`

/** Track both objects in world X/Z for the floor material's two grid lenses. */
export function createGravityLensing() {
  const uniforms = {
    uGridLogoCenter: { value: new Vector2() },
    uGridHubCenter: { value: new Vector2() },
    uGridLensStrength: { value: 0 },
    uGridLensRelease: { value: 0 },
    uGridShockStrength: { value: 0 },
  }
  const position = new Vector3()

  function reset() {
    uniforms.uGridLensStrength.value = 0
    uniforms.uGridLensRelease.value = 0
    uniforms.uGridShockStrength.value = 0
  }

  function update(
    time: number, releaseTime: number, card: Object3D, hub: Object3D, reducedMotion: boolean,
  ) {
    if (time <= 0 || reducedMotion) {
      reset()
      return
    }
    card.getWorldPosition(position)
    uniforms.uGridLogoCenter.value.set(position.x, position.z)
    hub.getWorldPosition(position)
    uniforms.uGridHubCenter.value.set(position.x, position.z)
    const release = releaseTime >= GRID_LENS_RELEASE.durationSeconds - 1e-6
      ? 1 : MathUtils.clamp(releaseTime / GRID_LENS_RELEASE.durationSeconds, 0, 1)
    uniforms.uGridLensRelease.value = release
    const pulse = 1 + GRID_LENS.pulseDepth
      * Math.sin(time * Math.PI * 2 * GRID_LENS.pulseFrequencyHz)
    uniforms.uGridLensStrength.value = GRID_LENS.strength * MathUtils.smootherstep(time, 0, 2)
      * pulse * (1 - MathUtils.smootherstep(release, 0, 1))
    uniforms.uGridShockStrength.value = 0.22 * MathUtils.smootherstep(release, 0, 0.12)
      * (1 - MathUtils.smootherstep(release, 0.55, 1))
  }

  return { uniforms, update, reset }
}
