import VPBadge from 'vitepress/dist/client/theme-default/components/VPBadge.vue'
import { defineComponent, h } from 'vue'
import type { JsonChildren, JsonElement } from '../core/components/common'
import type { VNode, PropType } from 'vue'

/** Locally used components mapped to their serialized names. */
// HACK: Local component registration seems to only work
//       in SFC, but not in pure code components.
//       Likely missing a step, but this is
//       a simple enough workaround.
const localComponents = new Map([
  ['Badge', VPBadge]
])

/** Creates a VNode from a JSON element. */
function makeVNode (part: JsonElement) {
  const component = localComponents.get(part.tag)

  return component != null
    ? h(component, part.props, [...toVNodes(part.children)])
    : h(part.tag, part.props, [...toVNodes(part.children)])
}

/** Converts JSON serialized markup info VNodes and strings. */
function * toVNodes (content: JsonChildren): Generator<VNode | string> {
  for (const part of content) {
    if (Array.isArray(part)) {
      yield * toVNodes(part)
    } else if (typeof part === 'string') {
      yield part
    } else {
      yield makeVNode(part)
    }
  }
}

/** An API documentation content page. */
const ContentPage = defineComponent({
  name: 'ContentPage',
  props: { page: { type: Array as PropType<JsonChildren>, required: true } },
  setup (props) { return () => [...toVNodes(props.page)] }
})

export default ContentPage
