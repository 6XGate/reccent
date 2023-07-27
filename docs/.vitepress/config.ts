import { defineConfig } from 'vitepress'
import { useApiDocumentation } from './api'

async function getConfig () {
  const apiDocs = useApiDocumentation()
  await apiDocs.add()

  return defineConfig({
    title: 'Reccent',
    description: 'Recursive descent parser generator for JavaScript',
    themeConfig: {
      nav: [
        { text: 'Guide', link: '/guide/' },
        { text: 'Reference', items: apiDocs.getNavMenu('/reference') }
      ],
      sidebar: {
        '/guide/': [
          {
            text: 'Introduction',
            collapsed: false,
            items: [
              { text: 'What is Reccent?', link: '/guide/' },
              { text: 'Getting Started', link: '/guide/starting' }
            ]
          },
          {
            text: 'Grammar',
            collapsed: false,
            items: [
              { text: 'Types of Grammar', link: '/guide/grammar/types' },
              { text: 'Terminal Grammar', link: '/guide/grammar/terminals' },
              { text: 'Non-terminal Grammar', link: '/guide/grammar/non-terminals' }
            ]
          },
          { text: 'Basic Syntax Tree', link: '/guide/tree' },
          { text: 'Parsing', link: '/guide/parsing' }
        ],
        '/reference/': apiDocs.getSideBar('/reference')
      }
    }
  })
}

export default getConfig
