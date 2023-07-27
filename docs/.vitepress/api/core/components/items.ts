import {
  ApiItem,
  ApiDeclaredItem,
  Excerpt as ApiExcerpt,
  Parameter as ApiParameter,
  TypeParameter as ApiTypeParameter
} from '@microsoft/api-extractor-model'
import { DocBlock } from '@microsoft/tsdoc'
import { unique } from 'radash'
import { z } from 'zod'
import { isNotNullish } from '../../utilities/basic'
import { NormalSection, OneLineSection, cz, czcomment, defineLiteComponent } from './common'
import { ModifierChip } from './modifiers'
import { DocNodeContent } from './nodes'
import { Table } from './tables'
import { BlockExcerpt, InlineExcerpt } from './tsdoc/except'
import type { Renderable } from './common'
import type { ApiItemHandlers } from '../../utilities/handlers'

type ApiItemRenderers = ApiItemHandlers<Renderable>

const renderers: ApiItemRenderers = {
  CallSignature: item => ItemDocumentation({ item }, [
    Parameters({ params: item.parameters }),
    TypeParameters({ params: item.typeParameters }),
    Return({ excerpt: item.returnTypeExcerpt, block: item.tsdocComment?.returnsBlock })
  ]),
  Class: item => ItemDocumentation({ item }, [
    // TODO: What it extends, and what it implements.
    TypeParameters({ params: item.typeParameters })
  ]),
  ConstructSignature: item => ItemDocumentation({ item }, [
    Parameters({ params: item.parameters }),
    TypeParameters({ params: item.typeParameters }),
    Return({ excerpt: item.returnTypeExcerpt, block: item.tsdocComment?.returnsBlock })
  ]),
  Constructor: item => ItemDocumentation({ item }, [
    Parameters({ params: item.parameters })
  ]),
  EntryPoint: () => /* Not necessary */ null,
  Enum: item => {
    const members = item.members.map(member => ({
      name: member.displayName,
      value: member.initializerExcerpt != null ? InlineExcerpt({ excerpt: member.initializerExcerpt }) : '-',
      // Don't support full comment since it will mess up the tables.
      description: member.tsdocComment != null ? DocNodeContent({ node: member.tsdocComment.summarySection }) : '-'
    }))

    return ItemDocumentation({ item }, [
      Table({
        columns: [
          { heading: 'Name', field: 'name', align: 'end' },
          { heading: 'Value', field: 'value' },
          { heading: 'Description', field: 'description' }
        ],
        items: members
      })
    ])
  },
  EnumMember: () => /* Handle by the ancestory */ null,
  Function: item => ItemDocumentation({ item }, [
    Parameters({ params: item.parameters }),
    TypeParameters({ params: item.typeParameters }),
    Return({ excerpt: item.returnTypeExcerpt, block: item.tsdocComment?.returnsBlock })
  ]),
  IndexSignature: item => ItemDocumentation({ item }, [
    Return({ excerpt: item.returnTypeExcerpt }, item.tsdocComment?.returnsBlock != null
      ? [' - ', DocNodeContent({ node: item.tsdocComment.returnsBlock })]
      : czcomment())
  ]),
  Interface: item => ItemDocumentation({ item }, [
    // TODO: What it extends.
    TypeParameters({ params: item.typeParameters })
  ]),
  Method: item => ItemDocumentation({ item }, [
    Parameters({ params: item.parameters }),
    TypeParameters({ params: item.typeParameters }),
    Return({ excerpt: item.returnTypeExcerpt, block: item.tsdocComment?.returnsBlock })
  ]),
  MethodSignature: item => ItemDocumentation({ item }, [
    Parameters({ params: item.parameters }),
    TypeParameters({ params: item.typeParameters }),
    Return({ excerpt: item.returnTypeExcerpt, block: item.tsdocComment?.returnsBlock })
  ]),
  Model: () => /* Not necessary */ null,
  Namespace: item => ItemDocumentation({ item }),
  None: () => { throw new SyntaxError('No model should be of the None kind') },
  Package: () => /* Not necessary */ null,
  Property: item => ItemDocumentation({ item }, [
    OneLineSection({ heading: 'Type' }, [InlineExcerpt({ excerpt: item.propertyTypeExcerpt })]),
    item.initializerExcerpt != null
      ? OneLineSection({ heading: 'Value' }, [InlineExcerpt({ excerpt: item.initializerExcerpt })])
      : czcomment()
  ]),
  PropertySignature: item => ItemDocumentation({ item }, [
    OneLineSection({ heading: 'Type' }, [InlineExcerpt({ excerpt: item.propertyTypeExcerpt })])
  ]),
  TypeAlias: item => ItemDocumentation({ item }, [
    TypeParameters({ params: item.typeParameters }),
    OneLineSection({ heading: 'Type' }, [InlineExcerpt({ excerpt: item.typeExcerpt })])
  ]),
  Variable: item => ItemDocumentation({ item }, [
    OneLineSection({ heading: 'Type' }, [InlineExcerpt({ excerpt: item.variableTypeExcerpt })]),
    item.initializerExcerpt != null
      ? OneLineSection({ heading: 'Value' }, [InlineExcerpt({ excerpt: item.initializerExcerpt })])
      : czcomment()
  ])
}

