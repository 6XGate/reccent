import { Reflection } from 'typedoc'
import { Serializable } from '../serialization'
import { FactoryHeader } from '../isolate'

interface PartData<Parent extends Part | null, Item extends Reflection | null, Heading extends string | null> {
  /** The parent of the part. */
  parent: Parent
  /** The item model being documented by the part. */
  item: Item
  /** The heading for the part. */
  heading: Heading
}

export abstract class Part<Parent extends Part | null = any, Item extends Reflection | null = any, Heading extends string | null = any> extends Serializable<'Part'> {
  /** The parent of the part. */
  #parent: Parent
  /** The item model being documented by the part. */
  #item: Item
  /** The heading for the part. */
  #heading: Heading

  constructor (header: FactoryHeader, data: PartData<Parent, Item, Heading>) {
    super(header)
    this.#parent = data.parent
    this.#item = data.item
    this.#heading = data.heading
  }

  /** The parent of the part. */
  get parent () { return this.#parent }

  /** The item model being documented by the part. */
  get item () { return this.#item }

  /** The heading for the part. */
  get heading () { return this.#heading }
}
