# What is a Terminal Grammar?

Though discussed in [Types of Grammar](/guide/grammar/types#terminal-grammars), more precisely
terminal grammars parse the tokens of a grammar. This is more properly known as the
[terminal symbols](https://w.wiki/6jDi#Terminal_symbols) of a
[formal grammar](https://w.wiki/6jDh). In **Reccent**,
non-terminal grammars that would represent a token
can be squared into a terminal grammar with
[token](/reference/grammar#token) API.

All terminal grammars are _non-empty grammar_.

## Tokens

Tokens are any part of the grammar that results in a terminal symbol, or token. A simple string
a very finite or simple semtanic meaning. While tokens are create with non-terminal grammars,
terminal grammars can be squared into tokens. Pre-existing terminal grammars are literals,
character sets, and single characters.

## Literals

Literal grammars will match the exact string it is provided. They are created with the
[lit](/reference/grammar#lit) function.

```ts
const doctypeopen = lx.lit('<!DOCTYPE')
```

## Character sets

Character sets grammars will, or will not, match a set of characters, hence the name, or a range of
characters. They are create using the [charSet](/reference/grammar#charset) and
[notCharSet](/reference/grammar#notcharset) functions.

```ts
const NameStartChar = lx.charSet(``, [
  ':_', // ":" | "_"
  ['A', 'Z'], // A-Z
  ['a', 'z'] // a-z
])
```

## Characters

Character grammars will match, or not match, a single character provided. When matching, this can
be an optimized form of literals or character sets for a single character. When not matching,
this can act as an optimized version of only a character set. They are created using the
[char](/reference/grammar#char) and [notChar](/reference/grammar#notchar) functions.

```ts
const doctypeclose = lx.char('>')
```

## "Squashed" terminals

Squashing a non-terminal grammar into a token with the `token` API is simple. But the grammar must
eventually end with some form a real terminal grammar.

```ts
import * as lx from 'reccent'
// Real terminal grammar using a char-set.
const NameStartChar = lx.charSet('NameStartChar', [
  ':_', // ":" | "_"
  ['A', 'Z'], // A-Z
  ['a', 'z'] // a-z
])
// Real terminal grammar using a char-set.
const NameChar = lx.charSet('NameChar', [
  ...NameStartChar.specifiers,
  '-.', // "-" | "."
  ['0', '9'] // 0-9
])
// Non-terminal grammar using sequence and zeroOrMore.
const NameSeq = lx.sequence([NameStartChar, NameChar.zeroOrMore()])
// "Squashed" terminal grammar using token.
const Name = lx.token('Name', NameSeq)
```
