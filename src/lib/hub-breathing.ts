import { Material, Mesh, MeshStandardMaterial, Object3D } from 'three'

/** Give each lime port its own slow rhythm without changing shared GLB materials. */
export function createHubBreathing(hub: Object3D) {
  const groups: Object3D[] = []
  const replacedMaterials = new Set<Material>()
  hub.traverse((object) => {
    if (object.name.startsWith('Port_') || object.name === 'Hub_Lime_Rim') groups.push(object)
  })
  const lights = groups.flatMap((group, index) => {
    const materials = new Map<MeshStandardMaterial, MeshStandardMaterial>()
    group.traverse((object) => {
      if (!(object instanceof Mesh)) return
      const cloneGlow = (source: Material) => {
        if (!(source instanceof MeshStandardMaterial)
          || (source.emissive.r === 0 && source.emissive.g === 0 && source.emissive.b === 0)) return source
        let clone = materials.get(source)
        if (!clone) {
          clone = source.clone()
          materials.set(source, clone)
          replacedMaterials.add(source)
        }
        return clone
      }
      object.material = Array.isArray(object.material)
        ? object.material.map(cloneGlow) : cloneGlow(object.material)
    })
    return [...materials.values()].map((material) => ({
      material, baseline: material.emissiveIntensity,
      period: group.name === 'Hub_Lime_Rim' ? 7.2 : 4.6 + index * 0.27,
      phase: index * 2.399963,
    }))
  })

  // Release original materials only when no other hub mesh still uses them.
  hub.traverse((object) => {
    if (!(object instanceof Mesh)) return
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      replacedMaterials.delete(material)
    }
  })
  replacedMaterials.forEach((material) => material.dispose())

  function update(time: number, reducedMotion: boolean) {
    for (const light of lights) {
      const phase = time * Math.PI * 2 / light.period + light.phase
        + 0.12 * Math.sin(time * 0.31 + light.phase)
      const breath = 0.5 - 0.5 * Math.cos(phase)
      const variation = 0.82 + 0.3 * breath + 0.03 * Math.sin(time * 0.7 + light.phase)
      light.material.emissiveIntensity = light.baseline * (reducedMotion ? 1 : variation)
    }
  }

  return { update }
}
