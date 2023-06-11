import { isNode } from './basics'
import type { Node, Position } from './basics'
import type { AnyGrammar } from './grammar'
import type { Context } from './parser'

/**
 * Creates a grammar proxy that will call an event listener if the parser succeeds.
 *
 * @param grammar Grammar that must successfully be parsed.
 * @param fn The callback function to call if the grammar succeeds.
 */
export function on<G extends AnyGrammar> (grammar: G, fn: (node: Node) => unknown): G {
  function run (ctx: Context, stream: string, first: Position, last: Position) {
    const result = grammar.run(ctx, stream, first, last)
    if (result == null) {
      return null
    }

    if (!isNode(result)) {
      return result
    }

    fn(result)

    return result
  }

  return Object.create(grammar, {
    run: { configurable: true, writable: true, value: run }
  }) as G
}

/**
 * Creates a grammar proxy that will call an event listener if the parser fails.
 *
 * @param grammar Grammar that must failed to be parsed.
 * @param fn The callback function to call if the grammar fails.
 */
export function failed<G extends AnyGrammar> (grammar: G, fn: (id: string, at: number) => unknown): G {
  function run (ctx: Context, stream: string, first: Position, last: Position) {
    const result = grammar.run(ctx, stream, first, last)
    if (result != null) {
      return result
    }

    fn(grammar.id, first[0])

    return result
  }

  return Object.create(grammar, {
    run: { configurable: true, writable: true, value: run }
  }) as G
}
