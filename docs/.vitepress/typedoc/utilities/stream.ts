import { tuple } from './foundation'

class MemoryStream {
  /** Buffer slack space, defaults to 4MiB. */
  static #slack = 4194304

  /** Gets the allocation slack for the buffer. */
  static get slack () { return this.#slack }

  /**
   * Sets the allocation slack for the buffer.
   *
   * @remarks
   * This must be a power of two. Providing any
   * other value will result in a RangeError.
   */
  static set slack (value: number) {
    if ((value & (value - 1)) !== 0) throw new RangeError('Buffer slack must be a power of two')
  }

  /** The stream's memory buffer. */
  #buffer = new ArrayBuffer(MemoryStream.kBufferSlack)

  /** Actual size of the data in the memory buffer. */
  #size = 0

  get buffer () { return this.#buffer }

  get capacity () { return this.#buffer.byteLength }

  get size () { return this.#size }
}

/** Heading magic characters, which is the string 'ADSS'. */
export type HeaderMagic = typeof kHeaderMagic
/** Heading magic characters, which is the string 'ADSS'. */
export const kHeaderMagic = tuple([0x41, 0x44, 0x53, 0x53])

interface HeaderData {
  streamSize: number
  finalPosition: number
}

export function readHeader (data: DataView) {
  const magic = new Uint8Array(data.buffer).slice(0, kHeaderMagic.length)
  if (!magic.every((byte, index) => byte === kHeaderMagic[index])) {
    throw new TypeError('Data is not an data stream')
  }

  const header: HeaderData = {
    streamSize: data.getInt32()
  }

  return header
}

export function writeHeader (data: DataView, final: number, size: number) {
  let pos = 0
  new Uint8Array(data.buffer).set(kHeaderMagic, 0); pos += kHeaderMagic.length
  data.setInt32(pos, size); pos += Uint32Array.BYTES_PER_ELEMENT
  data.setInt16(pos, final); pos += Uint32Array.BYTES_PER_ELEMENT
}

/** 'Z' for zero/null reference. */
export type NullType = typeof kNullType
/** 'Z' for zero/null reference. */
export const kNullType = 0x5A

/** 'F' for false. */
export type FalseType = typeof kFalseType
/** 'F' for false. */
export const kFalseType = 0x46

/** 'T' for true. */
export type TrueType = typeof kTrueType
/** 'T' for true. */
export const kTrueType = 0x54

/** 'T' or 'F' for the boolean values true or false. */
export type BooleanType = FalseType | TrueType

/** 'N' for number. */
export type NumberType = typeof kNumberType
/** 'N' for number. */
export const kNumberType = 0x4E

/** 'S' for string. */
export type StringType = typeof kStringType
/** 'S' for string. */
export const kStringType = 0x53

/** 'A' for array. */
export type ArrayType = typeof kArrayType
/** 'A' for array. */
export const kArrayType = 0x41

/** 'O' for object, specifically raw objects or referenceable payload. */
export type ObjectType = typeof kObjectType
/** 'O' for object, specifically raw objects or referenceable payload. */
export const kObjectType = 0x4F

/** 'E' for referenceable entry. */
export type EntryType = typeof kEntryType
/** 'E' for referenceable entry. */
export const kEntryType = 0x45
