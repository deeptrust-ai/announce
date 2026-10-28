import { OPENING_DURATION } from './opening-shot'
import { CARD_CONSTRUCTION, CARD_DURATION } from './card-construction'
import { ARRIVAL_EFFECT } from './arrival-effect'
import { SOUTH_CONNECTION } from './south-connection'
import { HUB_APPROACH } from './hub-approach'
import { FINAL_HUB_SHOT } from './final-hub-camera'
import { GRID_LENS_RELEASE } from './gravity-lensing'
import { CONNECTION_SHOT } from './connection-camera'

export const ARRIVAL_START = Math.max(
  OPENING_DURATION, CARD_CONSTRUCTION.startSeconds + CARD_DURATION,
)
export const CONNECTION_START = ARRIVAL_START + ARRIVAL_EFFECT.durationSeconds
export const APPROACH_START = CONNECTION_START + HUB_APPROACH.delaySeconds
export const FINAL_HUB_START = CONNECTION_START + CONNECTION_SHOT.riseSeconds
  + FINAL_HUB_SHOT.wideHoldSeconds
export const LENS_RELEASE_START = Math.max(
  FINAL_HUB_START + FINAL_HUB_SHOT.durationSeconds,
  APPROACH_START + HUB_APPROACH.durationSeconds,
)

export const TRANSITIONS = [
  { id: 'camera', name: 'Camera rise', start: 0, duration: OPENING_DURATION },
  {
    id: 'draw', name: 'Border draw', start: CARD_CONSTRUCTION.startSeconds,
    duration: CARD_CONSTRUCTION.outlineSeconds,
  },
  {
    id: 'fill', name: 'Tiled fill',
    start: CARD_CONSTRUCTION.startSeconds + CARD_CONSTRUCTION.fillDelaySeconds,
    duration: CARD_CONSTRUCTION.fillSeconds,
  },
  {
    id: 'arrival', name: 'Arrival pulse', start: ARRIVAL_START,
    duration: ARRIVAL_EFFECT.durationSeconds,
  },
  {
    id: 'connect', name: 'South connection', start: CONNECTION_START,
    duration: SOUTH_CONNECTION.durationSeconds,
  },
  {
    id: 'approach', name: 'Hub attraction', start: APPROACH_START,
    duration: HUB_APPROACH.durationSeconds,
  },
  {
    id: 'framing', name: 'Final hub view', start: FINAL_HUB_START,
    duration: FINAL_HUB_SHOT.durationSeconds,
  },
  {
    id: 'release', name: 'Grid release', start: LENS_RELEASE_START,
    duration: GRID_LENS_RELEASE.durationSeconds,
  },
] as const

export type TransitionId = typeof TRANSITIONS[number]['id']
export const SCENE_DURATION = LENS_RELEASE_START + GRID_LENS_RELEASE.durationSeconds

export function startingTransition(search: string): TransitionId {
  const requested = new URLSearchParams(search).get('start')
  return TRANSITIONS.find((transition) => transition.id === requested)?.id ?? 'camera'
}

export function transitionAt(elapsed: number): TransitionId {
  for (let index = TRANSITIONS.length - 1; index >= 0; index -= 1) {
    if (elapsed >= TRANSITIONS[index].start) return TRANSITIONS[index].id
  }
  return 'camera'
}
