# Grammar API

## `GrammarGraph` _type_ {#grammargraph}

```ts
type GrammarGraph = [id: string, ...args: any[]]
```

## `Grammar` _class_ {#grammar}

```ts
class Grammar<Nothing extends Empty | null = null>
```

### `Grammar()` _constructor_ {#grammar_constructor}

```ts
constructor (tag: string, id: string, empty: boolean, graph: GrammarGraph)
```

### `Grammar: id` _field_ {#grammar_id}

```ts
readonly id: string
```

### `Grammar: graph` _field_ {#grammar_graph}

```ts
readonly graph: GrammarGraph
```

### `Grammar: couldReturnEmpty` _field_ {#grammar_couldReturnEmpty}

```ts
readonly couldReturnEmpty: boolean
```

### `Grammar.prototype.run` _method_ {#grammar_prototype_run}

```ts
run (ctx: Context, stream: string, first: Position, last: Position)
```

### `Grammar.prototype.parse` _method_ {#grammar_prototype_parse}

```ts
protected abstract parse (
  ctx: Context,
  stream: string,
  first: Position,
  last: Position,
  rewind: Rewind
): Node | Nothing
```


## `AnyGrammar` _type alias_ {#anygrammar}

```ts
type AnyGrammar = Grammar<Empty | null>
```

## `NonOptionalGrammar` _class_ {#nonoptionalgrammar}

```ts
class NonEmptyGrammar extends Grammar<null>
```

### `NonEmptyGrammar()` _constructor_ {#nonemptygrammar_constructor}

```ts
constructor (tag: string, id: string, graph: GrammarGraph)
```

### `NonEmptyGrammar.prototype.between` _method_ {#nonemptygrammar_prototype_between}

```ts
between (min: number, max: number): NonEmptyGrammar
between (id: string, min: number, max: number): NonEmptyGrammar
```

### `NonEmptyGrammar.prototype.atLeast` _method_ {#nonemptygrammar_prototype_atLeast}

```ts
atLeast (min: number): NonEmptyGrammar
atLeast (id: string, min: number): NonEmptyGrammar
```

### `NonEmptyGrammar.prototype.atMost` _method_ {#nonemptygrammar_prototype_atMost}

```ts
atMost (max: number): NonEmptyGrammar
atMost (id: string, max: number): NonEmptyGrammar
```

### `NonEmptyGrammar.prototype.zeroOrMore` _method_ {#nonemptygrammar_prototype_zeroOrMore}

```ts
zeroOrMore (id?: string | undefined): NonEmptyGrammar
```

### `NonEmptyGrammar.prototype.oneOrMore` _method_ {#nonemptygrammar_prototype_oneOrMore}

```ts
oneOrMore (id?: string | undefined): NonEmptyGrammar
```

### `NonEmptyGrammar.prototype.butNot` _method_ {#nonemptygrammar_prototype_butNot}

```ts
butNot (exclude: NonEmptyGrammar): NonEmptyGrammar
butNot (id: string, exclude: NonEmptyGrammar): NonEmptyGrammar
```

### `NonEmptyGrammar.prototype.maybe` _method_ {#nonemptygrammar_prototype_maybe}

```ts
oneOrMore (id?: string | undefined): Grammar<Empty>
```

## `ref` _function_ {#ref}

```ts
function ref (fn: () => Grammar): NonEmptyGrammar
```

## `Choices` _type alias_ {#choices}

```ts
type Choices = [Grammar<null>, Grammar<null>, ...Array<Grammar<null>>]
```

## `choose` _function_ {#choose}

```ts
function choose (options: Choices): NonEmptyGrammar
function choose (id: string, options: Choices): NonEmptyGrammar
```

## `Parts` _type alias_ {#parts}

```ts
type Parts = [AnyGrammar, AnyGrammar, ...AnyGrammar[]]
```

## `sequence` _function_ {#sequence}

```ts
function sequence (parts: Parts): NonEmptyGrammar
function sequence (id: string, parts: Parts): NonEmptyGrammar
```

## `not` _function_ {#not}

```ts
function not (target: Grammar<null>): AnyGrammar
```

## `end` _function_ {#end}

```ts
function end (): AnyGrammar
```

## `token` _function_ {#token}

```ts
function token (grammar: Grammar<null>): NonEmptyGrammar
function token (id: string, grammar: Grammar<null>): NonEmptyGrammar
```

## `lit` _function_ {#lit}

```ts
function lit (value: string): NonEmptyGrammar
function lit (id: string, value: string): NonEmptyGrammar
```

## `char` _function_ {#char}

```ts
char (value: string): NonEmptyGrammar
char (id: string, value: string): NonEmptyGrammar
```

## `notChar` _function_ {#notchar}

```ts
function notChar (value: string): NonEmptyGrammar
function notChar (id: string, value: string): NonEmptyGrammar
```

## `CharSetSpecifier` _type alias_

```ts
export type CharSetSpecifier =
  | string
  | [string, string]
```

### `BaseCharSetGrammar` _class_

```ts
class BaseCharSetGrammar extends NonEmptyGrammar
```

### `BaseCharSetGrammar: specifiers` _field_ {#basecharsetgrammar_specifiers}

```ts
readonly specifiers: CharSetSpecifier[]
```

## `charSet` _function_ {#charset}

```ts
function charSet (specifiers: CharSetSpecifier[]): BaseCharSetGrammar
function charSet (id: string, specifiers: CharSetSpecifier[]): BaseCharSetGrammar
```

## `notCharSet` _function_ {#notcharset}

```ts
function notCharSet (specifiers: CharSetSpecifier[]): BaseCharSetGrammar
function notCharSet (id: string, specifiers: CharSetSpecifier[]): BaseCharSetGrammar
```
