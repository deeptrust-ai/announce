import {
  Box3,
  CylinderGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three'

export const SOUTH_CONNECTION = {
  durationSeconds: 3,
  hubDistance: 18,
} as const

/** Draw a fixed connection south (+Z) while the overhead camera stays on the card. */
export function createSouthConnection(card: Object3D, width: number, hub: Object3D) {
  const border = card.getObjectByName('Border_Left_Trace')
  const plate = hub.getObjectByName('Hub_Plate')
  if (!(border instanceof Mesh) || !(border.material instanceof MeshStandardMaterial) || !plate) {
    throw new Error('The card border or central hub is unavailable for the south connection.')
  }
  // Assets are positioned before their first render. Refresh the full parent
  // chains before measuring descendants, or the hub endpoint stays near origin.
  card.updateWorldMatrix(true, true)
  hub.updateWorldMatrix(true, true)
  const borderBounds = new Box3().setFromObject(border)
  const hubBounds = new Box3().setFromObject(plate)
  const cardCenter = card.getWorldPosition(new Vector3())
  const start = new Vector3(
    cardCenter.x, (borderBounds.min.y + borderBounds.max.y) / 2, cardCenter.z + width / 2,
  )
  const end = new Vector3(
    (hubBounds.min.x + hubBounds.max.x) / 2, hubBounds.max.y, hubBounds.min.z,
  )
  const direction = end.clone().sub(start)
  const length = direction.length()
  direction.normalize()
  const radius = width * (0.09 / 12)
  const material = border.material.clone()
  material.name = 'DeepTrust south connection — blue'
  const root = new Group()
  root.name = 'DeepTrust_South_Connection'
  root.userData.sourceNode = card.name
  root.userData.targetHub = hub.name
  root.userData.direction = 'South, +Z in world space and down in the overhead view'
  root.visible = false

  const wire = new Mesh(new CylinderGeometry(radius, radius, 1, 8), material)
  wire.name = 'South_Connection_Wire'
  wire.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction)
  wire.castShadow = true
  wire.receiveShadow = true
  root.add(wire)

  const port = new Mesh(new TorusGeometry(radius * 2.8, radius * 0.6, 8, 24), material)
  port.name = 'DeepTrust_South_Port'
  port.rotation.x = -Math.PI / 2
  port.position.copy(start)
  root.add(port)

  const tip = new Mesh(
    new SphereGeometry(radius * 1.6, 12, 8),
    new MeshBasicMaterial({ color: material.color.clone().multiplyScalar(140) }),
  )
  tip.name = 'South_Connection_Draw_Head'
  root.add(tip)
  let previousProgress = -1

  function reset() {
    root.visible = false
    wire.visible = false
    tip.visible = false
    wire.scale.y = 0
    previousProgress = -1
  }

  function update(time: number) {
    if (time < 0) return false
    const elapsed = MathUtils.clamp(time / SOUTH_CONNECTION.durationSeconds, 0, 1)
    // Let the visible starting segment draw slowly before the head travels off-screen.
    const progress = elapsed ** 3
    const drawnLength = length * progress
    root.visible = true
    wire.visible = progress > 0
    wire.scale.y = drawnLength
    wire.position.copy(start).addScaledVector(direction, drawnLength / 2)
    tip.visible = progress > 0 && progress < 1
    tip.position.copy(start).addScaledVector(direction, drawnLength)
    const changed = progress !== previousProgress
    previousProgress = progress
    return changed
  }

  reset()
  return { root, update, reset }
}
