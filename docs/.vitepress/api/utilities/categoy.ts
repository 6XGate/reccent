import { DocBlock } from '@microsoft/tsdoc'
import { isNotNullish } from './basic'
import type { NodeStringifiers } from './handlers'
import type { ApiDeclaredItem } from '@microsoft/api-extractor-model'
import type { DocNode, DocNodeKind } from '@microsoft/tsdoc'

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

  const value = stringifiers[node.kind as DocNodeKind](node as never)?.trim()
  if (value == null) {
    return undefined
  }

  return value.length > 0 ? value : undefined
}

export function stringifyNodes (nodes: readonly DocNode[]) {
  const value = nodes.map(node => stringifyNode(node)).filter(isNotNullish).join(' ').trim()

  return value.length > 0 ? value : undefined
}

function findCategoryNode (node: DocNode): string | undefined {
  if (node instanceof DocBlock && node.blockTag.tagNameWithUpperCase === '@CATEGORY') {
    return stringifyNode(node)
  }

  for (const child of node.getChildNodes()) {
    const category = findCategoryNode(child)
    if (category != null) {
      return category
    }
  }

  return undefined
}

const kDefaultCategory = 'General'

export function findCategory (item: ApiDeclaredItem) {
  return item.tsdocComment != null
    ? findCategoryNode(item.tsdocComment) ?? kDefaultCategory
    : kDefaultCategory
}
