# Continuation prompt

You are continuing the DeepTrust announcement landing page in:

`/Users/michaelbishop/Apps/deeptrust/announce`

Read this prompt, the applicable `AGENTS.md` instructions, and the current source
before making changes. Continue from the existing implementation.

## Current versions: Doppel and Keycard

The user corrected the Keycard direction: the hub-and-spoke model is a Doppel
concept. Keycard must use its physical credential hero and layered content
blocks, as shown in the two supplied reference screenshots. Do not theme the
Doppel network or copy its sphere animation into the Keycard page.

`/` remains the original Doppel scene. Its source was restored to the pre-Keycard
implementation, retaining the sphere interaction and all prior refinements.
`/keycard/` has its own HTML and `keycard/main.ts`, mounting
`src/lib/KeycardPage.svelte` directly. It does not import or mount the Three.js
hub, GLBs, or sphere code. `vite.config.ts` keeps both HTML build inputs.

The Keycard page is a scrolling, responsive layout with a grainy near-black
field and fine grid. The hero pairs the staged DeepTrust/Keycard announcement
with Keycard's authentic portrait NFC-card artwork. The card arrives in a soft
3D turn, floats slowly, tilts toward pointer movement, responds to arrow keys,
and resets its tilt on click. Foil highlights follow the pointer. The actual
card art is self-hosted as `public/branding/keycard/credential-card.png`.
The original commercial artwork and logos are not regenerated or altered.

Below the hero is a separate layered content-block composition: context fields,
a wide iridescent issued-credential panel, chip/circuit rail, lime trust signals,
fine tick separators, and resource tiles. The copy announces DeepTrust joining
Keycard; it does not pretend to perform actual authentication or issue tokens.
The point is Keycard's credential/object metaphor, not a renamed graph.

The page has its own four playback stages (`card`, `identity`, `join`, `release`)
in compact bottom-right Back / Restart / Next controls. Query shortcuts preserve
the Keycard URL. Visibility pauses the reveal clock; reduced motion shows the
completed copy and disables ambient float/foil animation. The keycard can still
be tilted with keyboard input. Fonts are self-hosted Geist/Geist Mono with OFL
notices. The CTA retains `https://deeptrust.ai/press-release` and reveals last,
with a real arrow, transparent styling, and separation from the logos.

The obsolete Keycard hub rebranding files (`brand.ts`, `keycard-network.ts`) and
shared scene variant branches were removed. Read
`docs/keycard-brand-research.md` and `public/branding/keycard/SOURCES.md` for the
research and asset provenance. This is concept copy for the user's exit scenario,
not evidence that an acquisition has occurred. No tests, builds, local browser
validation, or proof screenshots were run. Nothing was pushed or deployed.
Continue to let the user run and assess the app in parallel.

## User workflow

- The user is a senior developer. Use short, direct updates and quick bullets.
- Work through visual iterations. Commit each completed iteration locally.
- The user runs the app and checks it in parallel. Do not start, stop, or restart
  their development server.
- The user explicitly said not to worry about running tests. Skip routine test
  runs. The user later explicitly requested a test to diagnose the missing grid;
  targeted checks and browser verification were performed for that repair and
  the accompanying camera change. The user then reaffirmed that they do not
  need agent tests or proof because they run the app in parallel. For current
  iterations, skip tests, builds, browser validation, and proof screenshots.
  Be clear about verification for each iteration.
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
A delayed drift now brings the complete DeepTrust card into the top of the hub
orbit, while the seven original nodes redistribute into an eight-node layout.
Gravitational lensing affects only the surrounding floor grid.
The travel route, joining timing, arrival point, and final logo placement have
not been decided.

Continue with the user's next visual request. If asked to implement the joining
sequence, use these assets and retain their separate transforms. Do not assume
the later joining sequence was already approved or add unrelated page content.

## Current app

