import { MathUtils } from 'three'

export const ANNOUNCEMENT_TEXT = 'is now a part of'
export const ANNOUNCEMENT = {
  deeptrustFadeSeconds: 0.65,
  typingDelaySeconds: 0.15,
  characterSeconds: 0.075,
  doppelDelaySeconds: 0.2,
  doppelFadeSeconds: 0.75,
  pressReleaseDelaySeconds: 0.25,
  pressReleaseFadeSeconds: 0.6,
} as const

const typingStart = ANNOUNCEMENT.deeptrustFadeSeconds + ANNOUNCEMENT.typingDelaySeconds
const typingEnd = typingStart + ANNOUNCEMENT_TEXT.length * ANNOUNCEMENT.characterSeconds
const doppelStart = typingEnd + ANNOUNCEMENT.doppelDelaySeconds
const doppelEnd = doppelStart + ANNOUNCEMENT.doppelFadeSeconds
const pressReleaseStart = doppelEnd + ANNOUNCEMENT.pressReleaseDelaySeconds
export const ANNOUNCEMENT_DURATION = pressReleaseStart + ANNOUNCEMENT.pressReleaseFadeSeconds

/** Absolute timeline progress keeps typing, direct seeks, and replay in sync. */
export function announcementState(progress: number) {
  const time = progress >= 1 - 1e-6
    ? ANNOUNCEMENT_DURATION : MathUtils.clamp(progress, 0, 1) * ANNOUNCEMENT_DURATION
  return {
    deeptrustOpacity: MathUtils.smootherstep(time, 0, ANNOUNCEMENT.deeptrustFadeSeconds),
    characters: MathUtils.clamp(
      Math.floor((time - typingStart) / ANNOUNCEMENT.characterSeconds),
      0, ANNOUNCEMENT_TEXT.length,
    ),
    doppelOpacity: MathUtils.smootherstep(time, doppelStart, doppelEnd),
    pressReleaseOpacity: MathUtils.smootherstep(time, pressReleaseStart, ANNOUNCEMENT_DURATION),
  }
}
