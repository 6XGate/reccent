# Node _type alias_ {#node}

Syntax tree node. All syntax tree nodes provide an `id` field to identify the grammar that matched
the node, if the ID was provided. A node can be a [Syntax](#syntax) node or [Token](#token) node.

```ts
type Node = Token | Syntax
```

## `Syntax` _class_ {#syntax}

The syntax node is an Array[Array](https://mdn.io/Array) that contain the non-terminal
semantic symbols that a grammar matched. Each element of a syntax node may be
any other typeof [Node](#node).

```ts
class Syntax {
  readonly [index: number]: Node

  readonly find = Array.prototype.find
}
```

### `Syntax()` _constructor_ {#syntax_constructor}

```ts
constructor (id: string, children: Node[])
```

### `Syntax: id` _field_ {#syntax_id}

The ID of the grammar that created the node.

```ts
readonly id: string
```

### `Syntax.prototype[@@iterator]` _method_ {#syntax_prototype_atatiterator}

Allows the children of the Syntax node to be iterated.

```ts
[Symbol.iterator] (): IterableIterator<Node>
```

### `Syntax.prototype.find` _method_ {#syntax_prototype_find}

The a specific node from a Syntax node.

See the MDN page for [Array.prorotype.find](https://mdn.io/Array.prototype.find)
for more information on using this method as it is inherited from Array.

```ts
find<S extends Node> (cb: (item: Node, index: number, nodes: readonly Node[]) => item is S, thisArg?: any): S | undefined
find (cb: (item: Node, index: number, nodes: readonly Node[]) => unknown, thisArg?: any): Node | undefined
```

### `Syntax.prototype.query` _method_ {#syntax_prototype_query}

Queries a node in the syntax tree.

|      name | presence   | description                         |
|----------:|:----------:|-------------------------------------|
|    `path` | _required_ | The path to the node to be queried. |
|    `type` | _optional_ | The expected type of the node.      |

```ts
query (path: string): Node | undefined
query (path: string, type: typeof Token): Token | undefined
query (path: string, type: typeof Syntax): Syntax | undefined
```

## Token _class_ {#token}

## Empty

##