- Svelte 5, TypeScript, Vite 8, Three.js 0.186; npm and `package-lock.json`.
- `src/App.svelte`: full-screen page composition.
- `src/lib/Scene.svelte`: editorial overlay, playback controls, and canvas lifecycle.
- `src/lib/announcement.ts`: staged text/logo reveal with absolute timeline progress.
- `src/lib/scene.ts`: GLB loading, floor, lights, shadows, and animation lifecycle.
- `src/lib/opening-shot.ts`: camera choreography and configurable shot constants.
- `src/lib/card-construction.ts`: matching node body, split border, sparks, tiled fill.
- `src/lib/arrival-effect.ts`: floor pulse, damped camera impact, and reset.
- `src/lib/floor.ts`: solid floor with a faint, antialiased world-aligned grid.
- `src/lib/south-connection.ts`: bottom-center port and southbound connection trace.
- `src/lib/connection-camera.ts`: vertical rise and framing of both connection endpoints.
- `src/lib/final-hub-camera.ts`: final overhead fit of the completed eight-node hub.
- `src/lib/hub-approach.ts`: delayed card approach into the top orbit slot.
- `src/lib/hub-expansion.ts`: clockwise node redistribution, links, and eighth port.
- `src/lib/hub-breathing.ts`: independent, slow emission rhythms for ports and rim.
- `src/lib/hub-orbits.ts`: continuous spherical anchor motion, billboard cards, and live 3D links.
- `src/lib/sphere-interaction.ts`: pointer hit testing, hover influence, dragging, inertia, and keyboard input.
- `src/lib/gravity-lensing.ts`: world-space lens centers and GLSL for only the floor-grid coordinates.
- `src/lib/timeline.ts`: transition definitions shared by playback and preview menu.
- `src/app.css`: full-screen layout.
- `public/models/hub-network.glb`: distant destination for the later sequence.
- `public/models/inner-truth.glb`: DeepTrust logo currently featured by the camera.

The scene uses a dark floor, angled perspective camera, warm key light, cool
fill light, hemisphere light, and subtle bloom on the lime ports. The latest
user instruction disables all cast shadows: renderer shadow maps are off, loaded
and generated meshes have casting/receiving disabled, and the floor shadow
receiver has been removed. Keep normal lighting, emission, and bloom.
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
- Hub attraction: starts 5.8 s, lasts 8 s, ends 13.8 s.
- Final hub view: starts 8.2 s, lasts 5.6 s, ends 13.8 s.
- Orbital hub: starts 12.04 s, lifts over 3 s, then continues indefinitely.
- Grid release: starts 12.6 s, lasts 1.2 s, ends 13.8 s.

The user explicitly superseded the earlier sequential timing and the requirement
to close the border before filling. Camera, outline, and fill all complete when
the arrival impact begins. Offsets and durations are derived from shared values.
The full transition list has been replaced by compact bottom-right controls.
They show the current transition name and index. Back and Next seek to adjacent
entries in the shared timeline; Restart replays the current active transition.
The index follows automatic stage progression. Back is disabled at the first
entry, Next at the last, and all controls are disabled during loading/errors.
Seeking resets and restores the correct partial state without reloading or
refetching models. Native buttons provide keyboard focus and activation.

The URL tracks the selected starting point without reloading:
`http://localhost:5173/?start=draw` begins with an undrawn border and the camera
at second 1.5. `http://localhost:5173/?start=fill` begins at second 2, with fill at
zero, partial border, and camera still rising. `?start=arrival` starts the pulse
with camera and card complete. `?start=connect` starts the south connection from
its first frame after the pulse has ended. Refresh to replay. The default URL
starts the whole sequence. `?start=approach` previews attraction with the line
and camera already two seconds into the connection scene. Reduced motion shows
the completed eight-node hub in its final close framing, without animated
impact or lensing. `?start=framing` begins the camera catch-up while the
card and existing nodes are still moving. `?start=release` begins the outward
grid shockwave while the camera and DeepTrust movement finish together.

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
- The card never casts or receives shadows, including during construction. Generated meshes and spark resources are disposed
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
The latest shadow-free iteration removes that separate shadow layer. Scene
cleanup disposes the remaining unlit floor material and geometry. PCFShadowMap replaces
the removed PCFSoftShadowMap constant to avoid its runtime warning.

