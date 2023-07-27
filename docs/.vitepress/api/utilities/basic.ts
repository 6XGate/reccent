/* eslint-disable @typescript-eslint/no-explicit-any -- Used in template arguments or interface implementations. */

export function tap<T> (value: T, tapper: (value: T) => unknown) {
  tapper(value)

  return value
}

export function isNotNullish<T> (value: T | null | undefined): value is T {
  return value != null
}

// credits goes to https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type/50375286#50375286
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

// credits goes to https://github.com/microsoft/TypeScript/issues/13298#issuecomment-468114901
type UnionToOvlds<U> = UnionToIntersection<U extends any ? (f: U) => void : never>
type PopUnion<U> = UnionToOvlds<U> extends (a: infer A) => void ? A : never

// credits goes to https://stackoverflow.com/questions/53953814/typescript-check-if-a-type-is-a-union#comment-94748994
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true
export type UnionToArray<T, A extends unknown[] = []> = IsUnion<T> extends true
  ? UnionToArray<Exclude<T, PopUnion<T>>, [PopUnion<T>, ...A]>
  : [T, ...A]

const kSafeReadonlyArrayMembers: UnionToArray<Exclude<keyof readonly unknown[], number>> = [
  Symbol.iterator,
  Symbol.unscopables,
  'length',
  'toString',
  'toLocaleString',
  'concat',
  'join',
  'slice',
  'indexOf',
  'lastIndexOf',
  'every',
  'some',
  'forEach',
  'map',
  'filter',
  'reduce',
  'reduceRight',
  'find',
  'findIndex',
  'entries',
  'keys',
  'values',
  'includes',
  'flatMap',
  'flat',
  'at',
  'findLast',
  'findLastIndex'
]

const readonlyArrayHandler = new class implements ProxyHandler<readonly any[]> {
  defineProperty () {
    return false
  }

  deleteProperty () {
    return false
  }

  get (target: readonly [], p: string | symbol | number) {
    if (kSafeReadonlyArrayMembers.includes(p as never)) {
      return target[p as never]
    }

    p = Number(p)
    if (Number.isInteger(p)) {
      return target[p]
    }

    return undefined
  }

  getOwnPropertyDescriptor (target: readonly any[], p: string | symbol | number) {
    if (kSafeReadonlyArrayMembers.includes(p as never)) {
      return {
        configurable: false,
        enumerable: false,
        writable: false,
        value: target[p as never] as never
      } satisfies PropertyDescriptor
    }

    p = Number(p)
    if (Number.isInteger(p) && p < target.length) {
      return {
        configurable: false,
        enumerable: true,
        writable: false,
        value: target[p] as never
      } satisfies PropertyDescriptor
    }

    return undefined
  }

  has (target: readonly any[], p: string | symbol | number) {
    if (kSafeReadonlyArrayMembers.includes(p as never)) {
      return true
    }

    p = Number(p)
    if (Number.isInteger(p) && p < target.length) {
      return true
    }

    return false
  }

  isExtensible () {
    return false
  }

  ownKeys (target: readonly any[]) {
    return Object.keys(target)
  }

  preventExtensions () {
    return true
  }

  set () {
    return false
  }

  setPrototypeOf () {
    return false
  }
}()

function makeReadonlyArray<T> (array: T[]) {
  return new Proxy<readonly T[]>(array, readonlyArrayHandler)
}

export class PublicArray<T> extends Array<T> {
  readonly #readonly = makeReadonlyArray(this)

  get readonly () { return this.#readonly }
}

class InnerReadonlyMap<K, V> implements ReadonlyMap<K, V> {
  readonly #map: Map<K, V>

  constructor (map: Map<K, V>) {
    this.#map = map

    Object.freeze(this)
  }

  get size () { return this.#map.size }

  forEach (callbackfn: (value: V, key: K, map: InnerReadonlyMap<K, V>) => void, thisArg?: any): void {
    this.#map.forEach((v, k) => { callbackfn.call(thisArg, v, k, this) })
  }

  get (key: K): V | undefined {
    return this.#map.get(key)
  }

  has (key: K): boolean {
    return this.#map.has(key)
  }

  entries (): IterableIterator<[K, V]> {
    return this.#map.entries()
  }

  keys (): IterableIterator<K> {
    return this.#map.keys()
  }

  values (): IterableIterator<V> {
    return this.#map.values()
  }

  [Symbol.iterator] (): IterableIterator<[K, V]> {
    return this.#map.entries()
  }
}

export class PublicMap<K, V> extends Map<K, V> {
  readonly #readonly = new InnerReadonlyMap(this)

  get readonly () {
    return this.#readonly
  }
}

class InnerReadonlySet<T> implements ReadonlySet<T> {
  readonly #set: Set<T>

  constructor (set: Set<T>) {
    this.#set = set

    Object.freeze(this)
  }

  get size () { return this.#set.size }

  forEach (callbackfn: (value: T, key: T, map: InnerReadonlySet<T>) => void, thisArg?: any): void {
    this.#set.forEach((v, k) => { callbackfn.call(thisArg, v, k, this) })
  }

  has (value: T): boolean {
    return this.#set.has(value)
  }

  entries (): IterableIterator<[T, T]> {
    return this.#set.entries()
  }

  keys (): IterableIterator<T> {
    return this.#set.keys()
  }

  values (): IterableIterator<T> {
    return this.#set.values()
  }

  [Symbol.iterator] (): IterableIterator<T> {
    return this.#set.values()
  }
}

export class PublicSet<T> extends Set<T> {
  readonly #readonly = new InnerReadonlySet(this)

  get readonly () {
    return this.#readonly
  }
}
