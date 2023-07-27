import { resolve as resolvePath } from 'node:path'
import process from 'node:process'
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor'
import { ApiModel } from '@microsoft/api-extractor-model'
import { memo } from 'radash'
import { z } from 'zod'
import { makePath } from '../utilities/paths'
import { convertRenderable } from './components/common'
import { processPackage } from './processor'
import { Page } from './structure'
import type { JsonChildren } from './components/common'
import type { DefaultTheme as Theme } from 'vitepress'

/** Configuration schema. */
const ApiDocumentationConfig = z.object({
  /** The API extractor configuratin. */
  extractorConfig: z.string().min(1)
    .default('api-extractor.json')
    .transform(path => resolvePath(process.cwd(), path))
}).default({ /* use all defaults */ })

/** Configuration options. */
export type ApiDocumentationConfig = z.input<typeof ApiDocumentationConfig>

async function generateApiDoc (config: z.output<typeof ApiDocumentationConfig>) {
  const extractorConifg = ExtractorConfig.loadFileAndPrepare(config.extractorConfig)
  const extractResult = Extractor.invoke(extractorConifg, {
    localBuild: true,
    showVerboseMessages: true
  })

  if (!extractResult.succeeded) {
    throw new Error('API document generation failed')
  }

  const model = new ApiModel()
  processPackage(model.loadPackage(extractorConifg.apiJsonFilePath))

  // In case we do eventually need async later.
  await Promise.resolve()
}

export const useApiDocumentation = memo(() => {
  async function add (config?: ApiDocumentationConfig | undefined) {
    await generateApiDoc(ApiDocumentationConfig.parse(config))
  }

  function getPageData () {
    const data = new Array<{ params: { title: string, item: string, page: JsonChildren } }>()
    const cwd = new Array<string>()

    function innerGetter (page: Page) {
      if (page.sections.size > 0) {
        data.push({
          params: {
            title: page.title,
            item: [...cwd, page.name].join('-'),
            page: [...convertRenderable([...page.render()])]
          }
        })
      }

      cwd.push(page.name)
      try {
        for (const child of page.children.values()) {
          innerGetter(child)
        }
      } finally {
        cwd.pop()
      }
    }

    for (const page of Page.pages.values()) {
      innerGetter(page)
    }

    return data
  }

  function getNavMenu (base: string) {
    if (Page.pages.size === 0) {
      return []
    }

    return [...Page.pages.values()].map((page): Theme.NavItemWithLink =>
      ({ text: page.title, link: `${base}/${makePath(page)}` })
    )
  }

  function makeSideBarItem (base: string, page: Page): Theme.SidebarItem {
    return page.children.size === 0
      ? ({
          text: page.title,
          link: `${base}/${makePath(page)}`
        })
      : ({
          text: page.title,
          collapsed: false,
          link: `${base}/${makePath(page)}`,
          items: [...page.children.values()].map(child => makeSideBarItem(base, child))
        })
  }

  function getSideBar (base: string) {
    if (Page.pages.size === 0) {
      return []
    }

    return [...Page.pages.values()].map(page => makeSideBarItem(base, page))
  }

  return Object.freeze({
    add,
    getPageData,
    getNavMenu,
    getSideBar
  })
})
