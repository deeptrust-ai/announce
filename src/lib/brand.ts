export type BrandVariant = 'doppel' | 'keycard'

export const BRANDS = {
  doppel: {
    name: 'Doppel', title: 'DeepTrust is now a part of Doppel',
    logo: 'doppel-lockup.svg', logoWidth: 146, logoHeight: 32,
    background: '#080d14', floor: '#182331', grid: '#43566F', gridOpacity: 0.32,
    arrival: '#4D83D9', bloom: 0.35,
    hemisphere: '#c5d8ed', groundLight: '#29212c', keyLight: '#fff0dc', fillLight: '#a5c8ff',
  },
  keycard: {
    name: 'Keycard', title: 'DeepTrust is now a part of Keycard',
    logo: 'keycard/wordmark.svg', logoWidth: 599, logoHeight: 158,
    background: '#030a0e', floor: '#0c1419', grid: '#3a5360', gridOpacity: 0.28,
    arrival: '#b9adf3', bloom: 0.24,
    hemisphere: '#d5eef1', groundLight: '#201c2c', keyLight: '#e7f2ff', fillLight: '#b9a9ef',
  },
} as const
