import { Color, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three'

import { createGravityLensing, GRAVITY_LENS_GLSL } from './gravity-lensing'
import { BRANDS } from './brand'
import type { BrandVariant } from './brand'

export const GRID_CARD_RATIO = 0.7

/** Keep the floor color/grid independent of lighting and free of cast shadows. */
export function createFloor(variant: BrandVariant = 'doppel') {
  const brand = BRANDS[variant]
  const lensing = createGravityLensing()
  const cellSize = { value: 12 * 0.0254 * GRID_CARD_RATIO }
  const cameraPosition = { value: new Vector3() }
  const material = new MeshBasicMaterial({ color: brand.floor })
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lensing.uniforms)
    shader.uniforms.uFloorCellSize = cellSize
    shader.uniforms.uFloorCameraPosition = cameraPosition
    shader.uniforms.uFloorGridColor = { value: new Color(brand.grid) }
    shader.uniforms.uFloorGridOpacity = { value: brand.gridOpacity }
    shader.vertexShader = 'varying vec3 vFloorWorldPosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      vFloorWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;`,
    )
    shader.fragmentShader = `
      ${GRAVITY_LENS_GLSL}
      varying vec3 vFloorWorldPosition;
      uniform float uFloorCellSize;
      uniform vec3 uFloorGridColor;
      uniform vec3 uFloorCameraPosition;
      uniform float uFloorGridOpacity;
    ` + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      vec2 gridPosition = vFloorWorldPosition.xz;
      vec2 warpedGridPosition = gridPosition
        + gridDeflection(gridPosition, uGridLogoCenter, 0.65)
        + gridDeflection(gridPosition, uGridHubCenter, 1.7)
        + gridShockwave(gridPosition);
      vec2 gridUV = warpedGridPosition / uFloorCellSize;
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
      diffuseColor.rgb = mix(diffuseColor.rgb, uFloorGridColor, grid * uFloorGridOpacity);`,
    )
  }
  material.customProgramCacheKey = () => 'branded-world-floor-grid-v7-shockwave'

  const geometry = new PlaneGeometry(200, 200)
  const mesh = new Mesh(geometry, material)
  mesh.name = 'Floor'
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.001
  mesh.onBeforeRender = (_renderer, _scene, camera) => {
    camera.getWorldPosition(cameraPosition.value)
  }

  function setCardWidth(width: number) {
    cellSize.value = width * GRID_CARD_RATIO
  }

  return { mesh, setCardWidth, lensing }
}
