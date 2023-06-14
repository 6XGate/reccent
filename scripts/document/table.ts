export type Alignment = 'start' | 'end' | 'center'
export interface Header { text: string, field: string, align?: Alignment | undefined }
export interface Column extends Header { length: number }

function renderText (text: string, column: Column) {
  const length = Math.max(column.length, text.length)
  let start: number
  let end: number
  switch (column.align) {
    case undefined:
    case 'start':
      start = 0
      end = length - text.length
      break
    case 'end':
      start = length - text.length
      end = 0
      break
    case 'center':
      start = Math.floor((length - text.length) / 2)
      end = length - text.length - start
      break
    default:
      throw new SyntaxError(`Unsupported alignment ${String(column.align)}`)
  }

  return `${' '.repeat(start)}${text}${' '.repeat(end)}`
}

function renderHeader (column: Column) {
  return renderText(column.text, column)
}

function renderSeparator (column: Column) {
  switch (column.align) {
    case undefined:
      return '-'.repeat(column.length)
    case 'start':
      return `:${'-'.repeat(column.length - 1)}`
    case 'end':
      return `${'-'.repeat(column.length - 1)}:`
    case 'center':
      return `:${'-'.repeat(column.length - 2)}:`
    default:
      throw new SyntaxError(`Unsupported alignment ${String(column.align)}`)
  }
}

function renderCell (item: Record<string, string>, column: Column) {
  return renderText(item[column.field] ?? '', column)
}

function renderRow (item: Record<string, string>, columns: Column[]) {
  return `| ${columns.map(column => renderCell(item, column)).join(' | ')} |`
}

function renderRows (items: Array<Record<string, string>>, columns: Column[]) {
  return items.map(item => renderRow(item, columns))
}

function getColumnLength (header: Header, items: Array<Record<string, string>>) {
  // Get the maximum length of all text items, ensuring at minimal 5 characters
  // for column alignment marker in the header separator.
  return items.reduce(
    (accumulator, item) => Math.max(accumulator, (item[header.field]?.length ?? 0)),
    Math.max(5, header.text.length))
}

export function renderTable (headers: Header[], items: Array<Record<string, string>>) {
  const columns = headers.map((header): Column => ({ ...header, length: getColumnLength(header, items) }))

  const lines = [
    // Header
    `| ${columns.map(renderHeader).join(' | ')} |`,
    // Separator
    `| ${columns.map(renderSeparator).join(' | ')} |`,
    ...renderRows(items, columns)
  ]

  return lines.join('\n')
}
