import { z } from 'zod'

/**
 * Passes a value as if by reference to the caller can
 * modify it and the change reflect to the callee.
 *
 * @remarks
 * Although object types are passed around by reference.
 * Like primative values, ECMAScript always passes
 * reference by-value into functions, being a
 * pass-by-value language. This allows
 * a pass-by-reference semantic.
 *
 * @category Core
 */
export type ByRef<T> = [T]

/**
 * Position reference.
 *
 * @category Core
 */
export type Position = ByRef<number>

/**
 * Type to indicate success with no result, such as optional grammar.
 *
 * @category Nodes
 */
export type Empty = typeof Empty
/**
 * The `Empty` symbol denotes a grammar did not match anything, such as optional grammar.
 *
 * @category Nodes
 *
 * @public
 */
export const Empty = Symbol('Empty')

/**
 * Token node with a single value.
 *
 * @category Nodes
 */
export class Token extends String {
  /** The ID of the grammar that created the node. */
  declare readonly id: string

  /**
   * Creates a token.
   *
   * @param id - The ID of the grammar that parsed the token.
   * @param value - The data parsed by the grammar.
   */
  constructor (id: string, value: string) {
    super(value)

    Object.defineProperties(this, { id: { value: id } })
  }
}

/**
 * Syntax node with a child values.
 *
 * @remarks
 * The syntax node is an {@link https://mdn.io/Array | Array} that contain the
 * non-terminal semantic symbols that a grammar matched. Each element
 * of a syntax node may be any other typeof {@link Node}.
 *
 * @category Nodes
 */
export class Syntax extends Array<Node> {
  /** The ID of the grammar that created the node. */
  declare readonly id: string

  /**
   * Creates a syntax node.
   *
   * @param id - The ID of the grammar that parsed the syntax.
   * @param children - The child node in the syntax.
   */
  constructor (id: string, children: Node[]) {
    super(...children.map(child => {
      if (child.id === '' && child instanceof Syntax) {
        return child
      }

      return [child]
    }).flat())

    Object.defineProperties(this, { id: { value: id } })
  }

  /**
   * Queries a node in the syntax tree.
   *
   * @param path - The path to the node to be queried.
   */
  query (path: string): Node | undefined
  /**
   * Queries a node in the syntax tree.
   *
   * @param path - The path to the node to be queried.
   * @param type - The expected type of the node, in this case a Token.
   */
  query (path: string, type: typeof Token): Token | undefined
  /**
   * Queries a node in the syntax tree.
   *
   * @param path - The path to the node to be queried.
   * @param type - The expected type of the node, in this case a Syntax.
   */
  query (path: string, type: typeof Syntax): Syntax | undefined
  query (path: string, type?: NodeType) {
    const parts = path.split('/') as [string, ...string[]]
    if (parts[0] === '') {
      parts.shift()
    }

    let node = this as Node
    for (const part of parts) {
      if (node instanceof Token) {
        // If the current node is a token, and there are more parts,
        // then the path references a non-existent node.
        return undefined
      }

      const next = node.find(child => child.id === part)
      if (next == null) {
        return undefined
      }

      node = next
    }

    return type == null || node instanceof type ? node : undefined
  }
}

/**
 * Syntax tree node.
 *
 * @remarks
 * All syntax tree nodes provide an `id` field to identify the grammar that matched
 * the node, if the ID was provided. A node can be a {@link Syntax} node or
 * {@link Token} node.
 *
 * @category Nodes
 */
export type Node = Token | Syntax

/**
 * Possible node types to query.
 *
 * @category Nodes
 */
type NodeType = typeof Syntax | typeof Token

/**
 * Checks that a value is a syntax tree node.
 *
 * @category Nodes
 */
export function isNode (value: unknown): value is Node {
  return value instanceof Syntax || value instanceof Syntax
}

/**
 * Zod schemas for the nodes.
 *
 * @remarks
 * This acts a namespace for exported Zod schemas. The schemas include;
 * <ul>
 *   <li>`node` for the {@link Node} <em>type</em>,</li>
 *   <li>`token` for the {@link Token} <em>class</em>,</li>
 *   <li>and `syntax` for the {@link Syntax} <em>class</em></li>
 * </ul>
 *
 * @category Nodes
 */
export const zod = {
  /** Verifies any syntax tree node. */
  node: z.custom<Node>(isNode),

  /** Verifies a token node. */
  token: (id?: string | undefined) => (id != null
    ? z.instanceof(Token).refine(value => value.id === id, `Node was not "${id}"`)
    : z.instanceof(Token)),

  /** Verifies a syntax node. */
  syntax: (id?: string | undefined) => (id != null
    ? z.instanceof(Syntax).refine(value => value.id === id, `Node was not "${id}"`)
    : z.instanceof(Syntax))
}

/**
 * A stream position rewind function.
 *
 * @category Core
 */
export type Rewind = () => void
