import { z } from 'zod'
import { Syntax, Token } from './basics'
import { Grammar } from './grammar'
import type { ByRef, Node } from './basics'

const kIsContext = Symbol('isContext')

/**
 * The parser context.
 *
 * @category Parsing
 */
export interface Context {
  [kIsContext]: true
  lastId: string | undefined
}

/**
 * The concrete parser context.
 *
 * @category Parsing
 */
class ParserContext implements Context {
  [kIsContext] = true as const
  lastId: string | undefined
}

/**
 * Node filter callback.
 *
 * @category Parsing
 */
type NodeFilter = (node: Node) => boolean

/**
 * The schema of the parser configuration.
 *
 * @category Parsing
 */
const ParserConfiguration = z.object({
  grammar: z
    // We don't wrap the grammar function in a schema since it will remove necessary members.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- Required by TypeScript
    .instanceof(Grammar<null>),
  aliases: z
    .record(z.string())
    .or(z.map(z.string(), z.string()))
    .transform(v => (v instanceof Map ? v : new Map(Object.entries(v))))
    .optional(),
  filter: z
    // We don't wrap the filter function in a schema for performance.
    .custom<NodeFilter>(v => typeof v === 'function')
    .optional(),
  mustConsumeAll: z
    .boolean()
    .default(true)
})

/**
 * The parser options.
 *
 * @category Parsing
 */
export type ParserOptions = z.input<typeof ParserConfiguration>
/**
 * The resolved parser options.
 *
 * @category Parsing
 */
type ParserConfiguration = z.output<typeof ParserConfiguration>

/**
 * Indicates a parsing failure.
 *
 * @category Parsing
 */
interface ParserFailure {
  /** Indicates the parsing failed. */
  succeeded: false
  /** The ID of the expected grammar. */
  expected: string
  /** The position at which parsing failed. */
  at: number
}

/**
 * Indicates a successful parse.
 *
 * @category Parsing
 */
interface ParserResult {
  /** Indicates the parsing succeeded. */
  succeeded: true
  /** The parsed syntax tree. */
  bst: Node
}

/**
 * The parsing results.
 *
 * @category Parsing
 */
type ParserReturn = ParserFailure | ParserResult

/**
 * Grammar-based parser.
 *
 * @category Parsing
 */
export class Parser {
  /** Parsing configuration. */
  #configuration: ParserConfiguration

  /** Creates a new parser. */
  constructor (options: ParserOptions) {
    this.#configuration = ParserConfiguration.parse(options)
  }

  // TODO: Add support for Blob and Buffer with text decoding to JS UTF16

  /** Parses a stream or string. */
  parse (stream: string): ParserReturn {
    const first: ByRef<number> = [0]
    const last: ByRef<number> = [stream.length]
    const ctx = new ParserContext()

    let bst = this.#configuration.grammar.run(ctx, stream, first, last)
    if (bst == null) {
      return {
        succeeded: false,
        expected: this.#configuration.aliases?.get(ctx.lastId as string) ?? ctx.lastId as string,
        at: first[0]
      }
    }

    if (this.#configuration.mustConsumeAll && first[0] !== last[0]) {
      return {
        succeeded: false,
        expected: this.#configuration.aliases?.get(ctx.lastId as string) ?? ctx.lastId as string,
        at: first[0]
      }
    }

    if (bst instanceof Token) {
      return {
        succeeded: true,
        bst
      }
    }

    if (bst instanceof Syntax) {
      bst = Parser.#filterSyntax(bst, this.#configuration.filter)
    }

    return {
      succeeded: true,
      bst
    }
  }

  /** Filters the resulting syntax tree. */
  static #filterSyntax (syntax: Syntax, filter?: (node: Node) => boolean): Syntax {
    return new Syntax(syntax.id,
      [...syntax]
        .map(child =>
          (child instanceof Syntax
            ? Parser.#filterSyntax(child, filter)
            : child))
        .filter(filter == null ? () => true : filter)
        .filter(node => !(node instanceof Syntax) || node.length > 0)
    )
  }
}
