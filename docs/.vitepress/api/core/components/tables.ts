import { z } from 'zod'
import { stringifyCss } from '../../utilities/styling'
import { Renderable, cz, czcomment, defineLiteComponent } from './common'

/** Table alignment. */
export type Alignment = z.input<typeof Alignment>
export const Alignment = z.enum(['start', 'end', 'center'])

/** Table header/column configuration. */
export type Column = z.input<typeof Column>
export const Column = z.object({
  heading: z.string().min(1),
  field: z.string().min(1),
  align: Alignment.optional()
})

/** Gets the style of a cell based on it's column configuration. */
function getCellStyle (column: z.output<typeof Column>) {
  return stringifyCss({
    textAlign: column.align
  })
}

/** Table component. */
export const Table = defineLiteComponent(
  z.object({ columns: z.array(Column).min(1), items: z.array(z.record(Renderable)).optional() }),
  ({ columns, items }) => [
    items != null && items.length > 0
      ? (cz('p', [cz('table', [
          cz('thead', [
            cz('tr', columns.map(column => cz('th', { style: getCellStyle(column) }, [column.heading])))
          ]),
          cz('tbody',
            items.map(item => cz('tr',
              columns.map(column => cz('td', { style: getCellStyle(column) }, [item[column.field]]))
            ))
          )
        ])]))
      : czcomment()
  ]
)
