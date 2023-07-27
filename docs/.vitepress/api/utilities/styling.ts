import type { CSSProperties } from 'vue'

export function stringifyCss (css: CSSProperties) {
  return Object.entries(css)
    .filter(([, value]) => value != null)
    .map(([property, value]) => `${property}: ${String(value)}`)
    .join(';')
}