The hub's GLB scene is named `Doppel_Hub`. Its center is 15 floor-grid cells
south of the logo center, about `(0, 0, 3.2004)` meters with the current card.
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
replay. The source endpoint and port follow the moving card each frame; the hub
endpoint stays at the northern plate rim beneath the new DeepTrust port.

Two seconds after connection starts, the complete `Node_DeepTrust` drifts south
over eight seconds, using smootherstep easing and absolute positions. It stops
at the north/top position of the existing orbit, using the actual radius of
`Node_Messages` from the GLB. This supersedes the earlier eight-grid-cell stop
outside the orbit. `HUB_APPROACH` controls delay and duration. Replay restores
the original card position. The shadow light follows the card with a constant
offset, preserving its lighting direction and shadow coverage. Camera fitting
uses the cached original scene bounds so resizing during travel does not
recompose the shot or lose the original logo location.

The hub expands from seven points to eight during the approach. Existing nodes
retain their clockwise order: Messages, Domains, Email, Social Media, Paid Ads,
Telco, URLs. Their final slots are 45, 90, 135, 180, 225, 270, and 315 degrees
clockwise from north; DeepTrust occupies 0 degrees at the top. The motion starts
20% into the approach and settles at 90%, using smootherstep easing. Node cards
and icons translate around the orbit without rotation. Their matching ports
move to the same angles, and their baked radial links rotate about the hub
center. A clone of the original Messages port becomes `Port_DeepTrust` and
scales into view as the top slot opens. Shared geometry/materials are preserved
and disposed with the loaded hub. Replay restores all original node, link, and
port transforms and hides the eighth port. The Blender source and GLB are not
modified; all redistribution happens in the runtime scene.

The camera return overlaps the attraction rather than waiting for it to finish.
`CONNECTION_SHOT.riseSeconds` gives a four-second pullback from second 3.8 to
7.8. It reaches the wide composition while DeepTrust is still near its original
position, then holds for 0.4 seconds. From second 8.2 to 13.8, it catches up and
moves closer over 5.6 seconds, finishing simultaneously with attraction.
`FINAL_HUB_DURATION` derives from the attraction endpoint; there is no separate
camera tail after the logo settles.
`final-hub-camera.ts` measures the live hub and DeepTrust body/logo every frame,
excluding the old logo origin and pulse plane. This replaces the former cached
settled fit, which would become stale during overlapping motion. The target
tracks the closing gap while the camera eases away from the wide pose. It ends
square overhead, north up. The final composition is now deliberately oversized
and cropped, but shows more of the sphere than the first northwest-only crop:
the virtual center is inside the viewport at screen X 84%, Y 78% desktop / 84%
portrait. Right and bottom edges may overflow. Desktop coverage is 125% vertically and
115% horizontally. Portrait framing now applies `mobileScale: 2`, doubling
coverage to 250% vertically and 270% horizontally while preserving the center.
Camera clearance above the rotating volume still applies, so near-square
portrait viewports may reach slightly less than 2x before that safety limit. Distance also respects clearance above the orbital volume. This replaces
the earlier small full-hub fit at 73% X. Do not restore automatic fit-to-all-nodes
or viewport-edge clamping: nodes should orbit into and out of the crop. The
camera and gaze translate together to preserve the overhead view and the left
editorial space. Replay, resize, direct seeks, timeline duration, and reduced
motion use absolute time and the same crop.

