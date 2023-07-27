import { z } from 'zod'
import { collapse, isNotUndefined, symbols } from './utilities/foundation'
import type { Isolate } from './isolate'
import type { JsonArray, JsonObject, JsonValue } from 'type-fest'

export interface SerializableHeader {
  /** Isolate to which this object belongs. */
  isolate: Isolate
  /** The serializable type of this object. */
  id: number
}

export abstract class Serializable<TypeName extends string> {
  /** Isolate to which this object belongs. */
  #isolate: Isolate
  /** The serializable type of this object. */
  #id: number

  protected constructor (header: SerializableHeader) {
    this.#isolate = header.isolate
    this.#id = header.id
  }

  /** Gets the isolate to which this object belongs. */
  [symbols.isolate] () { return this.#isolate }

  /** Gets the serializable reference ID of this object. */
  [symbols.id] () { return this.#id }

  /** Gets the serializable type of this object. */
  abstract [symbols.type] (): TypeName

  /** Serializes the object to JSON. */
  abstract [symbols.serialize] (stream: SerializationStream, dest: JsonObject): JsonObject

  /** Determines if the value is a serializable object. */
  static isSerializable (value: unknown): value is Serializable<string> {
    return value instanceof Serializable
  }
}

/** Factory for deserializing serializable objects. */
export abstract class SerializableFactory<TypeName extends string, T extends Serializable<TypeName>, Args extends any[]> {
  /** The isolate to which this factory is registered. */
  #isolate: Isolate
  /** The type this factory can create or deserialize. */
  #type: TypeName

  protected constructor (isolate: Isolate, type: TypeName) {
    this.#isolate = isolate
    this.#type = type
  }

  /** The isolate to which this factory is registered. */
  get isolate () { return this.#isolate }

  /** The type this factory can create or deserialize. */
  get type () { return this.#type }

  /** Provides instance of operation from factory. */
  abstract created (value: unknown): value is T

  /** Deserializes an instance of `T`. */
  abstract deserialize (header: SerializableHeader, data: JsonObject): T

  /** Creates a new instance of `T`. */
  abstract create (header: SerializableHeader, ...args: Args): T
}

export type FactorySet<TypeNames extends string> = {
  [TypeName in TypeNames]: SerializableFactory<TypeName, Serializable<TypeName>, any[]>
}

export const defineFactories =
  <Factories extends FactorySet<TypeNames>, TypeNames extends Exclude<keyof Factories, symbol | number>> (factories: Factories) =>
    factories

export type JsonReference = z.infer<typeof JsonReference>
export const JsonReference = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)

export type JsonTypeName = z.infer<typeof JsonTypeName>
export const JsonTypeName = z.string().min(1)

export type JsonStreamEntry = z.infer<typeof JsonStreamEntry>
export const JsonStreamEntry = z.tuple([
  // Reference ID
  JsonReference,
  // Serialized object type
  JsonTypeName,
  // Serialized object
  z.custom<JsonObject>(v => v != null && typeof v === 'object' && !Array.isArray(v))
])

/**
 * JSON stream structure.
 *
 * @remarks
 * This is an array, as a stream, of tuples with a reference ID and the associated JSON payload.
 * The first item is considered the root of the entire payload the stream represents.
 * Serializable object will be stored to the stream and not in the payload of
 * an entry.
 */
export type JsonStream = z.infer<typeof JsonStream>
export const JsonStream = z.array(JsonStreamEntry)

class SerializationStream {
  #isolate: Isolate

  #cyclical = new WeakSet()

  #references = new WeakMap<object, number>()

  #entries = new Array<JsonStreamEntry>()

  constructor (isolate: Isolate) {
    this.#isolate = isolate
  }

  get isolate () { return this.#isolate }

  get entries () { return this.#entries }

  write (target: Serializable<string>): JsonReference {
    // Check that the object is already in the process of being serialized.
    let id = this.#references.get(target)
    if (id != null) {
      return id
    }

    // Add the object to the reference cache.
    id = target[symbols.id]()
    const payload: JsonObject = { }
    this.#references.set(payload, id)

    // Get the extra meta-data, they payload, and push it to the stream.
    const type = target[symbols.type]()
    const root = target[symbols.serialize](this, payload)
    this.#entries.push([id, type, root])

    // Return the reference ID.
    return id
  }

  writeValue (target: unknown): JsonValue | undefined {
    if (target === undefined) {
      return undefined
    }

    if (target === null || typeof target === 'boolean' || typeof target === 'number' || typeof target === 'string') {
      return target
    }

    if (Serializable.isSerializable(target)) {
      return this.write(target)
    }

    if (Array.isArray(target)) {
      return this.writeArray(target)
    }

    return this.writeObject(target)
  }

  writeObject (target: NonNullable<object>): JsonObject {
    // Objects should not be encountered twice. `push` will use IDs to
    // reference Serializable object that will not allow this to
    // be called again. This should only happen if plain
    // objects have cyclical references.
    if (this.#cyclical.has(target)) {
      throw new RangeError(collapse`
        Cyclical object graph detected, implement Serializable
        to safely use a reference ID instead
      `)
    }

    this.#cyclical.add(target)
    const payload: JsonObject = { }
    Object.entries(target).forEach(([name, value]) => {
      const result = this.writeValue(value)
      if (result !== undefined) {
        payload[name] = result
      }
    })

    return payload
  }

  writeArray (target: unknown[]): JsonArray {
    return target.map(element => this.writeValue(element)).filter(isNotUndefined)
  }
}

class DeserializationStream {
  #isolate: Isolate

  #cyclical = new WeakSet()

  #references = new Map<number, object>()

  #entries = new Array<JsonStreamEntry>()

  constructor (isolate: Isolate, entries: Iterable<JsonStreamEntry>) {
    this.#isolate = isolate
    this.#entries.push(...entries)
  }

  get isolate () { return this.#isolate }

  get entries () { return this.#entries }

  read (): Serializable<string> {

  }

  readValue (target: JsonValue): unknown {

  }

  readObject (target: JsonObject): unknown {

  }

  readArray (target: JsonArray): unknown[] {

  }

  readReference (id: number): Serializable<string> {

  }
}
