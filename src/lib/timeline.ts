import { OPENING_DURATION } from './opening-shot'
import { CARD_CONSTRUCTION, CARD_DURATION } from './card-construction'
import { ARRIVAL_EFFECT } from './arrival-effect'
import { SOUTH_CONNECTION } from './south-connection'

export const ARRIVAL_START = Math.max(
  OPENING_DURATION, CARD_CONSTRUCTION.startSeconds + CARD_DURATION,
)
export const CONNECTION_START = ARRIVAL_START + ARRIVAL_EFFECT.durationSeconds

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
] as const

export type TransitionId = typeof TRANSITIONS[number]['id']
export const SCENE_DURATION = CONNECTION_START + SOUTH_CONNECTION.durationSeconds

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
