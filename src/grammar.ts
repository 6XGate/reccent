import { Empty, Syntax, Token } from './basics'
import { getCharacterCodePoint, getCodePointAt, toUnicode } from './utilities'
import type { ByRef, Node, Position, Rewind } from './basics'
import type { Context } from './parser'

/**
 * Abstract grammar graphs.
 *
 * @category Grammar
 */
export type GrammarGraph =
  | [id: 'quantifier', target: Grammar, min: number, max: number]
  | [id: 'exclusion', target: Grammar, exclusion: Grammar]
  | [id: 'optional', target: Grammar]
  | [id: 'reference', reference: () => AnyGrammar]
  | [id: 'alternation', ...choices: Grammar[]]
  | [id: 'concatenation', ...parts: AnyGrammar[]]
  | [id: 'negation', target: Grammar]
  | [id: 'terminals', mode: 'are' | 'not', ...values: Array<string | [string, string]>]
  | [id: 'end']

/**
 * Determines whether the result could indicate `Empty`.
 *
 * @internal
 */
type EmptyValue<Nothing extends Empty | null> =
  Nothing extends Empty
    ? true : Nothing extends null
      ? false : boolean

/**
 * Defined grammar parser.
 *
 * @typeParam Nothing - Possible value types for not matching.
 *
 * @category Grammar
 */
export abstract class Grammar<Nothing extends Empty | null = null> {
  /** The grammmar ID. */
  readonly id: string

  /** Abstract grammar graph. */
  readonly graph: GrammarGraph

  /** Indicates whether the grammar can result in Empty. */
  readonly couldReturnEmpty: EmptyValue<Nothing>

  /**
   * Creates a new grammar.
   *
   * @param tag - The string tag for the grammar, useful for debugging.
   * @param id - The ID of the grammar.
   * @param empty - Indicates whether the grammar can result in Empty.
   * @param graph - The graph for the grammar.
   */
  constructor (tag: string, id: string, empty: EmptyValue<Nothing>, graph: GrammarGraph) {
    Object.defineProperties(this, { [Symbol.toStringTag]: { value: tag } })

    this.id = id
    this.graph = graph
    this.couldReturnEmpty = empty
  }

  /**
   * Parses a stream.
   *
   * @param ctx - The parser context.
   * @param stream - The stream being parsed.
   * @param first - The current, or first, position.
   * @param last - The final, or last, position; usually one after the end of the stream.
   * @returns A node or the Nothing value.
   */
  run (ctx: Context, stream: string, first: Position, last: Position) {
    if (first[0] === last[0]) {
      return null
    }

    const returnTo = first[0]
    const rewind = () => { first[0] = returnTo }
    ctx.lastId = this.id

    return this.parse(ctx, stream, first, last, rewind)
  }

  /**
   * Concrete parsing logic.
   *
   * @param ctx - The parser context.
   * @param stream - The stream being parsed.
   * @param first - The current, or first, position.
   * @param last - The final, or last, position; usually one after the end of the stream.
   * @param rewind - A function to rewind back to the starting position.
   */
  protected abstract parse (
    ctx: Context,
    stream: string,
    first: Position,
    last: Position,
    rewind: Rewind
  ): Node | Nothing
}

/**
 * Any grammar.
 *
 * @category Grammar
 */
export type AnyGrammar = Grammar<Empty | null>

/**
 * Grammar that cannot return an empty result.
 *
 * @category Grammar
 */
export abstract class NonEmptyGrammar extends Grammar {
  /**
   * Creates a new non-empty grammar.
   *
   * @param tag - The string tag for the grammar, useful for debugging.
   * @param id - The ID of the grammar.
   * @param graph - The graph for the grammar.
   */
  constructor (tag: string, id: string, graph: GrammarGraph) {
    super(tag, id, false, graph)
  }

  /**
   * Creates a new grammar indicating this grammar must repeat.
   *
   * @param min - The minimal number of repetitions.
   * @param max - The maximum number of repetitions.
   */
  between (min: number, max: number): NonEmptyGrammar
  /**
   * Creates a new grammar indicating this grammar must repeat.
   *
   * @param id - The ID of the new derived grammar.
   * @param min - The minimal number of repetitions.
   * @param max - The maximum number of repetitions.
   */
  between (id: string, min: number, max: number): NonEmptyGrammar
  between (...args: [string | number, number, number?]) {
    const id = typeof args[0] === 'string' ? args[0] : undefined
    const min = typeof args[0] === 'number' ? args[0] : args[1]
    const max = typeof args[2] === 'number' ? args[2] : args[1]

    return new QuantifierGrammar(this, min, max, id)
  }

