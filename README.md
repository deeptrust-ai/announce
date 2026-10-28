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
- `src/lib/arrival-effect.ts`: floor shockwave and brief camera impact.
- `src/lib/floor.ts`: unlit floor grid with a separate shadow receiver.
- `src/lib/south-connection.ts`: outgoing port and southbound connection trace.
- `src/lib/connection-camera.ts`: vertical camera rise that frames the logo and hub.
- `src/lib/final-hub-camera.ts`: overlapping camera catch-up and final close overhead framing.
- `src/lib/hub-approach.ts`: delayed drift into the top slot of the hub orbit.
- `src/lib/hub-expansion.ts`: seven-to-eight-node redistribution with moving links and ports.
- `src/lib/gravity-lensing.ts`: world-space distortion of only the floor-grid coordinates.
- `src/lib/timeline.ts`: shared transition names, start times, and durations.
- `src/lib/Scene.svelte`: canvas lifecycle and WebGL fallback.
- `src/App.svelte`: page composition.
- `src/app.css`: full-screen layout.

The scene starts focused on the DeepTrust logo, lying flat on a dark floor.
The camera turns continuously through 180 degrees over 3 seconds. It starts
close to the logo at a grazing angle and immediately begins a gentle climb.
Physical height follows a quadratic curve: slow at first, then progressively
faster toward overhead. A continuous radial arc pulls backward early and
converges above the logo. There is no delayed takeoff, stage boundary, or midpoint
stop. FOV narrows from 58 to 40 degrees using the same quadratic progress.
The turn ends at azimuth 0 so the logo finishes aligned with the screen, with
horizontal bars and no diagonal tilt. The camera keeps looking at the logo
throughout. The shot plays once after both GLBs load; refresh the page to replay it.

The camera and card transitions overlap and finish together at second 3.
The connection starts after the arrival pulse:

| Preview | Starts | Duration | Ends |
| --- | --- | --- | --- |
| Camera rise | 0 s | 3 s | 3 s |
| Border draw | 1.5 s | 1.5 s | 3 s |
| Tiled fill | 2 s | 1 s | 3 s |
| Arrival pulse | 3 s | 0.8 s | 3.8 s |
| South connection | 3.8 s | 6 s | 9.8 s |
| Hub attraction | 5.8 s | 8 s | 13.8 s |
| Final hub view | 8.2 s | 5.6 s | 13.8 s |
| Grid release | 12.6 s | 1.2 s | 13.8 s |

The left-side preview menu derives names, durations, and entry points from these
shared values. Clicking resets and replays from that point, with the camera and
other effects already at their correct timeline state. Camera rise replays all.
The latest started transition is highlighted as playback advances. Native
buttons support keyboard activation and focus; the canvas stays full-screen.

The menu also updates the URL without reloading. `http://localhost:5173/?start=draw`
starts border drawing at its first frame with the camera halfway through its
move. `http://localhost:5173/?start=fill` starts fill with a partially drawn border
and the camera at second 2. `?start=arrival` previews the completed-card impact.
`?start=connect` previews the south connection with camera and card complete.
`?start=approach` starts the attraction, with the wire and camera already two
seconds into the connection scene. `?start=framing` starts the final camera
catch-up while DeepTrust is still approaching. `?start=release` previews the
outward grid shockwave while the final camera and DeepTrust movement settle.
Refresh to replay that starting point and the remaining sequence.
The default URL still plays the full sequence. Reduced motion still skips to
the completed card.

While the camera is still rising, a blue card constructs around the logo:

- The border traces from the top center down both sides simultaneously, meeting
  at the bottom center over 1.5 seconds. Bright heads emit blue spark trails.
- Half a second after drawing starts, a 12-by-12 grid reveals the interior over
  1 second while the border continues. Cells appear top-to-bottom with variation near the fill
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

At second 3, the camera, border, and fill finish together. A subtle soft blue ring
starts at zero radius beneath the card center, expands to 0.75 m over 0.8 seconds,
and fades. Its width parameter is 0.22 m, doubled again from 0.11 m, with no
brightness increase. The pulse plane sits between the floor and card base, so
the opaque card masks its center and the glow emerges from underneath. The
plane is large enough to contain the wider soft tail without square clipping.
A small damped camera impact
lasts 0.28 seconds, then returns to the exact square overhead pose. Offsets are
applied to a fresh base pose every frame, so they cannot accumulate. Spark tails
and border glow cool naturally during the arrival pulse.

