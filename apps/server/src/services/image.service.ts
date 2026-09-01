import React from 'react'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { db } from '../db'
import { dailyLogs, categories } from '../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'
import { yearDates, yearStart, yearEnd } from '../lib/dates'
import { calculateLongestStreak, totalActiveDays } from './streak.service'

let fontData: Buffer | null = null
const getFontData = (): Buffer => {
  if (!fontData) {
    fontData = fs.readFileSync(
      path.join(__dirname, '../fonts/BebasNeue-Regular.ttf')
    )
  }
  return fontData
}

const INK = '#000000'
const CANVAS = '#f8fafc'
const CARD = '#ffffff'
const HAIRLINE = '#e2e8f0'
const MUTED = '#94a3b8'
const SUBTLE = '#64748b'
const HEAT = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#475569', '#0f172a'] as const

// The Loop In mark, white on a black rounded tile, matching the app navbar.
// Drawn as a vector rather than embedding public/Logo.png: that file is 520KB,
// which would add roughly 710KB of base64 to every image this renders.
const LOOP_PATH =
  'M12,12 C10.5,8.5 5,8.5 5,12 C5,15.5 10.5,15.5 12,12 C13.5,8.5 19,8.5 19,12 C19,15.5 13.5,15.5 12,12 Z'

const loopMark = (size: number, color: string) =>
  'data:image/svg+xml;base64,' +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${LOOP_PATH}"/></svg>`
  ).toString('base64')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

const WIDTH = 800
const HEIGHT = 340
const CELL = 10
const GAP = 2
const COL_WIDTH = CELL + GAP

type Square = { date: string; level: number; future: boolean }

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
  const categoryColor = category[0].color || '#0f172a'

  // Build log map
  const logMap: Record<string, number> = {}
  for (const log of logs) {
    logMap[log.date] = log.effortLevel
  }

  const today = new Date().toISOString().slice(0, 10)

  // Full year of squares — timezone-independent, leap-year correct
  const squares: Square[] = yearDates(y).map(date => ({
    date,
    level: logMap[date] ?? 0,
    future: date > today,
  }))

  const activeDates = Object.keys(logMap).sort()
  const daysTracked = totalActiveDays(activeDates)
  const longestStreak = calculateLongestStreak(activeDates)

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

  const svg = await satori(
    React.createElement('div', {
      style: {
        display: 'flex',
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        backgroundColor: CANVAS,
        padding: '14px',
        fontFamily: 'BebasNeue',
      }
    },

      // Card — white, hairline border, generous radius, like every panel on the site
      React.createElement('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          backgroundColor: CARD,
          border: `1px solid ${HAIRLINE}`,
          borderRadius: '20px',
          padding: '30px 32px',
        }
      },

        // brand row
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }
        },
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'row', alignItems: 'center' }
          },
            // the logo lockup from the login page / app navbar
            React.createElement('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '22px',
                height: '22px',
                borderRadius: '6px',
                backgroundColor: INK,
                marginRight: '9px',
              }
            },
              React.createElement('img', {
                src: loopMark(14, '#ffffff'),
                width: 13,
                height: 13,
              })
            ),
            React.createElement('div', {
              style: { color: INK, fontSize: '21px', letterSpacing: '0.5px' }
            }, 'Loop In')
          ),
          React.createElement('div', {
            style: { color: MUTED, fontSize: '20px', letterSpacing: '1px' }
          }, String(y))
        ),

        // habit heading
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: '18px',
          }
        },
          // the one place the habit's own colour shows, mirroring the settings list
          React.createElement('div', {
            style: {
              display: 'flex',
              width: '11px',
              height: '11px',
              borderRadius: '6px',
              backgroundColor: categoryColor,
              marginRight: '10px',
            }
          }),
          React.createElement('div', {
            style: { color: INK, fontSize: '34px', letterSpacing: '0.5px' }
          }, categoryName)
        ),

        // grid
        React.createElement('div', {
          style: { display: 'flex', flexDirection: 'row', marginTop: '20px' }
        },

          // day labels
          React.createElement('div', {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: `${GAP}px`,
              width: '28px',
              marginRight: '6px',
              marginTop: '20px',
            }
          },
            ...DAY_LABELS.map(label =>
              React.createElement('div', {
                style: {
                  display: 'flex',
                  height: `${CELL}px`,
                  alignItems: 'center',
                  color: MUTED,
                  fontSize: '11px',
                }
              }, label)
            )
          ),

          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column' }
          },

            // month labels
            React.createElement('div', {
              style: {
                display: 'flex',
                flexDirection: 'row',
                height: '14px',
                marginBottom: '6px',
              }
            },
              ...monthLabels.map(({ month, colIndex }, i) => {
                const nextColIndex = monthLabels[i + 1]?.colIndex ?? columns.length
                return React.createElement('div', {
                  style: {
                    display: 'flex',
                    width: `${(nextColIndex - colIndex) * COL_WIDTH}px`,
                    color: MUTED,
                    fontSize: '12px',
                    flexShrink: 0,
                  }
                }, month)
              })
            ),

            // 7 rows x N columns
            React.createElement('div', {
              style: { display: 'flex', flexDirection: 'column', gap: `${GAP}px` }
            },
              ...Array.from({ length: 7 }, (_, row) =>
                React.createElement('div', {
                  style: { display: 'flex', flexDirection: 'row', gap: `${GAP}px` }
                },
                  ...columns.map(col => {
                    const sq = col[row]
                    return React.createElement('div', {
                      style: {
                        display: 'flex',
                        width: `${CELL}px`,
                        height: `${CELL}px`,
                        borderRadius: '2px',
                        backgroundColor: sq ? (HEAT[sq.level] ?? HEAT[0]) : 'transparent',
                        opacity: sq && sq.future ? 0.4 : 1,
                      }
                    })
                  })
                )
              )
            )
          )
        ),

        // footer
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '18px',
          }
        },

          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'row', alignItems: 'center' }
          },
            React.createElement('div', {
              style: { color: INK, fontSize: '17px', letterSpacing: '0.4px' }
            }, `${daysTracked} ${daysTracked === 1 ? 'day' : 'days'} tracked`),
            React.createElement('div', {
              style: { color: HAIRLINE, fontSize: '15px', marginLeft: '9px', marginRight: '9px' }
            }, '/'),
            React.createElement('div', {
              style: { color: SUBTLE, fontSize: '17px', letterSpacing: '0.4px' }
            }, `longest streak ${longestStreak}`)
          ),

          
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'row', alignItems: 'center' }
          },
            React.createElement('div', {
              style: { color: MUTED, fontSize: '13px', marginRight: '7px' }
            }, 'Less'),
            ...HEAT.map(shade =>
              React.createElement('div', {
                style: {
                  display: 'flex',
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: shade,
                  marginRight: '3px',
                }
              })
            ),
            React.createElement('div', {
              style: { color: MUTED, fontSize: '13px', marginLeft: '4px' }
            }, 'More')
          )
        )
      )
    ),
    {
      width: WIDTH,
      height: HEIGHT,
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
