# Announce

A minimal Svelte + TypeScript + Vite app with a full-screen Three.js scene.

## Development

Use Node.js 22.12+ or 24 LTS.

```sh
npm ci
npm run dev
```

## Validate and build

```sh
npm run check
npm run build
npm run preview
```

The production build is written to `dist/`. Serve that directory with a static host.

## Scene

- `src/lib/scene.ts`: camera, objects, pointer movement, and render loop.
- `src/lib/Scene.svelte`: canvas lifecycle and WebGL fallback.
- `src/App.svelte`: page composition.
- `src/app.css`: full-screen layout.

The placeholder scene contains a rotating wireframe sculpture and stars. It fits
the viewport, caps pixel density at 2, pauses while the tab is hidden, and renders
a still frame when reduced motion is enabled. GPU resources and event listeners
are released when the component unmounts.

## Blender model

- `models/inner-truth.blend`: the DeepTrust SVG mark extruded to 1 inch deep and 12 inches wide.
- `public/models/inner-truth.glb`: mesh-only export for Three.js, in meters with Y up.
- `models/inner-truth-preview.png`: rendered preview.

The original logo proportions give a height of approximately 11.63 inches.
The rounded outer corners follow the SVG's original Bezier curves. The navy
background rectangle is excluded. No bevel is added to the other edges.
The mesh is centered at the origin. The Blender file includes a separate preview
studio collection; the GLB contains only the glyph. The landing-page scene does
not load the model yet.

To regenerate on macOS with Blender installed:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python scripts/create-inner-truth.py
```

The generator reads `public/branding/logo-mark.svg`. The exported meshes have no
external file dependencies.

## Hub network model

- `models/hub-network.blend`: floor-level hub, nodes, icons, ports, and radial links.
- `public/models/hub-network.glb`: model-only Three.js export, in meters with Y up.
- `models/hub-network-preview.png`: rendered view on a preview floor.
- `models/references/hub-reference.png`: supplied diagram reference.

The circular hub is 48 inches across. Seven 12-inch nodes sit on a 48-inch-radius
orbit, with two thin orbit rings and lime connection ports. The layout lies in
Blender's XY floor plane, with shallow geometry above Z=0. Labels and the center
phone are omitted. The small phone icon on the outer Telco node is retained.

`Hub_Network` is the export root. `Central_Hub`, `Outer_Nodes`,
`Radial_Connections`, and `Orbit_Rings` retain separate transforms. Each outer
node and its icon share a parent. Links identify their node and hub port through
custom properties. The separate DeepTrust logo can join this system in a later
animation; no acquisition animation is baked into this asset.

The preview studio contains the floor, lights, and camera. It is excluded from
the GLB. Regenerate with:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python scripts/create-hub-network.py
```
