import { DocNode, DocParagraph } from '@microsoft/tsdoc'
import { z } from 'zod'
import { getDocReference } from '../../utilities/reference'
import {
  CodeBlock,
  HtmlEnd,
  HtmlStart,
  NormalSection,
  OneLineSection,
  ReferenceLink,
  convertRenderable,
  cz,
  czcomment,
  defineLiteComponent
} from './common'
import { ModifierChip } from './modifiers'
import { Table } from './tables'
import type { Renderable } from './common'
import type { DocNodeHandlers } from '../../utilities/handlers'
import type { DocBlock, DocHtmlStartTag, DocInlineTag, DocNodeKind } from '@microsoft/tsdoc'

type DocNodeRenderers = DocNodeHandlers<Renderable>

type TagHandler<T extends DocNode> = (node: T) => Renderable

const BlockTagHandlers: Record<string, TagHandler<DocBlock>> = {
  // Returns should really only be one paragraph, so try to keep it that way.
  '@RETURNS': node => (node.content.nodes.length === 1 && node.content.nodes[0] instanceof DocParagraph
    ? DocNodeListContent({ nodes: node.content.nodes[0].nodes })
    : DocNodeListContent({ nodes: node.content.nodes }))
}

const InlineTagHandlers: Record<string, TagHandler<DocInlineTag>> = {
  // None yet...
}

const renderers: DocNodeRenderers = {
  Block: node => {
    const tag = node.blockTag.tagNameWithUpperCase
    const handler = BlockTagHandlers[tag]

    return handler == null
      // Don't render the section itself since blocks are already likely in one.
      ? DocNodeListContent({ nodes: node.content.nodes })
      : handler(node)
  },
  BlockTag: node => ModifierChip({ tag: node.tagName }),
  Excerpt: () => /* Should not be rendered, unnecessary */ null,
  FencedCode: node => CodeBlock({ lang: node.language }, [node.code]), // TODO: Code fence
  CodeSpan: node => cz('code', [node.code]),
  Comment: node => [
    // TODO: node.customBlocks, will require user plug-ins.
    // TODO: node.inheritDocTag, will require support
    DocNodeContent({ node: node.summarySection }),
    node.params.count > 0
      ? NormalSection({ heading: 'Parameters' }, [DocNodeContent({ node: node.params })])
      : czcomment(),
    node.typeParams.count > 0
      ? NormalSection({ heading: 'Type parameters' }, [DocNodeContent({ node: node.params })])
      : czcomment(),
    node.returnsBlock != null
      ? OneLineSection({ heading: 'Returns' }, [DocNodeContent({ node: node.returnsBlock })])
      : czcomment(),
    node.remarksBlock != null
      ? NormalSection({ heading: 'Remarks' }, [DocNodeContent({ node: node.remarksBlock })])
      : czcomment(),
    node.modifierTagSet.nodes.length > 0
      // TODO: Badging
      ? (OneLineSection({ heading: 'Info' }, [
          DocNodeListContent({ nodes: node.modifierTagSet.nodes })
        ]))
      : czcomment(),
    node.seeBlocks.length > 0
      ? (NormalSection({ heading: 'See also' }, [
          cz('ul', node.seeBlocks.map(block =>
            cz('li', [DocNodeContent({ node: block })])
          ))
        ]))
      : czcomment(),
    node.deprecatedBlock != null
      // TODO: Warning container
      ? OneLineSection({ heading: 'Warning, Deprecated' }, [DocNodeContent({ node: node.deprecatedBlock })])
      : czcomment()
  ],
  DeclarationReference: () => /* Should not be rendered, handled by ancestory */ null,
  ErrorText: () => /* Unnecessary, API extractor should warn to console */ null,
  EscapedText: node => node.decodedText,
  HtmlAttribute: () => /* Should not be rendered, handled HtmlStartTag */ null,
  HtmlEndTag: node => ({ [HtmlEnd]: true, tag: node.name }),
  HtmlStartTag: node => ({ [HtmlStart]: true, tag: node.name, props: getAttributes(node), selfClose: node.selfClosingTag }),
  InheritDocTag: () => /* TODO: See what this will take. */ null,
  InlineTag: node => {
    const tag = node.tagNameWithUpperCase
    const handler = InlineTagHandlers[tag]

    return handler == null ? node.tagContent : handler(node)
  },
  LinkTag: node => {
    if (node.urlDestination != null) {
      return cz('a', { href: node.urlDestination }, [getLinkText(node.linkText, node.urlDestination)])
    }

    if (node.codeDestination != null) {
      const ref = getDocReference(node.codeDestination)
      const content = getLinkText(node.linkText, ref)

      return ReferenceLink({ ref }, [content])
    }

    if (node.linkText != null) {
      return node.linkText
    }

    return czcomment('DocLinkTag with no link or text')
  },
  MemberIdentifier: () => /* Should not be rendered, handled by ancestory */ null,
  MemberReference: () => /* Should not be rendered, handled by ancestory */ null,
  MemberSelector: () => /* Should not be rendered, handled by ancestory */ null,
  MemberSymbol: () => /* Should not be rendered, handled by ancestory */ null,
  Paragraph: node => cz('p', [DocNodeListContent({ nodes: node.nodes })]),
  ParamBlock: node =>
    // Needs to be supported for external rendering, internally handled by ParamCollection.
    // Don't render the section itself since blocks are already likely in one.
    (node.content.nodes.length === 1 && node.content.nodes[0] instanceof DocParagraph
      ? DocNodeListContent({ nodes: node.content.nodes[0].nodes })
      : DocNodeListContent({ nodes: node.content.nodes })),
  ParamCollection: node =>
    Table({
      columns: [
        { heading: 'Name', field: 'name', align: 'end' },
        { heading: 'Description', field: 'description' }
      ],
      items: node.blocks.map(param => ({
        name: param.parameterName,
        description: DocNodeListContent({ nodes: param.content.nodes })
      }))
    }),
  PlainText: node => node.text,
  Section: node => cz('section', [DocNodeListContent({ nodes: node.nodes })]),
  SoftBreak: () => /* Does not render to anything useful */ null
}

export const DocNodeContent = defineLiteComponent(
  z.object({ node: z.instanceof(DocNode) }),
  ({ node }) => [renderers[node.kind as DocNodeKind](node as never /* kind identifies the type */)]
)

const DocNodeListContent = defineLiteComponent(
  z.object({ nodes: z.array(z.instanceof(DocNode)) as z.ZodType<readonly DocNode[]> /* HACK: allow readonly */ }),
  ({ nodes }) => nodes.map(node => renderers[node.kind as DocNodeKind](node as never /* kind identifies the type */))
)

function getAttributes (node: DocHtmlStartTag) {
  const pairs = node.htmlAttributes.map(attribute => [attribute.name, attribute.value] as [string, string])

  return Object.fromEntries(pairs)
}

function getLinkText (text: string | undefined, ref: string) {
  return text != null && text.length > 0 ? text : ref
}

export function renderDocNode (node: DocNode) {
  return convertRenderable(DocNodeContent({ node }))
}
