import {
  Camera,
  Color,
  HalfFloatType,
  Mesh,
  NoBlending,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'

/** Average freshly rendered shutter samples, without retaining earlier frames. */
export function createKeycardMotionBlur(renderer: WebGLRenderer) {
  const type = renderer.extensions.has('EXT_color_buffer_float') ? HalfFloatType : UnsignedByteType
  const sample = new WebGLRenderTarget(1, 1, { type })
  const history = [
    new WebGLRenderTarget(1, 1, { type, depthBuffer: false }),
    new WebGLRenderTarget(1, 1, { type, depthBuffer: false }),
  ]
  const geometry = new PlaneGeometry(2, 2)
  const vertexShader = /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }
  `
  const average = new ShaderMaterial({
    vertexShader,
    fragmentShader: /* glsl */`
      uniform sampler2D uSample;
      uniform sampler2D uHistory;
      uniform float uCount;
      varying vec2 vUv;
      void main() {
        vec3 current = texture2D(uSample, vUv).rgb;
        vec3 previous = texture2D(uHistory, vUv).rgb;
        gl_FragColor = vec4(mix(previous, current, 1. / (uCount + 1.)), 1.);
      }
    `,
    uniforms: { uSample: { value: sample.texture }, uHistory: { value: history[0]!.texture }, uCount: { value: 0 } },
    depthTest: false, depthWrite: false, blending: NoBlending, toneMapped: false,
  })
  const output = new ShaderMaterial({
    vertexShader,
    fragmentShader: /* glsl */`
      uniform sampler2D uImage;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(texture2D(uImage, vUv).rgb, 1.);
        #include <colorspace_fragment>
      }
    `,
    uniforms: { uImage: { value: history[0]!.texture } },
    depthTest: false, depthWrite: false, blending: NoBlending, toneMapped: false,
  })
  const quad = new Mesh(geometry, average)
  quad.frustumCulled = false
  const pass = new Scene()
  pass.add(quad)
  const camera = new Camera()
  const clearColor = new Color()
  let samples = 12

  return {
    resize(width: number, height: number) {
      // Only the three-second spin uses these buffers. Keep its fill cost bounded.
      const scale = Math.min(renderer.getPixelRatio(), 1.5, 1600 / Math.max(width, height))
      const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale))
      sample.setSize(w, h)
      history.forEach((target) => target.setSize(w, h))
      samples = width < 700 ? 8 : 12
    },
    render(time: number, shutter: number, start: number, renderSample: (time: number) => void) {
      const previousTarget = renderer.getRenderTarget()
      const autoClear = renderer.autoClear
      renderer.getClearColor(clearColor)
      const clearAlpha = renderer.getClearAlpha()
      renderer.autoClear = false
      try {
        renderer.setClearColor(0x000000, 1)
        // Fresh accumulation on every frame: seeking and replay cannot leave trails.
        renderer.setRenderTarget(history[0]!)
        renderer.clear()
        let read = history[0]!, write = history[1]!
        quad.material = average
        for (let index = 0; index < samples; index++) {
          renderer.setRenderTarget(sample)
          renderer.clear()
          const sampleTime = Math.max(start, time - shutter * (1 - (index + .5) / samples))
          renderSample(sampleTime)
          average.uniforms.uHistory!.value = read.texture
          average.uniforms.uCount!.value = index
          renderer.setRenderTarget(write)
          renderer.render(pass, camera)
          const swap = read; read = write; write = swap
        }
        output.uniforms.uImage!.value = read.texture
        quad.material = output
        renderer.setRenderTarget(previousTarget)
        renderer.render(pass, camera)
      } finally {
        renderer.setRenderTarget(previousTarget)
        renderer.setClearColor(clearColor, clearAlpha)
        renderer.autoClear = autoClear
      }
    },
    dispose() {
      sample.dispose(); history.forEach((target) => target.dispose())
      geometry.dispose(); average.dispose(); output.dispose()
    },
  }
}
