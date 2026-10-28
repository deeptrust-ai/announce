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

The page lives at `/keycard/`. The original Doppel page stays at `/`.

The core sequence remains recognizable: the original DeepTrust mark becomes a
card, connects, approaches, and joins eight evenly spaced anchors. Their shared
rotation, camera-facing icons, invisible sphere, fixed circular rim, no cast
shadows, mobile crop, pointer influence, and keyboard controls are preserved.
The scene is recolored with graphite card bodies, pearl/cyan connections, lilac
arrival light, restrained bloom, and lime port breathing.

The seven existing destination cards now represent Identity, Agents,
Credentials, Policy, Resources, Sessions, and Audit. They use original monoline
icons generated locally, replacing the media-channel imagery at runtime. The
original GLB and Blender assets are not overwritten.

The final editorial layer follows the existing left-aligned grid and ordered
reveal: DeepTrust fades in, the joining phrase types, the authentic Keycard
wordmark fades in, then the outlined press-release action appears. Chip artwork,
quiet metadata, and translucent credential framing make this a Keycard edition
rather than a logo-only substitution. The CTA keeps the user-supplied
`https://deeptrust.ai/press-release` destination.

## Implementation and review status

`brand.ts` holds independent defaults for both brands. Keycard-specific node
materials and icons live in `keycard-network.ts`. Theme changes do not mutate
source files or persist across page loads. Both HTML entry points are included
in Vite's multipage build configuration.

Research included the official site, brand assets, product documentation, launch
article, current positioning article, public CSS/font references, and a visual
inspection of the official homepage. No local app tests, production build,
browser validation, or proof screenshots were run, following the user's workflow.
No publication or deployment was performed.
