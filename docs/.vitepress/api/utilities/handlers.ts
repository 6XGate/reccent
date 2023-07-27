import type {
  ApiItemKind,
  ApiCallSignature,
  ApiClass,
  ApiConstructSignature,
  ApiConstructor,
  ApiEntryPoint,
  ApiEnum,
  ApiEnumMember,
  ApiFunction,
  ApiIndexSignature,
  ApiInterface,
  ApiMethod,
  ApiMethodSignature,
  ApiModel,
  ApiNamespace,
  ApiItem,
  ApiPackage,
  ApiProperty,
  ApiPropertySignature,
  ApiTypeAlias,
  ApiVariable
} from '@microsoft/api-extractor-model'
import type {
  DocBlock,
  DocBlockTag,
  DocCodeSpan,
  DocComment,
  DocDeclarationReference,
  DocErrorText,
  DocEscapedText,
  DocExcerpt,
  DocFencedCode,
  DocHtmlAttribute,
  DocHtmlEndTag,
  DocHtmlStartTag,
  DocInheritDocTag,
  DocInlineTag,
  DocLinkTag,
  DocMemberIdentifier,
  DocMemberReference,
  DocMemberSelector,
  DocMemberSymbol,
  DocNode,
  DocNodeKind,
  DocParagraph,
  DocParamBlock,
  DocParamCollection,
  DocPlainText,
  DocSection,
  DocSoftBreak
} from '@microsoft/tsdoc'

declare module '@microsoft/api-extractor-model' {
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiCallSignature { parent: ApiStrcuture }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiClass { parent: ApiScope }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiConstructSignature { parent: ApiStrcuture }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiConstructor { parent: ApiClass }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiEntryPoint { parent: ApiPackage } // FIXME: Complete?
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiEnum { parent: ApiScope }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiEnumMember { parent: ApiEnum }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiFunction { parent: ApiScope }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiIndexSignature { parent: ApiStrcuture }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiInterface { parent: ApiScope }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiMethod { parent: ApiClass }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiMethodSignature { parent: ApiStrcuture }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiModel { parent: undefined } // FIXME: Complete?
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiNamespace { parent: ApiScope }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiPackage { parent: ApiModel } // FIXME: Complete?
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiProperty { parent: ApiClass }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiPropertySignature { parent: ApiStrcuture }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiTypeAlias { parent: ApiScope }
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Augmenting interface.
  interface ApiVariable { parent: ApiScope }
}

export type ApiStrcuture =
  | ApiInterface
  | ApiClass
export type ApiScope =
  | ApiNamespace
  | ApiStrcuture
export type ApiScopeMembers =
  | ApiEnum
  | ApiFunction
  | ApiTypeAlias
  | ApiVariable
  // export type ApiStructureMembers =
  | ApiCallSignature
  | ApiConstructSignature
  | ApiConstructor
  | ApiIndexSignature
  | ApiMethod
  | ApiMethodSignature
  | ApiProperty
  | ApiPropertySignature

export interface ApiMetaData<Item extends ApiItem, Kind extends ApiItemKind> {
  item: Item
  kind: Kind
}

