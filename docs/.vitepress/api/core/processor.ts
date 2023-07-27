import { Page, Section } from './structure'
import type { ApiItemHandlers } from '../utilities/handlers'
import type { ApiItem, ApiPackage } from '@microsoft/api-extractor-model'

type ItemProcessors = ApiItemHandlers<Page | Section | null>

const processors: ItemProcessors = {
  CallSignature: Section.forMember,
  Class: Page.forScope,
  ConstructSignature: Section.forMember,
  Constructor: Section.forMember,
  EntryPoint: () => null,
  Enum: Section.forMember,
  EnumMember: () => null,
  Function: Section.forMember,
  IndexSignature: Section.forMember,
  Interface: Page.forScope,
  Method: Section.forMember,
  MethodSignature: Section.forMember,
  Model: () => null,
  Namespace: Page.forScope,
  None: () => { throw new SyntaxError('No model should be of the None kind') },
  Package: () => null,
  Property: Section.forMember,
  PropertySignature: Section.forMember,
  TypeAlias: Section.forMember,
  Variable: Section.forMember
}

function processItem (item: ApiItem) {
  if (!(item.kind in processors)) {
    throw new SyntaxError(`Unsupoorted API kind "${item.kind}"`)
  }

  return processors[item.kind](item as never)
}

function processItemTree (item: ApiItem) {
  try {
    processItem(item)
    for (const member of item.members) {
      processItemTree(member)
    }
  } catch (e) {
    console.warn(`skipping ${item.kind}: ${String(e)}`)
  }
}

export function processPackage (pkg: ApiPackage) {
  processItemTree(pkg)

  return [...Page.pages.values()]
}
