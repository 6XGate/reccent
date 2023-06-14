import { ApiItemKind } from '@microsoft/api-extractor-model'
import { DocBlock } from '@microsoft/tsdoc'
import { renderComment, stringifyNode } from './render'
import { isApiKind } from './utilities'
import type { ApiScopeMembers, ApiStructureMembers, ApiItemStringifiers } from './utilities'
import type { ApiNamespace, ApiItem, ApiDocumentedItem, ApiEnum } from '@microsoft/api-extractor-model'
import type { DocNode } from '@microsoft/tsdoc'

/*
Anchor format:
  - **name**
    >  Will be any valid identifier to TypeScript.
  - **spaceName**_
    > The name of a class, interface, namspace. Specific kind of **name**.
  - **memberName**
    > The name of a member of any class, interface or namespace. Specific kind of **name**.
  - Namespaces are the document file itself:
    > **name** ( `/` **name** )*
  - Global or namespace data member; such as variable, class, enum, or function :
    > `[let]` **name**
  - Global or namespace type member; such as alias or interface:
    > `[type]` **name**
  - Static member of a class:
    > `[static]` **spaceName** `.` **memberName**
  - Instance member of class:
    > `[this]` **spaceName** `.` **memberName**
  - Member of an interface:
    > `[obj]` **spaceName** `.` **memberName**
*/

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

function findCategory (item: ApiDocumentedItem) {
  return item.tsdocComment != null
    ? findCategoryNode(item.tsdocComment) ?? kDefaultCategory
    : kDefaultCategory
}

export class Part {
  readonly #parent: Part | null

  readonly #item: ApiItem | null

  readonly #heading: string | undefined

  constructor (parent: Part | null, item: ApiItem | null, heading: string | undefined) {
    this.#parent = parent
    this.#item = item
    this.#heading = heading
  }

