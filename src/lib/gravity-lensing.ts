import { MathUtils, Object3D, PerspectiveCamera, Vector2, Vector3 } from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

/** Bend the rendered floor and silhouettes locally around the two attracting bodies. */
export function createGravityLensing() {
  const uniforms = {
    tDiffuse: { value: null },
    uAspect: { value: 1 },
    uLogoCenter: { value: new Vector2() },
    uHubCenter: { value: new Vector2() },
    uLogoRadius: { value: 0 },
    uHubRadius: { value: 0 },
    uStrength: { value: 0 },
  }
  const pass = new ShaderPass({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uAspect;
      uniform vec2 uLogoCenter;
      uniform vec2 uHubCenter;
      uniform float uLogoRadius;
      uniform float uHubRadius;
      uniform float uStrength;
      varying vec2 vUv;

      vec2 lens(vec2 center, float radius) {
        vec2 delta = (vUv - center) * vec2(uAspect, 1.0);
        float r = length(delta) / max(radius, 0.00001);
        // An annular deflection leaves the center readable and bends the
        // surrounding grid most strongly near the lens's outer edge.
        float band = exp(-pow((r - 0.72) / 0.38, 2.0));
        return -delta / vec2(uAspect, 1.0) * band * uStrength;
      }

      void main() {
        vec2 bend = lens(uLogoCenter, uLogoRadius) + lens(uHubCenter, uHubRadius);
        vec2 sampleUv = clamp(vUv + bend, vec2(0.001), vec2(0.999));
        gl_FragColor = texture2D(tDiffuse, sampleUv);
      }
    `,
  })
  const worldPosition = new Vector3()
  const projected = new Vector3()
  const viewPosition = new Vector3()

  function projectLens(
    object: Object3D, camera: PerspectiveCamera, radius: number,
    center: Vector2,
  ) {
    object.getWorldPosition(worldPosition)
    projected.copy(worldPosition).project(camera)
    center.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5)
    viewPosition.copy(worldPosition).applyMatrix4(camera.matrixWorldInverse)
    if (viewPosition.z >= 0 || projected.z < -1 || projected.z > 1) return 0
    return radius / (2 * -viewPosition.z * Math.tan(MathUtils.degToRad(camera.fov / 2)))
  }

  function reset() {
    pass.enabled = false
    pass.uniforms.uStrength!.value = 0
  }

  function update(
    time: number, camera: PerspectiveCamera, card: Object3D, hub: Object3D,
    reducedMotion: boolean,
  ) {
    if (time <= 0 || reducedMotion) {
      reset()
      return
    }
    camera.updateMatrixWorld()
    pass.enabled = true
    pass.uniforms.uAspect!.value = camera.aspect
    pass.uniforms.uLogoRadius!.value = projectLens(card, camera, 0.65, pass.uniforms.uLogoCenter!.value)
    pass.uniforms.uHubRadius!.value = projectLens(hub, camera, 1.7, pass.uniforms.uHubCenter!.value)
    pass.uniforms.uStrength!.value = 0.12 * MathUtils.smootherstep(time, 0, 2)
      * (1 + 0.08 * Math.sin(time * 1.4))
  }

  reset()
  return { pass, update, reset }
}
