import React from 'react'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { db } from '../db'
import { dailyLogs, categories } from '../db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import * as fs from 'fs'
import * as path from 'path'

export const generateHeatmapImage = async (
  userId: string,
  categoryId: string,
  year: string
): Promise<Buffer> => {

// Fetch logs for the year
const logs = await db.select({
  date: dailyLogs.date,
  effortLevel: dailyLogs.effortLevel
})
.from(dailyLogs)
.where(and(
  eq(dailyLogs.userId, userId),
  eq(dailyLogs.categoryId, categoryId),
  gte(dailyLogs.date, `${year}-01-01`),
  lte(dailyLogs.date, `${year}-12-31`)
))

// Fetch category info
const category = await db.select()
  .from(categories)
  .where(eq(categories.id, categoryId))

const categoryName = category[0]?.name || 'Activity'
const categoryColor = category[0]?.color || '#22c55e'

// Build log map
const logMap: Record<string, number> = {}
logs.forEach(log => {
  logMap[log.date] = log.effortLevel
})

// Generate 365 squares data
const squares = []
const startDate = new Date(parseInt(year), 0, 1)
for (let i = 0; i < 365; i++) {
  const date = new Date(startDate)
  date.setDate(date.getDate() + i)
  const dateStr = date.toISOString().split('T')[0]
  squares.push({
    date: dateStr,
    level: logMap[dateStr] || 0
  })
}

// Get opacity for level
const getOpacity = (level: number) => {
  if (level === 0) return 0.1
  if (level === 1) return 0.25
  if (level === 2) return 0.5
  if (level === 3) return 0.75
  return 1.0
}

// Group squares into columns of 7 (weeks)
const columns: { date: string; level: number }[][] = []
for (let i = 0; i < squares.length; i += 7) {
  columns.push(squares.slice(i, i + 7))
}

const fontPath = path.join(__dirname, '../fonts/BebasNeue-Regular.ttf')
const fontData = fs.readFileSync(fontPath)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

const monthLabels = MONTHS.map((month, i) => {
  const firstDay = new Date(parseInt(year), i, 1)
  const startOfYear = new Date(parseInt(year), 0, 1)
  const dayIndex = Math.floor((firstDay.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
  const colIndex = Math.floor(dayIndex / 7)
  return { month, colIndex }
})

  // Build SVG using Satori JSX

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
    }, `${categoryName} — ${year}`),
    React.createElement('div', {
      style: { color: '#94a3b8', fontSize: '13px', fontFamily: 'BebasNeue' }
    }, 'HeatTrack')
  ),

  // Month labels + grid row
  React.createElement('div', {
    style: { display: 'flex', flexDirection: 'row' }
  },
  
  // Day labels column (Mon, Wed, Fri)
  React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      marginRight: '4px',
      marginTop: '16px', 
    }
  },
  ...DAY_LABELS.map(label =>
    React.createElement('div', {
        style: {
          height: '10px',
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
        const nextColIndex = monthLabels[i + 1]?.colIndex ?? 53
        const widthPx = (nextColIndex - colIndex) * 12
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

    // Grid — 7 rows × 53 cols
    React.createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }
    },
      ...Array.from({ length: 7 }, (_, row) =>
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            gap: '2px',
          }
        },
          ...columns.map(col => {
            const sq = col[row]
            return React.createElement('div', {
              style: {
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                backgroundColor: sq
                  ? (sq.level === 0 ? '#1e293b' : categoryColor)
                  : '#1e293b',
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
        data: fontData,
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