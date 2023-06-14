import { mkdir, open } from 'node:fs/promises'
import { resolve as resolvePath } from 'node:path'
// import { normalize as webNormalizePath, join as webJoinPath } from 'node:path/posix'
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor'
import { ApiModel } from '@microsoft/api-extractor-model'
import { Page } from './document'
import { processPackage } from './process'
import type { Block, Section } from './document'
import type { FileHandle } from 'node:fs/promises'

/* eslint-env node */

async function run () {
  // Load the configuration file.
  const apiExtractorConfigPath = resolvePath(process.cwd(), 'api-extractor.json')
  const apiExtractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorConfigPath)

  // Parse the code documentation.
  const result = Extractor.invoke(apiExtractorConfig, {
    localBuild: true,
    showVerboseMessages: true
  })

  if (!result.succeeded) {
    console.error(`API extration failed with ${result.errorCount} errors`)

    return 1
  }

  console.log('API extration done... generating markdown')
  const model = new ApiModel()
  const pkg = model.loadPackage(apiExtractorConfig.apiJsonFilePath)
  // echoStruct(pkg)
  processPackage(pkg)
  await writeOut()

  return 0
}

// function echoStruct (parent: ApiItem, level = 0) {
//   console.log(`${' '.repeat(level * 2)}- ${parent.kind} -- ${parent.displayName}`)
//
//   ++level
//   for (const member of parent.members) {
//     echoStruct(member, level)
//   }
// }

// function echoStruct (at: Page | Section | Block, level = 0) {
//   if (at instanceof Page) {
//     console.log(`${' '.repeat(level * 2)}- Document: ${at.heading ?? ''}`)
//     for (const child of at.children.values()) {
//       echoStruct(child, level + 1)
//     }
//
//     for (const section of at.sections.values()) {
//       echoStruct(section, level + 1)
//     }
//
//     // for (const block of at.content) {
//     //   echoStruct(block, level + 1)
//     // }
//   }
//
//   if (at instanceof Section) {
//     console.log(`${' '.repeat(level * 2)}- Section: ${at.heading ?? ''}`)
//     for (const block of at.content) {
//       echoStruct(block, level + 1)
//     }
//
//     for (const section of at.sections.values()) {
//       echoStruct(section, level + 1)
//     }
//   }
//
//   if (at instanceof Block) {
//     console.log(`${' '.repeat(level * 2)}- Block: ${at.text.length > 0 ? `\n${at.text.trim()}` : ''}`)
//   }
// }

async function writeOutBlock (file: FileHandle, block: Block, level: number) {
  if (block.heading != null && block.heading.length > 0) {
    await file.write(`${'#'.repeat(level)} ${block.heading}\n\n`)
  }

  await file.write(`${block.text}\n\n`)
}

async function writeOutSection (file: FileHandle, section: Section, level: number) {
  if (section.heading != null && section.heading.length > 0) {
    await file.write(section.anchor != null && section.anchor.length > 0
      ? `${'#'.repeat(level)} ${section.heading} {#${section.anchor}}\n\n`
      : `${'#'.repeat(level)} ${section.heading}\n\n`)
  }

  for (const block of section.content) {
    await writeOutBlock(file, block, level + 1)
  }

  for (const subSection of section.sections) {
    await writeOutSection(file, subSection, level + 1)
  }
}

async function writeOutContent (file: FileHandle, page: Page, level = 1) {
  if (page.heading != null && page.heading.length > 0) {
    await file.write(`${'#'.repeat(level)} ${page.heading} {#top}\n\n`)
  }

  for (const section of page.sections) {
    await writeOutSection(file, section, level + 1)
  }
}

async function writeOutPages (outDir: string, pages: Iterable<Page>) {
  await mkdir(outDir, { recursive: true, mode: 0o755 })

  return [...pages].map(async page => { await writeOutPage(outDir, page) })
}

async function writeOutPage (outDir: string, page: Page) {
  const operations = new Array<Promise<unknown>>()

  if (page.sections.length > 0) {
    const outPath = resolvePath(outDir, `${page.name}.md`)
    const file = await open(outPath, 'w', 0o644)

    operations.push(writeOutContent(file, page))
  }

  if (page.children.size > 0) {
    const outSubDir = resolvePath(outDir, page.name)

    operations.push(...await writeOutPages(outSubDir, page.children.values()))
  }

  await Promise.all(operations)
}

async function writeOut (...dest: string[]) {
  if (dest.length === 0) dest = ['dist', 'docs']
  const outDir = resolvePath(process.cwd(), ...dest)
  await Promise.all(await writeOutPages(outDir, Page.pages()))
}

run()
  .then(code => {
    process.exitCode = code

    return code
  })
  .catch(reason => {
    console.error(reason)
    process.exitCode = 1

    return 1
  })
