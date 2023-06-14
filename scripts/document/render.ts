import { renderTable } from './table'
import type { DocNodeHandlers } from './utilities'
import type { DocComment, DocNode, DocNodeKind } from '@microsoft/tsdoc'

type NodeStringifiers = DocNodeHandlers<string | undefined>

function onlyNonEmptyInner (value: string): string | undefined {
  return value.length > 0
    ? value.trim()
    : undefined
}

function onlyNonEmpty (value: string | undefined): string | undefined {
  return value != null
    ? onlyNonEmptyInner(value)
    : undefined
}

const nodeRenderer: NodeStringifiers = {
  Block: node => renderNode(node.content),
  BlockTag: node => `\`${node.tagName}\``,
  Excerpt: _node => undefined, // TODO: Let's see what's needed, needed for reference code-span.
  FencedCode: _node => `\`\`\`${_node.language}\n${_node.code}\n\`\`\``,
  CodeSpan: node => `\`${node.code}\``,
  Comment: node => {
    const sections = new Array<string | undefined>()

    const deprecated = renderNode(node.deprecatedBlock)
    const tags = node.modifierTagSet.nodes.map(renderNode).filter(Boolean).join(' ')

    sections.push(
      renderNode(node.summarySection),
      renderNode(node.params),
      renderNode(node.remarksBlock),
      deprecated != null ? `::: warning Deprecated\n${deprecated}\n:::` : undefined,
      tags.length > 0 ? `::: info tags\n${tags}\n:::` : undefined
    )

    return sections.filter(Boolean).join('\n\n')
  },
  DeclarationReference: _node => undefined, // TODO: Let's see what's needed
  ErrorText: _node => undefined, // TODO: Let's see what's needed
  EscapedText: _node => undefined, // TODO: Let's see what's needed
  HtmlAttribute: _node => undefined, // TODO: Let's see what's needed
  HtmlEndTag: _node => undefined, // TODO: Let's see what's needed
  HtmlStartTag: _node => undefined, // TODO: Let's see what's needed
  InheritDocTag: _node => undefined, // TODO: Let's see what's needed
  InlineTag: _node => undefined, // TODO: Let's see what's needed
  LinkTag: _node => undefined, // TODO: Let's see what's needed
  MemberIdentifier: _node => undefined, // TODO: Let's see what's needed
  MemberReference: _node => undefined, // TODO: Let's see what's needed
  MemberSelector: _node => undefined, // TODO: Let's see what's needed
  MemberSymbol: _node => undefined, // TODO: Let's see what's needed
  Paragraph: node => renderChildren(node, ' '),
  ParamBlock: () => undefined, // handled by ParamCollection
  ParamCollection: node => {
    if (node.count === 0) {
      return ''
    }

    return renderTable([
      { text: 'Name', field: 'name', align: 'end' },
      { text: 'Descriptions', field: 'description' }
    ], node.blocks.map(block => ({
      name: `\`${block.parameterName}\``,
      description: renderNode(block.content)?.trim() ?? ''
    })))
  },
  PlainText: node => node.text,
  Section: node => renderChildren(node, '\n\n'),
  SoftBreak: () => ' '
}

function renderNode (node: DocNode | null | undefined) {
  if (node == null) {
    return undefined
  }

  return onlyNonEmpty(nodeRenderer[node.kind as DocNodeKind](node as never))
}

function renderChildren (node: DocNode, separator = '') {
  return onlyNonEmpty(node.getChildNodes().map(renderNode).filter(Boolean).join(separator))
}

export function renderComment (comment: DocComment): string {
  return renderNode(comment) ?? ''
}

// Simply stringifies the basic text of a DocNode,
// ignoring all advanced formatting. This
// can be used when getting basic
// names or strings for custom
// tags.

const stringifiers: NodeStringifiers = {
  Block: node => stringifyNode(node.content),
  BlockTag: () => undefined,
  Excerpt: () => undefined,
  FencedCode: () => undefined,
  CodeSpan: () => undefined,
  Comment: node => stringifyNodes(node.getChildNodes()),
  DeclarationReference: () => undefined,
  ErrorText: () => undefined,
  EscapedText: node => node.decodedText,
  HtmlAttribute: () => undefined,
  HtmlEndTag: () => undefined,
  HtmlStartTag: () => undefined,
  InheritDocTag: () => undefined,
  InlineTag: node => node.tagContent,
  LinkTag: node => node.linkText,
  MemberIdentifier: () => undefined,
  MemberReference: () => undefined,
  MemberSelector: () => undefined,
  MemberSymbol: () => undefined,
  Paragraph: node => stringifyNodes(node.nodes),
  ParamBlock: _node => undefined,
  ParamCollection: _node => undefined,
  PlainText: node => node.text,
  Section: node => stringifyNodes(node.nodes),
  SoftBreak: () => ' '
}

export function stringifyNode (node: DocNode | null | undefined) {
  if (node == null) {
    return undefined
  }

  return onlyNonEmpty(stringifiers[node.kind as DocNodeKind](node as never))
}

export function stringifyNodes (nodes: readonly DocNode[]) {
  return onlyNonEmpty(nodes.map(node => stringifyNode(node)).filter(Boolean).join(' '))
}
