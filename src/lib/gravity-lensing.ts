import { MathUtils, Object3D, Vector2, Vector3 } from 'three'

export const GRID_LENS_RELEASE = { durationSeconds: 1.2 } as const

/** Applied only to floor-grid lookup coordinates, never to the rendered scene. */
export const GRAVITY_LENS_GLSL = `
  uniform vec2 uGridLogoCenter;
  uniform vec2 uGridHubCenter;
  uniform float uGridLensStrength;
  uniform float uGridLensRelease;

  vec2 gridDeflection(vec2 position, vec2 center, float radius) {
    vec2 delta = position - center;
    float r = length(delta) / radius;
    float ringRadius = mix(0.72, 3.0, uGridLensRelease);
    float ringWidth = mix(0.38, 0.56, uGridLensRelease);
    float band = exp(-pow((r - ringRadius) / ringWidth, 2.0));
    return -delta * band * uGridLensStrength;
  }
`

/** Track both objects in world X/Z for the floor material's two grid lenses. */
export function createGravityLensing() {
  const uniforms = {
    uGridLogoCenter: { value: new Vector2() },
    uGridHubCenter: { value: new Vector2() },
    uGridLensStrength: { value: 0 },
    uGridLensRelease: { value: 0 },
  }
  const position = new Vector3()

  function reset() {
    uniforms.uGridLensStrength.value = 0
    uniforms.uGridLensRelease.value = 0
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
    uniforms.uGridLensStrength.value = 0.12 * MathUtils.smootherstep(time, 0, 2)
      * (1 + 0.08 * Math.sin(time * 1.4)) * (1 - MathUtils.smootherstep(release, 0, 1))
  }

  return { uniforms, update, reset }
}
