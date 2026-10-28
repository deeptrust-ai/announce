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
The visual concept is DeepTrust being acquired and added to a central hub.
Treat this as the user's creative brief, not evidence of a public acquisition.

Two assets have been created: the DeepTrust logo and a hub network based on the
user's supplied image. The hub now appears in the Three.js scene on a floor.
The acquisition animation has not been implemented. Its movement, timing,
arrival point, and final logo placement have not been decided.

Continue with the user's next visual request. If asked to implement the joining
sequence, use these assets and retain their separate transforms. Do not assume
an animation design was already approved or add unrelated landing-page content.

## Current app

- Svelte 5, TypeScript, Vite 8, Three.js 0.186; npm and `package-lock.json`.
- `src/App.svelte`: full-screen page composition.
- `src/lib/Scene.svelte`: canvas lifecycle, model-loading status, and errors.
- `src/lib/scene.ts`: GLB loading, floor, lights, shadows, camera, and rendering.
- `src/app.css`: full-screen layout.
- `public/models/hub-network.glb`: asset currently loaded by the scene.

The scene uses a dark floor, angled perspective camera, warm key light, cool
fill light, hemisphere light, soft shadows, and subtle bloom on the lime ports.
OrbitControls supports drag to orbit and scroll/pinch to zoom. Panning is off,
and the camera remains above the floor. The camera reframes on viewport changes.

The hub is static. Rendering happens on demand during loading, resizing, and
camera movement. Pixel density is capped at 2. Reduced motion disables camera
damping. Cleanup disposes controls, geometry, materials, shadow maps, and
postprocessing resources. Async GLB loading handles unmounts and loading errors.

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
depth along Z. It is not yet loaded into the live scene.

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
The latest implementation commit before this handoff was:

`ca61694` — Show hub network on a lit floor in Three.js

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