  get parent () { return this.#parent }

  get item () { return this.#item }

  get heading () { return this.#heading }

  static #headerMakers: ApiItemStringifiers = {
    [ApiItemKind.CallSignature]: item => `${item.parent.displayName}: _call signature_`,
    [ApiItemKind.Class]: item => `${item.displayName} _class_`,
    [ApiItemKind.ConstructSignature]: item => `${item.parent.displayName}() _constructor signature_`,
    [ApiItemKind.Constructor]: item => `${item.parent.displayName}() _constructor_`,
    [ApiItemKind.EntryPoint]: () => undefined,
    [ApiItemKind.Enum]: item => `${item.displayName} _enum_`,
    [ApiItemKind.EnumMember]: item => `${item.parent.displayName}.${item.displayName} _value_`,
    [ApiItemKind.Function]: item => `${item.displayName} _function_`,
    [ApiItemKind.IndexSignature]: item => `${item.parent.displayName}: _[index]_`,
    [ApiItemKind.Interface]: item => `${item.displayName} _interface_`,
    [ApiItemKind.Method]: item => (item.isStatic
      ? `${item.parent.displayName}: ${item.displayName} _static method_`
      : `${item.parent.displayName}: ${item.displayName} _method_`),
    [ApiItemKind.MethodSignature]: item => `${item.parent.displayName}: ${item.displayName} _method_`,
    [ApiItemKind.Model]: () => undefined,
    [ApiItemKind.Namespace]: () => undefined, // Only page: item => `${item.displayName} _namespace_`,
    [ApiItemKind.None]: () => undefined,
    [ApiItemKind.Package]: () => undefined,
    [ApiItemKind.Property]: item => (item.isStatic
      ? `${item.parent.displayName}: ${item.displayName} _static property_`
      : `${item.parent.displayName}: ${item.displayName} _property_`),
    [ApiItemKind.PropertySignature]: item => `${item.parent.displayName}: ${item.displayName} _property_`,
    [ApiItemKind.TypeAlias]: item => `${item.displayName} _type_`,
    [ApiItemKind.Variable]: item => (item.isReadonly
      ? `${item.displayName} _constant_`
      : `${item.displayName} _variable_`)
  }

  protected static makeHeader (item: ApiItem) {
    return Part.#headerMakers[item.kind](item as never)
  }

  protected static makeAnchor (item: ApiItem) {
    const parent = item.parent
    switch (parent?.kind) {
      case ApiItemKind.Class:
        return (isApiKind(ApiItemKind.Method, item) || isApiKind(ApiItemKind.Property, item)) && item.isStatic
          ? `[Static:${item.kind}]${parent.displayName}.${item.displayName}`
          : `[${item.kind}]${parent.displayName}.${item.displayName}`
      case ApiItemKind.Interface:
      case ApiItemKind.Enum:
        return `[${item.kind}]${parent.displayName}.${item.displayName}`
      case undefined:
      case null:
      default:
        return `[${item.kind}]${item.displayName}`
    }
  }
}

export class MultiSectionPart extends Part {
  #members = new Map<string, Section>()

  #sections = new Array<Section>()

  get members () { return this.#members }

  get sections () { return this.#sections }
}

export class Page extends MultiSectionPart {
  readonly #name: string

  readonly #children = new Map<string, Page>()

  readonly #namespace: Section | null

  constructor (category: string)
  constructor (parent: Page, item: ApiNamespace)
  constructor (parent: string | Page, item?: ApiNamespace | undefined) {
    super(
      typeof parent !== 'string' ? parent : null,
      item ?? null,
      typeof parent === 'string' ? parent : `${item?.displayName ?? ''} _namespace_`
    )

    if (typeof parent === 'string') {
      this.#namespace = null
      this.#name = parent.toLowerCase()

      Page.#pages.set(parent.toUpperCase(), this)
    } else if (item != null) {
      this.#namespace = Section.forNamespace(this, item)
      this.#name = item.displayName

      parent.#children.set(item.displayName, this)
      Page.#documented.set(item, this)
    } else {
      throw SyntaxError('Page constructor must be given (string) or (Page, Namespace)')
    }
  }

  get name () { return this.#name }

  get children () { return this.#children }

  get namespace () { return this.#namespace }

  /** Top-level pages, which are based on API categories. */
  static readonly #pages = new Map<string, Page>()

  static readonly #documented = new WeakMap<ApiItem, Page>()

  /** Gets the top-level pages, which are based on API categories. */
  static pages () {
    return this.#pages.values()
  }

  static forParent (item: ApiDocumentedItem): Page {
    switch (item.parent?.kind) {
      case ApiItemKind.Model:
      case ApiItemKind.Package:
      case ApiItemKind.EntryPoint:
      case undefined:
        // Use the item category
        // TODO: Get the proper category.
        return Page.forCategory(findCategory(item))
      case ApiItemKind.Namespace:
        // Use another namespace document.
        return Page.forNamespace(item.parent as ApiNamespace)
      default:
        throw new SyntaxError(`${item.kind} may only belong to a namespace or package`)
    }
  }

  static forCategory (category: string) {
    const id = category.toUpperCase()

    let page = Page.#pages.get(id)
    if (page != null) {
      return page
    }

    Page.#pages.set(id, page = new Page(category))

    return page
  }

  static forNamespace (ns: ApiNamespace) {
    // Look for an existing document to the namespace.
    let page = Page.#documented.get(ns)
    if (page != null) {
      return page
    }

    // Determine or craete the parent.
    const parent = Page.forParent(ns)

    // Look for another documented namespace with the same name.
    // In case the namespace was augmented.
    page = parent.#children.get(ns.displayName)
    if (page != null) {
      // Add to the existing page and map this namespace to it.
      // The section will handle the merging work.
      Section.forNamespace(page, ns)
      Page.#documented.set(ns, page)

      return page
    }

    // Create a new document, will make
    // this section its namespace.
    return new Page(parent, ns)
  }
}

export class Section extends MultiSectionPart {
  readonly #anchor: string | undefined

  readonly #content = new Array<Block>()

  constructor (parent: Page | Section, item: ApiDocumentedItem) {
    super(parent, item, Part.makeHeader(item))

    this.#anchor = Part.makeAnchor(item)

    this.content.push(new Block(this, item))
    parent.sections.push(this)
    parent.members.set(this.#anchor, this)

    Section.#documented.set(item, this)
  }

  get anchor () { return this.#anchor }

  get content () { return this.#content }

  static readonly #documented = new WeakMap<ApiItem, Section>()

  /** Gets the section for a parent class or interface. */
  static forParent (item: ApiStructureMembers) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Sanity check.
    if (item.parent == null) {
      throw new SyntaxError(`"${item.displayName}" ${item.kind} must be the member of a class, interface, or enum`)
    }

    const parent = Section.#documented.get(item.parent)
    if (parent != null) {
      return parent
    }

    switch (item.parent.kind) {
      case ApiItemKind.Class: return Section.forScopeMember(item.parent)
      case ApiItemKind.Interface: return Section.forScopeMember(item.parent)
      // case ApiItemKind.Enum: throw new Error('Not yet implemented') // TODO: This needs special handling...
      default: throw new ReferenceError(`"${item.kind}" may not be a member of ${item.parent.kind}`)
    }
  }

  static forNamespace (page: Page, ns: ApiNamespace) {
    // If this section is already documented, return the section.
    let section = Section.#documented.get(ns) ?? null
    if (section != null) {
      return section
    }

    section = page.namespace
    if (section != null) {
      section.#content.push(new Block(section, ns))
      Section.#documented.set(ns, section)

      return section
    }

    // Namespace sections will not have their own headers,
    // that will belong to the page.
    return new Section(page, ns)
  }

  /** Generic top-level API item handling. */
  static forScopeMember (item: ApiScopeMembers) {
    let section = Section.#documented.get(item) ?? null
    if (section != null) {
      return section
    }

    const page = Page.forParent(item)

    section = page.members.get(Part.makeAnchor(item)) ?? null
    if (section != null) {
      section.#content.push(new Block(section, item))
      Section.#documented.set(item, section)

      return section
    }

    return new Section(page, item)
  }

  static forStructureMember (item: ApiStructureMembers) {
    let section = Section.#documented.get(item) ?? null
    if (section != null) {
      return section
    }

    const parent = Section.forParent(item)

    section = parent.members.get(Part.makeAnchor(item)) ?? null
    if (section != null) {
      section.#content.push(new Block(section, item))
      Section.#documented.set(item, section)

      return section
    }

    return new Section(parent, item)
  }

  /** Special handling for enum to put members in a table. */
  static forEnum (item: ApiEnum) {
    // TODO
    return Section.forScopeMember(item)
  }
}

// Maybe on blocks, if we can determine headered sections.
export class Block extends Part {
  #text: string

  constructor (parent: Section, item: ApiDocumentedItem) {
    super(parent, item, undefined)
    this.#text = item.tsdocComment != null
      ? renderComment(item.tsdocComment)
      : ''
  }

  get text () { return this.#text }
}