export interface ApiKindMetaData {
  CallSignature: ApiMetaData<ApiCallSignature, ApiItemKind.CallSignature>
  Class: ApiMetaData<ApiClass, ApiItemKind.Class>
  ConstructSignature: ApiMetaData<ApiConstructSignature, ApiItemKind.ConstructSignature>
  Constructor: ApiMetaData<ApiConstructor, ApiItemKind.Constructor>
  EntryPoint: ApiMetaData<ApiEntryPoint, ApiItemKind.EntryPoint>
  Enum: ApiMetaData<ApiEnum, ApiItemKind.Enum>
  EnumMember: ApiMetaData<ApiEnumMember, ApiItemKind.EnumMember>
  Function: ApiMetaData<ApiFunction, ApiItemKind.Function>
  IndexSignature: ApiMetaData<ApiIndexSignature, ApiItemKind.IndexSignature>
  Interface: ApiMetaData<ApiInterface, ApiItemKind.Interface>
  Method: ApiMetaData<ApiMethod, ApiItemKind.Method>
  MethodSignature: ApiMetaData<ApiMethodSignature, ApiItemKind.MethodSignature>
  Model: ApiMetaData<ApiModel, ApiItemKind.Model>
  Namespace: ApiMetaData<ApiNamespace, ApiItemKind.Namespace>
  None: ApiMetaData<ApiItem, ApiItemKind.None>
  Package: ApiMetaData<ApiPackage, ApiItemKind.Package>
  Property: ApiMetaData<ApiProperty, ApiItemKind.Property>
  PropertySignature: ApiMetaData<ApiPropertySignature, ApiItemKind.PropertySignature>
  TypeAlias: ApiMetaData<ApiTypeAlias, ApiItemKind.TypeAlias>
  Variable: ApiMetaData<ApiVariable, ApiItemKind.Variable>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required to match any arguments.
export type ApiItemHandlers<Result, Args extends any[] = never> = {
  [Kind in ApiItemKind]: (item: ApiKindMetaData[Kind]['item'], ...args: Args) => Result
}

export type ApiItemData<Data> = {
  [Kind in ApiItemKind]: Data
}

/*
# Handler Template
const name: Type = {
  CallSignature: () => { throw new Error('not implemented') },
  Class: () => { throw new Error('not implemented') },
  ConstructSignature: () => { throw new Error('not implemented') },
  Constructor: () => { throw new Error('not implemented') },
  EntryPoint: () => { throw new Error('not implemented') },
  Enum: () => { throw new Error('not implemented') },
  EnumMember: () => { throw new Error('not implemented') },
  Function: () => { throw new Error('not implemented') },
  IndexSignature: () => { throw new Error('not implemented') },
  Interface: () => { throw new Error('not implemented') },
  Method: () => { throw new Error('not implemented') },
  MethodSignature: () => { throw new Error('not implemented') },
  Model: () => { throw new Error('not implemented') },
  Namespace: () => { throw new Error('not implemented') },
  None: () => { throw new SyntaxError('No model should be of the None kind') },
  Package: () => { throw new Error('not implemented') },
  Property: () => { throw new Error('not implemented') },
  PropertySignature: () => { throw new Error('not implemented') },
  TypeAlias: () => { throw new Error('not implemented') },
  Variable: () => { throw new Error('not implemented') }
}
*/

export type ApiItemStringifiers = ApiItemHandlers<string | undefined>

export function isApiKind<Kind extends ApiItemKind> (kind: Kind, item: ApiItem): item is ApiKindMetaData[Kind]['item'] {
  return item.kind === kind
}

export interface NodeMetaData<Node extends DocNode, Kind extends DocNodeKind> {
  node: Node
  kind: Kind
}

export interface NodeKindMetaData {
  Block: NodeMetaData<DocBlock, DocNodeKind.Block>
  BlockTag: NodeMetaData<DocBlockTag, DocNodeKind.BlockTag>
  Excerpt: NodeMetaData<DocExcerpt, DocNodeKind.Excerpt>
  FencedCode: NodeMetaData<DocFencedCode, DocNodeKind.FencedCode>
  CodeSpan: NodeMetaData<DocCodeSpan, DocNodeKind.CodeSpan>
  Comment: NodeMetaData<DocComment, DocNodeKind.Comment>
  DeclarationReference: NodeMetaData<DocDeclarationReference, DocNodeKind.DeclarationReference>
  ErrorText: NodeMetaData<DocErrorText, DocNodeKind.ErrorText>
  EscapedText: NodeMetaData<DocEscapedText, DocNodeKind.EscapedText>
  HtmlAttribute: NodeMetaData<DocHtmlAttribute, DocNodeKind.HtmlAttribute>
  HtmlEndTag: NodeMetaData<DocHtmlEndTag, DocNodeKind.HtmlEndTag>
  HtmlStartTag: NodeMetaData<DocHtmlStartTag, DocNodeKind.HtmlStartTag>
  InheritDocTag: NodeMetaData<DocInheritDocTag, DocNodeKind.InheritDocTag>
  InlineTag: NodeMetaData<DocInlineTag, DocNodeKind.InlineTag>
  LinkTag: NodeMetaData<DocLinkTag, DocNodeKind.LinkTag>
  MemberIdentifier: NodeMetaData<DocMemberIdentifier, DocNodeKind.MemberIdentifier>
  MemberReference: NodeMetaData<DocMemberReference, DocNodeKind.MemberReference>
  MemberSelector: NodeMetaData<DocMemberSelector, DocNodeKind.MemberSelector>
  MemberSymbol: NodeMetaData<DocMemberSymbol, DocNodeKind.MemberSymbol>
  Paragraph: NodeMetaData<DocParagraph, DocNodeKind.Paragraph>
  ParamBlock: NodeMetaData<DocParamBlock, DocNodeKind.ParamBlock>
  ParamCollection: NodeMetaData<DocParamCollection, DocNodeKind.ParamCollection>
  PlainText: NodeMetaData<DocPlainText, DocNodeKind.PlainText>
  Section: NodeMetaData<DocSection, DocNodeKind.Section>
  SoftBreak: NodeMetaData<DocSoftBreak, DocNodeKind.SoftBreak>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required to match any arguments.
export type DocNodeHandlers<Result, Args extends any[] = never> = {
  [Kind in DocNodeKind]: (item: NodeKindMetaData[Kind]['node'], ...args: Args) => Result
}

export type DocNodeData<Data> = {
  [Kind in DocNodeKind]: Data
}

/*
# Handler Template
const name: Type = {
  Block: () => { throw new Error('not implemented') },
  BlockTag: () => { throw new Error('not implemented') },
  Excerpt: () => { throw new Error('not implemented') },
  FencedCode: () => { throw new Error('not implemented') },
  CodeSpan: () => { throw new Error('not implemented') },
  Comment: () => { throw new Error('not implemented') },
  DeclarationReference: () => { throw new Error('not implemented') },
  ErrorText: () => { throw new Error('not implemented') },
  EscapedText: () => { throw new Error('not implemented') },
  HtmlAttribute: () => { throw new Error('not implemented') },
  HtmlEndTag: () => { throw new Error('not implemented') },
  HtmlStartTag: () => { throw new Error('not implemented') },
  InheritDocTag: () => { throw new Error('not implemented') },
  InlineTag: () => { throw new Error('not implemented') },
  LinkTag: () => { throw new Error('not implemented') },
  MemberIdentifier: () => { throw new Error('not implemented') },
  MemberReference: () => { throw new Error('not implemented') },
  MemberSelector: () => { throw new Error('not implemented') },
  MemberSymbol: () => { throw new Error('not implemented') },
  Paragraph: () => { throw new Error('not implemented') },
  ParamBlock: () => { throw new Error('not implemented') },
  ParamCollection: () => { throw new Error('not implemented') },
  PlainText: () => { throw new Error('not implemented') },
  Section: () => { throw new Error('not implemented') },
  SoftBreak: () => { throw new Error('not implemented') },
}
*/

export type NodeStringifiers = DocNodeHandlers<string | undefined>