The solid dark floor has faint square grid lines aligned to world X/Z. Cells
measure 70% of the actual hub card width: about 0.21336 m (8.4 inches) for a
12-inch card. The grid uses an unlit color layer so its visibility does not depend on the
lighting path. A separate, slightly raised transparent shadow receiver preserves
the card shadow. Antialiasing and distance fading keep distant lines subdued;
the fade distance grows with camera height. This fixes the missing grid observed
in the browser, rather than only increasing its contrast.

The grazing 4-degree start puts the camera about 3 cm above the floor. It starts
0.24 meters from the logo and arcs outward to roughly a 0.56-meter ground-plane
radius while climbing. It reaches the same 1.2-meter overhead
distance and 40-degree FOV as before at second 3. Portrait viewports increase
horizontal distance and final height for framing, without lifting the initial
eye height. Replay and direct-stage shortcuts also restore the proper lens.
The logo stays centered while settling into the forming card. Reduced
motion skips to the completed card and overhead camera, without sparks,
shockwave, or jolt. Hidden tabs pause the timeline. Rendering stops after the
13.8-second sequence until a resize or visibility change. Pixel density is
capped at 2. GPU resources and event listeners are released on unmount.

The hub center sits 30 floor-grid cells directly south of the logo center,
about `(0, 0, 6.4008)` meters for the current card size,
in world +Z and below it in the final view. Spacing derives from the same
loaded card width and grid ratio as the visible floor cells. After the arrival pulse,
a blue port appears at the card's bottom center and a connection draws toward
the hub's northern rim over 6 seconds. The trace starts slowly, then accelerates
into the distance. During the connection, the camera rises vertically with smooth
easing and gradually aims toward the diagram center. Its floor position and lens
stay fixed. The final height fits both the logo and the complete hub with margin
in landscape and portrait. Fog distance grows with altitude to keep them visible. Menu replay resets the port and wire.
The connection maintains a minimum visible screen thickness as the camera rises.
Two seconds into the line scene, DeepTrust begins an eight-second eased drift
toward the hub. Its logo, body, border, and source port move together. It stops
at the top of the existing node orbit, at the same radius as the other cards. The
wire stays attached as its source moves and continues drawing to the hub.
The camera reaches its wide view over the first four seconds of the connection
scene, then holds for 0.4 seconds. It begins a 5.6-second move closer while
DeepTrust is still approaching. Framing measures the moving hub, DeepTrust card,
and logo each frame, keeping the pair together as the gap shrinks. It finishes
square overhead with 84% coverage in the limiting viewport dimension. The old
logo position and pulse plane are excluded; resize uses the current layout.
During the approach, the seven original nodes slide clockwise into seven
evenly spaced slots, leaving the top slot for DeepTrust. The final eight-node
layout has 45-degree spacing. Cards and icons remain upright; their amber
links and lime hub ports follow their angular movement. A new lime port appears
at the top for DeepTrust. Replaying restores the original seven-node layout.

As attraction begins, the floor shader gradually bends only its grid lookup
coordinates around each object. The logo, hub, connection, lighting, shadows,
and bloom retain their normal rendering. The grid lenses follow the objects in
world X/Z with fixed world radii. Reduced motion omits the grid distortion and
shows the completed approach. During the last 1.2 seconds of attraction, the two lenses fade while a single
shockwave expands from the hub through the grid. A narrow compression front and
trailing rebound give it a sharper wave shape. The camera, DeepTrust movement,
and grid release all finish together at second 13.8. Both lens and shockwave
strength reach exactly zero, leaving a straight grid. Replays reset the pulse and distortion. There is no
full-scene lensing pass.


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

The preceding grid/camera iteration passed static checks and targeted browser
verification. The attraction/lensing iteration was committed without tests,
builds, browser checks, or proof screenshots, following the user’s renewed
instruction. The user reviews the running app in parallel. No push or deployment
was performed.
