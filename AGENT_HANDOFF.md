# Continuation prompt

You are continuing the DeepTrust announcement landing page in:

`/Users/michaelbishop/Apps/deeptrust/announce`

Read this prompt, the applicable `AGENTS.md` instructions, and the current source
before making changes. Continue from the existing implementation.

## User workflow

- The user is a senior developer. Use short, direct updates and quick bullets.
- Work through visual iterations. Commit each completed iteration locally.
- The user runs the app and checks it in parallel. Do not start, stop, or restart
  their development server.
- The user explicitly said not to worry about running tests. Skip routine test
  runs. The user later explicitly requested a test to diagnose the missing grid;
  targeted checks and browser verification were performed for that repair and
  the accompanying camera change. Be clear about verification for each iteration.
- Do not push or deploy unless requested.
- Preserve unrelated edits and unsaved Blender work. Inspect the actual state
  before replacing an open file or model.

## Intent and scope

The landing page is a full-screen Three.js scene inside a simple Svelte app.
The visual concept is DeepTrust being acquired by Doppel and added to its hub.
Treat this as the user's creative brief, not evidence of a public acquisition.

Two assets have been created: the DeepTrust logo and a hub network based on the
user's supplied image. Both are loaded into the same Three.js floor scene.
The opening is implemented: an accelerating rise from near the floor to overhead,
overlapping construction of a blue node/card. They finish together in a brief
blue shockwave and restrained camera impact. A blue connection then draws south
from the completed card toward the distant hub while the camera rises vertically
to reveal both objects.
Moving the logo into the hub orbit and rearranging nodes have not been implemented.
The travel route, joining timing, arrival point, and final logo placement have
not been decided.

Continue with the user's next visual request. If asked to implement the joining
sequence, use these assets and retain their separate transforms. Do not assume
the later joining sequence was already approved or add unrelated page content.

## Current app

- Svelte 5, TypeScript, Vite 8, Three.js 0.186; npm and `package-lock.json`.
- `src/App.svelte`: full-screen page composition.
- `src/lib/Scene.svelte`: canvas lifecycle, model-loading status, and errors.
- `src/lib/scene.ts`: GLB loading, floor, lights, shadows, and animation lifecycle.
- `src/lib/opening-shot.ts`: camera choreography and configurable shot constants.
- `src/lib/card-construction.ts`: matching node body, split border, sparks, tiled fill.
- `src/lib/arrival-effect.ts`: floor pulse, damped camera impact, and reset.
- `src/lib/floor.ts`: solid floor with a faint, antialiased world-aligned grid.
- `src/lib/south-connection.ts`: bottom-center port and southbound connection trace.
- `src/lib/connection-camera.ts`: vertical rise and framing of both connection endpoints.
- `src/lib/timeline.ts`: transition definitions shared by playback and preview menu.
- `src/app.css`: full-screen layout.
- `public/models/hub-network.glb`: distant destination for the later sequence.
- `public/models/inner-truth.glb`: DeepTrust logo currently featured by the camera.

The scene uses a dark floor, angled perspective camera, warm key light, cool
fill light, hemisphere light, soft shadows, and subtle bloom on the lime ports.
The camera follows the opening shot automatically. Manual OrbitControls were
removed so they cannot compete with the exact overhead camera pose.

Current opening shot choices:

- Start at a -180-degree azimuth and a grazing 4-degree elevation, focused on the
  flat logo, 0.24 meters away. This puts the camera about 3 cm above the floor.
  The user requested this low start after seeing the first 35-degree version.
- Turn 180 degrees continuously over 3 seconds. Physical height follows `t²`
  over the entire move, starting gently and accelerating toward overhead. This
  replaces the old 2-second height hold and last-second takeoff, which felt jumpy.
  `riseExponent` controls this profile. A single smooth radial arc pulls backward
  to roughly 0.56 meters, then converges above the logo without a phase switch.
- End the turn at azimuth 0. The logo finishes aligned with the screen, with
  horizontal bars and no 45-degree tilt. The orientation remains continuous
  through the spiral; there is no separate roll correction or snap.
- Reach 1.2 meters overhead at second 3. FOV narrows from 58 to 40 degrees using
  the same quadratic progress as height, without a separate lens stage. The final
  overhead framing is preserved. Every applied pose updates the projection
  matrix when FOV changes, including direct-stage seeks and reduced motion.
- Increase horizontal distance and final height for portrait viewports, while
  keeping the initial eye height fixed.
