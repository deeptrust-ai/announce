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

- `src/lib/scene.ts`: GLB loading, floor, lighting, and animation lifecycle.
- `src/lib/opening-shot.ts`: opening camera path, timing, and distances.
- `src/lib/Scene.svelte`: canvas lifecycle and WebGL fallback.
- `src/App.svelte`: page composition.
- `src/app.css`: full-screen layout.

The scene starts focused on the DeepTrust logo, lying flat on a dark floor.
The camera makes a continuous 180-degree rising spiral over 12 seconds, from
4 degrees above the floor to directly overhead at 90 degrees, then holds there.
Turning, elevation, and camera distance share one easing curve. The camera eases
only at the beginning and end, with no midpoint stop or separate squaring stage.
The turn ends at azimuth 0 so the logo finishes aligned with the screen, with
horizontal bars and no diagonal tilt. The camera keeps looking at the logo
throughout. The shot plays once after both GLBs load; refresh the page to replay it.

The grazing 4-degree start puts the camera about 6 cm above the floor in a
landscape viewport. Camera distance rises continuously from 0.68 to 1.2 meters, with
extra distance for portrait viewports. The logo stays still. Reduced motion skips
directly to the final overhead shot. Hidden tabs pause the timeline. Rendering
stops after the shot finishes until a resize or visibility change. Pixel density is capped at 2.
GPU resources and event listeners are released when the component unmounts.

The existing hub network sits at `(12, 0, -12)` meters, outside the opening shot.
Its separate nodes and links are retained for the later acquisition sequence.
Logo travel, joining the hub, and rearranging nodes are not implemented yet.

## Blender model

- `models/inner-truth.blend`: the DeepTrust SVG mark extruded to 1 inch deep and 12 inches wide.
- `public/models/inner-truth.glb`: mesh-only export for Three.js, in meters with Y up.
- `models/inner-truth-preview.png`: rendered preview.

The original logo proportions give a height of approximately 11.63 inches.
The rounded outer corners follow the SVG's original Bezier curves. The navy
background rectangle is excluded. No bevel is added to the other edges.
The mesh is centered at the origin. The Blender file includes a separate preview
studio collection; the GLB contains only the glyph. The live scene rotates the
logo's front face upward and lifts its base to floor level.

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
