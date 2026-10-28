import { MathUtils, Object3D, Quaternion, Vector3 } from 'three'
import { HUB_APPROACH } from './hub-approach'

const NODE_KINDS = ['Messages', 'Domains', 'Email', 'Social_Media', 'Paid_Ads', 'Telco', 'URLs']

/** Open the north slot by sliding the seven existing nodes clockwise. */
export function createHubExpansion(hub: Object3D) {
  const entries = NODE_KINDS.map((kind, index) => {
    const node = hub.getObjectByName(`Node_${kind}`)
    const port = hub.getObjectByName(`Port_${kind}`)
    const link = hub.getObjectByName(`Link_${kind}`)
    if (!node || !port || !link) throw new Error(`Hub layout is missing ${kind}.`)
    const angle = MathUtils.euclideanModulo(Math.atan2(node.position.x, -node.position.z), Math.PI * 2)
    return {
      node, port, link, angle,
      targetAngle: (index + 1) * Math.PI / 4,
      nodePosition: node.position.clone(),
      portPosition: port.position.clone(),
      linkPosition: link.position.clone(),
      linkRotation: link.quaternion.clone(),
    }
  })
  const first = entries[0]!
  const orbitRadius = Math.hypot(first.nodePosition.x, first.nodePosition.z)
  const newPort = first.port.clone(true)
  newPort.traverse((object) => { object.name = object.name.replace('Messages', 'DeepTrust') })
  newPort.userData.type = 'DeepTrust'
  first.port.parent!.add(newPort)
  const portScale = newPort.scale.clone()
  const rotation = new Quaternion()
  const up = new Vector3(0, 1, 0)
  let previousProgress = -1

  function reset() {
    for (const entry of entries) {
      entry.node.position.copy(entry.nodePosition)
      entry.port.position.copy(entry.portPosition)
      entry.link.position.copy(entry.linkPosition)
      entry.link.quaternion.copy(entry.linkRotation)
    }
    newPort.visible = false
    newPort.scale.copy(portScale)
    previousProgress = -1
  }

  function update(time: number) {
    const progress = MathUtils.smootherstep(time / HUB_APPROACH.durationSeconds, 0.2, 0.9)
    for (const entry of entries) {
      const angle = MathUtils.lerp(entry.angle, entry.targetAngle, progress)
      const nodeRadius = Math.hypot(entry.nodePosition.x, entry.nodePosition.z)
      const portRadius = Math.hypot(entry.portPosition.x, entry.portPosition.z)
      // Translate the cards and ports without turning their icons.
      entry.node.position.set(Math.sin(angle) * nodeRadius, entry.nodePosition.y, -Math.cos(angle) * nodeRadius)
      entry.port.position.set(Math.sin(angle) * portRadius, entry.portPosition.y, -Math.cos(angle) * portRadius)
      // The GLB links have baked radial geometry, so rotate each about the hub.
      rotation.setFromAxisAngle(up, -(angle - entry.angle))
      entry.link.position.copy(entry.linkPosition).applyQuaternion(rotation)
      entry.link.quaternion.copy(entry.linkRotation).premultiply(rotation)
    }
    const reveal = MathUtils.smootherstep(progress, 0.15, 0.7)
    newPort.visible = reveal > 0
    newPort.scale.copy(portScale).multiplyScalar(reveal)
    const changed = progress !== previousProgress
    previousProgress = progress
    return changed
  }

  reset()
  return { orbitRadius, update, reset }
}
