import { z } from 'zod'
import { resolveLinkReference } from '../../utilities/reference'

type Tag = string

type Attributes = Record<string, unknown>

export type JsonChildren = JsonRenderable[]

export interface JsonElement {
  tag: Tag
  props: Attributes
  children: JsonChildren
}

export type JsonRenderable = JsonChildren | JsonElement | string

type Children = Renderable[]

type VElementTag = typeof VElementTag
const VElementTag = Symbol('[[VHTML]]')

export const VElement = z.custom<VElement>(v => v != null && typeof v === 'object' && VElementTag in v)
export interface VElement {
  [VElementTag]: true
  tag: Tag
  props: Attributes
  children: Children
}

export type { Children as RenderChildren }

export function czcomment (_text?: string): Renderable[] | undefined {
  // HACK: Return type needs something other than undefined,
  //       since our ESLint config sees it as void and
  //       doesn't allows the assignment or use of
  //       void in an expression.
  // Don't render comments, just for reference if needed.
  return undefined
}

export function cz (tag: string, props?: Attributes | undefined, children?: Children | undefined): VElement
export function cz (tag: string, children: Children): VElement
export function cz (tag: string, props?: Attributes | Children | undefined, children?: Children | undefined) {
  if (Array.isArray(props)) {
    children = children != null ? [...props, ...children] : props
    props = { }
  }

  return { [VElementTag]: true, tag, props: props ?? { }, children: children ?? [] }
}

export const HtmlStart = Symbol('[[HTML]]')
export type HtmlStart = typeof HtmlStart

export const HtmlEnd = Symbol('[[/HTML]]')
export type HtmlEnd = typeof HtmlEnd

export const HtmlOpen = z.custom<HtmlOpen>(v => v != null && typeof v === 'object' && HtmlStart in v)
export interface HtmlOpen {
  [HtmlStart]: true
  tag: string
  props: Record<string, unknown>
  selfClose: boolean
}

export const HtmlClose = z.custom<HtmlClose>(v => v != null && typeof v === 'object' && HtmlEnd in v)
export interface HtmlClose {
  [HtmlEnd]: true
  tag: string
}

export function cztag (tag: string, props?: Attributes | undefined) {
  return { [HtmlStart]: true, tag, props: props ?? { }, selfClose: true } satisfies HtmlOpen
}

export function czopen (tag: string, props?: Attributes | undefined) {
  return { [HtmlStart]: true, tag, props: props ?? { }, selfClose: false } satisfies HtmlOpen
}

export function czclose (tag: string) {
  return { [HtmlEnd]: true, tag } satisfies HtmlClose
}

export type Renderable = Renderable[] | HtmlOpen | HtmlClose | VElement | string | null | undefined
export const Renderable: z.ZodType<Renderable> = z.lazy(() =>
  z.union([HtmlOpen, HtmlClose, VElement, z.string(), z.array(Renderable)]).nullish()
)

interface RenderableCollection { [Symbol.iterator](): IterableIterator<Renderable> }
type JsonElementIterable = Generator<JsonElement | string, void>

function * convertHtmlSegment (el: HtmlOpen, renderables: IterableIterator<Renderable>): JsonElementIterable {
  for (const renderable of renderables) {
    if (renderable == null) {
      // Filter out nullish nodes.
    } else if (Array.isArray(renderable)) {
      yield * convertRenderableCollection(renderable)
    } else if (typeof renderable === 'string') {
      yield renderable
    } else if (HtmlStart in renderable) {
      yield !renderable.selfClose
        ? { tag: renderable.tag, props: renderable.props, children: [...convertHtmlSegment(renderable, renderables)] }
        : { tag: renderable.tag, props: renderable.props, children: [] }
    } else if (HtmlEnd in renderable && el.tag === renderable.tag) {
      // Finished with this tag.
      return
    } else if (HtmlEnd in renderable) {
      // Another end tag found before the current one ended, meaning this one is an orphan.
      console.warn(`End "${renderable.tag}" element without a start element`)
    } else {
      yield { tag: renderable.tag, props: renderable.props, children: [...convertRenderableCollection(renderable.children)] }
    }
  }
}