Grid release overlaps the final 1.2 seconds of attraction and camera movement,
from second 12.6 to 13.8. All three derive their endpoint from the same settle
time. This replaces the previous release after the camera had stopped.
`GRID_LENS_RELEASE.durationSeconds` controls the overlap length. Both local lens
strengths fade to zero while one hub-centered shockwave expands across the grid.
`gridShockwave` uses a narrow radial compression front and opposite rebound,
with a 0.14 m band width, an expanding radius from 0.45 to 3.4 m, and a short
attack/fading envelope. It distorts only grid lookup coordinates; no model or
shadow is distorted and no luminous ring geometry is added. Lens and shockwave
strengths are exactly zero at the shared endpoint, leaving a straight grid.
The Grid release preview seeks into the last part of the approach/camera move.
Replay resets both strengths and release progress. Reduced motion shows the
completed hub with a normalized grid. Tests, builds, browser checks, and proof
screenshots were skipped for this iteration.

The user clarified that gravitational lensing must affect ONLY the grid. The
first implementation used a full-scene postprocessing pass, which also warped
the logo and hub. That pass has been removed. Do not restore whole-scene lensing.
`floor.ts` now injects `gravity-lensing.ts` GLSL into the floor material and bends
only the coordinates used to sample the grid pattern. It does not change floor
geometry, model rendering, connection geometry, shadows, lighting, or bloom.
The two lens centers track the objects in world X/Z, with radii of 0.65 m around
DeepTrust and 1.7 m around the hub. The same soft annular profile and two-second
strength ramp are retained. The user requested stronger, faster lensing:
`GRID_LENS` now sets strength to 0.3 (2.5 times the original 0.12), pulse depth
to 0.22, and temporal pulse frequency to 0.75 Hz (previously about 0.22 Hz).
Only grid distortion is strengthened. The shared endpoint, release shockwave,
and normalized final grid remain unchanged. Reduced motion disables distortion; replay
resets it. Uniforms are owned by the floor material, with no separate GPU pass.


Refresh the card and hub world matrices before measuring nested endpoint meshes.
The connection is created before the first render. Without that refresh, the
hub plate bounds can retain the pre-placement position near the origin and send
the wire north through the logo. The world orientation itself is correct:
north is screen up / -Z, south is screen down / +Z, east is +X, west is -X.

The joining/camera/grid beat ends at 13.8 seconds and text/button sequence completes at 16.4
seconds. Rendering continues for shared sphere rotation and port/rim breathing. Hidden tabs pause both clocks. Reduced motion holds the
final scene with baseline emission and renders on demand. Pixel density is capped at 2. Cleanup disposes geometry, materials,
shadow maps, and postprocessing resources. Both GLBs must load before the shot
starts; asynchronous loading handles unmounts and loading errors.

The original rotating wireframe sculpture and stars have been removed.

## Invisible spherical hub with evenly spaced rotating anchors

The latest request replaces independent paths with evenly spaced fixed anchors
on an invisible sphere, rotating as one unit.
Do not add visible sphere geometry, reflective material, meridian lines, or
extra equator rings. `Hub_Plate` and the old graphite `Orbit_Rings` are hidden at
load and replay. The original `Hub_Lime_Rim` is visible throughout; during the
three-second lift it rises to the virtual anchor center and continues breathing.
The permanent `Hub_Invisible_Sphere_Anchor` is an Object3D with no material or
geometry. Its center is raised above the floor so inclined orbits do not pass
through the ground. There is no visible globe growth or surface morph.

Orbital motion starts only when DeepTrust is close: at 78% of the eight-second
approach, around second 12.04 (about 93% of its eased travel). Eight nodes blend
from their joining positions into a fixed eight-point square antiprism over
three seconds. Four points occupy each of two symmetric latitudes, staggered
by 45 degrees. Unit height is `sqrt(1 / (1 + 2*sqrt(2)))`; the latitude radius
is `sqrt(1-height²)`, giving equal nearest-neighbor distances. This means evenly
spaced neighbors, not equal distance between all possible pairs.

A single quaternion rotates all anchor vectors at the same radius. Motion
combines continuous yaw (0.075 rad/s), slower tumble (0.025 rad/s), and gentle
sinusoidal pitch/roll precession. The virtual anchor rotates with it. The original lime ring keeps its source
orientation, so its circumference remains a circle instead of tumbling with the
anchor set. Do not apply the sphere quaternion to the visible ring. Distances between nodes remain fixed after the blend. The
separate unclamped animation clock continues indefinitely; hidden tabs pause
it and reduced motion shows the static final arrangement.

