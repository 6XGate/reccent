export interface Test {
  /**
   * finds a state
   */
  [idx: number]: boolean

  at (idx: number): boolean
}

export type IDs = `${number}`
export const ids: IDs = '55'

export enum KnownIds {
  set,
  map,
  array
}

export namespace IDGetter {
  export interface Getter { get id(): number }
}

export abstract class Handler {
  #handler: () => void

  constructor (handler: () => void) {
    this.#handler = handler
  }

  get handler () { return this.#handler }
}

// export { Parser } from './parser'
