import {
  Box3, CylinderGeometry, Group, MathUtils, Mesh,
  Object3D, PerspectiveCamera, Quaternion, Vector2, Vector3,
} from 'three'

export const HUB_ORBITS = { approachFraction: 0.78, riseSeconds: 3 } as const
const KINDS = ['DeepTrust', 'Messages', 'Domains', 'Email', 'Social_Media', 'Paid_Ads', 'Telco', 'URLs']

/** Lift the joined network into independent, slowly precessing spherical orbits. */
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
    wire.castShadow = true
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
      nominal: new Vector3(), resolved: new Vector3(), view: new Vector3(), avoidance: new Vector3(),
    }
  })
  const local = new Vector3(), desired = new Vector3(), direction = new Vector3()
  const start = new Vector3(), end = new Vector3(), world = new Vector3()
  const axis = new Vector3(), up = new Vector3(0, 1, 0)
  const tilt = new Quaternion(), orientation = new Quaternion()
  const cameraRotation = new Quaternion(), parentRotation = new Quaternion()
  const viewRight = new Vector3(), viewUp = new Vector3(), sphereCenter = new Vector3()
  const frontToCamera = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
  let active = false, settled = false, blend = 0
  let previousOrbitTime: number | undefined
  let orbitDelta = 0

  function reset() {
    active = settled = false
    blend = 0
    previousOrbitTime = undefined
    root.visible = false
    root.scale.setScalar(0)
    plate.visible = false
    rim.visible = true
    rim.position.copy(rimPosition)
    floorRings.visible = false
    for (const entry of entries) {
      entry.node.position.copy(entry.nodePosition)
      entry.node.quaternion.copy(entry.nodeRotation)
      entry.port.position.copy(entry.portPosition)
      entry.port.quaternion.copy(entry.portRotation)
      entry.port.visible = entry.portVisible
      entry.oldLink.visible = entry.linkVisible
      entry.avoidance.set(0, 0, 0)
    }
  }

  function update(time: number, reducedMotion: boolean) {
    if (time <= 0) return false
    active = true
    orbitDelta = reducedMotion || previousOrbitTime === undefined
      ? 0 : MathUtils.clamp(time - previousOrbitTime, 0, 0.05)
    previousOrbitTime = time
    blend = reducedMotion ? 1 : MathUtils.smootherstep(time / HUB_ORBITS.riseSeconds, 0, 1)
    settled = blend === 1
    const motionTime = reducedMotion ? 0 : Math.max(0, time - HUB_ORBITS.riseSeconds * 0.25)
    root.visible = true
    root.scale.setScalar(1)
    rim.position.copy(rimPosition)
    rim.position.y += centerHeight * blend
    for (const entry of entries) {
      const phase = entry.index * Math.PI / 4
      const speed = (entry.index % 3 === 0 ? -1 : 1) * Math.PI * 2 / (44 + entry.index * 4.1)
      const angle = phase + motionTime * speed + 0.025 * Math.sin(motionTime * 0.23 + phase) * Math.min(motionTime, 1)
      const axisAngle = entry.index * 2.399963 + 0.08 * Math.sin(motionTime * 0.07 + phase)
      axis.set(Math.cos(axisAngle), 0, Math.sin(axisAngle))
      tilt.setFromAxisAngle(axis, MathUtils.degToRad(24 + entry.index % 4 * 10))
      const radius = orbitRadius * (1 + 0.02 * Math.sin(motionTime * 0.2 + phase))
      desired.set(Math.sin(angle) * radius, 0, -Math.cos(angle) * radius).applyQuaternion(tilt)
      direction.copy(desired).normalize()
      desired.y += centerHeight
      // Base transforms are restored by approach/expansion before each update.
      entry.node.getWorldPosition(local)
      hub.worldToLocal(local)
      local.lerp(desired, blend)
      world.copy(local); hub.localToWorld(world)
      entry.node.parent!.worldToLocal(world)
      entry.node.position.copy(world)
      entry.node.updateWorldMatrix(true, true)
      // Save the planar port before the post-camera separation pass places
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
    const verticalExtent = (orbitRadius * 0.84 + nodeWidth * 0.65) * blend + 0.05
    return new Box3().setFromCenterAndSize(world, new Vector3(extent * 2, verticalExtent * 2, extent * 2))
  }

  function faceCamera(camera: PerspectiveCamera) {
    if (!active) return
    camera.getWorldQuaternion(cameraRotation)
    viewRight.setFromMatrixColumn(camera.matrixWorld, 0)
    viewUp.setFromMatrixColumn(camera.matrixWorld, 1)
    anchor.getWorldPosition(sphereCenter)
    for (const entry of entries) {
      entry.node.getWorldPosition(entry.nominal)
      entry.avoidance.multiplyScalar(Math.exp(-orbitDelta * 1.25))
      entry.resolved.copy(entry.nominal).add(entry.avoidance)
      entry.view.copy(entry.resolved).applyMatrix4(camera.matrixWorldInverse)
    }

    function nudge(entry: typeof entries[number], x: number, y: number) {
      const depth = Math.max(camera.near, -entry.view.z)
      entry.resolved.addScaledVector(viewRight, x * depth).addScaledVector(viewUp, y * depth)
      entry.view.x += x * depth
      entry.view.y += y * depth
    }

    // A broad, gentle force starts moving neighbors apart before their cards
    // approach the hard minimum screen-space clearance.
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const a = entries[i]!, b = entries[j]!
        const depthA = Math.max(camera.near, -a.view.z), depthB = Math.max(camera.near, -b.view.z)
        const x = b.view.x / depthB - a.view.x / depthA
        const y = b.view.y / depthB - a.view.y / depthA
        const distance = Math.hypot(x, y)
        const comfort = nodeWidth * 1.1 * (1 / depthA + 1 / depthB)
        if (distance >= comfort || distance < 0.000001) continue
        const force = (comfort - distance) * Math.min(0.2, orbitDelta * 2) / 2
        nudge(a, -x / distance * force, -y / distance * force)
        nudge(b, x / distance * force, y / distance * force)
      }
    }

    // Resolve card rectangles in projection, including a generous gap. This
    // also separates nodes which are far apart in 3D but align in the camera.
    for (let pass = 0; pass < 24; pass += 1) {
      let separated = true
      for (let i = 0; i < entries.length; i += 1) {
        for (let j = i + 1; j < entries.length; j += 1) {
          const a = entries[i]!, b = entries[j]!
          const depthA = Math.max(camera.near, -a.view.z), depthB = Math.max(camera.near, -b.view.z)
          const x = b.view.x / depthB - a.view.x / depthA
          const y = b.view.y / depthB - a.view.y / depthA
          const clearance = nodeWidth * 0.72 * (1 / depthA + 1 / depthB)
          if (Math.abs(x) >= clearance || Math.abs(y) >= clearance) continue
          separated = false
          if (clearance - Math.abs(x) < clearance - Math.abs(y)) {
            const push = (Math.sign(x) || (i % 2 ? -1 : 1)) * (clearance - Math.abs(x) + 0.00001) / 2
            nudge(a, -push, 0); nudge(b, push, 0)
          } else {
            const push = (Math.sign(y) || (j % 2 ? -1 : 1)) * (clearance - Math.abs(y) + 0.00001) / 2
            nudge(a, 0, -push); nudge(b, 0, push)
          }
        }
      }
      if (separated) break
    }

    cameraRotation.multiply(frontToCamera)
    for (const entry of entries) {
      entry.avoidance.copy(entry.resolved).sub(entry.nominal)
      world.copy(entry.resolved)
      entry.node.parent!.worldToLocal(world)
      entry.node.position.copy(world)
      entry.node.parent!.getWorldQuaternion(parentRotation)
      entry.node.quaternion.copy(parentRotation.invert()).multiply(cameraRotation)
      // Re-anchor the port and spoke after repulsion, so neither endpoint lags.
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
