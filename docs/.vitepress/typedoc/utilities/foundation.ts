import type { Primitive } from 'type-fest'

//
// General purpose utilities...
//

/** Creates a tuple without forcing read-only. */
export function tuple<T extends [U, ...U[]], U extends number | string> (value: T) {
  return value
}

/** Checks that a value is not undefined. */
export function isNotUndefined<T> (value: T | undefined): value is T {
  return value !== undefined
}

/** Checks that a value is not null. */
export function isNotNull<T> (value: T | null): value is T {
  return value !== null
}

/** Checks that a value is not null or undefined. */
export function isNotNullish<T> (value: T | null | undefined): value is T {
  return value != null
}

//
// Foundational symbols...
//

// eslint-disable-next-line @typescript-eslint/no-namespace -- Symbols won't carry their types into object properties.
export namespace symbols {
  /** Symbol to get, or set, the isolate of an object. */
  export const isolate = Symbol.for('@@isolate')
  /** Symbol to get, or set, the storage type of an object. */
  export const type = Symbol.for('@@type')
  /** Symbol to get, or set, the storage id of an object. */
  export const id = Symbol.for('@@id')
  /** Symbol for the serialize operation. */
  export const serialize = Symbol.for('@@serialize')
}

//
// Counter tool...
//

/** Creates a number counter. */
export function createCount () {
  let next = 1

  function getNext () {
    return next++
  }

  return { getNext }
}

//
// String utilities...
//

/** Split everything by contiguous whitespces and joins it back together with single spaces. */
function removeLinesAndTrim (value: string) {
  return value.split(/[\p{Pattern_White_Space}]+/gu).join(' ')
}

/** Usefully stringable types. */
type Stringable = Exclude<Primitive, undefined | null | boolean | symbol>

/** Collapses a string, from a template, into a single line. */
export function collapse (parts: TemplateStringsArray, ...values: Stringable[]): string {
  return [
    ...values.map((value, index) => `${removeLinesAndTrim(parts[index] as string)}${value}`),
    removeLinesAndTrim(parts.at(-1) as string)
  ].join('').trim()
}
