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
- `src/lib/card-construction.ts`: split border trace, sparks, and tiled card fill.
- `src/lib/timeline.ts`: shared transition names, start times, and durations.
- `src/lib/Scene.svelte`: canvas lifecycle and WebGL fallback.
- `src/App.svelte`: page composition.
- `src/app.css`: full-screen layout.

The scene starts focused on the DeepTrust logo, lying flat on a dark floor.
The camera turns continuously through 180 degrees over 3 seconds. It starts
close to the logo at a grazing angle, then dollies backward for the first 2
seconds at a fixed low eye height. During the final second it smoothly rises to
directly overhead at 90 degrees, narrowing its FOV from 58 to 40 degrees as it
ascends. The turn keeps moving during the rise, with no pause or position jump.
The turn ends at azimuth 0 so the logo finishes aligned with the screen, with
horizontal bars and no diagonal tilt. The camera keeps looking at the logo
throughout. The shot plays once after both GLBs load; refresh the page to replay it.

The left-side preview menu lists Camera rise (3 s), Border draw (1 s), and Tiled
fill (2 s). Click an entry to reset and replay from its beginning, then continue
the following transitions. Camera rise also replays the whole sequence. The
active entry follows playback. Buttons support normal keyboard focus and
activation; the canvas stays full-screen beneath the overlay. Menu names,
durations, and start times come from the shared timeline.

The menu also updates the URL without reloading. `http://localhost:5173/?start=draw`
starts at the exact overhead pose and plays border drawing from its first frame.
`http://localhost:5173/?start=fill` starts with the border complete and fill just
beginning. Refresh either URL to replay that stage and its following transitions.
The default URL still plays the full sequence. Reduced motion still skips to
the completed card.

After the overhead camera settles, a blue card constructs around the logo:

- The border traces from the top center down both sides simultaneously, meeting
  at the bottom center over 1 second. Bright heads emit blue spark trails.
- Only after the border closes, a 12-by-12 grid reveals the interior over 2
  seconds. Cells appear top-to-bottom with deterministic variation near the fill
  front. Each cell fades from dark to its final fill, with no flash, glow, or
  brightness overshoot. The finished surface is solid, without a checker pattern
  or tile gaps.
- The card reuses the hub's 12-inch rounded-square body, 2.4-inch corner radius,
  1.5-inch depth, border thickness, and material roughness/metalness. Its fill
  uses a brighter related navy, `#102B55`, to stand out from the floor. Border
  and spark emission retain DeepTrust's original `#061533` from the logo SVG.
- As construction starts, the logo settles into a white icon: 52% of its original
  width and height, with 0.15-inch extrusion above the card surface. The original
  GLB remains unchanged. `Node_DeepTrust` parents the logo and construction parts
  for later movement together.

The grazing 4-degree start puts the camera about 3 cm above the floor. It starts
0.24 meters from the logo and pulls back to a 0.68-meter ground-plane radius,
holding eye height fixed until second 2. It reaches the same 1.2-meter overhead
distance and 40-degree FOV as before at second 3. Portrait viewports increase
horizontal distance and final height for framing, without lifting the initial
eye height. Replay and direct-stage shortcuts also restore the proper lens.
The logo stays still during the
camera shot. Reduced motion skips to the completed card and overhead camera,
without sparks. Hidden tabs pause the timeline. Rendering stops after the full
6-second sequence until a resize or visibility change. Pixel density is
capped at 2. GPU resources and event listeners are released on unmount.

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
