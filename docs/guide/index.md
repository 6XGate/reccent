---
layout: doc
---

# What is Reccent?

_**Reccent**_, product as _wreck-cent_, is a [recursive descent parser](https://w.wiki/38Rc)
generator. It creates parsing grammar that allows a stream of characters, a string, to be
parsed into a tree of syntax and tokens. At the heart of **Reccent** are a the concepts
of [Grammar](/reference/grammar) and the [Parser](/reference/parser).

You can create any kind of parser that can be expressed as [EBNF](https://w.wiki/jwK),
and by extension [BNF](https://w.wiki/5ZUC). You can also handle the some of the
kinds of tasks as you would with [Regular Expressions](https://w.wiki/3jKQ).

## Features and Limits

**Reccent** is pretty fully features for such a simple library. It allows you to create
almost any kind of [context-free grammar](https://w.wiki/6jCG) for things such as
[domain specific languages](https://w.wiki/6jCH), standardized languages,
and more.

- **Complete EBNF and BNF expression**

  Any grammar that can be expressed with **EBNF** and **BNF** can be expressed with **Reccent**.
  This would allow easy creation of parser for standardized and published languages. You can
  also design your language using either syntax first then use that as a reference for
  create the grammar in **Reccent**

- **Great Regular Expression coverage**

  Almost any operation that can be expressed in **Regular Expression** can be express in
  **Reccent**. The limits of this are mainly a lack of _character class support_,
  _anchors_, _capture groups_, _lookahead_, and _subsitions_. It should be
  noted that these features of **Regular Expression** aren't needed in
  a grammar parser or are handled in other ways.

- **Full typed**

  Since **Reccent** is written in TypeScript, with very strict build and lint settings, it is
  completely typed and fully compliant with its typing. It also uses [Zod](https://zod.dev/)
  for some of its validation.

- **Inline event support**

  When writting grammars, handlers for specific nodes can be attached to them, this allows
  the handling grammar without reading or querying the syntax tree.

- **Queryable**

  Since the syntax trees produced by a parser can be complex, but wholey deterministic, **Reccent**
  provides a simple query method to find nodes by thier IDs as a path. This can be used when
  parsing a partial payload or using only a portion of a grammar.

## Performance

**Reccent** will have the same performance as any other recursive descent parser in big O notation,
but with the added overhead of JavaScript/ECMAScript. **Reccent** also utilitizes the same object
for terminal and nonterminal parts of the grammar, basically the syntax and token parts. This
means that there is some overhead with how terminal parts are handled as a syntax tree is
still created by **Reccent** before it is squashed into a single terminal or token.

It should be generally faster than parsers built on large switch statement structures but likely
slower than those built on some form of proper [finite state machine](https://w.wiki/5v8) in
utilizing state tables in the same runtime environment.

## About the Syntax Tree

While many languages can be parsed into an [Abstract Syntax Tree](https://w.wiki/6jCi) (AST), that
feature is not directly handled by **Reccent** since that requies knowledge of the language being
parsed beforehand. Instead, **Reccent** provides a [Basic Syntax Tree](/reference/nodes) (BST)
of the syntax and tokens parsed by the grammer.

Using the inline event support, an AST can be created by someone using **Recent**. It is possible
to just step through the BST to do this as well.
