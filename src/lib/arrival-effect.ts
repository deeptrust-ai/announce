import {
  AdditiveBlending,
  Color,
  Group,
  MathUtils,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
} from 'three'

export const ARRIVAL_EFFECT = {
  durationSeconds: 0.8,
  joltSeconds: 0.28,
  startRadius: 0,
  endRadius: 0.75,
  ringWidth: 0.22,
} as const

/** A floor-level pulse and a tiny, absolute-time camera impulse at completion. */
export function createArrivalEffect() {
  const root = new Group()
  root.name = 'DeepTrust_Arrival_Pulse'
  root.visible = false
  const uniforms = {
    uRadius: { value: ARRIVAL_EFFECT.startRadius as number },
    uOpacity: { value: 0 },
    uWidth: { value: ARRIVAL_EFFECT.ringWidth },
    uColor: { value: new Color('#4D83D9') },
  }
  const material = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
    vertexShader: `
      varying vec2 vFloor;
      void main() {
        vFloor = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vFloor;
      uniform float uRadius;
      uniform float uOpacity;
      uniform float uWidth;
      uniform vec3 uColor;
      void main() {
        float distanceToRing = (length(vFloor) - uRadius) / uWidth;
        float glow = exp(-distanceToRing * distanceToRing * 2.0);
        gl_FragColor = vec4(uColor, glow * uOpacity);
      }
    `,
  })
  // Leave room for the wider band's soft tail without clipping it to a square.
  const diameter = 2 * (ARRIVAL_EFFECT.endRadius + ARRIVAL_EFFECT.ringWidth * 3)
  const pulse = new Mesh(new PlaneGeometry(diameter, diameter), material)
  pulse.name = 'Blue_Floor_Shockwave'
  pulse.rotation.x = -Math.PI / 2
  // Floor is at -0.001 m; card base is at 0. The pulse sits between them,
  // centered under the card, so the card occludes it until it emerges at the edges.
  pulse.position.y = -0.0005
  root.add(pulse)

  function reset() {
    root.visible = false
    uniforms.uRadius.value = ARRIVAL_EFFECT.startRadius
    uniforms.uOpacity.value = 0
  }

  function update(time: number, camera: PerspectiveCamera, reducedMotion: boolean) {
    root.visible = !reducedMotion && time >= 0 && time < ARRIVAL_EFFECT.durationSeconds - 1e-6
    if (!root.visible) return
    const progress = time / ARRIVAL_EFFECT.durationSeconds
    uniforms.uRadius.value = MathUtils.lerp(
      ARRIVAL_EFFECT.startRadius, ARRIVAL_EFFECT.endRadius, progress,
    )
    uniforms.uOpacity.value = 0.28 * (1 - Math.exp(-progress * 30)) * (1 - progress) ** 2

    if (time < ARRIVAL_EFFECT.joltSeconds) {
      const damping = Math.exp(-time * 17)
        * (1 - MathUtils.smoothstep(time, 0.16, ARRIVAL_EFFECT.joltSeconds))
      const kick = Math.sin(time * 55) * damping
      // applyOpeningShot restores the base pose before every update, so these
      // small offsets never accumulate and disappear completely after 0.28 s.
      camera.position.y -= 0.015 * kick
      camera.rotateX(MathUtils.degToRad(0.35) * kick)
      camera.rotateZ(MathUtils.degToRad(0.65) * kick)
    }
  }

  return { root, update, reset }
}
