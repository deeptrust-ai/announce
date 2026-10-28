import { Color, Mesh, MeshBasicMaterial, PlaneGeometry, ShadowMaterial, Vector3 } from 'three'

export const GRID_CARD_RATIO = 0.7

/** Keep floor color/grid independent of lighting, with a separate shadow receiver. */
export function createFloor() {
  const cellSize = { value: 12 * 0.0254 * GRID_CARD_RATIO }
  const cameraPosition = { value: new Vector3() }
  const material = new MeshBasicMaterial({ color: '#182331' })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFloorCellSize = cellSize
    shader.uniforms.uFloorCameraPosition = cameraPosition
    shader.uniforms.uFloorGridColor = { value: new Color('#43566F') }
    shader.vertexShader = 'varying vec3 vFloorWorldPosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vFloorWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;`,
    )
    shader.fragmentShader = `
      varying vec3 vFloorWorldPosition;
      uniform float uFloorCellSize;
      uniform vec3 uFloorGridColor;
      uniform vec3 uFloorCameraPosition;
    ` + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      vec2 gridUV = vFloorWorldPosition.xz / uFloorCellSize;
      vec2 footprint = max(fwidth(gridUV), vec2(0.000001));
      vec2 edgeDistance = abs(fract(gridUV + 0.5) - 0.5);
      vec2 coverage = 1.0 - smoothstep(
        vec2(0.0007 / uFloorCellSize),
        vec2(0.0007 / uFloorCellSize) + footprint,
        edgeDistance
      );
      float pixelFade = 1.0 - smoothstep(0.04, 0.22, max(footprint.x, footprint.y));
      float distanceScale = max(1.0, uFloorCameraPosition.y / 3.0);
      float distanceFade = 1.0 - smoothstep(
        4.0 * distanceScale, 14.0 * distanceScale,
        distance(uFloorCameraPosition.xz, vFloorWorldPosition.xz)
      );
      float grid = max(coverage.x, coverage.y) * pixelFade * distanceFade;
      diffuseColor.rgb = mix(diffuseColor.rgb, uFloorGridColor, grid * 0.32);`,
    )
  }
  material.customProgramCacheKey = () => 'unlit-world-floor-grid-v3'

  const geometry = new PlaneGeometry(200, 200)
  const mesh = new Mesh(geometry, material)
  mesh.name = 'Floor'
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.001
  mesh.onBeforeRender = (_renderer, _scene, camera) => {
    camera.getWorldPosition(cameraPosition.value)
  }

  const shadows = new Mesh(geometry, new ShadowMaterial({ color: '#000000', opacity: 0.3 }))
  shadows.name = 'Floor_Shadows'
  shadows.position.z = 0.0002
  shadows.receiveShadow = true
  shadows.material.depthWrite = false
  mesh.add(shadows)

  function setCardWidth(width: number) {
    cellSize.value = width * GRID_CARD_RATIO
  }

  return { mesh, setCardWidth }
}
