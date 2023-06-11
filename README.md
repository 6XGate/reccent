# Reccent

Pronounced like _wreck_-_scent_, is a recursive descent parser generator written in JavaScript. It
allows you to define a parsable grammar using methods that mimic the common operations
of EBNF and then some.

## Installation

Since _Reccent_ is a JavaScript and ECMAScript library, it can be installed via your favorite
package manager such as _npm_, _yarn_, and _pnpm_. It comes in a _CommonJS_ and
_ECMAScript Module_ flavors with _TypeScript_ typings included.

It is recommended to use _Reccent_ with _TypeScript_ to ensure grammars are well-formed,
but it is not necessary.

## Basic data and types

This library uses grammar objects and returns a syntax tree of nodes.

### Nodes

The `Node` type is a simple alias for two types of nodes.

- `Syntax` nodes which derive from `Array<Node>`, thus
  is a listing of child nodes found by the grammar.
- `Token` nodes which are matched characters and strings,
  also known as terminals. These are derived from
  `String`.

All nodes have an `id` property which identify the grammar that matched
them. If that property is an empty string, `""`, then the grammar
had no ID specified. Such nodes will be flattened as far up the
tree as possible.

### Grammars

Grammar are used to parse data and return syntax nodes. All grammars
at minimum have an `id`, `graph`, and `run` method, Four
common types of grammars exist in this library.

- `Grammar<Empty>` is a grammar that return `Empty` rather than
  failing if it cannot match anything.
- `Grammar<null>` and `NonEmptyGrammar` are grammars that can
  fails with `null` if it cannot match anything.
- `Grammar<Empty|null>` and `AnyGrammar` are grammars that can
  fail with `null` or return `Empty` if it cannot match
  anything.
- `CharSetGrammar` and `NotCharSetGrammar` are grammars derived
  from `NonEmptyGrammar` that also have a listing of what
  characters and range of characters they match in
  `specifiers`.

`NonEmptyGrammar` derives from `Grammar<null>` but is not the same. And
`AnyGrammar` derives from `Grammar<Empty|null>` but is not the same.

## Writing grammars

Grammars are written using the methods exposed in `grammar`. They generally have a 1:1 relation
with EBNF operations. Some functionality byond EBNF is provided that can allow full
expression of Regular Expressions as well. Provided is a basic definition
of the functions and methods that provide that functionality.

### Quantifiers

For `NonEmptyGrammar` the following methods are available.

- `grammar.between([id: string], min: number, max: number): NonEmptyGrammar`
  > Matches the grammar between a minimum and maximum number of times.
  > Like RegExp "`{x,y}`" quantifier.
- `grammar.atLeast([id: string], min: number): NonEmptyGrammar`
  > Matches the grammar a minimum number of times.
  > Like RegExp "`{3,}`" quantifier.
- `grammar.atMost([id: string], max: number): NonEmptyGrammar`
  > Matches the grammar a maximum number of times.
  > Like RegExp "`{0,3}`" quantifier.
- `grammar.oneOrMore([id: string]): NonEmptyGrammar`
  > Matches the grammar at least one time, or more.
  > Like EBNF and RegExp "`+`" quantifier.
- `grammar.zeroOrMore([id: string]): NonEmptyGrammar`
  > Matches the grammar zero or more times.
  > Like EBNF and RegExp "`*`" quantifier.
- `grammar.maybe([id: string]): NonEmptyGrammar`
  > Matches the grammar zero or one times, to say optionally.
  > Like EBNF ane RegExp "`?`" quantifier.

### Exclusion

For `NonEmptyGrammar` the following methods are available.

- `grammar.butNot(other: Grammar)`
  > Matches the grammar, but not if the other matches.
  > Like EBNF "`-`" operator.

### Choices and Sequences

- `choose([id: string], ...choices: [])`
  > Matches any one of the choices, known as alternation.
  > Like EBNF and RegExp "`|`" operator.
- `sequence([id: string], ...parts: Grammar[])`
  > Matches a series of parts, known as concatenation. > Like EBNF "`,`"
  > operator and just a normal stream of RegExp parts.

### Data

Matching data in EBNF is called _terminals_, this is the point
where actual characters are matches to something.

- `lit()`
- `char()`
- `notChar()`
- `charSet()`
- `notCharSet()`

# Utilities

- `ref()`
