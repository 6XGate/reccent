import { memo } from 'radash'
import { isNotNullish } from './basic'
import type { ApiDeclaredItem, ExcerptToken } from '@microsoft/api-extractor-model'
import type { DocDeclarationReference } from '@microsoft/tsdoc'

/** Gets the source module reference string from an item or excerpt. */
function getItemSource (item: ApiDeclaredItem | ExcerptToken) {
  if (item.canonicalReference?.source == null) {
    return undefined
  }

  if (
    'importPath' in item.canonicalReference.source &&
    item.canonicalReference.source.importPath.length === 0
  ) {
    return undefined
  }

  return item.canonicalReference.toString()
}

/** Gets the symbols reference string froman an item or excerpt. */
function getItemSymbol (item: ApiDeclaredItem | ExcerptToken) {
  if (item.canonicalReference?.symbol == null) {
    return undefined
  }

  return [
    item.canonicalReference.symbol.componentPath?.toString(),
    item.canonicalReference.symbol.meaning?.toString()
  ].filter(isNotNullish).join(':')
}

/** Gets the string reference for an item or excerpt. */
export function getReference (item: ApiDeclaredItem | ExcerptToken) {
  const ref = getItemSymbol(item)
  if (ref == null) {
    return undefined
  }

  return [getItemSource(item), ref].filter(isNotNullish).join('')
}

/** Gets the string reference from a documation declaration reference.  */
export function getDocReference (ref: DocDeclarationReference | string): string
export function getDocReference (ref: DocDeclarationReference | string | null | undefined): string | undefined
export function getDocReference (ref: DocDeclarationReference | string | null | undefined) {
  if (ref == null) {
    return undefined
  }

  if (typeof ref === 'string') {
    return ref
  }

  const parts = new Array<string>()

  // TODO: Source package or import. Proper supprt,
  //       likely combined for full reference.
  if (ref.packageName != null) {
    parts.push(`${ref.packageName}!`)
  } else if (ref.importPath != null) {
    parts.push(`${ref.importPath}!`)
  }

  // Reference itself.
  for (const member of ref.memberReferences) {
    const selector = member.selector?.selector

    if (member.hasDot) {
      parts.push(selector === 'static' ? '.' : '#')
    }

    if (member.memberIdentifier != null) {
      parts.push(member.memberIdentifier.hasQuotes
        ? `"${member.memberIdentifier.identifier}"`
        : member.memberIdentifier.identifier)
    } else if (member.memberSymbol != null) {
      parts.push(`[${getDocReference(member.memberSymbol.symbolReference)}]`)
    }
  }

  return parts.join('')
}

/** Function that will resolve a references to a document URL. */
export type ReferenceResolverFunction = (reference: string) => string | undefined

/** Object that will resolve a references to a document URL. */
export interface ReferenceResolverObject { resolve: ReferenceResolverFunction }

/** Resolver to resolve a reference to a document URL. */
export type ReferenceResolver = ReferenceResolverObject | ReferenceResolverFunction

/** Provides resolution of references to document URLs. */
export const useReferenceResolver = memo(() => {
  const resolvers = new Array<ReferenceResolver>()

  /*
  Currently supported meanings:
    - Class = "class",
    - Interface = "interface",
    - TypeAlias = "type",
    - Enum = "enum",
    - Namespace = "namespace",
    - Function = "function",
    - Variable = "var",
    - Constructor = "constructor",
    - Member = "member",
    - Event = "event",
    - CallSignature = "call",
    - ConstructSignature = "new",
    - IndexSignature = "index",
    - ComplexType = "complex"
  */

  /** List of meaning presedence when looking up references. */
  const byMeaningPresedence = [
    // First, any kind that can be a variables and a type, except namespaces.
    'complex',
    'class',
    'enum',
    // Then; namsapces and constructors.
    'namespace',
    // Next; any kind that is purely data or members a compound kind.
    'constructor',
    'function',
    'member',
    'var',
    // Leaving mostly signatures.
    'call',
    'new',
    'index',
    // Finally; purely type kinds.
    'event',
    'interface',
    'type'
  ]

  /**
   * Adds a document URL resolver.
   *
   * @returns
   * A function to remove the resolver.
   */
  function push (resolver: ReferenceResolver) {
    resolvers.push(resolver)

    return () => { remove(resolver) }
  }

  /** Removes a document URL resolver. */
  function remove (resolver: ReferenceResolver) {
    const index = resolvers.indexOf(resolver)
    if (index !== -1) {
      resolvers.splice(index, 1)
    }
  }

  /** Resolves a reference with the specified resolver. */
  function resolveWith (resolver: ReferenceResolver, reference: string) {
    if (typeof resolver === 'function') {
      return resolver(reference)
    }

    return resolver.resolve(reference)
  }

  /** Resolves a reference to a document URL. */
  function resolve (reference: string) {
    for (const resolver of resolvers) {
      let url = resolveWith(resolver, reference)
      if (url != null) {
        return url
      }

      for (const meaning of byMeaningPresedence) {
        url = resolveWith(resolver, `${reference}:${meaning}`)
        if (url != null) {
          return url
        }
      }
    }

    return undefined
  }

  return {
    push,
    remove,
    resolve
  }
})

/** The reference resolver. */
const kResolver = useReferenceResolver()

/** Resolves a reference to a document URL. */
export function resolveLinkReference (reference: string) {
  return kResolver.resolve(reference)
}
