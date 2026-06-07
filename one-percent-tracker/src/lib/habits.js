// Shared habit/category metadata used across pages.

export const CATEGORIES = [
  { name: 'Non-Negotiables', color: 'gold' },
  { name: 'Growth & Development', color: 'blue' },
]

export const CATEGORY_COLOR = {
  'Non-Negotiables': 'gold',
  'Growth & Development': 'blue',
}

// hex values for charts / inline styles
export const COLOR_HEX = {
  gold: '#e7b73c',
  blue: '#4f8cff',
}

// Weekly / monthly targets per habit (from the build spec).
export const TARGETS = {
  Meditation: { week: 6, month: 26 },
  'Daily Movement': { week: 6, month: 26 },
  Journal: { week: 6, month: 26 },
  'Family Time': { week: 6, month: 26 },
  'Big 3': { week: 5, month: 22 },
  'Sales Activity': { week: 5, month: 22 },
  'Content Creation': { week: 5, month: 22 },
}

// A day counts as "successful" for streaks when completion >= this ratio.
export const SUCCESS_THRESHOLD = 0.8