- The turn eases at its endpoints. The radial arc has zero horizontal velocity
  at both ends. Height and FOV accelerate over the full move, without symmetric
  rise easing or a midpoint stop. Play once and hold the final view. Refresh to replay.
- Keep a stable camera up vector at the overhead pole and focus on the logo.
- Reduced motion skips to the final overhead shot and completed card, without
  sparks, pulse, or jolt. Hidden tabs pause elapsed time.

The shared timeline now overlaps the effects:

- Camera rise: starts 0 s, lasts 3 s, ends 3 s.
- Border draw: starts 1.5 s, lasts 1.5 s, ends 3 s.
- Tiled fill: starts 2 s, lasts 1 s, ends 3 s.
- Arrival pulse: starts 3 s, lasts 0.8 s, ends 3.8 s.
- South connection: starts 3.8 s, lasts 6 s, ends 9.8 s.

The user explicitly superseded the earlier sequential timing and the requirement
to close the border before filling. Camera, outline, and fill all complete when
the arrival impact begins. Offsets and durations are derived from shared values.
The left-side preview menu lists all five effects. Clicking resets and seeks to
that entry, with correct partial camera/card state, then plays forward without
a reload or model refetch. Camera rise replays all. The latest started stage is
highlighted as playback advances. Native buttons provide keyboard activation.

The URL tracks the selected starting point without reloading:
`http://localhost:5173/?start=draw` begins with an undrawn border and the camera
at second 1.5. `http://localhost:5173/?start=fill` begins at second 2, with fill at
zero, partial border, and camera still rising. `?start=arrival` starts the pulse
with camera and card complete. `?start=connect` starts the south connection from
its first frame after the pulse has ended. Refresh to replay. The default URL
starts the whole sequence. Reduced motion shows the completed card and wire
without animated impact.

`createScene` returns a controller with `playFrom(transitionId)` and `dispose()`.
Replays reset the logo's original pose/color, border draw ranges, body reveal,
sparks, arrival pulse, outgoing connection, and shadow state before seeking. Do not remove this reset when adding
later transitions, or replaying the camera shot can retain a completed card.

Card construction overlaps the camera shot:

- From second 1.5 to 3: outline starts at top center, grows around both sides at once,
  then joins at bottom center. Two blue luminous heads emit short spark trails.
- From second 2 to 3: a 12-by-12 grid reveals cells top-to-bottom with randomized
  activation near the advancing front. Cells fade from dark to final fill;
  no flashes, glow, or emissive pulse. Cells are twice the linear size of the
  earlier 24-by-24 grid. Rounded clipping and the reveal direction are preserved.
  Fill begins while the border is drawing. Final fill is a solid navy surface,
  with no permanent checker pattern.
- Geometry comes from the hub GLB's actual `Messages_Body`, with matching
  12-inch width, 2.4-inch corner radius, and 1.5-inch depth. The border uses the
  hub's 0.09-inch wire radius and material roughness/metalness.
- The user specifically requested DeepTrust blue rather than the other nodes'
  orange. `#061533` comes from `public/branding/logo-mark.svg` and remains the
  basis for border glow and sparks. The body uses the modestly brighter related
  navy `#102B55` so it can be distinguished from the scene floor. Body emission
  is disabled; cell shading only darkens the final fill and never overshoots it.
- The logo stays light for contrast. During the first 0.9 seconds of construction
  it settles to 52% of its source width/height and 0.15-inch extrusion, just above
  the body. This changes the runtime instance only, preserving the source GLB.
- `Node_DeepTrust` parents the logo and all construction parts, keeping a single
  transform for later travel. Border branches, body, and effects remain separate.
- Border glow cools to its final blue after closure. Sparks have deterministic
  birth times and fade naturally. The body uses a shader reveal on the original
  rounded geometry, so there are no final tile seams or square corner overhangs.
- Shadows refresh during construction; the incomplete fill does not cast a
  premature solid-card shadow. Generated meshes and spark resources are disposed
  through the scene cleanup.

