# Keycard: brand research and announcement direction

Researched October 28, 2026. This is a proposed DeepTrust acquisition announcement
for the user's creative brief, not evidence of an announced transaction.

## The company and the useful narrative

Keycard describes a runtime authorization layer for AI agents. Its core story is
that an agent has an identity, acts within a task and delegation context, and
receives access according to policy. This is more specific than a generic
AI-security message. Its October positioning article emphasizes the relationship
between intent, action, and access. For this announcement, the useful bridge is
**DeepTrust's intelligence joining an identity-and-access system**. That is a
creative direction; this page does not claim a shipped integration or new joint
product capability. [Product overview](https://docs.keycard.ai/guides/why-keycard/),
[October positioning article](https://www.keycard.ai/blog/defining-auth-for-agents/).

## What the current identity actually looks like

The live site pairs a dark technical environment with the visual language of a
physical credential: a chip mark, fine circuitry, translucent panels, iridescent
surfaces, and compact metadata. Its diagrams show requests and decisions rather
than decorative connected dots alone. The combination makes abstract access
control feel tangible and observable. These are observations of the current
homepage, not a claim that a public brand manual mandates every treatment.
[Homepage](https://www.keycard.ai/).

The official brand page provides separate wordmarks, logos, a no-bleed symbol,
chip artwork, and small application icons. Use the provided artwork rather than
reconstructing the distinctive mark in a font. The Keycard variant uses the
light-on-dark wordmark and chip directly, preserving their SVG geometry.
[Official brand assets](https://www.keycard.ai/brand/).

## Palette and type observations

The following are sampled from the live homepage's public styles and assets.
They are implementation observations, not invented brand guidelines.

| Role | Observed treatment | Translation in this page |
| --- | --- | --- |
| Background | Near-black, cool slate, fine dark grid | `#030a0e` backdrop and `#0c1419` floor |
| Foil | Pale cyan, lilac, pink, warm pearl | Restrained cyan/lilac glass edges and iridescent node cards |
| Verification | Acid/lime accents, including `#bdee63` | Small identity labels and breathing port lights |
| Structure | Thin cool borders, small radii | Credential-style editorial frame and compact controls |
| Type | Site preloads Mori, Supply, Geist, and Geist Mono | Self-hosted Geist for UI/copy, Geist Mono for metadata |

Commercial Mori/Supply font files are not bundled. Geist and Geist Mono are
served locally with their SIL Open Font License notices. This keeps the
technical/human typographic contrast without assuming commercial font rights.
Sources: [live homepage](https://www.keycard.ai/),
[homepage CSS](https://www.keycard.ai/_astro/index.DCea1Zyf.css),
[shared material/color CSS](https://www.keycard.ai/_astro/EarlyAccessModal.c3VypNBf.css),
[Geist license](https://github.com/google/fonts/blob/main/ofl/geist/OFL.txt),
[Geist Mono license](https://github.com/google/fonts/blob/main/ofl/geistmono/OFL.txt).

## Visual communication techniques worth carrying over

- **Credential as object.** Foil, chip geometry, and edge highlights turn identity
  into something that feels issued and held. Use it sparingly around the partner
  announcement and node surfaces, rather than flooding the entire screen.
- **Process as evidence.** Ordered request/verification/decision sequences help
  people understand what the infrastructure does. The existing timed join and
  staged typography already provide a useful process narrative.
- **Small operational labels.** Monospaced, tracked text gives the scene an
  infrastructure vocabulary. It belongs in supporting labels, not the main
  acquisition sentence.
- **Color has a job.** Cool pearl carries the material; lime marks a meaningful
  status. Avoid importing Doppel's warm copper/amber as the dominant treatment.
- **Fine structure, generous space.** Grids and hairlines make the page feel
  precise; quieter empty regions keep it from resembling a crowded dashboard.
- **Visible connections.** Keep links and their anchors coherent while moving.
  The interactive sphere can communicate a connected system, while the identity
  icons explain what is connected.

These are design interpretations drawn from the
[homepage](https://www.keycard.ai/) and the conceptual diagrams in the
[company's introductory article](https://www.keycard.ai/blog/the-federated-trust-fabric-for-the-agent-native-era/).

## How this becomes the new landing page

The page lives at `/keycard/`. The original Doppel scene stays at `/`.
The user explicitly corrected the first adaptation: the hub-and-spoke metaphor
belongs to Doppel. Keycard must use its credential objects and layered content
blocks instead. No hub, orbiting nodes, invisible sphere, or Three.js scene is
mounted by the Keycard entry point.

The hero uses Keycard's actual NFC card artwork as a physical-looking portrait
credential. It arrives with a soft turn, floats slowly, and responds to pointer
or keyboard tilt with a foil highlight. A dark field, fine grid, grain, and cool
ambient light follow the supplied references. DeepTrust fades in, the joining
phrase types, the Keycard wordmark fades in, and the outlined press-release link
appears last. The CTA retains `https://deeptrust.ai/press-release`.

The page scrolls into a separate content-block composition: context above,
a wide iridescent credential crossing the stack, chip/circuit rail, lime trust
signals, tick-mark separators, and resource tiles below. Its announcement copy
expresses a shared new chapter rather than pretending to execute real
credential issuance. Typography and illustration are independent of the hero
card's motion. The concept is Keycard's credential language, not a reskin of
Doppel's network metaphor.

## Implementation and review status

`keycard/main.ts` mounts `KeycardPage.svelte` directly. Doppel's `src/App.svelte`
mounts its original `Scene.svelte`. Both HTML entry points remain in Vite's
multipage configuration. The obsolete Keycard-specific hub material/icon layer
and variant branches were removed. Keycard does not load the hub GLB or mount
the sphere renderer. It uses DOM, CSS 3D transforms, local SVG/PNG artwork, and
self-hosted fonts. It has its own compact Back / Restart / Next playback stages,
visibility pausing, reduced-motion support, and responsive stacked mobile layout.

Research included the official site, brand assets, product documentation, launch
article, current positioning article, public CSS/font references, and a visual
inspection of the official homepage. The corrected design also follows the two
user-supplied screenshots of the credential flow and physical keycard hero.
No local app tests, production build, browser validation, or proof screenshots
were run, following the user's workflow. Nothing was pushed or deployed.