Cards/icons must remain planar to the camera throughout the orbital motion.
`faceCamera` runs after the camera pose is applied and converts the camera's
orientation to each card parent's coordinates, with local +Y facing the viewer.
Do not rotate the cards into their orbital planes or warp their geometry.
Their 3D anchor positions and connecting ports rotate as one rigid set; each port
tracks the virtual sphere surface. Eight live cylinders replace the baked flat
links during orbital motion, preserving blue DeepTrust and amber existing links.
The original DeepTrust draw connection is hidden once its orbital spoke takes
over. Replay restores the original transforms, visibility, and planar links.

Final framing crops a fixed orbital envelope, and only caches after the lift
completes. It deliberately ignores individual node bounds once orbital motion
is active, so shared rotation and off-screen motion do not pump the camera zoom.
The former per-node paths, soft repulsion, and screen-space avoidance offsets
have been removed because they would change the fixed spherical spacing. Do
not reintroduce independent motion under the latest brief. Fixed 3D spacing does
not imply equal projected distances as points move through depth. Ports and
spokes are rebuilt from the rotated anchors each frame. No tests or proof were
run for this iteration.

The directional light follows the anchor with a constant offset for consistent
illumination. It does not cast shadows; no shadow frustum is allocated or updated. New geometry/materials are disposed through the normal scene cleanup.
The preview stage `?start=orbits` seeks to orbital activation. The original GLB
and Blender models are preserved. No tests, builds, browser validation, or proof
screenshots were run for this iteration.

## Sphere interaction

The user can influence the shared sphere rotation once its three-second lift is
complete. `sphere-interaction.ts` ray-tests pointer positions against the virtual
sphere envelope, including its visible cropped portion. Mouse hover adds a small
damped tilt. Primary-button or single-touch drag rotates around camera right/up,
with pointer capture so dragging can continue outside the canvas. Release adds
a short exponentially damped coast, unless the pointer was held stationary or
cancelled. Arrow keys rotate the focused canvas in small increments. The canvas
has a descriptive accessible label and a keyboard focus outline.

The input quaternion is composed with the existing automatic sphere quaternion.
It rotates the entire fixed anchor set, ports, and spokes; it does not rotate
the camera, change node spacing, affect billboard orientation, or turn the lime
circumference. Drag orientation persists while automatic rotation continues.
Hover influence eases away on pointer exit. The press-release link and transition
controls are sibling DOM targets; canvas listeners do not intercept their clicks.

Replay resets interaction state. Hidden tabs and window blur cancel active
gestures and stop inertia. Pointer cancellation/lost capture cannot leave the
sphere stuck dragging. Reduced motion disables hover and inertial animation but
still permits direct dragging and arrow-key rotation, requesting only the needed
frames. Disposal releases pointer capture and removes canvas/window listeners.
No tests, builds, browser checks, or proof screenshots were run for this iteration.

## Announcement layer and ambient glow

`Scene.svelte` now renders a Swiss-style editorial layer independently of the
Three.js scene. The user explicitly rejected text centered inside the hub.
A full-screen twelve-column grid holds a left-aligned text block spanning five
columns, with shared logo/type edges and generous spacing. The user asked to
remove the line above the logos; the border and its padding are gone. Logo/type
gaps are now 25% tighter than the preceding spacious version, with the same
logo sizes and staged reveal timing,
and large Helvetica-family type. Mobile uses six columns. A restrained dark
left gradient supports legibility while the animated scene continues underneath.
The DeepTrust logo lockup is the existing `logo-full.svg`. The Doppel lockup is
`public/branding/doppel-lockup.svg`, downloaded from the official website's
`/static/logos/doppel-lockup-dark.svg`; CSS renders it white on the dark scene.
`public/branding/SOURCES.md` records provenance. Both retain their aspect ratios. The Doppel logo is now 25% smaller across
desktop, mobile, and short viewports; the DeepTrust logo size is unchanged.
The heading's accessible name is “Deep Trust is now a part of Doppel”; decorative
logo images do not duplicate it for screen readers. The visible middle line is
“is now a part of”, set much smaller than the logos on one reserved line. The layer does not intercept pointer events.

