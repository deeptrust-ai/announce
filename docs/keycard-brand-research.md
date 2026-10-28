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
| Foil | Pale cyan, lilac, pink, warm pearl | Restrained cyan/lilac glass edges and iridescent credential surfaces |
| Verification | Acid/lime accents, including `#bdee63` | Reserved for later identity/status accents |
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
  announcement and credential surfaces, rather than flooding the entire screen.
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
- **Layered context.** Let context panels, credential rails, and resource tiles
  explain the access sequence. Keep the hub-and-spoke metaphor in Doppel only.

These are design interpretations drawn from the
[homepage](https://www.keycard.ai/) and the conceptual diagrams in the
[company's introductory article](https://www.keycard.ai/blog/the-federated-trust-fabric-for-the-agent-native-era/).

## How this becomes the new landing page

The page lives at `/keycard/`. The original Doppel scene stays at `/`.
The user explicitly corrected the first adaptation: the hub-and-spoke metaphor
belongs to Doppel. Keycard must use its credential objects and layered content
blocks instead. No hub, orbiting nodes, or invisible sphere is mounted by the
Keycard entry point.

The next corrections narrow implementation to the opening etch and hero reveal.
The card starts lying flat on a dark grid with its chip center empty. DeepTrust's
eight-block mark is etched into that center using the original solid SVG paths,
including their rounded corners. The paired-line experiment was rejected. The
approved smaller 0.72-world-unit map size remains, leaving clear space inside
the circuit frame. After the etching completes, a single
shockwave expands through the floor. The card then lifts upright, spins rapidly,
and settles into its front-facing hero view. The card retains the
NFC artwork's circuit tracks. The K is masked in the runtime material,
leaving the original PNG unchanged. The front KEYCARD.AI label is hidden.
A separate reverse face always carries the original Keycard K and KEYCARD.AI
artwork, visible whenever that side turns toward the camera. Only the scene and playback
controls are visible. The earlier
scrolling announcement and content blocks are deferred until later transitions.

## Implementation and review status

`keycard/main.ts` mounts `KeycardPage.svelte`, which owns the independent
`keycard-scene.ts`. This scene uses a rounded thin card body, the local NFC texture,
the actual filled DeepTrust SVG paths as etching maps, and a world-space grid shader.
An elevated camera initially shows the card resting on the floor, then tracks
its center as it lifts and settles into the hero view. The eight original solid
logo shapes etch left to right, top to bottom, with an illuminated front and a
flat pearlescent finish. A glowing blue beam from outside the upper-left frame
follows the cutting point, synchronized to the timing map. There is no relief,
bevel, or simulated edge shading. The shockwave distorts only the floor.

The sequence is: 0.8-second hold, 4.8-second engraving, 0.35-second cooling pause,
1.7-second shockwave, 2-second upright lift, 3-second six-and-a-half-turn spin, and
0.9-second hero settle. A short shutter trail approximates motion blur during
the spin, on both sides. The front and back keep their respective artwork
throughout. The final half turn leaves the original Keycard reverse facing
the camera. Previous,
Restart, and Next controls cover all six stages; R restarts the current stage.
Reduced motion shows the finished hero without animation; hidden tabs pause.
DPR is capped at two; animation stops after the hero settles.
The older content-block direction remains a reference for later transitions.

Research included the official site, brand assets, product documentation, launch
article, current positioning article, public CSS/font references, and a visual
inspection of the official homepage. The corrected design also follows the two
user-supplied screenshots of the credential flow and physical keycard hero.
No local app tests, production build, browser validation, or proof screenshots
were run, following the user's workflow. Nothing was pushed or deployed.
