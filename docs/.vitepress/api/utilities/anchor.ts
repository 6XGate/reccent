import type { ApiItemHandlers } from './handlers'
import type { ApiItem } from '@microsoft/api-extractor-model'

const anchorMakers: ApiItemHandlers<string> = {
  CallSignature: () => 'call-signature',
  Class: () => 'top',
  ConstructSignature: () => 'constructor-signature',
  Constructor: () => 'constructor',
  EntryPoint: () => { throw new SyntaxError('Entry-points are not documented') },
  Enum: item => item.displayName,
  EnumMember: () => { throw new SyntaxError('Enum members documented via rendering') },
  Function: item => item.displayName,
  IndexSignature: () => 'index-signature',
  Interface: () => 'top',
  Method: item => (item.isStatic ? `static-${item.displayName}` : item.displayName),
  MethodSignature: item => item.displayName,
  Model: () => { throw new SyntaxError('The model is not documented') },
  Namespace: () => 'top',
  None: () => { throw new SyntaxError('No model should be of the None kind') },
  Package: () => { throw new SyntaxError('Packages are not documented') },
  Property: item => (item.isStatic ? `static-${item.displayName}` : item.displayName),
  PropertySignature: item => item.displayName,
  TypeAlias: item => `type-${item.displayName}`,
  Variable: item => item.displayName
}

export function makeAnchor (item: ApiItem) {
  return anchorMakers[item.kind](item as never)
}