  /**
   * Creates a new grammar indicating this grammar must repeat a minimum number of times.
   *
   * @param min - The minimal number of repetitions.
   */
  atLeast (min: number): NonEmptyGrammar
  /**
   * Creates a new grammar indicating this grammar must repeat a minimum number of times.
   *
   * @param id - The ID of the new derived grammar.
   * @param min - The minimal number of repetitions.
   */
  atLeast (id: string, min: number): NonEmptyGrammar
  atLeast (...args: [string | number, number?]) {
    return typeof args[0] === 'string'
      ? this.between(args[0], args[1] as number, Infinity)
      : this.between(args[0], Infinity)
  }

  /**
   * Creates a new grammar indicating this grammar may repeat a maximum number of times.
   *
   * @param max - The maximum number of repetitions.
   */
  atMost (max: number): NonEmptyGrammar
  /**
   * Creates a new grammar indicating this grammar may repeat a maximum number of times.
   *
   * @param id - The ID of the new derived grammar.
   * @param max - The maximum number of repetitions.
   */
  atMost (id: string, max: number): NonEmptyGrammar
  atMost (...args: [string | number, number?]) {
    return typeof args[0] === 'string'
      ? this.between(args[0], 0, args[1] as number)
      : this.between(0, args[0])
  }

  /**
   * Creates a new grammar indicating this grammar may repeat zero or more times.
   *
   * @param id - The ID of the new derived grammar.
   */
  zeroOrMore (id?: string | undefined): NonEmptyGrammar {
    return id != null
      ? this.between(id, 0, Infinity)
      : this.between(0, Infinity)
  }

  /**
   * Creates a new grammar indicating this grammar must repeat one or more times.
   *
   * @param id - The ID of the new derived grammar.
   */
  oneOrMore (id?: string | undefined) {
    return id != null
      ? this.between(id, 1, Infinity)
      : this.between(1, Infinity)
  }

  /**
   * Creates a grammar that indicates this grammar is parsed after confirming the excluded grammar can not.
   *
   * @param exclude - The grammar to exclude.
   */
  butNot (exclude: NonEmptyGrammar): NonEmptyGrammar
  /**
   * Creates a grammar that indicates this grammar is parsed after confirming the excluded grammar can not.
   *
   * @param id - The ID of the new derived grammar.
   * @param exclude - The grammar to exclude.
   */
  butNot (id: string, exclude: NonEmptyGrammar): NonEmptyGrammar
  butNot (...args: [string | Grammar, NonEmptyGrammar?]): NonEmptyGrammar {
    const id = typeof args[0] === 'string' ? args[0] : undefined
    const exclude = args[1] != null ? args[1] : args[0] as Grammar

    return new ExclusionGrammar(this, exclude, id)
  }

  /**
   * Creates a grammar that indicates this grammar may, or may not, parse.
   *
   * @param id - The ID of the new derived grammar.
   */
  maybe (id?: string | undefined) {
    return new OptionalGrammar(this, id)
  }
}

/**
 * Result of `between`, `atLeast`, `atMost`, etc.
 *
 * @internal
 */
class QuantifierGrammar extends NonEmptyGrammar {
  #target: Grammar
  #min: number
  #max: number

  constructor (target: Grammar, min: number, max: number, id: string | undefined) {
    super('Quantifier', id ?? '', ['quantifier', target, min, max])

    this.#target = target
    this.#min = min
    this.#max = max
  }

  protected parse (ctx: Context, stream: string, first: Position, last: Position) {
    const children: Node[] = []
    for (let count = 0; count <= this.#max; ++count) {
      const returnTo = first[0]
      const result = this.#target.run(ctx, stream, first, last)
      if (result == null) {
        first[0] = count >= this.#min ? returnTo : first[0]

        return count >= this.#min ? new Syntax(this.id, children) : null
      }

      children.push(result)
    }

    return new Syntax(this.id, children)
  }
}

