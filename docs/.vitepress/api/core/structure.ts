import { ApiItemKind } from '@microsoft/api-extractor-model'
import { makeAnchor } from '../utilities/anchor'
import { PublicArray, PublicMap } from '../utilities/basic'
import { findCategory } from '../utilities/categoy'
import { makePath } from '../utilities/paths'
import { getReference, useReferenceResolver } from '../utilities/reference'
import { cz } from './components/common'
import { ItemContent } from './components/items'
import type { Renderable } from './components/common'
import type { ApiItemHandlers, ApiItemStringifiers, ApiScope, ApiScopeMembers } from '../utilities/handlers'
import type { ApiItem, ApiDeclaredItem } from '@microsoft/api-extractor-model'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for such circular type references.
export abstract class Part<Parent extends Part | null = any, Item extends ApiItem | null = any> {
  /** The parent of the part. */
  readonly #parent: Parent
  /** The item model being documented by the part. */
  readonly #item: Item
  /** The heading for the part. */
  readonly #heading: Renderable | undefined

  constructor (parent: Parent, item: Item, heading: Renderable | undefined) {
    this.#parent = parent
    this.#item = item
    this.#heading = heading
  }

  /** The parent of the part. */
  get parent () { return this.#parent }

  /** The item model being documented by the part. */
  get item () { return this.#item }

  /** The heading for the part. */
  get heading () { return this.#heading }

  abstract render (): Generator<Renderable, void>
}

type ApiItemRenderfiers = ApiItemHandlers<Renderable>

const kPageNamer = {
  CallSignature: () => undefined,
  Class: item => `class_${item.displayName}`,
  ConstructSignature: () => undefined,
  Constructor: () => undefined,
  EntryPoint: () => undefined,
  Enum: () => undefined,
  EnumMember: () => undefined,
  Function: () => undefined,
  IndexSignature: () => undefined,
  Interface: item => `interface_${item.displayName}`,
  Method: () => undefined,
  MethodSignature: () => undefined,
  Model: () => undefined,
  Namespace: item => `namespace_${item.displayName}`,
  None: () => undefined,
  Package: () => undefined,
  Property: () => undefined,
  PropertySignature: () => undefined,
  TypeAlias: () => undefined,
  Variable: () => undefined
} satisfies ApiItemStringifiers

const kPageHeader = {
  CallSignature: () => undefined,
  Class: item => [item.displayName, ' ', cz('em', ['class'])],
  ConstructSignature: () => undefined,
  Constructor: () => undefined,
  EntryPoint: () => undefined,
  Enum: () => undefined,
  EnumMember: () => undefined,
  Function: () => undefined,
  IndexSignature: () => undefined,
  Interface: item => [item.displayName, ' ', cz('em', ['interface'])],
  Method: () => undefined,
  MethodSignature: () => undefined,
  Model: () => undefined,
  Namespace: item => [item.displayName, ' ', cz('em', ['namespace'])],
  None: () => undefined,
  Package: () => undefined,
  Property: () => undefined,
  PropertySignature: () => undefined,
  TypeAlias: () => undefined,
  Variable: () => undefined
} satisfies ApiItemRenderfiers

const kPageTitler = {
  CallSignature: () => undefined,
  Class: item => `${item.displayName} class`,
  ConstructSignature: () => undefined,
  Constructor: () => undefined,
  EntryPoint: () => undefined,
  Enum: () => undefined,
  EnumMember: () => undefined,
  Function: () => undefined,
  IndexSignature: () => undefined,
  Interface: item => `${item.displayName} interface`,
  Method: () => undefined,
  MethodSignature: () => undefined,
  Model: () => undefined,
  Namespace: item => `${item.displayName} namespace`,
  None: () => undefined,
  Package: () => undefined,
  Property: () => undefined,
  PropertySignature: () => undefined,
  TypeAlias: () => undefined,
  Variable: () => undefined
} satisfies ApiItemStringifiers

export class Page extends Part<Page | null, ApiScope | null> {
  /** The link title of the page. */
  readonly #title: string
  /** The identifying name of the page. */
  readonly #name: string
  /** The main section of the page when documenting a scope. */
  readonly #scope: Section | null
  /** Child pages of this page, private mutable version. */
  readonly #children = new PublicMap<string, Page>()
  /** The sections of the document, in order of insertion, private mutable version. */
  readonly #sections = new PublicMap<string, Section>()

  constructor (category: string)
  constructor (parent: Page, item: ApiScope)
  constructor (parent: string | Page, item?: ApiScope | undefined) {
    if (typeof parent === 'string') {
      super(null, null, parent)

      this.#scope = null
      this.#title = parent
      this.#name = parent.toLowerCase()

      Page.#pages.set(parent.toUpperCase(), this)
    } else if (item != null) {
      super(parent, item, Page.#makeHeader(item as never) ?? item.displayName)

      this.#scope = Section.forScope(this, item)
      this.#title = Page.#makeTitle(item) ?? item.displayName
      this.#name = Page.#makeName(item) ?? `${item.kind.toLowerCase()}_${item.displayName}`

      parent.#children.set(this.#name, this)
      Page.#documented.set(item, this)
      const reference = getReference(item)
      if (reference != null) {
        Page.#references.set(reference, this)
      }
    } else {
      throw SyntaxError('Page constructor must be given (string) or (Page, Namespace)')
    }
  }

  /** The link title of the page. */
  get title () { return this.#title }

  /** The identifying name of the page. */
  get name () { return this.#name }

  /** The main section of the page when documenting a scope. */
  get scope () { return this.#scope }

  /** Child pages of this page. */
  get children () { return this.#children.readonly }

  /** The sections of the document, in order of insertion. */
  get sections () { return this.#sections.readonly }

  /** Adds a section to the page. */
  addSection (section: Section) {
    this.#sections.set(section.anchor, section)
    if (section.reference != null) {
      Page.#references.set(section.reference, this)
    }
  }

  override * render (): Generator<Renderable, void> {
    if (this.heading != null) {
      yield cz('h1', { id: 'top' }, [
        this.heading,
        cz('a', { class: 'header-anchor', href: '#top' })
      ])
    }

    for (const section of this.#sections.values()) {
      yield * section.render()
    }
  }

  /** The root pages. */
  static readonly #pages = new PublicMap<string, Page>()

  /** The root pages. */
  static get pages () {
    return Page.#pages.readonly
  }

  /** The documented page-level API items. */
  static readonly #documented = new PublicMap<ApiDeclaredItem, Page>()

  /** The documented page-level API items. */
  static get documented () {
    return Page.#documented.readonly
  }

  /** All of the referenced API items on the pages. */
  static readonly #references = new PublicMap<string, Page>()

  /** All of the referenced API items on the pages. */
  static get references () {
    return Page.#references.readonly
  }

  /** Creates the name for a page. */
  static #makeName (item: ApiItem) {
    return kPageNamer[item.kind](item as never)
  }

  /** Creates the header for a page. */
  static #makeHeader (item: ApiItem) {
    return kPageHeader[item.kind](item as never)
  }

  /** Creates the link title for a page. */
  static #makeTitle (item: ApiItem) {
    return kPageTitler[item.kind](item as never)
  }

  /** Gets the page for the member parent. */
  static forParent (item: ApiDeclaredItem): Page {
    switch (item.parent?.kind) {
      case ApiItemKind.Model:
      case ApiItemKind.Package:
      case ApiItemKind.EntryPoint:
      case undefined:
        // Use the item category
        // TODO: Get the proper category.
        return Page.forCategory(findCategory(item))
      case ApiItemKind.Namespace:
      case ApiItemKind.Interface:
      case ApiItemKind.Class:
        // Use another namespace document.
        return Page.forScope(item.parent as ApiScope)
      default:
        throw new SyntaxError(`${item.kind} may only belong to a namespace or package`)
    }
  }

  /** Gets the page for a category. */
  static forCategory (category: string) {
    const id = category.toUpperCase()

    let page = Page.#pages.get(id)
    if (page != null) {
      return page
    }

    Page.#pages.set(id, page = new Page(category))

    return page
  }

  /** Gets the page for an API item. */
  static forScope (item: ApiScope) {
    // Look for an existing document to the namespace.
    let page = Page.#documented.get(item)
    if (page != null) {
      return page
    }

    // Find or create the parent.
    const parent = Page.forParent(item)

    // Look for another documented item with the same name
    // and kind. In case the item was augmented.
    page = parent.children.get(`${item.kind.toLowerCase()}-${item.displayName}`)
    if (page != null) {
      // Add to the existing page and map this item to it.
      // The section will handle the merging work.
      Section.forScope(page, item)
      Page.#documented.set(item, page)

      return page
    }

    // Create a new document.
    return new Page(parent, item)
  }

  /** Gets the page for the specified reference. */
  static forReference (ref: string) {
    return Page.#references.get(ref)
  }
}

const kSectionHeader = {
  CallSignature: item => [item.parent.displayName, ' ', cz('em', ['call signature'])],
  Class: () => undefined,
  ConstructSignature: item => [item.parent.displayName, ' ', cz('em', ['constructor signature'])],
  Constructor: item => [item.parent.displayName, ' ', cz('em', ['constructor'])],
  EntryPoint: () => undefined,
  Enum: item => [item.displayName, ' ', cz('em', ['enum'])],
  EnumMember: item => [item.parent.displayName, '.', item.displayName, ' ', cz('em', ['value'])],
  Function: item => [item.displayName, ' ', cz('em', ['function'])],
  IndexSignature: item => [item.parent.displayName, ' ', cz('em', [cz('code', ['[index]']), 'signature'])],
  Interface: () => undefined,
  Method: item => (item.isStatic
    ? [item.parent.displayName, ': ', item.displayName, ' ', cz('em', ['static method'])]
    : [item.parent.displayName, ': ', item.displayName, ' ', cz('em', ['method'])]),
  MethodSignature: item => [item.parent.displayName, ': ', item.displayName, ' ', cz('em', ['method'])],
  Model: () => undefined,
  Namespace: () => undefined,
  None: () => undefined,
  Package: () => undefined,
  Property: item => (item.isStatic
    ? [item.parent.displayName, ': ', item.displayName, ' ', cz('em', ['static property'])]
    : [item.parent.displayName, ': ', item.displayName, ' ', cz('em', ['property'])]),
  PropertySignature: item => [item.parent.displayName, ': ', item.displayName, ' ', cz('em', ['property'])],
  TypeAlias: item => [item.displayName, ' ', cz('em', ['type'])],
  Variable: item => (item.isReadonly
    ? [item.displayName, ' ', cz('em', ['constant'])]
    : [item.displayName, ' ', cz('em', ['variable'])])
} satisfies ApiItemRenderfiers

export class Section extends Part<Page, ApiDeclaredItem> {
  /** The anchor for the section. */
  readonly #anchor: string
  /** The reference for the section. */
  readonly #reference: string | undefined
  /** The content block of the section. */
  readonly #content = new PublicArray<Block>()

  constructor (page: Page, item: ApiDeclaredItem) {
    super(page, item, Section.#makeHeader(item))

    this.#anchor = makeAnchor(item)
    this.#reference = getReference(item)

    this.#content.push(new Block(this, item))
    page.addSection(this)

    Section.#documented.set(item, this)
    if (this.reference != null) {
      Section.#references.set(this.reference, this)
    }
  }

  /** The anchor for the section. */
  get anchor () { return this.#anchor }

  /** The reference for the section. */
  get reference () { return this.#reference }

  /** The reference for the section. */
  get content () { return this.#content.readonly }

  static * #renderSection (section: Section) {
    if (section.heading != null) {
      yield cz('h2', { id: section.anchor }, [
        section.heading,
        cz('a', { class: 'header-anchor', href: `#${section.anchor}` })
      ])
    }

    if (section.content.length > 1) {
      for (const block of section.content) {
        yield cz('section', [...block.render()])
      }
    } else {
      for (const block of section.content) {
        yield * block.render()
      }
    }
  }

  override * render (): Generator<Renderable, void> {
    yield cz('section', [...Section.#renderSection(this)])
  }

  static #makeHeader (item: ApiItem) {
    return kSectionHeader[item.kind](item as never)
  }

  /** The documented API items. */
  static readonly #documented = new PublicMap<ApiDeclaredItem, Section>()

  /** The documented API items. */
  static get documented () {
    return Section.#documented.readonly
  }

  /** All of the referenced API items for the sections. */
  static readonly #references = new PublicMap<string, Section>()

  /** All of the referenced API items for the sections. */
  static get references () {
    return Section.#references.readonly
  }

  static forScope (page: Page, scope: ApiScope) {
    // If this scope is already documented, return the section.
    let section = Section.#documented.get(scope) ?? null
    if (section != null) {
      return section
    }

    // If the page already has a scope section, merge this
    // augmentation with that one.
    section = page.scope
    if (section != null) {
      section.#content.push(new Block(section, scope))
      Section.#documented.set(scope, section)

      return section
    }

    // Create a new section for this scope.
    return new Section(page, scope)
  }

  static forMember (item: ApiScopeMembers) {
    // If this member is already documented, return the section.
    let section = Section.#documented.get(item) ?? null
    if (section != null) {
      return section
    }

    // Find the page for the member's scope.
    const page = Page.forParent(item)

    // If the page already has a section for this member,
    // merge this augmentation or overload
    // with that section.
    section = page.sections.get(makeAnchor(item)) ?? null
    if (section != null) {
      section.#content.push(new Block(section, item))
      Section.#documented.set(item, section)

      return section
    }

    // Create a new section for this member.
    return new Section(page, item)
  }

  /** Gets the page for the specified section. */
  static forReference (ref: string) {
    return Section.#references.get(ref)
  }
}

// Maybe on blocks, if we can determine headered sections.
export class Block extends Part<Section, ApiDeclaredItem> {
  constructor (parent: Section, item: ApiDeclaredItem) {
    super(parent, item, undefined)
  }

  override * render (): Generator<Renderable, void> {
    yield ItemContent({ item: this.item })
  }
}

const referenceResolver = useReferenceResolver()
referenceResolver.push(reference => {
  const page = Page.forReference(reference)
  const section = Section.forReference(reference)
  if (page == null || section == null) {
    return undefined
  }

  return `${makePath(page)}#${section.anchor}`
})
