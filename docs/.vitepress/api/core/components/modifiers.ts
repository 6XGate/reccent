import { title } from 'radash'
import { z } from 'zod'
import { Chip, defineLiteComponent } from './common'
import type { BadgeType } from './common'

const modifierColors: Record<string, BadgeType> = {
  EXPORTED: 'tip',
  ABSTRACT: 'warning',
  PROTECTED: 'warning'
}

function getChipColor (value: string) {
  if (value.startsWith('@')) {
    value = value.substring(1)
  }

  const color = modifierColors[value.toUpperCase()]
  if (color == null) {
    return 'info'
  }

  return color
}

function getChipModifier (value: string) {
  if (value.startsWith('@')) {
    value = value.substring(1)
  }

  return title(value)
}

export const ModifierChip = defineLiteComponent(
  z.object({ tag: z.string().min(1) }),
  ({ tag }) => Chip({ type: getChipColor(tag) }, [getChipModifier(tag)])
)