/**
 * Result of `butNot`.
 *
 * @internal
 */
class ExclusionGrammar extends NonEmptyGrammar {
  #target: Grammar
  #excluded: Grammar

  constructor (target: Grammar, excluded: Grammar, id: string | undefined) {
    super('Exclusion', id ?? '', ['exclusion', target, excluded])

    this.#target = target
    this.#excluded = excluded
  }

  protected parse (ctx: Context, stream: string, first: Position, last: Position, rewind: Rewind) {
    if (this.#excluded.run(ctx, stream, first, last) == null) {
      rewind()

      return this.#target.run(ctx, stream, first, last)
    }

    return null
  }
}

/**
 * Result of `maybe`.
 *
 * @internal
 */
export class OptionalGrammar extends Grammar<Empty> {
  #target: Grammar

  constructor (target: Grammar, id: string | undefined) {
    super('Optional', id ?? '', true, ['optional', target])

    this.#target = target
  }

  override run (ctx: Context, stream: string, first: Position, last: Position) {
    // Since run can return null on the end of stream, that must be caught here.
    const result = super.run(ctx, stream, first, last)
    if (result == null) {
      return Empty
    }

    return result
  }

  protected parse (ctx: Context, stream: string, first: Position, last: Position, rewind: Rewind) {
    const result = this.#target.run(ctx, stream, first, last)
    if (result == null) {
      rewind()

      return Empty
    }

    return result
  }
}

/**
 * Creates a grammar that proxies to a referenced grammar.
 *
 * @param fn - Function that returns the referenced grammar.
 *
 * @remarks
 * This is used when a grammar tree container recursion into itself directly or indirectly.
 *
 * @category Grammar
 */
export function ref (fn: () => Grammar): NonEmptyGrammar {
  return new GrammarReference(fn)
}

/**
 * Result of `ref`.
 *
 * @internal
 */
class GrammarReference extends NonEmptyGrammar {
  #reference: () => Grammar

  constructor (reference: () => Grammar) {
    super('Reference', '', ['reference', reference])

    this.#reference = reference
  }

  protected parse (ctx: Context, stream: string, first: ByRef<number>, last: ByRef<number>) {
    const target = this.#reference()

    return target.run(ctx, stream, first, last)
  }
}

/** Minimal choice of grammars. */
type Choices = [Grammar, Grammar, ...Grammar[]]

/**
 * Creates a grammar that attempts to parse a choice of other grammars.
 *
 * @param options - The choice grammars.
 *
 * @category Grammar
 */
export function choose (options: Choices): NonEmptyGrammar
/**
 * Creates a grammar that attempts to parse a choice of other grammars.
 *
 * @param id - The ID of the new derived grammar.
 * @param options - The choice grammars.
 *
 * @category Grammar
 */
export function choose (id: string, options: Choices): NonEmptyGrammar
export function choose (...args: [string | Choices, Choices?]) {
  const id = typeof args[0] === 'string' ? args[0] : undefined
  const options = args[1] != null ? args[1] : args[0] as Choices

  return new AlternationGrammar(options, id)
}

/**
 * Result of `choose`.
 *
 * @internal
 */
class AlternationGrammar extends NonEmptyGrammar {
  #choices: Grammar[]

  constructor (choices: Choices, id: string | undefined) {
    super('Alternation', id ?? '', ['alternation', ...choices])

    this.#choices = choices
  }

  protected parse (ctx: Context, stream: string, first: Position, last: Position, rewind: Rewind) {
    for (const choice of this.#choices) {
      rewind()
      const result = choice.run(ctx, stream, first, last)
      if (result != null) {
        return this.id !== ''
          ? new Syntax(this.id, [result])
          : result
      }
    }

    return null
  }
}

/** The minimal list of grammars in a sequence. */
type Parts = [AnyGrammar, AnyGrammar, ...AnyGrammar[]]

/**
 * Creates a sequence that parses a contiguous series of grammars.
 *
 * @param parts - Grammar parts of the sequence.
 *
 * @category Grammar
 */
export function sequence (parts: Parts): NonEmptyGrammar
/**
 * Creates a sequence that parses a contiguous series of grammars.
 *
 * @param id - The ID of the new derived grammar.
 * @param parts - Grammar parts of the sequence.
 *
 * @category Grammar
 */