export const ItemContent = defineLiteComponent(
  z.object({ item: z.instanceof(ApiItem) }),
  ({ item }) => renderers[item.kind](item as never /* kind identifies the type */)
)

const ItemDocumentation = defineLiteComponent(
  z.object({ item: z.instanceof(ApiDeclaredItem) }),
  ({ item }, content) => {
    // TODO: item.tsdocComment?.customBlocks, will require user plug-ins.
    // TODO: item.tsdocComment?.inheritDocTag, will require support
    // TODO: item.releaseTag, will require per-item check

    const node = item.tsdocComment
    if (node == null) {
      return [
        BlockExcerpt({ excerpt: item.excerpt }),
        ...content,
        BadgeItem({ item })
      ]
    }

    return [
      BlockExcerpt({ excerpt: item.excerpt }),
      DocNodeContent({ node: node.summarySection }),
      ...content,
      node.remarksBlock != null
        ? NormalSection({ heading: 'Remarks' }, [DocNodeContent({ node: node.remarksBlock })])
        : czcomment(),
      BadgeItem({ item }),
      node.seeBlocks.length > 0
        ? (NormalSection({ heading: 'See also' }, [cz('ul', node.seeBlocks.map(block =>
            cz('li', [DocNodeContent({ node: block })])
          ))]))
        : czcomment(),
      node.deprecatedBlock != null
        // TODO: Warning container
        ? OneLineSection({ heading: 'Warning, Deprecated' }, [DocNodeContent({ node: node.deprecatedBlock })])
        : czcomment()
    ]
  }
)

const kAbstract = 'abstract'
const kExported = 'exported'
const kProtected = 'protected'
const kReadonly = 'readonly'
const kStatic = 'static'
const kEvent = 'eventProperty'

const badger: ApiItemHandlers<Array<string | undefined>> = {
  CallSignature: () => [],
  Class: item => [
    item.isAbstract ? kAbstract : undefined,
    item.isExported ? kExported : undefined
  ],
  ConstructSignature: () => [],
  Constructor: item => [
    item.isProtected ? kProtected : undefined
  ],
  EntryPoint: () => [],
  Enum: item => [
    item.isExported ? kExported : undefined
  ],
  EnumMember: () => [],
  Function: item => [
    item.isExported ? kExported : undefined
  ],
  IndexSignature: item => [
    item.isReadonly ? kReadonly : undefined
  ],
  Interface: item => [
    item.isExported ? kExported : undefined
  ],
  Method: item => [
    item.isStatic ? kStatic : undefined,
    item.isOptional ? kProtected : undefined,
    item.isAbstract ? kAbstract : undefined,
    item.isProtected ? kProtected : undefined
  ],
  MethodSignature: item => [
    item.isOptional ? kProtected : undefined
  ],
  Model: () => [],
  Namespace: item => [
    item.isExported ? kExported : undefined
  ],
  None: () => [],
  Package: () => [],
  Property: item => [
    item.isStatic ? kStatic : undefined,
    item.isOptional ? kProtected : undefined,
    item.isAbstract ? kAbstract : undefined,
    item.isProtected ? kProtected : undefined,
    item.isReadonly ? kReadonly : undefined,
    item.isEventProperty ? kEvent : undefined
  ],
  PropertySignature: item => [
    item.isOptional ? kProtected : undefined,
    item.isReadonly ? kReadonly : undefined,
    item.isEventProperty ? kEvent : undefined
  ],
  TypeAlias: item => [
    item.isExported ? kExported : undefined
  ],
  Variable: item => [
    item.isReadonly ? kReadonly : undefined,
    item.isExported ? kExported : undefined
  ]
}

