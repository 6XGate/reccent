import ansiStyles from 'ansi-styles'
import chalk from 'chalk'
import chroma from 'chroma-js'
import {
  Serializer,
  TSConfigReader,
  Application as TypeDoc,
  TypeDocReader
} from 'typedoc'
import type {
  Reflection,
  ReflectionVariant,
  ReflectionKind,
  DeclarationReflection,
  ParameterReflection,
  ProjectReflection,
  ReferenceReflection,
  SignatureReflection,
  TypeParameterReflection,
  ContainerReflection
} from 'typedoc'

const colors = {
  red: '#F07178',
  yellow: '#FFCB6B',
  green: '#C3E88D',
  cyan: '#89DDFF',
  blue: '#82AAFF',
  purple: '#C288E8',
  gray: '#676E95',
  white: '#A6ACCD'
}

const palette = {
  red: chalk.ansi256(ansiStyles.hexToAnsi256(colors.red)),
  yellow: chalk.ansi256(ansiStyles.hexToAnsi256(colors.yellow)),
  green: chalk.ansi256(ansiStyles.hexToAnsi256(colors.green)),
  cyan: chalk.ansi256(ansiStyles.hexToAnsi256(colors.cyan)),
  blue: chalk.ansi256(ansiStyles.hexToAnsi256(colors.blue)),
  purple: chalk.ansi256(ansiStyles.hexToAnsi256(colors.purple)),
  gray: chalk.ansi256(ansiStyles.hexToAnsi256(colors.gray)),
  // chalk.dim isn't good enough
  dim: {
    red: chalk.ansi256(ansiStyles.hexToAnsi256(chroma(colors.red).darken(2).hex('rgb'))),
    yellow: chalk.ansi256(ansiStyles.hexToAnsi256(chroma(colors.yellow).darken(2).hex('rgb'))),
    green: chalk.ansi256(ansiStyles.hexToAnsi256(chroma(colors.green).darken(2).hex('rgb'))),
    cyan: chalk.ansi256(ansiStyles.hexToAnsi256(chroma(colors.cyan).darken(2).hex('rgb'))),
    blue: chalk.ansi256(ansiStyles.hexToAnsi256(chroma(colors.blue).darken(2).hex('rgb'))),
    purple: chalk.ansi256(ansiStyles.hexToAnsi256(chroma(colors.purple).darken(2).hex('rgb'))),
    gray: chalk.ansi256(ansiStyles.hexToAnsi256(chroma(colors.gray).darken(2).hex('rgb')))
  }
}

const styles = {
  string: palette.green,
  block: palette.cyan,
  context: palette.purple,
  name: palette.blue,
  interface: palette.yellow,
  member: palette.red,
  comment: palette.gray
}

async function main () {
  const app = new TypeDoc()
  app.options.addReader(new TSConfigReader())
  app.options.addReader(new TypeDocReader())

  await app.bootstrapWithPlugins({
    entryPoints: ['src/index.ts', 'src/test.ts'],
    defaultCategory: 'General',
    categorizeByGroup: false
  })

  const serializer = new Serializer()

  const project = app.convert() ?? null
  if (project != null) echoProject(project)
}

function echo (indent: number, ...text: unknown[]) {
  console.log(`${' '.repeat(indent * 2)}${text.map(String).join(' ')}`)
}

const kKindNames = new Map([
  [0x1, 'Project'],
  [0x2, 'Module'],
  [0x4, 'Namespace'],
  [0x8, 'Enum'],
  [0x10, 'EnumMember'],
  [0x20, 'Variable'],
  [0x40, 'Function'],
  [0x80, 'Class'],
  [0x100, 'Interface'],
  [0x200, 'Constructor'],
  [0x400, 'Property'],
  [0x800, 'Method'],
  [0x1000, 'CallSignature'],
  [0x2000, 'IndexSignature'],
  [0x4000, 'ConstructorSignature'],
  [0x8000, 'Parameter'],
  [0x10000, 'TypeLiteral'],
  [0x20000, 'TypeParameter'],
  [0x40000, 'Accessor'],
  [0x80000, 'GetSignature'],
  [0x100000, 'SetSignature'],
  [0x200000, 'ObjectLiteral'],
  [0x400000, 'TypeAlias'],
  [0x800000, 'Reference']
] satisfies Array<[number, ReflectionKind.KindString]>)

interface ReflectionKindClass {
  Project: ProjectReflection
  Module: DeclarationReflection
  Namespace: DeclarationReflection
  Enum: DeclarationReflection
  EnumMember: DeclarationReflection
  Variable: DeclarationReflection
  Function: DeclarationReflection
  Class: DeclarationReflection
  Interface: DeclarationReflection
  Constructor: DeclarationReflection
  Property: DeclarationReflection
  Method: DeclarationReflection
  CallSignature: SignatureReflection
  IndexSignature: SignatureReflection
  ConstructorSignature: SignatureReflection
  Parameter: ParameterReflection
  TypeLiteral: Reflection // TODO
  TypeParameter: TypeParameterReflection
  Accessor: DeclarationReflection
  GetSignature: SignatureReflection
  SetSignature: SignatureReflection
  ObjectLiteral: Reflection // Unused...
  TypeAlias: DeclarationReflection
  Reference: ReferenceReflection
}