export function sequence (id: string, parts: Parts): NonEmptyGrammar
export function sequence (...args: [string | Parts, Parts?]) {
  const id = typeof args[0] === 'string' ? args[0] : undefined
  const parts = args[1] != null ? args[1] : args[0] as Parts

  return new ConcatenationGrammar(parts, id)
}

/**
 * Result of `sequence`.
 *
 * @internal
 */
class ConcatenationGrammar extends NonEmptyGrammar {
  #parts: AnyGrammar[]

  constructor (parts: Parts, id: string | undefined) {
    super('Concatenation', id ?? '', ['concatenation', ...parts])

    this.#parts = parts
  }

  protected parse (ctx: Context, stream: string, first: Position, last: Position) {
    const children: Node[] = []
    for (const part of this.#parts) {
      const result = part.run(ctx, stream, first, last)
      switch (result) {
        case null:
          return null
        case Empty:
          break
        default:
          children.push(result)
          break
      }
    }

    return new Syntax(this.id, children)
  }
}

/**
 * Creates a grammar that will disallow parsing of a target grammar.
 *
 * @param target - The grammar to disallow.
 *
 * @category Grammar
 */
export function not (target: Grammar): Grammar<Empty | null> {
  return new NegationGrammar(target)
}

/**
 * Result of `not`.
 *
 * @internal
 */
class NegationGrammar extends Grammar<Empty | null> {
  #target: Grammar

  constructor (target: Grammar) {
    super('Negation', '', true, ['negation', target])

    this.#target = target
  }

  protected parse (ctx: Context, stream: string, first: Position, last: Position, rewind: Rewind) {
    if (this.#target.run(ctx, stream, first, last) != null) {
      return null
    }

    rewind()

    return Empty
  }
}

/**
 * Creates a grammar that matches the end of the stream.
 *
 * @category Grammar
 */
export function end (): EndOfStreamGrammar {
  return new EndOfStreamGrammar()
}

/**
 * Result of `end`.
 *
 * @internal
 */
class EndOfStreamGrammar extends Grammar<Empty | null> {
  constructor () {
    super('End', 'end of stream', true, ['end'])
  }

  override run (_ctx: Context, _stream: string, first: Position, last: Position) {
    if (first[0] === last[0]) {
      return Empty
    }

    return null
  }

  protected parse (): Empty {
    // Not used
    return Empty
  }
}

/**
 * Creates a grammar that converts the parsed grammar into a single token.
 *
 * @param grammar - The grammar to convert.
 *
 * @category Grammar
 */
export function token (grammar: Grammar): NonEmptyGrammar
/**
 * Creates a grammar that converts the parsed grammar into a single token.
 *
 * @param id - The ID of the new derived grammar.
 * @param grammar - The grammar to convert.
 *
 * @category Grammar
 */
export function token (id: string, grammar: Grammar): NonEmptyGrammar
export function token (...args: [string | Grammar, Grammar?]) {
  const id = typeof args[0] === 'string' ? args[0] : undefined
  const grammar = args[1] != null ? args[1] : args[0] as Grammar

  return new TokenGrammar(grammar, id)
}

/**
 * Result of `token`.
 *
 * @internal
 */
class TokenGrammar extends NonEmptyGrammar {
  #grammar: Grammar

  constructor (grammar: Grammar, id: string | undefined) {
    super('Token', id ?? '', grammar.graph)

    this.#grammar = grammar
  }

  protected parse (ctx: Context, stream: string, first: Position, last: Position) {
    const startsAt = first[0]
    const result = this.#grammar.run(ctx, stream, first, last)
    if (result == null) {
      return result
    }

    return new Token(this.id, stream.slice(startsAt, first[0]))
  }
}

/**
 * Creates a grammar that matches an exact stream.
 *
 * @param value - The literal string the match.
 *
 * @category Grammar
 */
export function lit (value: string): NonEmptyGrammar
/**
 * Creates a grammar that matches an exact stream.
 *
 * @param id - The ID of the new derived grammar.
 * @param value - The literal string the match.
 *
 * @category Grammar
 */