const BadgeItem = defineLiteComponent(
  z.object({ item: z.instanceof(ApiDeclaredItem) }),
  ({ item }) => {
    const tags = item.tsdocComment?.modifierTagSet.nodes
      .map(tag => tag.tagName)
      .filter(tag => tag.length > 0) ??
      []

    const badges = unique(
      [...badger[item.kind](item as never).filter(isNotNullish), ...tags],
      i => i.toUpperCase())

    // TODO: Chips
    return badges.length > 0
      ? OneLineSection({ heading: 'Info' }, badges.map(badge => ModifierChip({ tag: badge })))
      : czcomment()
  }
)

const Parameters = defineLiteComponent(
  z.object({ params: z.array(z.instanceof(ApiParameter)) as z.ZodType<readonly ApiParameter[]> /* HACK: allow readonly */ }),
  ({ params }) => {
    if (params.length === 0) {
      return [czcomment()]
    }

    return NormalSection({ heading: 'Parameters' }, [
      Table({
        columns: [
          { heading: 'Name', field: 'name', align: 'end' },
          { heading: 'Type', field: 'type' },
          { heading: 'Descriptions', field: 'description' }
        ],
        items: params.map(param => ({
          name: param.isOptional ? cz('em', [([cz('code', [param.name])])]) : cz('code', [param.name]),
          type: param.parameterTypeExcerpt.isEmpty ? '-' : InlineExcerpt({ excerpt: param.parameterTypeExcerpt }),
          description: [
            param.isOptional ? cz('em', ['(Optional) ']) : czcomment(),
            param.tsdocParamBlock != null ? DocNodeContent({ node: param.tsdocParamBlock }) : '-'
          ]
        }))
      })
    ])
  }
)

const TypeParameters = defineLiteComponent(
  z.object({ params: z.array(z.instanceof(ApiTypeParameter)) as z.ZodType<readonly ApiTypeParameter[]> /* HACK: allow readonly */ }),
  ({ params }) => {
    if (params.length === 0) {
      return [czcomment()]
    }

    return NormalSection({ heading: 'Type parameters' }, [
      Table({
        columns: [
          { heading: 'Name', field: 'name', align: 'end' },
          { heading: 'Type', field: 'type' },
          { heading: 'Default', field: 'default' },
          { heading: 'Descriptions', field: 'description' }
        ],
        items: params.map(param => ({
          name: param.isOptional ? cz('em', [([cz('code', [param.name])])]) : cz('code', [param.name]),
          type: param.constraintExcerpt.isEmpty ? '-' : InlineExcerpt({ excerpt: param.constraintExcerpt }),
          default: param.defaultTypeExcerpt.isEmpty ? '-' : InlineExcerpt({ excerpt: param.defaultTypeExcerpt }),
          description: [
            param.isOptional ? cz('em', ['(Optional) ']) : czcomment(),
            param.tsdocTypeParamBlock != null ? DocNodeContent({ node: param.tsdocTypeParamBlock }) : '-'
          ]
        }))
      })
    ])
  }
)

const Return = defineLiteComponent(
  z.object({
    excerpt: z.instanceof(ApiExcerpt).nullish(),
    block: z.instanceof(DocBlock).nullish()
  }),
  ({ excerpt, block }) => {
    if (excerpt != null && !excerpt.isEmpty) {
      return OneLineSection({ heading: 'Returns' }, [InlineExcerpt({ excerpt }), block != null
        ? [' - ', DocNodeContent({ node: block })]
        : czcomment()])
    }

    return block != null
      ? OneLineSection({ heading: 'Returns' }, [DocNodeContent({ node: block })])
      : czcomment()
  })
