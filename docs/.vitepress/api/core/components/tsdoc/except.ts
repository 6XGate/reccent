import { Excerpt as ApiExcerpt } from '@microsoft/api-extractor-model'
import { z } from 'zod'
import { getReference, resolveLinkReference } from '../../../utilities/reference'
import { stringifyCss } from '../../../utilities/styling'
import { CodeBlock, ReferenceLink, cz, defineLiteComponent } from '../common'

const kKeywords = [
  // Reserved words
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  // Strict mode reserved words
  'as',
  'implements',
  'interface',
  'let',
  'package',
  'private',
  'protected',
  'public',
  'static',
  'yield',
  // Contextual keywords
  'any',
  'boolean',
  'constructor',
  'declare',
  'get',
  'module',
  'require',
  'number',
  'set',
  'string',
  'symbol',
  'type',
  'from',
  'of'
]

// const kCommonTypes = [
// ]

function processTokens (excerpt: ApiExcerpt) {
  return excerpt.spannedTokens.map(token => {
    const ref = token.canonicalReference != null ? getReference(token) : undefined
    const url = ref != null ? resolveLinkReference(ref) : undefined
    if (url != null) {
      return cz('a', { href: url }, [token.text])
    }

    if (token.canonicalReference != null) {
      // Token was expected to be a reference, but not found.
      return cz('span', { style: stringifyCss({ color: '#FFC964' }) }, [token.text])
    }

    if (kKeywords.includes(token.text)) {
      return cz('span', { style: stringifyCss({ color: '#C288E8' }) }, [token.text])
    }

    return token.text
  })
}

export const BlockExcerpt = defineLiteComponent(
  z.object({ excerpt: z.instanceof(ApiExcerpt) }),
  ({ excerpt }) => [
    CodeBlock({ lang: 'ts' }, processTokens(excerpt))
  ]
)

export const InlineExcerpt = defineLiteComponent(
  z.object({ excerpt: z.instanceof(ApiExcerpt) }),
  ({ excerpt }) => [
    cz('code', processTokens(excerpt))
  ]
)