// eslint-disable-next-line @typescript-eslint/unified-signatures -- Needed for proper documentation.
export function lit (id: string, value: string): NonEmptyGrammar
export function lit (...args: [string, string?]) {
  const id = args[0]
  const value = args[1] != null ? args[1] : args[0]

  const points = toUnicode(value)
  if (points.length === 0) {
    throw new SyntaxError('A literal must be one or more characters in length')
  }

  return points.length === 1
    ? new LiteralCharacterGrammar(value, points[0] as number, id)
    : new LiteralStringGrammar(value, points, id)
}

class LiteralStringGrammar extends NonEmptyGrammar {
  #value: string
  #cp: Uint32Array

  constructor (value: string, cp: Uint32Array, id: string) {
    super('Terminals', id, ['terminals', 'are', value])

    this.#value = value
    this.#cp = cp
  }

  protected parse (_ctx: Context, stream: string, first: Position, last: Position) {
    for (const cp of this.#cp) {
      if (first[0] === last[0]) {
        return null
      }

      const current = getCodePointAt(stream, first)
      if (current !== cp) {
        return null
      }

      ++first[0]
    }

    return new Token(this.id, this.#value)
  }
}

/**
 * Creates a grammar that matches a single character.
 *
 * @param value - The character to match.
 *
 * @remarks
 * This can be used as an optimized version of in-character-set and literal for one character.
 *
 * @category Grammar
 */
export function char (value: string): NonEmptyGrammar
/**
 * Creates a grammar that matches a single character.
 *
 * @param id - The ID of the new derived grammar.
 * @param value - The character to match.
 *
 * @remarks
 * This can be used as an optimized version of in-character-set and literal for one character.
 *
 * @category Grammar
 */
// eslint-disable-next-line @typescript-eslint/unified-signatures -- Needed for proper documentation.
export function char (id: string, value: string): NonEmptyGrammar
export function char (...args: [string, string?]) {
  const id = args[0]
  const value = args[1] != null ? args[1] : args[0]
  const cp = getCharacterCodePoint(value)

  return new LiteralCharacterGrammar(value, cp, id)
}

/**
 * Result of `char`.
 *
 * @internal
 */
class LiteralCharacterGrammar extends NonEmptyGrammar {
  #value: string
  #cp: number

  constructor (value: string, cp: number, id: string) {
    super('Terminals', id, ['terminals', 'are', value])

    this.#value = value
    this.#cp = cp
  }

  protected parse (_ctx: Context, stream: string, first: Position) {
    const current = getCodePointAt(stream, first)
    if (current === this.#cp) {
      ++first[0]

      return new Token(this.id, this.#value)
    }

    return null
  }
}

/**
 * Creates a grammar that matches any single character that is not the specified.
 *
 * @param value - The character to exclude.
 *
 * @remarks
 * This can be used as an optimized version of not in-character-set and not literal for one character.
 *
 * @category Grammar
 */
export function notChar (value: string): NonEmptyGrammar
/**
 * Creates a grammar that matches any single character that is not the specified.
 *
 * @param id - The ID of the new derived grammar.
 * @param value - The character to exclude.
 *
 * @remarks
 * This can be used as an optimized version of not-in-character-set and not literal for one character.
 *
 * @category Grammar
 */
// eslint-disable-next-line @typescript-eslint/unified-signatures -- Needed for proper documentation.
export function notChar (id: string, value: string): NonEmptyGrammar
export function notChar (...args: [string, string?]) {
  const id = args[0]
  const cp = getCharacterCodePoint(args[1] != null ? args[1] : args[0])

  return new NotCharacterGrammar(cp, id)
}

/**
 * Result of `notChar`.
 *
 * @internal
 */
class NotCharacterGrammar extends NonEmptyGrammar {
  #cp: number

  constructor (cp: number, id: string) {
    super('Terminals', `!${id}`, ['terminals', 'not', String.fromCodePoint(cp)])

    this.#cp = cp
  }

