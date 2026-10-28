import { Color, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three'

const GRID_CARD_RATIO = 0.7

/** Put the grid in the floor material so it receives shadows without a second surface. */
export function createFloor() {
  const cellSize = { value: 12 * 0.0254 * GRID_CARD_RATIO }
  const material = new MeshStandardMaterial({
    color: '#111820', roughness: 0.92, metalness: 0.05,
  })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFloorCellSize = cellSize
    shader.uniforms.uFloorGridColor = { value: new Color('#34465D') }
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
    ` + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      vec2 gridUV = vFloorWorldPosition.xz / uFloorCellSize;
      vec2 footprint = max(fwidth(gridUV), vec2(0.000001));
      vec2 edgeDistance = abs(fract(gridUV + 0.5) - 0.5);
      vec2 coverage = 1.0 - smoothstep(
        vec2(0.0004 / uFloorCellSize),
        vec2(0.0004 / uFloorCellSize) + footprint,
        edgeDistance
      );
      float pixelFade = 1.0 - smoothstep(0.04, 0.22, max(footprint.x, footprint.y));
      float distanceFade = 1.0 - smoothstep(
        4.0, 14.0, distance(cameraPosition.xz, vFloorWorldPosition.xz)
      );
      float grid = max(coverage.x, coverage.y) * pixelFade * distanceFade;
      diffuseColor.rgb = mix(diffuseColor.rgb, uFloorGridColor, grid * 0.16);`,
    )
  }
  material.customProgramCacheKey = () => 'subtle-world-floor-grid-v1'

  const mesh = new Mesh(new PlaneGeometry(200, 200), material)
  mesh.name = 'Floor'
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.001
  mesh.receiveShadow = true

  function setCardWidth(width: number) {
    cellSize.value = width * GRID_CARD_RATIO
  }

  return { mesh, setCardWidth }
}
