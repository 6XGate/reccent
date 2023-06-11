# Nodes

There are two times of nodes in the _Reccent_ _Basic Syntax Tree_, or _BST_. Both nodes types
posses an `id` field, but differ in their structure. There is also a special "node" symbol
with no ID but a special meaning. `Empty` is used to denote a grammar that returned an
empty result.

`Node` is defined defined as a simple union of the two node types.

```ts
type Node = Token | Syntax
```

## Syntax

A syntax node is used to denote a part of the tree made up of a non-terminal symbol or set of
semantic nodes. In reality, Syntax extends Array, but only exposes the find and iterator
methods.

By this means, reading 

```ts
class Syntax {
  readonly id: string

  constructor (id: string, children: Node[])

  readonly [index: number]: Node

  readonly [Symbol.iterator]: IterableIterator<Node>
  readonly find = Array.prototype.find
}
```

## Token

## Empty
