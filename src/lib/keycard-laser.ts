import {
  AdditiveBlending,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three'

/** A camera-space beam from an off-screen emitter to the projected cutting point. */
export function createKeycardLaser() {
  const geometry = new PlaneGeometry(2, 2)
  const material = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blending: AdditiveBlending,
    uniforms: {
      uResolution: { value: new Vector2(1, 1) },
      uPixelRatio: { value: 1 },
      uHit: { value: new Vector2() },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0., 1.);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec2 uResolution;
      uniform float uPixelRatio;
      uniform vec2 uHit;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vec2 point = vUv * uResolution;
        vec2 source = vec2(-.18, 1.18) * uResolution;
        vec2 hit = uHit * uResolution;
        vec2 beam = hit - source;
        float travel = clamp(dot(point - source, beam) / max(dot(beam, beam), 1.), 0., 1.);
        float distanceToBeam = length(point - source - travel * beam) / uPixelRatio;
        float distanceToHit = length(point - hit) / uPixelRatio;
        if (distanceToBeam > 40. && distanceToHit > 40.) discard;
        float core = exp(-pow(distanceToBeam / .8, 2.));
        float halo = exp(-distanceToBeam / 3.2) * .38;
        float contact = exp(-pow(distanceToHit / 6., 2.));
        float hotPoint = exp(-pow(distanceToHit / 1.6, 2.));
        float power = .94 + .06 * sin(uTime * 83.);
        vec3 color = vec3(.06, .34, 1.) * (core + halo + contact * .65);
        color += vec3(.65, .88, 1.) * (core * .65 + hotPoint);
        gl_FragColor = vec4(color * power, 1.);
        #include <colorspace_fragment>
      }
    `,
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.renderOrder = 10
  mesh.visible = false
  const projected = new Vector3()

  return {
    mesh,
    resize(width: number, height: number, pixelRatio: number) {
      material.uniforms.uResolution!.value.set(width, height)
      material.uniforms.uPixelRatio!.value = pixelRatio
    },
    update(point: Vector3 | undefined, camera: PerspectiveCamera, time: number) {
      mesh.visible = !!point
      if (!point) return
      projected.copy(point).project(camera)
      material.uniforms.uHit!.value.set(projected.x * .5 + .5, projected.y * .5 + .5)
      material.uniforms.uTime!.value = time
    },
    dispose() { geometry.dispose(); material.dispose() },
  }
}
