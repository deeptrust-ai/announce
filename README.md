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

- `models/inner-truth.blend`: the ䷼ glyph extruded to 1 inch deep and 12 inches wide.
- `public/models/inner-truth.glb`: mesh-only export for Three.js, in meters with Y up.
- `models/inner-truth-preview.png`: rendered preview.

The original glyph proportions give a height of approximately 13.73 inches.
The mesh is centered at the origin. The Blender file includes a separate preview
studio collection; the GLB contains only the glyph. The landing-page scene does
not load the model yet.

To regenerate on macOS with Blender installed:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python scripts/create-inner-truth.py
```

The generator uses the Apple Symbols font installed with macOS. The exported
meshes have no external font dependencies.
