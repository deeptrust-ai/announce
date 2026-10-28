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
