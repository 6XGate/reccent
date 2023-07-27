import { z } from 'zod'
import { JsonReference, Serializable } from '../serialization'
import { symbols } from '../utilities/foundation'
import type { JsonObject } from 'type-fest'

export type PageBlock = z.infer<typeof PageBlock>
export const PageBlock = z.object({
  heading: z.string(),
  children: z.array(JsonReference),
  sections: z.array(JsonReference)
})

abstract class Page<TypeName extends string> extends Serializable<TypeName> {

}

export class CategoryPage extends Page<'CategoryPage'> {
  override [symbols.type] () { return 'CategoryPage' as const }

  override [symbols.serialize] (): JsonObject {
    throw new Error('Method not implemented.')
  }
}

export class ScopePage extends Page<'ScopePage'> {
  override [symbols.type] () { return 'ScopePage' as const }

  override[symbols.serialize] (): JsonObject {
    throw new Error('Method not implemented.')
  }
}
