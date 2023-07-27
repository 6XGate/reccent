import { createCount, symbols } from './utilities/foundation'

export class Isolate {
  /** ID counter to use for getting the next ID in the isolate. */
  #idCounter = createCount()

  // constructor (factories: Factories) {
  //   this.#factories = factories
  // }

  // getNextId () {
  //   return this.#idCounter.getNext()
  // }

  // create<Type extends keyof Factories> (type: Type, ...args: SerializableArgs<Factories[Type]>) {
  //   const factory = this.#factories[type]
  //   const header = { isolate: this, id: this.#idCounter.getNext() } satisfies FactoryHeader
  //   const instance = factory.create(header, ...args) as SerializableInstanceType<Factories[Type]>
  //   this.#references.set(instance[symbols.id], instance)
  //
  //   return instance
  // }
}

export interface FactoryHeader {
  /** Isolate to which this object belongs. */
  isolate: Isolate<any>
  /** The serializable type of this object. */
  id: number
}

export interface SerializableHeader extends FactoryHeader {
  /** The serializable type of this object. */
  id: number
}

export type SerializableType<Factory extends SerializableFactory<any, any, any>> =
  Factory['type']

export type SerializableInstanceType<Factory extends SerializableFactory<any, any, any>> =
  ReturnType<Factory['create']>

export type SerializableArgs<Factory extends SerializableFactory<any, any, any>> = // Factory['__args']
  Factory extends SerializableFactory<any, any, infer Args> ? Args : any[]

class Page extends Serializable {

}

class PageFactory extends SerializableFactory<'page', Page, []> {
  constructor () {
    super()
  }
}

const iso = new Isolate({
  page: new PageFactory()
})

// const pageFactory = new PageFactory()
