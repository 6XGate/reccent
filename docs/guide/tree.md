# Nodes and the Basic Syntax Tree

Since _Reccent_ does not understand the data it parses, only that it is parsing data, it does not
provided an _Abstract Syntax Tree_ of any data it parses. That is the in purview of the user
or teams using _Reccent_ to create such a tree from its results. Rather, _Reccent_
produces a _Basic Syntax Tree_ or _BST_. This tree is just the nodes or symbols
matched by a _Reccent_ defined grammar.

There are two times of nodes in the _Reccent_ _BST_. Both nodes types posses an `id` field,
but differ in their structure. Those nodes are _syntax_, or non-terminal, nodes; and
_token_, or terminal, nodes. Grammars may also return a special `Empty` symbol
to indicate they didn't fail, but didn't match anything, but that will
never appear in the tree.

A [`Node`](/reference/nodes#node) is defined defined as a simple union of the two node types.

```ts
type Node = Token | Syntax
```

## Syntax

A syntax node is used to denote a part of the tree made up of a non-terminal symbols or set of
semantic nodes. In reality, [`Syntax`](/reference/nodes#syntax) extends
[`Array`](https://mdn.io/Array), but only exposes the
find and iterator methods.

This means syntax notes are read like arrays and have a `length`.

```ts
const json = parser.parse(payload)
if (!json.succeeded)) {
  return
}

if (json.bst instanceof Syntax) {
  for (let i = 0; i !== json.bst.legnth; ++i) {
    switch (json.bst[i].id) {
      case 'JsonObject':
        convertObject(json.bst[i])
        break
      case 'JsonArray':
        convertArray(json.bst[i])
        break
      default:
        convertPrimative(json.bst[i])
        break
    }
  }
} else {
  // Parse terminal
}
```

## Token

A token node is used to denote a part of the tree made up of terminal symbols or
token leaves. In reality, Token extends `String`, and therefore seems as though
it is a simple string representation of the matching grammar.

```ts
const json = parser.parse(payload)
if (!json.succeeded)) {
  return
}

if (json.bst instanceof Token) {
  switch (json.bst.id) {
    case 'BooleanTrue':
      pushTrue()
      break
    case 'BooleanFalse':
      pushFalse()
      break
    case 'Number':
      parseNumber(json.bst)
      break
    case 'String':
      unquoteString(json.bst)
      break
    default:
      throw Error('unknown token')
  }
} else {
  // Parse non-terminal
}
```

## Empty

The `Empty` symbol is used in place of a `Node` to denote that the grammar did not match anything
semantically, but did not fail. This usually will not be found in the syntax tree, but is
returned from parts of the grammar for optional symbols or special-case symbols.

## Querying

You can query the nodes of the syntax tree with the [query](/reference/utilities#query) function.
It allows you to use a slash separated path of names and number of find nodes in the
tree, or returns `undefined` if they do not exist.

```ts
const innerObj = query('JsonObject/JsonObject', json.bst[0])
if (innerObj != null && innerObj instanceof Syntax) {
  // do work on inner object.
}
```
