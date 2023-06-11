# Types of Grammar

There are four basic types of grammar supported by **Reccent**. Their purpose is the ensure that
the grammars are well formed and will not result in infinite loops as best as possible. Some
also carry additional data for reused with other grammar such as character set grammars.

## Basic strcture of a grammar.

A [Grammar](/reference/grammar) allows a [Parser](/reference/parser) to parse a stream of
characters based on some form of designed grammar. And to do this in a useful way, it
must be able to identify what part of the grammar was matched for any given part of
the data. For that, all **Grammars** will at a minimum have an `id` field and a
`run` method.

**Grammars** will also contain an Abstract Grammar Graph in `graph`. This will identify the
operation of the grammar and what other inputs or data are involved in that grammar. This
data can be used to create a visiual representation of the grammar in some future
version or by the user.

One other key field in a **Grammar** is `couldReturnEmpty` which is used to indicate if a grammar
can return [Empty](/reference/nodes#empty) rather than failing if it doesn't match anything.

## Possibly empty Grammars

Any grammar that can return **Empty** is called possibly empty grammar or empty grammars. These
grammars could not return a result, but without failing. Examples include negation grammars
optional grammars, and end-of-stream marking grammars.

In this documentation, we will reference to these simply as "empty grammars". An example of an
_empty grammar_ would be a optional part of a grammar, such as the following in EBNF.

```EBNF
maybeexternalid = ExternalID?
```

Empty grammars are usually limited in where they may be used, such as not being the root of a
grammar tree, and don't provide any additional operations for creating other grammars.
Empty grammars are usually accepted as part of another non-empty grammar that
can handle empty grammars, such as sequences.

## Definately non-empty grammars

Any grammar that will return a result or fail with `null` and never return `Empty` is called a
definately non-empty grammar. Examples of these will be terminal grammars like tokens,
alterations, and sequences.

In this documentation, we will reference to these simply as "non-empty grammars". An example of
a _non-empty grammar_ would be a simple sequence, such as the following in EBNF.

```EBNF
basicdoctype = "<!DOCTYPE" S Name ">"
```

Most non-empty will have additional methods for creating other kinds of grammar based on commonly
used operations.

## Terminal grammars

Terminal grammars, also know as token gramars or expression, are class of non-empty grammars that
actually perform the core parsing of the sream. These grammars would include literal tokens
and token charater sets. Terminal grammars can also be formed from other non-empty
grammars that will then be "squared" into a single token.

In this documentation, we will reference to these simply as "terminal grammars". An example of a
terminal grammar in EBNF would be as follows which matches the string literal `"<!DOCTYPE"`.

```EBNF
doctypeopener = "<!DOCTYPE"
```

Read up on [Terminal Grammar](/guide/grammar/terminals).

## Character set grammars

Character set grammars are a special class of terminal grammars that will have a `specifiers` field
that is a listing of characters and character ranges that the grammar will match or refuse
to match. This will allow creating new character set grammars by reusing those
specifiers.

A simple expression of a character set can be seen regular expressions as follows which matches any
latin1 alpha-numeric character.

```RegExp
/[A-Za-z0-9]/
```

Read up on [Character sets](/guide/grammar/terminals#character-sets).

## Note on empty/non-empty

To ensure well formed grammars, certain empty and non-empty grammars should only be mixed in
certain ways. Typically, empty grammars that contain other grammars will usually only
contain non-empty grammars directly. Also certain non-empty grammars can
only directly contain other non-empty grammars. This will be
discussed for each specific type of grammar later on.