At second 3, a soft bluish floor ring expands from the logo area and fades over
0.8 seconds. Its width parameter is 0.22 m, doubled again from 0.11 m without
increasing brightness. The radius starts at zero at the card center and expands
to 0.75 m. Its plane is at Y=-0.0005 m, between the floor at -0.001 m and card
base at 0, with depth testing enabled. The card occludes the center so the pulse
emerges from underneath. The plane's size includes the wider Gaussian tail to
avoid square clipping. Replay resets the radius to zero.
Camera impact lasts 0.28 seconds:
maximum configured 1.5 cm vertical
impulse, 0.35-degree tilt, and 0.65-degree roll, attenuated immediately by damping.
The base camera pose is reapplied before each impulse, so offsets do not build
up. After the brief impact, camera alignment is exactly overhead and square.
Arrival is attached to `Node_DeepTrust`, reset on menu replay, and disposed with
the scene. Its shader ring is soft additive blue, not a full-screen flash.

The environment floor stays solid dark with faint square grid lines. Grid cells
are 70% of the actual final card width, measured from the loaded hub geometry:
about 0.21336 m / 8.4 inches for a 12-inch card. The material pattern uses world
X/Z coordinates. The original lit floor material failed to render even in bright
diagnostic configurations. There were no shader compile errors; the precise
low-level cause was not established. The repair uses MeshBasicMaterial for the
floor color/grid and a separate transparent ShadowMaterial receiver 0.2 mm above
it. The browser now shows both the grid and the card shadow. Derivative
antialiasing, pixel-density fading, and distance fading suppress distracting
distant lines; fade distances scale with camera altitude. The grid uses a
blue-gray 32% blend and a 0.7 mm nominal line half-width. Cell spacing is unchanged.
Scene cleanup disposes both layers and the shared geometry. PCFShadowMap replaces
the removed PCFSoftShadowMap constant to avoid its runtime warning.

The hub's GLB scene is named `Doppel_Hub`. Its center is 30 floor-grid cells
south of the logo center, about `(0, 0, 6.4008)` meters with the current card.
`hubDistanceGridCells` controls this spacing. Placement derives from the actual
loaded card width times the exported `GRID_CARD_RATIO`, so floor and hub agree.
This replaces the earlier 18-meter spacing at the user's request.
World +Z is south: down the screen in the square overhead view. The hub remains
distant and its internal node positions are retained. The logo stays centered
while scaling and lifting into its forming card during the camera move.

After the pulse finishes, a small blue port appears at the card's bottom-center
border. A matching wire draws south toward the hub's northern plate rim over
6 seconds, with cubic progress so the visible beginning grows slowly. At the
same time, the camera rises vertically above its original floor position, with
smootherstep easing, and gradually aims toward the diagram center. Its lens
stays at 40 degrees. The final height fits the completed card and whole hub
inside an 86% viewport margin, recalculated on resize. Fog distances scale with
altitude so the distant objects stay visible. This supersedes the earlier request
for a one-second delay followed by a line-tip chase; do not restore that chase.
The wire maintains a minimum 1.2-pixel screen diameter at high camera positions,
scaling only its cross-section. Its endpoint and length remain unchanged.
The connector uses separate absolute transforms and resets on menu
replay. No card travel or node rearrangement occurs yet. Its path is fixed for
this iteration; later movement will require updating connector endpoints.

Refresh the card and hub world matrices before measuring nested endpoint meshes.
The connection is created before the first render. Without that refresh, the
hub plate bounds can retain the pre-placement position near the origin and send
the wire north through the logo. The world orientation itself is correct:
north is screen up / -Z, south is screen down / +Z, east is +X, west is -X.

Rendering continues during the 9.8-second sequence including the south connection, then returns to rendering on
demand. Pixel density is capped at 2. Cleanup disposes geometry, materials,
shadow maps, and postprocessing resources. Both GLBs must load before the shot
starts; asynchronous loading handles unmounts and loading errors.

The original rotating wireframe sculpture and stars have been removed.

## Logo asset

- `public/branding/logo-mark.svg`: original DeepTrust mark.
- `public/branding/logo-full.svg`: full wordmark, retained as a source asset.
- `models/inner-truth.blend`: logo model and separate preview studio.
- `public/models/inner-truth.glb`: logo mesh for Three.js.
- `models/inner-truth-preview.png`: rendered preview.
- `scripts/create-inner-truth.py`: reproducible Blender generator.

The SVGs came from
`/Users/michaelbishop/Apps/deeptrust/releases/releases-site/src/assets/`.
The logo mark also exists in the desktop project.

The model is **12 inches wide, 1 inch deep, and approximately 11.6281 inches
tall**. It uses the SVG's actual white paths, including the four rounded outer
corners. The navy background rectangle is excluded. Other edges have no added
bevel. The generator preserves the SVG's cubic Bezier curves and supports the
M/L/H/V/C/Z path commands used by this source.