type ReflectionVisitorByVariant<Result, Args extends any[]> = {
  [Variant in keyof ReflectionVariant]: (reflection: ReflectionVariant[Variant], ...args: Args) => Result
}

type ReflectionVisitorByKind<Result, Args extends any[]> = {
  [Kind in keyof ReflectionKindClass]: (reflection: ReflectionKindClass[Kind], ...args: Args) => Result
}

function explainItem (item: Reflection) {
  const variant = styles.block(item.variant)
  const kind = styles.context(kKindNames.get(item.kind) ?? `${item.kind.toString(16)}h`)
  const name = styles.interface(item.name)
  const ctor = styles.comment(`/* ${item.constructor.name} */`)

  return `${variant}[${kind}]: ${name} ${ctor}`
}

function heading (item: Reflection, level: number) {
  console.log(`${'#'.repeat(level + 1)} ${explainItem(item)}`)
}

function listCategories (item: ContainerReflection, level = 0) {
  item.groups?.forEach(group => {
    console.log(`${' '.repeat(level * 2)}- ${group.title} ${styles.comment(`/* ${group.constructor.name} */`)}`)
    group.categories?.forEach(category => {
      console.log(`${' '.repeat(level * 2)}- ${category.title} ${styles.comment(`/* ${category.constructor.name} */`)}`)
    })
  })

  item.categories?.forEach(category => {
    console.log(`${' '.repeat(level * 2)}- ${category.title} ${styles.comment(`/* ${category.constructor.name} */`)}`)
  })
}

const handlers: ReflectionVisitorByVariant<void, [level: number]> = {
  declaration: (item, level) => {
    heading(item, level)
    listCategories(item)

    item.typeParameters?.forEach(child => { echoStruct(child, level + 1) })
    item.getAllSignatures().forEach(child => { echoStruct(child, level + 1) })
    item.children?.forEach(child => { echoStruct(child, level + 1) })
  },
  param: (item, level) => {
    heading(item, level)
  },
  project: (item, level) => {
    heading(item, level)
    listCategories(item)

    item.children?.forEach(child => { echoStruct(child, level + 1) })
  },
  reference: (item, level) => {
    // echoStruct(item.getTargetReflection(), level)

    heading(item, level)
    listCategories(item)

    item.typeParameters?.forEach(child => { echoStruct(child, level + 1) })
    item.getAllSignatures().forEach(child => { echoStruct(child, level + 1) })
    item.children?.forEach(child => { echoStruct(child, level + 1) })
  },
  signature: (item, level) => {
    heading(item, level)

    item.typeParameters?.forEach(child => { echoStruct(child, level + 1) })
    item.parameters?.forEach(child => { echoStruct(child, level + 1) })
  },
  typeParam: (item, level) => {
    heading(item, level)
  }
}

export function echoStruct (item: Reflection | null, level = 0) {
  if (item != null) handlers[item.variant](item as never, level)
}

const byKind: ReflectionVisitorByKind<void, [level: number]> = {
  Project: (item, level) => {
    heading(item, level)

    item.children?.forEach(child => { handleItem(child, level) })
  },
  Module: (item, level) => {
    heading(item, level)

    item.children?.forEach(child => { handleItem(child, level) })
  },
  Namespace: (item, level) => {
    heading(item, level)

    item.children?.forEach(child => { handleItem(child, level) })
  },
  Enum: (item, level) => { console.log(item.kind) },
  EnumMember: (item, level) => { console.log(item.kind) },
  Variable: (item, level) => { console.log(item.kind) },
  Function: (item, level) => { console.log(item.kind) },
  Class: (item, level) => { console.log(item.kind) },
  Interface: (item, level) => { console.log(item.kind) },
  Constructor: (item, level) => { console.log(item.kind) },
  Property: (item, level) => { console.log(item.kind) },
  Method: (item, level) => { console.log(item.kind) },
  CallSignature: (item, level) => { console.log(item.kind) },
  IndexSignature: (item, level) => { console.log(item.kind) },
  ConstructorSignature: (item, level) => { console.log(item.kind) },
  Parameter: (item, level) => { console.log(item.kind) },
  TypeLiteral: (item, level) => { console.log(item.kind) },
  TypeParameter: (item, level) => { console.log(item.kind) },
  Accessor: (item, level) => { console.log(item.kind) },
  GetSignature: (item, level) => { console.log(item.kind) },
  SetSignature: (item, level) => { console.log(item.kind) },
  ObjectLiteral: (item, level) => { console.log(item.kind) },
  TypeAlias: (item, level) => { console.log(item.kind) },
  Reference: (item, level) => { console.log(item.kind) }
}

function handleItem (item: Reflection | null, level = 0) {
  if (item == null) return
  const kind = kKindNames.get(item.kind)
  if (kind == null) return
  byKind[kind](item as never, level)
}

main()
  // eslint-disable-next-line promise/always-return -- No it does not.
  .then(() => {
    process.exitCode = 0
  })
  .catch(reason => {
    console.error(reason)
    process.exitCode = 1
  })
