import React from 'react'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { db } from '../db'
import { dailyLogs, categories } from '../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'
import { yearDates, yearStart, yearEnd } from '../lib/dates'

// Read the font once and cache it, but lazily: reading at module load means a missing font file takes 
// the whole server down at boot instead of failing the one endpoint that needs it.
let fontData: Buffer | null = null
const getFontData = (): Buffer => {
  if (!fontData) {
    fontData = fs.readFileSync(
      path.join(__dirname, '../fonts/BebasNeue-Regular.ttf')
    )
  }
  return fontData
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

const CELL = 10
const GAP = 2
const COL_WIDTH = CELL + GAP

type Square = { date: string; level: number }

const getOpacity = (level: number) => {
  if (level === 0) return 0.1
  if (level === 1) return 0.25
  if (level === 2) return 0.5
  if (level === 3) return 0.75
  return 1.0
}

export const generateHeatmapImage = async (
  userId: string,
  categoryId: string,
  year: string
): Promise<Buffer> => {

  const y = parseInt(year, 10)
  if (Number.isNaN(y)) throw new Error(`Invalid year: ${year}`)

  // Fetch logs for the year
  const logs = await db.select({
    date: dailyLogs.date,
    effortLevel: dailyLogs.effortLevel
  })
  .from(dailyLogs)
  .where(and(
    eq(dailyLogs.userId, userId),
    eq(dailyLogs.categoryId, categoryId),
    gte(dailyLogs.date, yearStart(y)),
    lte(dailyLogs.date, yearEnd(y))
  ))

  // Fetch category info — scoped to the owner
  const category = await db.select({
    name: categories.name,
    color: categories.color
  })
  .from(categories)
  .where(and(
    eq(categories.id, categoryId),
    eq(categories.userId, userId)
  ))

  if (!category[0]) throw new Error('Category not found')

  const categoryName = category[0].name
  const categoryColor = category[0].color || '#22c55e'

  // Build log map
  const logMap: Record<string, number> = {}
  for (const log of logs) {
    logMap[log.date] = log.effortLevel
  }

  // Full year of squares — timezone-independent, leap-year correct
  const squares: Square[] = yearDates(y).map(date => ({
    date,
    level: logMap[date] ?? 0
  }))

  // Pad the front so row 0 is Sunday and the day labels are truthful
  const jan1Weekday = new Date(Date.UTC(y, 0, 1)).getUTCDay() // 0 = Sunday
  const padded: (Square | null)[] = [
    ...Array<Square | null>(jan1Weekday).fill(null),
    ...squares
  ]

  // Group into columns of 7 (weeks)
  const columns: (Square | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) {
    columns.push(padded.slice(i, i + 7))
  }

  // Month label offsets, computed arithmetically (no Date diffing)
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
  const monthLengths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  let dayIndex = jan1Weekday
  const monthLabels = MONTHS.map((month, i) => {
    const colIndex = Math.floor(dayIndex / 7)
    dayIndex += monthLengths[i]
    return { month, colIndex }
  })

  // Build SVG using Satori
  const svg = await satori(
    React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0f172a',
        padding: '32px',
        borderRadius: '12px',
        width: '800px',
        height: '260px',
      }
    },

      // Title row
      React.createElement('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }
      },
        React.createElement('div', {
          style: { color: '#f1f5f9', fontSize: '18px', fontWeight: 'bold', fontFamily: 'BebasNeue' }
        }, `${categoryName} — ${y}`),
        React.createElement('div', {
          style: { color: '#94a3b8', fontSize: '13px', fontFamily: 'BebasNeue' }
        }, 'HeatTrack')
      ),

      // Day labels + grid row
      React.createElement('div', {
        style: { display: 'flex', flexDirection: 'row' }
      },

        // Day labels column (Mon, Wed, Fri)
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: `${GAP}px`,
            marginRight: '4px',
            marginTop: '16px',
          }
        },
          ...DAY_LABELS.map(label =>
            React.createElement('div', {
              style: {
                height: `${CELL}px`,
                width: '24px',
                color: '#64748b',
                fontSize: '9px',
                fontFamily: 'BebasNeue',
                display: 'flex',
                alignItems: 'center',
              }
            }, label)
          )
        ),

        // Month labels + squares
        React.createElement('div', {
          style: { display: 'flex', flexDirection: 'column' }
        },

          // Month labels
          React.createElement('div', {
            style: {
              display: 'flex',
              flexDirection: 'row',
              marginBottom: '4px',
              height: '12px',
            }
          },
            ...monthLabels.map(({ month, colIndex }, i) => {
              const nextColIndex = monthLabels[i + 1]?.colIndex ?? columns.length
              const widthPx = (nextColIndex - colIndex) * COL_WIDTH
              return React.createElement('div', {
                style: {
                  width: `${widthPx}px`,
                  color: '#64748b',
                  fontSize: '10px',
                  fontFamily: 'BebasNeue',
                  flexShrink: 0,
                }
              }, month)
            })
          ),

          // Grid — 7 rows × N cols
          React.createElement('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: `${GAP}px`,
            }
          },
            ...Array.from({ length: 7 }, (_, row) =>
              React.createElement('div', {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: `${GAP}px`,
                }
              },
                ...columns.map(col => {
                  const sq = col[row]
                  return React.createElement('div', {
                    style: {
                      width: `${CELL}px`,
                      height: `${CELL}px`,
                      borderRadius: '2px',
                      backgroundColor: sq && sq.level > 0 ? categoryColor : '#1e293b',
                      opacity: sq ? getOpacity(sq.level) : 0.1,
                    }
                  })
                })
              )
            )
          )
        )
      )
    ),
    {
      width: 800,
      height: 260,
      fonts: [
        {
          name: 'BebasNeue',
          data: getFontData(),
          weight: 400,
          style: 'normal',
        }
      ],
    }
  )

  const resvg = new Resvg(svg)
  const pngBuffer = resvg.render().asPng()
  return Buffer.from(pngBuffer)
}