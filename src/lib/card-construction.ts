import {
  AdditiveBlending,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  CubicBezierCurve3,
  CurvePath,
  DynamicDrawUsage,
  Group,
  LineBasicMaterial,
  LineCurve3,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'

export const CARD_CONSTRUCTION = {
  startSeconds: 1.5,
  outlineSeconds: 1.5,
  fillDelaySeconds: 0.5,
  fillSeconds: 1,
  logoSettleSeconds: 0.9,
  gridSize: 12,
  fillColor: '#102B55',
  logoScale: 0.52,
} as const

export const CARD_DURATION = Math.max(
  CARD_CONSTRUCTION.outlineSeconds,
  CARD_CONSTRUCTION.fillDelaySeconds + CARD_CONSTRUCTION.fillSeconds,
)

// The navy background color in public/branding/logo-mark.svg.
const DEEPTRUST_BLUE = '#061533'
const BORDER_SEGMENTS = 192
const BORDER_SIDES = 8

function sourceMesh(hub: Object3D, name: string) {
  const mesh = hub.getObjectByName(name)
  if (!(mesh instanceof Mesh)) throw new Error(`Hub card mesh is missing: ${name}`)
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
  if (!(material instanceof MeshStandardMaterial)) {
    throw new Error(`Hub card material is unsupported: ${name}`)
  }
  return { mesh, material }
}

/** Match a hub card, with a blue split trace and a temporary tiled fill reveal. */
export function createCardConstruction(logo: Object3D, hub: Object3D) {
  const sourceBody = sourceMesh(hub, 'Messages_Body')
  const sourceBorder = sourceMesh(hub, 'Messages_Amber_Border')
  sourceBody.mesh.geometry.computeBoundingBox()
  sourceBorder.mesh.geometry.computeBoundingBox()
  const bodyBounds = sourceBody.mesh.geometry.boundingBox!
  const borderBounds = sourceBorder.mesh.geometry.boundingBox!
  const size = bodyBounds.getSize(new Vector3())
  const halfWidth = size.x / 2
  const halfDepth = size.z / 2
  // Match the source's 12-inch card, 2.4-inch corner radius and 0.09-inch wire.
  const radius = size.x * 0.2
  const wireRadius = size.x * (0.09 / 12)
  const borderY = (borderBounds.min.y + borderBounds.max.y) / 2
  const blue = new Color(DEEPTRUST_BLUE)

  const root = new Group()
  root.name = 'Node_DeepTrust'
  root.userData.type = 'DeepTrust'
  root.userData.sourceCard = 'Messages_Body'
  root.userData.brandBlue = DEEPTRUST_BLUE
  root.userData.fillColor = CARD_CONSTRUCTION.fillColor
  root.add(logo)
  const construction = new Group()
  construction.name = 'DeepTrust_Card_Construction'
  construction.visible = false
  root.add(construction)

  const fillProgress = { value: 0 }
  const bodyMaterial = sourceBody.material.clone()
  bodyMaterial.name = 'DeepTrust navy card — tiled construction'
  bodyMaterial.color.set(CARD_CONSTRUCTION.fillColor)
  bodyMaterial.emissive.setRGB(0, 0, 0)
  bodyMaterial.emissiveIntensity = 0
  bodyMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uCardFill = fillProgress
    shader.uniforms.uCardSize = { value: new Vector2(size.x, size.z) }
    shader.vertexShader = 'varying vec2 vCardPosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvCardPosition = position.xz;',
    )
    shader.fragmentShader = `
      varying vec2 vCardPosition;
      uniform float uCardFill;
      uniform vec2 uCardSize;
      float cardHash(vec2 cell) {
        return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
      }
    ` + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
      vec2 cardUV = clamp(vCardPosition / uCardSize + 0.5, 0.0, 0.99999);
      vec2 cell = floor(cardUV * ${CARD_CONSTRUCTION.gridSize.toFixed(1)});
      float checker = mod(cell.x + cell.y, 2.0);
      float tileStart = (cell.y + cardHash(cell) * 1.7 + checker * 0.8)
        / ${(CARD_CONSTRUCTION.gridSize + 2.5).toFixed(1)};
      float tileAge = uCardFill - tileStart;
      if (uCardFill < 1.0 && tileAge <= 0.0) discard;`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `// Fade each cell from dark to its final shaded fill, without overshoot.
      outgoingLight *= mix(0.18, 1.0, smoothstep(0.0, 0.06, tileAge));
      #include <opaque_fragment>`,
    )
  }
  bodyMaterial.customProgramCacheKey = () => 'deeptrust-tiled-card-v2-dark-fill'
  const body = new Mesh(sourceBody.mesh.geometry, bodyMaterial)
  body.name = 'DeepTrust_Card_Body'
  body.receiveShadow = true
  body.visible = false
  construction.add(body)

  const borderMaterial = sourceBorder.material.clone()
  borderMaterial.name = 'DeepTrust blue border'
  borderMaterial.color.copy(blue)
  borderMaterial.emissive.copy(blue)
  borderMaterial.emissiveIntensity = 24
  const headGeometry = new SphereGeometry(wireRadius * 1.7, 12, 8)
  const headMaterial = new MeshBasicMaterial({ color: blue.clone().multiplyScalar(220) })

  function branch(sign: number) {
    const point = (x: number, z: number) => new Vector3(sign * x, borderY, z)
    const k = radius * 0.5522847498
    const path = new CurvePath<Vector3>()
    path.add(new LineCurve3(point(0, -halfDepth), point(halfWidth - radius, -halfDepth)))
    path.add(new CubicBezierCurve3(
      point(halfWidth - radius, -halfDepth),
      point(halfWidth - radius + k, -halfDepth),
      point(halfWidth, -halfDepth + radius - k),
      point(halfWidth, -halfDepth + radius),
    ))
    path.add(new LineCurve3(
      point(halfWidth, -halfDepth + radius), point(halfWidth, halfDepth - radius),
    ))
    path.add(new CubicBezierCurve3(
      point(halfWidth, halfDepth - radius),
      point(halfWidth, halfDepth - radius + k),
      point(halfWidth - radius + k, halfDepth),
      point(halfWidth - radius, halfDepth),
    ))
    path.add(new LineCurve3(point(halfWidth - radius, halfDepth), point(0, halfDepth)))
    const geometry = new TubeGeometry(path, BORDER_SEGMENTS, wireRadius, BORDER_SIDES, false)
    geometry.setDrawRange(0, 0)
    const mesh = new Mesh(geometry, borderMaterial)
    mesh.name = sign < 0 ? 'Border_Left_Trace' : 'Border_Right_Trace'
    mesh.castShadow = true
    const head = new Mesh(headGeometry, headMaterial)
    head.name = sign < 0 ? 'Left_Trace_Head' : 'Right_Trace_Head'
    construction.add(mesh, head)
    return { path, mesh, head }
  }
  const branches = [branch(-1), branch(1)]

  // Fixed particles follow deterministic birth times, so hidden tabs and seeks
  // cannot cause a burst of newly spawned particles or change the fill pattern.
  let seed = 0xdee97
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const particles = branches.flatMap(({ path }) => Array.from({ length: 120 }, (_, index) => {
    const birth = (index + random() * 0.7) / 120 * CARD_CONSTRUCTION.outlineSeconds
    return {
      birth,
      lifetime: 0.16 + random() * 0.22,
      origin: path.getPointAt(birth / CARD_CONSTRUCTION.outlineSeconds),
      velocity: new Vector3((random() - 0.5) * 0.18, 0.04 + random() * 0.08,
        (random() - 0.5) * 0.18),
    }
  }))
  const sparkPositions = new Float32Array(particles.length * 6)
  const sparkColors = new Float32Array(particles.length * 6)
  const sparkGeometry = new BufferGeometry()
  const positions = new BufferAttribute(sparkPositions, 3).setUsage(DynamicDrawUsage)
  const colors = new BufferAttribute(sparkColors, 3).setUsage(DynamicDrawUsage)
  sparkGeometry.setAttribute('position', positions)
  sparkGeometry.setAttribute('color', colors)
  const sparkMaterial = new LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  })
  const sparks = new LineSegments(sparkGeometry, sparkMaterial)
  sparks.name = 'Blue_Construction_Sparks'
  sparks.frustumCulled = false
  construction.add(sparks)

  const startPosition = logo.position.clone()
  const startScale = logo.scale.clone()
  const logoBounds = new Box3().setFromObject(logo)
  const logoDepth = logoBounds.getSize(new Vector3()).y
  const finalDepth = size.x * (0.15 / 12)
  const finalLogoY = bodyBounds.max.y + 0.0005 + finalDepth / 2
  const white = new Color('#ffffff')
  const logoMaterials = new Map<MeshStandardMaterial, Color>()
  logo.traverse((object) => {
    if (!(object instanceof Mesh)) return
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of materials) {
      if (material instanceof MeshStandardMaterial && !logoMaterials.has(material)) {
        logoMaterials.set(material, material.color.clone())
      }
    }
  })
  let previousTime = -1

  function reset() {
    construction.visible = false
    body.visible = false
    body.castShadow = false
    fillProgress.value = 0
    logo.position.copy(startPosition)
    logo.scale.copy(startScale)
    logoMaterials.forEach((color, material) => material.color.copy(color))
    borderMaterial.emissiveIntensity = 24
    for (const { mesh, head } of branches) {
      mesh.geometry.setDrawRange(0, 0)
      head.visible = false
    }
    sparks.visible = false
    previousTime = -1
  }

  function update(time: number) {
    if (time < 0) return false
    const activeTime = MathUtils.clamp(time, 0, CARD_DURATION)
    const effectsTime = Math.max(0, time)
    const outline = MathUtils.clamp(activeTime / CARD_CONSTRUCTION.outlineSeconds, 0, 1)
    const fill = MathUtils.clamp(
      (activeTime - CARD_CONSTRUCTION.fillDelaySeconds) / CARD_CONSTRUCTION.fillSeconds, 0, 1,
    )
    const settle = MathUtils.smootherstep(activeTime, 0, CARD_CONSTRUCTION.logoSettleSeconds)
    construction.visible = true
    logo.scale.set(
      startScale.x * MathUtils.lerp(1, CARD_CONSTRUCTION.logoScale, settle),
      startScale.y * MathUtils.lerp(1, CARD_CONSTRUCTION.logoScale, settle),
      startScale.z * MathUtils.lerp(1, finalDepth / logoDepth, settle),
    )
    logo.position.y = MathUtils.lerp(startPosition.y, finalLogoY, settle)
    logoMaterials.forEach((startColor, material) => material.color.lerpColors(startColor, white, settle))

    const cooling = 1 - MathUtils.smoothstep(effectsTime,
      CARD_CONSTRUCTION.outlineSeconds, CARD_CONSTRUCTION.outlineSeconds + 0.45)
    borderMaterial.emissiveIntensity = 24 + cooling * 140
    for (const { path, mesh, head } of branches) {
      mesh.geometry.setDrawRange(0, Math.floor(outline * BORDER_SEGMENTS) * BORDER_SIDES * 6)
      head.visible = activeTime > 0 && outline < 1
      if (head.visible) head.position.copy(path.getPointAt(outline))
    }
    body.visible = activeTime >= CARD_CONSTRUCTION.fillDelaySeconds
    // Avoid a solid-card shadow before its cells have actually filled in.
    body.castShadow = fill >= 1
    fillProgress.value = fill

    sparks.visible = effectsTime > 0 && effectsTime < CARD_CONSTRUCTION.outlineSeconds + 0.4
    if (sparks.visible) {
      particles.forEach((particle, index) => {
        const age = effectsTime - particle.birth
        const alive = age >= 0 && age < particle.lifetime
        const energy = alive ? (1 - age / particle.lifetime) ** 2 * 220 : 0
        for (let end = 0; end < 2; end += 1) {
          const t = alive ? Math.max(0, age - end * 0.035) : 0
          const offset = index * 6 + end * 3
          sparkPositions[offset] = particle.origin.x + particle.velocity.x * t
          sparkPositions[offset + 1] = Math.max(borderY,
            particle.origin.y + particle.velocity.y * t - 0.175 * t * t)
          sparkPositions[offset + 2] = particle.origin.z + particle.velocity.z * t
          sparkColors[offset] = blue.r * energy
          sparkColors[offset + 1] = blue.g * energy
          sparkColors[offset + 2] = blue.b * energy
        }
      })
      positions.needsUpdate = true
      colors.needsUpdate = true
    }
    const changed = activeTime !== previousTime
    previousTime = activeTime
    return changed
  }

  return { root, update, reset }
}