`announcement.ts` defines an ordered reveal starting at 12.6 seconds. DeepTrust
fades in over 0.65 seconds; after 0.15 seconds, “is now a part of” types at
0.075 seconds per character. After the full phrase and a 0.2-second pause,
Doppel fades in over 0.75 seconds. After a further 0.25-second pause, the final
“Read the Press Release →” button fades in over 0.6 seconds. The whole reveal
now lasts 3.8 seconds and ends at 16.4 seconds. The connecting phrase uses a smaller 1.125–2 rem scale and
lighter weight so the logos carry the hierarchy. An invisible full-text copy
reserves its line; the typed characters do not shift the logos or layout.
The accessible heading remains complete and the typing is not a live region.

`onAnnouncement(progress)` now reports linear progress over the complete text
sequence; `announcementState` derives each logo opacity and visible character
count. The editorial backdrop enters with DeepTrust, and the Doppel image
and press-release button each have their own opacity. Replay and seeks use absolute scene time; there are no
independent timers. Reduced motion shows the complete message immediately.
`SCENE_DURATION` includes the text tail. `HUB_SETTLE_TIME` still anchors the
camera, card, grid shockwave, to second 13.8. Orbital framing caches after the three-second lift completes
with the entire orbit envelope included. Do not stretch
the 3D movement to match the longer text sequence. Release preview also replays
the whole announcement. The bottom-right Back / Restart / Next controls stay
separate from the editorial grid and restart the active timeline entry.

The press-release control is a locally styled anchor beneath the logos, outside
the heading, aligned to the editorial left edge. It uses a real right arrow, a transparent
background with a light outline, and a larger 3–5 rem responsive gap above it.
Hover changes border/text color without filling the background. The user supplied its exact
URL: `https://deeptrust.ai/press-release`. It opens a new tab with
`noopener noreferrer`. Space is reserved before reveal; visibility, pointer
interaction, and keyboard tab order follow its final fade. Reduced motion shows
it immediately; replay hides it and restarts the same ordered sequence. Final
announcement progress snaps within a small epsilon of completion so float
rounding cannot leave the button permanently non-interactive. No tests, builds,
browser checks, or proof screenshots were run for this iteration.

`hub-breathing.ts` gives every `Port_*` group (including DeepTrust) independent
emissive materials, keeping dark sockets steady. The lime rim has its own slower
rhythm. Ports use 4.6–6.8 second periods, distinct phases, and small secondary
variations; the rim uses 7.2 seconds. Emission stays near baseline, with no sharp
flashes or synchronized beat. Replaced unreferenced source materials are disposed,
and scene cleanup disposes the assigned clones. Breathing starts after loading
and continues after the main timeline completes, using a separate ambient clock.
The camera, normalized grid, and text remain settled while the node positions
continue rotating together at their fixed spherical anchor points. The final
camera fit is cached once the layout completes and invalidated on replay/resize.
Hidden tabs pause the ambient clock; reduced motion restores baseline emission
and stops continuous rendering after the final frame. No tests, builds, browser
checks, or proof screenshots were run for this iteration.

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
names. The source link geometry is baked; `hub-expansion.ts` rotates each link
with its node and port to preserve the connection during orbit redistribution.

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
preceding grid/camera iteration passed `npm run check`, targeted framing checks,
and browser verification. The current approach/lensing iteration was implemented
and committed without tests, builds, browser validation, or proof screenshots,
as the user requested. Do not describe its appearance as agent-verified. The
user runs and reviews the app in parallel; their dev server was left untouched.