function * convertRenderableCollection (collection: RenderableCollection): JsonElementIterable {
  // We need to continue the active iterator in HTML contexts, so lets get a reference to it.
  const renderables = collection[Symbol.iterator]()
  for (const renderable of renderables) {
    if (renderable == null) {
      // Filter out nullish nodes.
    } else if (Array.isArray(renderable)) {
      yield * convertRenderableCollection(renderable)
    } else if (typeof renderable === 'string') {
      yield renderable
    } else if (HtmlStart in renderable) {
      yield !renderable.selfClose
        ? { tag: renderable.tag, props: renderable.props, children: [...convertHtmlSegment(renderable, renderables)] }
        : { tag: renderable.tag, props: renderable.props, children: [] }
    } else if (HtmlEnd in renderable) {
      // End tag while not within the HTML context, meaning it is a orphan.
      console.warn(`End "${renderable.tag}" element without a start element`)
    } else {
      yield { tag: renderable.tag, props: renderable.props, children: [...convertRenderableCollection(renderable.children)] }
    }
  }
}

export function * convertRenderable (renderable?: Renderable | undefined): JsonElementIterable {
  if (renderable == null) {
    // Nothing to yield, end of iteration.
  } else if (Array.isArray(renderable)) {
    yield * convertRenderableCollection(renderable)
  } else if (typeof renderable === 'string') {
    yield renderable
  } else if (HtmlStart in renderable && renderable.selfClose) {
    yield { tag: renderable.tag, props: renderable.props, children: [] }
  } else if (HtmlStart in renderable) {
    // HTML start tag encountered outside of a collection context, so it will be orphaned.
    console.warn(`Start "${renderable.tag}" element without a end element`)
  } else if (HtmlEnd in renderable) {
    // HTML end tag encountered outside the HTML context, so this is likely an orphan.
    console.warn(`End "${renderable.tag}" element without a start element`)
  } else {
    yield { tag: renderable.tag, props: renderable.props, children: [...convertRenderableCollection(renderable.children)] }
  }
}

// export function toVElements (renderable?: Renderable | undefined) {
//   return [...convertRenderable(renderable)]
// }

export function defineLiteElement (render: (children?: Renderable[] | undefined) => Renderable) {
  // This simplifies typing and advertising intention.
  return render
}

export type LiteRenderer<Schema extends z.AnyZodObject | z.ZodDefault<z.AnyZodObject>> =
  (props: z.output<Schema>, children: Renderable[]) => Renderable

export function defineLiteComponent<Schema extends z.AnyZodObject | z.ZodDefault<z.AnyZodObject>> (
  schema: Schema, renderer: LiteRenderer<Schema>) {
  function wrapper (): Renderable
  function wrapper (children: Renderable[]): Renderable
  function wrapper (props: z.input<Schema> | undefined, children?: Renderable[] | undefined): Renderable
  function wrapper (props?: z.input<Schema> | Renderable[] | undefined, children?: Renderable[] | undefined) {
    if (Array.isArray(props)) {
      children = children != null ? [...props, ...children] : props
      props = { }
    } else {
      children = children ?? []
      props = props ?? { }
    }

    return renderer(schema.parse(props), children.flat())
  }

  return wrapper
}

export const NormalSection = defineLiteComponent(
  z.object({ heading: z.string().min(1) }),
  ({ heading }, content) => [
    cz('section', [
      cz('header', [cz('strong', [heading])]),
      ...content
    ])
  ]
)

export const OneLineSection = defineLiteComponent(
  z.object({ heading: z.string().min(1) }),
  ({ heading }, content) => [cz('p', [cz('strong', [heading]), ' - ', ...content])]
)

export const kBadgeType = ['info', 'tip', 'warning', 'danger'] as const
export const BadgeType = z.enum(kBadgeType)
export type BadgeType = z.infer<typeof BadgeType>

// TODO: VitePress badge.
export const Chip = defineLiteComponent(
  z.object({ type: BadgeType.default('info') }).default({}),
  ({ type }, content) => [cz('Badge', { type }, content)]
)

// TODO: VidePress code fence.
export const CodeBlock = defineLiteComponent(
  z.object({ lang: z.string().min(1).default('ts') }).default({}),
  ({ lang }, content) => [cz('div', { class: `language-${lang}` }, [
    cz('pre', [
      czopen('code'),
      ...content.flatMap(part =>
        (typeof part === 'string'
          ? part.split('\n').map((sub, index) => (index > 0 ? [czclose('code'), czopen('code'), sub] : [sub])).flat()
          : part)
      ),
      czclose('code')
    ])
  ])]
)

export const ReferenceLink = defineLiteComponent(
  z.object({ ref: z.string().min(1) }),
  ({ ref }, content) => {
    const href = resolveLinkReference(ref)

    return href != null
      ? [cz('a', { href }, content)]
      : content
  }
)