  protected parse (_ctx: Context, stream: string, first: Position) {
    const current = getCodePointAt(stream, first)
    if (current !== this.#cp) {
      ++first[0]

      return new Token(this.id, String.fromCodePoint(current))
    }

    return null
  }
}

/**
 * Character set specifiers.
 *
 * @category Grammar
 */
export type CharSetSpecifier =
  | string
  | [string, string]

/**
 * Character set specifier code point ranges.
 *
 * @category Grammar
 */
type CharSetRange =
  | number
  | [number, number]

/**
 * Base for other character set grammars.
 *
 * @internal
 */
abstract class BaseCharSetGrammar extends NonEmptyGrammar {
  readonly specifiers: CharSetSpecifier[]
  readonly ranges: CharSetRange[]

  constructor (specifiers: CharSetSpecifier[], graph: GrammarGraph, id: string) {
    super('Terminals', id, graph)

    this.specifiers = specifiers
    this.ranges = BaseCharSetGrammar.#convertSpecifiers(specifiers)
  }

  static #convertSpecifiers (specifiers: CharSetSpecifier[]) {
    const ranges: CharSetRange[] = []
    for (const specifier of specifiers) {
      if (Array.isArray(specifier)) {
        ranges.push([
          getCharacterCodePoint(specifier[0]),
          getCharacterCodePoint(specifier[1])
        ])
      } else {
        ranges.push(...toUnicode(specifier))
      }
    }

    return ranges
  }
}

/**
 * Creates a grammar that parsers a character in a specified set.
 *
 * @param specifiers - Character set specifiers.
 *
 * @category Grammar
 */
export function charSet (specifiers: CharSetSpecifier[]): CharSetGrammar
/**
 * Creates a grammar that parsers a character in a specified set.
 *
 * @param id - The ID of the new derived grammar.
 * @param specifiers - Character set specifiers.
 *
 * @category Grammar
 */
export function charSet (id: string, specifiers: CharSetSpecifier[]): CharSetGrammar
export function charSet (...args: [string | CharSetSpecifier[], CharSetSpecifier[]?]) {
  const id = typeof args[0] === 'string' ? args[0] : undefined
  const specifiers = Array.isArray(args[0]) ? args[0] : args[1] as CharSetSpecifier[]

  return new CharSetGrammar(specifiers, id)
}

/**
 * Result of `charSet`.
 *
 * @internal
 */
class CharSetGrammar extends BaseCharSetGrammar {
  constructor (specifiers: CharSetSpecifier[], id: string | undefined) {
    super(specifiers, ['terminals', 'are', ...specifiers], id ?? '')
  }

  protected parse (_ctx: Context, stream: string, first: Position) {
    const current = getCodePointAt(stream, first)
    for (const range of this.ranges) {
      if (
        Array.isArray(range)
          ? (range[0] <= current && current <= range[1])
          : current === range
      ) {
        ++first[0]

        return new Token(this.id, String.fromCodePoint(current))
      }
    }

    return null
  }
}

/**
 * Creates a grammar that parses a character not in a specified set.
 *
 * @param specifiers - Character set specifies.
 *
 * @category Grammar
 */
export function notCharSet (specifiers: CharSetSpecifier[]): NotCharSetGrammar
/**
 * Creates a grammar that parses a character not in a specified set.
 *
 * @param id - The ID of the new derived grammar.
 * @param specifiers - Character set specifies.
 *
 * @category Grammar
 */
export function notCharSet (id: string, specifiers: CharSetSpecifier[]): NotCharSetGrammar
export function notCharSet (...args: [string | CharSetSpecifier[], CharSetSpecifier[]?]) {
  const id = typeof args[0] === 'string' ? args[0] : undefined
  const specifiers = Array.isArray(args[0]) ? args[0] : args[1] as CharSetSpecifier[]

  return new NotCharSetGrammar(specifiers, id)
}

/**
 * Result of `notCharSet`.
 *
 * @internal
 */
class NotCharSetGrammar extends BaseCharSetGrammar {
  constructor (specifiers: CharSetSpecifier[], id: string | undefined) {
    super(specifiers, ['terminals', 'not', ...specifiers], id ?? '')
  }

  protected parse (_ctx: Context, stream: string, first: Position) {
    const current = getCodePointAt(stream, first)
    for (const range of this.ranges) {
      if (
        Array.isArray(range)
          ? (range[0] <= current && current <= range[1])
          : current === range
      ) {
        ++first[0]

        return null
      }
    }

    return new Token(this.id, String.fromCodePoint(current))
  }
}
