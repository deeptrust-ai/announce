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
  runs. Be clear about what has and has not been verified.
- Do not push or deploy unless requested.
- Preserve unrelated edits and unsaved Blender work. Inspect the actual state
  before replacing an open file or model.

## Intent and scope

The landing page is a full-screen Three.js scene inside a simple Svelte app.
The visual concept is DeepTrust being acquired by Doppel and added to its hub.
Treat this as the user's creative brief, not evidence of a public acquisition.

Two assets have been created: the DeepTrust logo and a hub network based on the
user's supplied image. Both are loaded into the same Three.js floor scene.
The first logo/camera transition is implemented: an orbit, then an overhead rise.
Logo travel, hub joining, and node rearrangement have not been implemented.
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
- `src/app.css`: full-screen layout.
- `public/models/hub-network.glb`: distant destination for the later sequence.
- `public/models/inner-truth.glb`: DeepTrust logo currently featured by the camera.

The scene uses a dark floor, angled perspective camera, warm key light, cool
fill light, hemisphere light, soft shadows, and subtle bloom on the lime ports.
The camera follows the opening shot automatically. Manual OrbitControls were
removed so they cannot compete with the exact overhead camera pose.

Current opening shot choices:

- Start at a 45-degree azimuth and a grazing 4-degree elevation, focused on the
  flat logo. This puts the camera about 6 cm above the floor on landscape screens.
  The user requested this low start after seeing the first 35-degree version.
- Orbit a full 360 degrees over 18 seconds while rising to 65-degree elevation.
- Rise for 6 more seconds to an exact overhead position, looking down 90 degrees.
- Camera distances: 0.68 meters initially, 0.92 after the orbit, 1.2 overhead.
- Increase distance for portrait viewports to keep the logo in frame.
- Ease each phase, play once, and hold the final view. Refresh to replay.
- Keep a stable camera up vector at the overhead pole and focus on the logo.
- Reduced motion skips to the final shot. Hidden tabs pause elapsed time.

The hub's GLB scene is named `Doppel_Hub` and positioned at `(12, 0, -12)` meters,
about 17 meters from the logo. It stays outside the opening frame. Its existing
groups remain intact for later animation. Neither the logo nor the hub moves
during this first camera transition.

Rendering continues during the 24-second opening, then returns to rendering on
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
upward, then lifts its base to Y=0. The runtime scene is named `DeepTrust_Logo`.

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

The next iteration adds the automatic opening logo orbit and overhead camera
transition. Read the local Git log for its commit hash.

Earlier relevant commits:

- `9ce8890`: floor-level hub model with separate nodes and connections.
- `7366e4e`: rebuild logo from SVG with its rounded corners.
- `8239ed8`: original DeepTrust SVG assets.

Changes have been committed locally. No push or deployment was performed in
this session. Blender asset generation and rendered previews succeeded. The
latest Three.js implementation has **not** been tested, built, or verified in a
browser by the agent, following the user's iteration preference. The user is
checking the running app in parallel. Do not report the browser appearance as
verified without fresh evidence.
