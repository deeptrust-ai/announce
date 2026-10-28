import { MathUtils, Object3D, Vector2, Vector3 } from 'three'

/** Applied only to floor-grid lookup coordinates, never to the rendered scene. */
export const GRAVITY_LENS_GLSL = `
  uniform vec2 uGridLogoCenter;
  uniform vec2 uGridHubCenter;
  uniform float uGridLensStrength;

  vec2 gridDeflection(vec2 position, vec2 center, float radius) {
    vec2 delta = position - center;
    float r = length(delta) / radius;
    float band = exp(-pow((r - 0.72) / 0.38, 2.0));
    return -delta * band * uGridLensStrength;
  }
`

/** Track both objects in world X/Z for the floor material's two grid lenses. */
export function createGravityLensing() {
  const uniforms = {
    uGridLogoCenter: { value: new Vector2() },
    uGridHubCenter: { value: new Vector2() },
    uGridLensStrength: { value: 0 },
  }
  const position = new Vector3()

  function reset() {
    uniforms.uGridLensStrength.value = 0
  }

  function update(time: number, card: Object3D, hub: Object3D, reducedMotion: boolean) {
    if (time <= 0 || reducedMotion) {
      reset()
      return
    }
    card.getWorldPosition(position)
    uniforms.uGridLogoCenter.value.set(position.x, position.z)
    hub.getWorldPosition(position)
    uniforms.uGridHubCenter.value.set(position.x, position.z)
    uniforms.uGridLensStrength.value = 0.12 * MathUtils.smootherstep(time, 0, 2)
      * (1 + 0.08 * Math.sin(time * 1.4))
  }

  return { uniforms, update, reset }
}
