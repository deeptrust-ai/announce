# Keycard assets

Retrieved October 28, 2026 from Keycard's official public press/partner assets:
https://www.keycard.ai/brand/

- `wordmark.svg`: https://www.keycard.ai/_astro/LightOnDarkKeycardWordmark.B8X-Wb82.svg
- `logo.svg`: https://www.keycard.ai/_astro/LightOnDarkKeycardLogoNoBleed.Bj9sX_H-.svg
- `mark.svg`: https://www.keycard.ai/img/keycard-mark.svg
- `chip.svg`: https://www.keycard.ai/img/press/KeycardChip.svg

- `credential-card.png`: https://www.keycard.ai/_astro/keycard-nfc.BbQl8DwC_WxzyM.png,
  the 504px NFC-card image referenced by Keycard’s current homepage.

The SVG geometry and PNG artwork are unchanged on disk. The Keycard opening
uses the PNG as a material texture and masks its center K at runtime so the
DeepTrust mark can be etched into the empty center. The KEYCARD.AI label is
also masked during the opening and returns in the final upright hero. Assets are served locally, with no hotlinked logo
requests. Typeface files in `public/fonts/keycard/` are Geist and Geist Mono,
retrieved from the public font assets used on Keycard's homepage:

- https://www.keycard.ai/_astro/Geist-Regular-latin.Bf8HLhmU.woff2
- https://www.keycard.ai/_astro/GeistMono-Regular-latin.CvQfK0Gj.woff2

Their SIL Open Font License notices are included alongside the files, sourced
from the Google Fonts `ofl/geist` and `ofl/geistmono` directories. Commercial
Mori/Supply files are not bundled. The initial content-block composition is deferred while the first card-etching
transition is developed.

Research and design translation: `docs/keycard-brand-research.md`.
