import {
  Box3, CylinderGeometry, Euler, Group, MathUtils, Mesh,
  Object3D, PerspectiveCamera, Quaternion, Vector2, Vector3,
} from 'three'

export const HUB_ORBITS = { approachFraction: 0.78, riseSeconds: 3 } as const
const KINDS = ['DeepTrust', 'Messages', 'Domains', 'Email', 'Social_Media', 'Paid_Ads', 'Telco', 'URLs']
// A square antiprism gives eight uniformly separated points on a sphere:
// two equal squares, offset by 45 degrees, with equal nearest-neighbor edges.
const LATITUDE_HEIGHT = Math.sqrt(1 / (1 + 2 * Math.SQRT2))
const LATITUDE_RADIUS = Math.sqrt(1 - LATITUDE_HEIGHT ** 2)

/** Place eight fixed, evenly spaced anchors on a sphere and rotate them together. */
export function createHubOrbits(hub: Object3D, card: Object3D, connection: Group, orbitRadius: number) {
  const plate = hub.getObjectByName('Hub_Plate')
  const rim = hub.getObjectByName('Hub_Lime_Rim')
  const floorRings = hub.getObjectByName('Orbit_Rings')
  const blueWire = connection.getObjectByName('South_Connection_Wire')
  if (!(plate instanceof Mesh) || !(rim instanceof Mesh)
    || !(blueWire instanceof Mesh) || !floorRings) throw new Error('The spherical hub assets are unavailable.')
  plate.geometry.computeBoundingBox()
  const sphereRadius = plate.geometry.boundingBox!.getSize(new Vector3()).x / 2
  const nodeWidth = orbitRadius / 4
  const centerHeight = orbitRadius * 1.05 + nodeWidth / 2
  const rimPosition = rim.position.clone()
  const rimRotation = rim.quaternion.clone()
  const root = new Group()
  root.name = 'Hub_Spherical_Orbits'
  hub.add(root)
  // The sphere is a permanent coordinate anchor, with no rendered surface.
  const anchor = new Object3D()
  anchor.name = 'Hub_Invisible_Sphere_Anchor'
  anchor.position.y = centerHeight
  hub.add(anchor)
  const wireGeometry = new CylinderGeometry(nodeWidth * 0.0075, nodeWidth * 0.0075, 1, 8)
  const viewport = new Vector2(), wireViewPosition = new Vector3()
  const entries = KINDS.map((kind, index) => {
    const node = index === 0 ? card : hub.getObjectByName(`Node_${kind}`)
    const port = hub.getObjectByName(`Port_${kind}`)
    const oldLink = index === 0 ? connection : hub.getObjectByName(`Link_${kind}`)
    if (!node || !port || !oldLink) throw new Error(`The spherical orbit is missing ${kind}.`)
    const source = index === 0 ? blueWire : oldLink
    if (!(source instanceof Mesh)) throw new Error(`The ${kind} orbit link is unavailable.`)
    const wire = new Mesh(wireGeometry, source.material)
    wire.name = `Orbital_Link_${kind}`
    wire.castShadow = false
    wire.onBeforeRender = (renderer, _scene, camera) => {
      if (!(camera instanceof PerspectiveCamera)) return
      renderer.getSize(viewport)
      wire.getWorldPosition(wireViewPosition).applyMatrix4(camera.matrixWorldInverse)
      const pixelSize = 2 * Math.abs(wireViewPosition.z)
        * Math.tan(MathUtils.degToRad(camera.fov / 2)) / viewport.y
      wire.scale.x = wire.scale.z = Math.max(1, pixelSize * 0.6 / (nodeWidth * 0.0075))
      wire.updateMatrixWorld()
    }
    root.add(wire)
    return {
      node, port, oldLink, wire, index,
      nodePosition: node.position.clone(), nodeRotation: node.quaternion.clone(),
      portPosition: port.position.clone(), portRotation: port.quaternion.clone(),
      portVisible: port.visible, linkVisible: oldLink.visible,
      flatPort: port.position.clone(),
      resolved: new Vector3(),
      anchorDirection: new Vector3(
        Math.sin(index * Math.PI / 4) * LATITUDE_RADIUS,
        (index % 2 === 0 ? 1 : -1) * LATITUDE_HEIGHT,
        -Math.cos(index * Math.PI / 4) * LATITUDE_RADIUS,
      ),
    }
  })
  const local = new Vector3(), desired = new Vector3(), direction = new Vector3()
  const start = new Vector3(), end = new Vector3(), world = new Vector3()
  const up = new Vector3(0, 1, 0)
  const sphereRotation = new Quaternion(), orientation = new Quaternion()
  const sphereEuler = new Euler(0, 0, 0, 'YXZ')
  const cameraRotation = new Quaternion(), parentRotation = new Quaternion()
  const sphereCenter = new Vector3()
  const frontToCamera = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
  let active = false, settled = false, blend = 0

  function reset() {
    active = settled = false
    blend = 0
    root.visible = false
    root.scale.setScalar(0)
    anchor.quaternion.identity()
    plate.visible = false
    rim.visible = true
    rim.position.copy(rimPosition)
    rim.quaternion.copy(rimRotation)
    floorRings.visible = false
    for (const entry of entries) {
      entry.node.position.copy(entry.nodePosition)
      entry.node.quaternion.copy(entry.nodeRotation)
      entry.port.position.copy(entry.portPosition)
      entry.port.quaternion.copy(entry.portRotation)
      entry.port.visible = entry.portVisible
      entry.oldLink.visible = entry.linkVisible
    }
  }

  function update(time: number, reducedMotion: boolean) {
    if (time <= 0) return false
    active = true
    blend = reducedMotion ? 1 : MathUtils.smootherstep(time / HUB_ORBITS.riseSeconds, 0, 1)
    settled = blend === 1
    const motionTime = reducedMotion ? 0 : Math.max(0, time - HUB_ORBITS.riseSeconds * 0.25)
    root.visible = true
    root.scale.setScalar(1)
    rim.position.copy(rimPosition)
    rim.position.y += centerHeight * blend
    // One shared spin, slow tumble, and gentle precession preserve every
    // anchor-to-anchor distance rather than letting nodes drift individually.
    sphereEuler.set(
      motionTime * 0.025 + 0.24 * Math.sin(motionTime * 0.075),
      motionTime * 0.075,
      0.18 * Math.sin(motionTime * 0.05),
      'YXZ',
    )
    sphereRotation.setFromEuler(sphereEuler)
    anchor.quaternion.copy(sphereRotation)
    orientation.copy(sphereRotation).multiply(rimRotation)
    rim.quaternion.slerpQuaternions(rimRotation, orientation, blend)
    for (const entry of entries) {
      desired.copy(entry.anchorDirection).applyQuaternion(sphereRotation).multiplyScalar(orbitRadius)
      desired.y += centerHeight
      // Base transforms are restored by approach/expansion before each update.
      entry.node.getWorldPosition(local)
      hub.worldToLocal(local)
      local.lerp(desired, blend)
      world.copy(local); hub.localToWorld(world)
      entry.node.parent!.worldToLocal(world)
      entry.node.position.copy(world)
      entry.node.updateWorldMatrix(true, true)
      // Save the planar port before the post-camera billboard pass places
      // its spherical anchor and rebuilds the live spoke.
      start.copy(entry.portPosition)
      if (entry.index > 0) {
        entry.port.getWorldPosition(start)
        hub.worldToLocal(start)
      }
      entry.flatPort.copy(start)
      entry.port.visible = true
      entry.oldLink.visible = false
    }
    return !reducedMotion || !settled
  }

  function getBounds() {
    if (!active) return undefined
    hub.getWorldPosition(world)
    world.y += centerHeight * blend
    const extent = orbitRadius * 1.02 + nodeWidth * 0.65
    const verticalExtent = (orbitRadius + nodeWidth * 0.65) * blend + 0.05
    return new Box3().setFromCenterAndSize(world, new Vector3(extent * 2, verticalExtent * 2, extent * 2))
  }

  function faceCamera(camera: PerspectiveCamera) {
    if (!active) return
    camera.getWorldQuaternion(cameraRotation)
    anchor.getWorldPosition(sphereCenter)
    cameraRotation.multiply(frontToCamera)
    for (const entry of entries) {
      entry.node.getWorldPosition(entry.resolved)
      entry.node.parent!.getWorldQuaternion(parentRotation)
      entry.node.quaternion.copy(parentRotation.invert()).multiply(cameraRotation)
      // Ports and spokes follow the same rigid sphere rotation as their cards.
      direction.copy(entry.resolved).sub(sphereCenter).normalize()
      start.copy(entry.flatPort); hub.localToWorld(start)
      end.copy(sphereCenter).addScaledVector(direction, sphereRadius)
      end.lerpVectors(start, end, blend)
      world.copy(end); entry.port.parent!.worldToLocal(world)
      entry.port.position.copy(world)
      orientation.setFromUnitVectors(up, direction)
      entry.port.quaternion.slerpQuaternions(entry.portRotation, orientation, blend)
      start.copy(entry.resolved).addScaledVector(direction, -nodeWidth * 0.43)
      end.addScaledVector(direction, 0.0254 * blend)
      hub.worldToLocal(start); hub.worldToLocal(end)
      desired.copy(end).sub(start)
      entry.wire.position.copy(start).addScaledVector(desired, 0.5)
      entry.wire.scale.y = desired.length()
      entry.wire.quaternion.setFromUnitVectors(up, desired.normalize())
    }
  }

  reset()
  return { update, reset, getBounds, faceCamera, center: anchor, get active() { return active }, get settled() { return settled } }
}
