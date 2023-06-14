import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Reccent',
  description: 'Recursive descent parser generator for JavaScript',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      {
        text: 'Reference',
        items: [
          { text: 'Nodes', link: '/reference/nodes' },
          { text: 'Grammar', link: '/reference/grammar' },
          { text: 'Parser', link: '/reference/parser' },
          { text: 'Utilities', link: '/reference/utilities' }
        ]
      }
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
      '/reference/': [
        {
          text: 'API',
          collapsed: false,
          items: [
            { text: 'Nodes', link: '/reference/nodes' },
            { text: 'Grammar', link: '/reference/grammar' },
            { text: 'Parser', link: '/reference/parser' },
            { text: 'Utilities', link: '/reference/utilities' }
          ]
        },
      ]
    }
  }
})
