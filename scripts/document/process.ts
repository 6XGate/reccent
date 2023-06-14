import { ApiItemKind } from '@microsoft/api-extractor-model'
import { Page, Section } from './document'
import type { ApiItemHandlers } from './utilities'
import type { ApiItem, ApiPackage } from '@microsoft/api-extractor-model'

type ItemProcessors = ApiItemHandlers<Page | Section | null>

const processors: ItemProcessors = {
  [ApiItemKind.CallSignature]: Section.forStructureMember,
  [ApiItemKind.Class]: Section.forScopeMember,
  [ApiItemKind.ConstructSignature]: Section.forStructureMember,
  [ApiItemKind.Constructor]: Section.forStructureMember,
  [ApiItemKind.EntryPoint]: () => null,
  [ApiItemKind.Enum]: Section.forScopeMember,
  [ApiItemKind.EnumMember]: () => { throw new Error('not implemented') }, // TODO: needs special handling
  [ApiItemKind.Function]: Section.forScopeMember,
  [ApiItemKind.IndexSignature]: Section.forStructureMember,
  [ApiItemKind.Interface]: Section.forScopeMember,
  [ApiItemKind.Method]: Section.forStructureMember,
  [ApiItemKind.MethodSignature]: Section.forStructureMember,
  [ApiItemKind.Model]: () => null,
  [ApiItemKind.Namespace]: Page.forNamespace,
  [ApiItemKind.None]: () => { throw new SyntaxError('No model should be of the None kind') },
  [ApiItemKind.Package]: () => null,
  [ApiItemKind.Property]: Section.forStructureMember,
  [ApiItemKind.PropertySignature]: Section.forStructureMember,
  [ApiItemKind.TypeAlias]: Section.forScopeMember,
  [ApiItemKind.Variable]: Section.forScopeMember
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
}
