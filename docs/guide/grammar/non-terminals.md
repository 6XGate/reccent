# What is a Non-Terminal Grammar?

Non-terminal grammars parse a set of token that form a sentactic meaning to the grammar. This is
properly known as the [non-terminal symbols](https://w.wiki/6jDi#Nonterminal_symbols) of a
[formal grammar](https://w.wiki/6jDh). In **Reccent**, non-terminal grammars that
would represent a token can be squared into a terminal grammar with
[token](/reference/grammar#token) API.

Some non-terminal grammars are _non-empty grammar_, but a few are _empty grammar_.

## Alterations, or Choices

Alterations, also know as choices, are grammars that can match one of its choice grammars. They are
created with the [choose](/reference/grammar#choose).

```ts
const contenttype = lx.choose('contenttype', [
  lx.lit('ID'),
  lx.lit('IDREF'),
  lx.lit('IDREFS'),
  lx.lit('ENTITY'),
  lx.lit('ENTITIES'),
  lx.lit('NMTOKEN'),
  lx.lit('NMTOKENS')
])

```

## Concatinations, or Sequences

Concatinations, also known as sequences, are grammars that can match a contiguous sequnce of
grammars. Sequences are one of the few grammars that can take _empty grammars_ such as
_optional_ and _negation_. They are created with the
[sequence](/reference/grammar#sequence) function.

```ts
const doctypebody = lx.sequence([
  Space,
  Name,
  lx.maybe(lx.sequence([Space, ExternalID])),
  lx.maybe(Space),
  lx.maybe(
    lx.sequence([
      lx.lit('['),
      intSubset,
      lx.lit(']'),
      lx.maybe(Space),
    ])
  )
])
```

## Operations

Operation are only available to _non-empty grammars_. They allow the use of quantifiers, marking a
grammar as optional, or negating another grammar in the same context.

### Quantifiers

Quantifiers allow specifying that a grammar can or should be repeated a set number of times.

- [**between**](/reference/grammar#nonemptygrammar-between) Indicates that the grammar should be repeated a minimum and maximum number of times
  akin to the **Regular Express** "`{n,m}`" quantifier operator.
  ```ts
  const llcname = name.between(2, 3)
  ```
- **atLeast** Indicates that the grammar should be repeated at least a minimum number of times akin
  to the **Regular Express** "`{n,}`" quantifier operator.
  ```ts
  const personname = name.atLeast(2)
  ```
- **atMost** Indicates that the grammar should be repeated at most a maximum number of times akin
  to the **Regular Express** "`{0,m}`" quantifier operator.
  ```ts
  const csuits = name.atMost(4)
  ```
- **zeroOrMore** Indicates that the grammar can be repeated any number of times or not at all akin
  to the **EBNF** and **Regular Express** "`*`" quantifier operator.
  ```ts
  const intSubset = lx.choose([markupdecl, DeclSep]).zeroOrMore()
  ```
- **oneOrMore** Indicates that the grammar must be present but can repeat any number of times akin
  akin to the **EBNF** and **Regular Express** "`+`" quantifier operator.
  ```ts
  const Space = lx.charSet([kTab, kLineFeed, kCarriageReturn, kSpace]).oneOrMore()
  ```

### Optional

- **maybe** Indicates that the grammar is optional, so can be match zero or one times if it was an
  quantifier. This is akin to the **EBNF** and **Regular Express** "`?`" operator.
  ```ts
  const PIBody = lx.sequence([Space, PIPayload.zeroOrMore()]).maybe()
  ```

### Negation

- **butNot** Indicates that another grammar must not match before this grammar can be matched. This
  is akin to the **EBNF** "`-`" operator.
  ```ts
  const PITarget = Name.butNot(lx.sequence([lx.charSet(['Xx']), lx.charSet(['Mm']), lx.charSet(['Ll'])]))
  ```
