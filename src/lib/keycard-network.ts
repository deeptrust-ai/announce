import {
  CanvasTexture, Color, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, Object3D, PlaneGeometry, SRGBColorSpace, Vector3,
} from 'three'

const TOPICS = [
  ['Messages', 'Identity'], ['Domains', 'Agents'], ['Email', 'Credentials'],
  ['Social_Media', 'Policy'], ['Paid_Ads', 'Resources'], ['Telco', 'Sessions'], ['URLs', 'Audit'],
] as const

/** Original, restrained line icons for the seven identity/access concepts. */
function topicTexture(topic: string) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.scale(8, 8)
  ctx.strokeStyle = '#d6e8ed'
  ctx.lineWidth = 1.15
  ctx.lineCap = ctx.lineJoin = 'round'
  const line = (...points: number[]) => {
    ctx.beginPath(); ctx.moveTo(points[0]!, points[1]!)
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i]!, points[i + 1]!)
    ctx.stroke()
  }
  const circle = (x: number, y: number, radius: number) => {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke()
  }
  const box = (x: number, y: number, width: number, height: number, radius = 2) => {
    ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.stroke()
  }
  switch (topic) {
    case 'Identity':
      box(6, 4, 20, 24); circle(16, 12, 3); line(10, 23, 10, 21, 13, 18, 19, 18, 22, 21, 22, 23); break
    case 'Agents':
      box(6, 9, 20, 17, 4); line(16, 9, 16, 5); circle(16, 4, 1)
      circle(12, 16, 1); circle(20, 16, 1); line(12, 22, 20, 22); line(3, 14, 3, 21); line(29, 14, 29, 21); break
    case 'Credentials':
      circle(11, 13, 6); line(15, 17, 25, 27, 28, 24, 25, 21, 23, 23); circle(9, 11, 1); break
    case 'Policy':
      line(16, 4, 26, 8, 25, 20, 21, 25, 16, 29, 11, 25, 7, 20, 6, 8, 16, 4)
      line(11, 16, 15, 20, 22, 12); break
    case 'Resources':
      line(16, 4, 27, 10, 27, 23, 16, 29, 5, 23, 5, 10, 16, 4)
      line(5, 10, 16, 16, 27, 10); line(16, 16, 16, 29); break
    case 'Sessions':
      circle(16, 17, 11); line(16, 10, 16, 17, 21, 20); line(12, 3, 20, 3); break
    case 'Audit':
      box(7, 4, 19, 24); line(12, 11, 21, 11); line(12, 16, 21, 16); line(12, 21, 18, 21); break
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

/** Reuse the editable hub geometry with a Keycard palette and identity vocabulary. */
export function applyKeycardNetwork(hub: Object3D) {
  const converted = new Map<Material, MeshStandardMaterial>()
  hub.traverse((object) => {
    if (!(object instanceof Mesh)) return
    function convert(source: Material) {
      if (!(source instanceof MeshStandardMaterial)) return source
      let target = converted.get(source)
      if (target) return target
      const name = source.name
      if (name.includes('dark copper')) {
        target = new MeshPhysicalMaterial({
          color: '#17232b', metalness: 0.4, roughness: 0.42,
          iridescence: 0.7, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 450],
          clearcoat: 0.45, clearcoatRoughness: 0.35,
        })
      } else {
        target = source.clone()
        if (name.includes('amber')) {
          target.color.set('#b7d8e0'); target.emissive.set('#91b4d6'); target.emissiveIntensity = 0.6
        } else if (name.includes('lime')) {
          target.color.set('#c6e5a7'); target.emissive.set('#b6d791'); target.emissiveIntensity = 1.1
        } else if (name.includes('socket')) target.color.set('#0b1317')
      }
      target.name = `Keycard — ${name}`
      converted.set(source, target)
      return target
    }
    object.material = Array.isArray(object.material) ? object.material.map(convert) : convert(object.material)
  })
  converted.forEach((_target, source) => source.dispose())

  const geometry = new PlaneGeometry(0.15, 0.15)
  for (const [kind, topic] of TOPICS) {
    const node = hub.getObjectByName(`Node_${kind}`)!
    for (const child of node.children) {
      if (child.name !== `${kind}_Body` && child.name !== `${kind}_Amber_Border`) child.visible = false
    }
    const body = node.getObjectByName(`${kind}_Body`) as Mesh
    body.geometry.computeBoundingBox()
    const width = body.geometry.boundingBox!.getSize(new Vector3()).x
    const icon = new Mesh(geometry, new MeshBasicMaterial({ map: topicTexture(topic), transparent: true, depthWrite: false }))
    icon.name = `Keycard_${topic}_Icon`
    icon.rotation.x = -Math.PI / 2
    icon.position.y = body.geometry.boundingBox!.max.y + width * 0.025
    node.add(icon)
    node.userData.keycardTopic = topic
  }
  const rim = hub.getObjectByName('Hub_Lime_Rim') as Mesh
  if (rim.material instanceof MeshStandardMaterial) {
    const rimMaterial = rim.material.clone()
    rimMaterial.color.copy(new Color('#c4d4f2'))
    rimMaterial.emissive.set('#a4b4e5')
    rimMaterial.emissiveIntensity = 1.25
    rim.material = rimMaterial
  }
}
