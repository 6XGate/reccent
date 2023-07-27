import type { Page } from '../core/structure'

export function makePath (page: Page) {
  const path = new Array<string>()

  let current: Page | null = page
  while (current != null) {
    path.unshift(current.name)
    current = current.parent
  }

  return path.join('-')
}