The first model was based on the Unicode character ䷼, but that was replaced by
the actual SVG geometry. Do not revert to a font glyph. The historical
`inner-truth` filenames now refer to the correct logo model.

The logo GLB is upright, centered at the origin, Y-up, facing +Z, with extrusion
depth along Z. The live scene rotates it -90 degrees around X so its front faces
upward, then lifts its base to Y=0 for the opening. During card construction the
runtime instance scales down and lifts above the new card surface. Its name is
`DeepTrust_Logo`, parented under `Node_DeepTrust`.

## Hub asset

- `models/references/hub-reference.png`: the user's original diagram.
- `models/hub-network.blend`: full editable model and separate preview studio.
- `public/models/hub-network.glb`: exported model without studio equipment.
- `models/hub-network-preview.png`: rendered preview.
- `scripts/create-hub-network.py`: reproducible Blender generator.

The user requested the nodes, circular hub, and connections, lying flat on the
floor. Labels and the phone in the center were deliberately omitted. The small
phone icon on the outer Telco node is retained.

The modeled layout has:

- A 48-inch-diameter shallow circular hub with a lime rim.
- Seven 12-inch rounded square nodes on a 48-inch-radius orbit.
- Amber connections and node icons, seven lime hub ports, and two orbit rings.
- Messages, Domains, Email, Social Media, Paid Ads, Telco, and URLs nodes.

These dimensions were chosen for the first model iteration; they were not
specified by the user. Preserve the reference layout unless asked to change it.

Blender uses meters internally. The model lies in Blender's XY plane with +Z up.
The GLB is already converted to Three.js Y-up, lies in XZ, and rests at Y=0.
Do not rotate the hub another 90 degrees when loading it. The Three.js floor is
at Y=-0.001 to avoid overlap.

The exported object hierarchy preserves:

- `Hub_Network`: overall root.
- `Central_Hub`: plate, rim, and ports.
- `Outer_Nodes`: separate `Node_Messages`, `Node_Domains`, `Node_Email`,
  `Node_Social_Media`, `Node_Paid_Ads`, `Node_Telco`, and `Node_URLs` parents.
- `Radial_Connections`: individual `Link_*` objects.
- `Orbit_Rings`: inner and outer rings.

Each node parent owns its card and icon. Links have `source_node` and
`target_port` custom properties, exported as glTF extras. Ports use `Port_*`
names. This structure is intended to support later acquisition animation.
The link geometry is static; moving a node alone will not update its link.

## Blender workflow

Blender is installed at:

`/Applications/Blender.app/Contents/MacOS/Blender`

The connected Blender version was 5.2.1 LTS. The MCP connection became available
after the user opened Blender. Recheck connection and scene state before use.

The last agent action opened `models/hub-network.blend` in Blender. The user's
previous open logo scene had unsaved changes. A snapshot was saved before opening
the hub:

`models/session.local/logo-before-hub-b6434db2.blend`

That directory is ignored by Git. Do not delete it or overwrite it. This is a
historical pointer; the user may since have changed the open Blender file.

The background generators refuse to run inside an interactive Blender session.
They create assets in an isolated process. Run from the project root when asset
regeneration is needed:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python scripts/create-inner-truth.py

/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python scripts/create-hub-network.py
```

Regeneration overwrites that asset's `.blend`, `.glb`, and preview PNG. Inspect
for manual edits first. Neither exported asset needs external fonts or textures.

## Git and verification status

Work was on `main`. Recheck the branch and working tree before editing.
The hub-only implementation commit, before the opening camera shot, was:

`ca61694` — Show hub network on a lit floor in Three.js

The opening camera shot has since been refined and extended with card
construction. Read the local Git log for the latest implementation commit.

Earlier relevant commits:

- `9ce8890`: floor-level hub model with separate nodes and connections.
- `7366e4e`: rebuild logo from SVG with its rounded corners.
- `8239ed8`: original DeepTrust SVG assets.

Changes have been committed locally. No push or deployment was performed in
this session. Blender asset generation and rendered previews succeeded. The
latest iteration passed `npm run check` (no diagnostics), targeted mathematical
checks using the actual hub GLB bounds for landscape and portrait framing, and
a visual browser check of the grid and wider view on the existing local server.
The camera checks confirm a monotonic rise, fixed X/Z and lens, and both objects
inside the final view. No production build was run. The user is checking the app
in parallel; their server was not started, stopped, or restarted. Recheck current
behavior before claiming future changes are verified.
