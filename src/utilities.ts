import type { ByRef } from './basics'

/**
 * Creates a stream of UTF-32 code-points from a string.
 *
 * @param value String to convert.
 */
export function toUnicode (value: string) {
  // Calculate the needed length.
  let length = 0
  let i = 0
  for (; i < value.length; ++i) {
    const cp = value.codePointAt(i)

    // Some how we are at the end? or something else is wrong.
    if (cp == null) {
      throw new SyntaxError(`Malformed string, partial surragot pair after ${i}`)
    }

    // We got an un-decoded surragot pair, this indicates the string is malformed.
    if (0xD800 <= cp && cp <= 0xDFFF) {
      throw new SyntaxError(`Malformed string, partial surragot pair at ${i}`)
    }

    if (0x10000 <= cp) {
      // Encoded character from a surragot pair is two characters,
      // the next index will return the lower unit of the pair.
      ++i
    }

    ++length
  }

  // If `i` is at or greater than length,
  // then the string is malformed.
  if (i > value.length) {
    throw new SyntaxError('Malformed string, partial surragot pair at end')
  }

  let p = 0
  const stream = new Uint32Array(length)
  for (i = 0; i !== value.length; ++i) {
    // We've already confirmed the string's length and that it is not malformed.
    const cp = value.codePointAt(i) as number
    stream[p++] = cp
    if (0x10000 <= cp) {
      // Encoded character from a surragot pair is two characters,
      // the next index will return the lower unit of the pair.
      ++i
    }
  }

  return stream
}

/**
 * Gets a code-point from a string/stream.
 *
 * @param stream The stream from which to get the code-point.
 * @param at The position in the stream.
 */
export function getCodePointAt (stream: string, at: ByRef<number>) {
  const cp = stream.codePointAt(at[0])
  if (cp == null) {
    throw new SyntaxError('Unexpected end of stream')
  }

  if (0xD800 <= cp && cp <= 0xDFFF) {
    throw new SyntaxError(`Malformed string, partial surragot pair at ${at[0]}`)
  }

  if (cp >= 0x10000) {
    // Go ahead and increment this value on to the low half of the pair.
    ++at[0]
  }

  return cp
}

/**
 * Gets the code-point of a character.
 *
 * @param value The character to convert.
 */
export function getCharacterCodePoint (value: string) {
  const cp = value.codePointAt(0)
  if (cp == null) {
    throw new SyntaxError('Unexpected empty string')
  }

  if (0xD800 <= cp && cp <= 0xDFFF) {
    throw new SyntaxError('Malformed string, partial surragot pair in grammar string')
  }

  if (cp >= 0x10000 && value.length !== 2) {
    throw new SyntaxError('Grammar character may only be two characters long for surrogate pair')
  } else if (cp < 0x10000 && value.length !== 1) {
    throw new SyntaxError('Grammar character may only be a single character long')
  }

  return cp
}
