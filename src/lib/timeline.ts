import { OPENING_DURATION } from './opening-shot'
import { CARD_CONSTRUCTION, CARD_DURATION } from './card-construction'

export const TRANSITIONS = [
  { id: 'camera', name: 'Camera rise', start: 0, duration: OPENING_DURATION },
  {
    id: 'draw', name: 'Border draw', start: OPENING_DURATION,
    duration: CARD_CONSTRUCTION.outlineSeconds,
  },
  {
    id: 'fill', name: 'Tiled fill',
    start: OPENING_DURATION + CARD_CONSTRUCTION.outlineSeconds,
    duration: CARD_CONSTRUCTION.fillSeconds,
  },
] as const

export type TransitionId = typeof TRANSITIONS[number]['id']
export const SCENE_DURATION = OPENING_DURATION + CARD_DURATION

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
