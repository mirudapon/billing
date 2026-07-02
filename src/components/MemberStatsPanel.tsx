import { Trip } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  餐飲: '#f97316',
  交通: '#3b82f6',
  住宿: '#8b5cf6',
  購物: '#ec4899',
  票券: '#14b8a6',
  其他: '#6b7280',
}

const DEFAULT_COLOR = '#94a3b8'

interface MemberStatsPanelProps {
  trip: Trip
  memberId: string
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) }
}

function arcPath(
  cx: number,
  cy: number,
  R: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const os = polarToCartesian(cx, cy, R, startAngle)
  const oe = polarToCartesian(cx, cy, R, endAngle)
  const is = polarToCartesian(cx, cy, r, startAngle)
  const ie = polarToCartesian(cx, cy, r, endAngle)
  const large = endAngle - startAngle > Math.PI ? 1 : 0
  return [
    `M ${os.x} ${os.y}`,
    `A ${R} ${R} 0 ${large} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${r} ${r} 0 ${large} 0 ${is.x} ${is.y}`,
    'Z',
  ].join(' ')
}

export default function MemberStatsPanel({ trip, memberId }: MemberStatsPanelProps) {
  // Paid: sum of expenses where this member is the payer
  const paid = trip.expenses
    .filter((e) => e.paidBy === memberId)
    .reduce((sum, e) => sum + e.amount * e.exchangeRate, 0)

  // Owed: this member's share across all expenses
  const owed = trip.expenses.reduce((sum, e) => {
    const split = e.splits.find((s) => s.memberId === memberId)
    if (!split) return sum
    const ratioSum = e.splits.reduce((s, sp) => s + sp.ratio, 0)
    if (ratioSum === 0) return sum
    return sum + e.amount * e.exchangeRate * (split.ratio / ratioSum)
  }, 0)

  const net = paid - owed

  // Category breakdown of this member's share
  const categoryMap: Record<string, number> = {}
  for (const e of trip.expenses) {
    const split = e.splits.find((s) => s.memberId === memberId)
    if (!split) continue
    const ratioSum = e.splits.reduce((s, sp) => s + sp.ratio, 0)
    if (ratioSum === 0) continue
    const share = e.amount * e.exchangeRate * (split.ratio / ratioSum)
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + share
  }

  const categories = Object.entries(categoryMap).sort(([, a], [, b]) => b - a)
  const total = categories.reduce((s, [, v]) => s + v, 0)

  // SVG donut
  const cx = 80
  const cy = 80
  const R = 68
  const r = 42
  const size = 160

  let currentAngle = -Math.PI / 2  // start from top

  const segments = categories.map(([cat, value]) => {
    const angle = (value / total) * 2 * Math.PI
    const start = currentAngle
    const end = currentAngle + angle
    currentAngle = end
    return { cat, value, start, end }
  })

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">已付</p>
          <p className="text-sm font-bold text-gray-800">{paid.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">應付</p>
          <p className="text-sm font-bold text-gray-800">{owed.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">差額</p>
          <p className={`text-sm font-bold ${net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {net >= 0 ? '+' : ''}{net.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Donut chart + legend */}
      {categories.length === 0 ? (
        <p className="text-center text-gray-400 py-6 text-sm">無支出記錄</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold mb-3">消費分類</h3>
          <div className="flex items-center gap-4">
            {/* SVG donut */}
            <svg width={size} height={size} className="shrink-0">
              {segments.map(({ cat, start, end }) => {
                const color = CATEGORY_COLORS[cat] ?? DEFAULT_COLOR
                // Handle near-full circle (single category)
                const sweep = end - start
                if (sweep >= 2 * Math.PI - 0.001) {
                  return (
                    <g key={cat}>
                      <circle cx={cx} cy={cy} r={R} fill={color} />
                      <circle cx={cx} cy={cy} r={r} fill="white" />
                    </g>
                  )
                }
                return (
                  <path
                    key={cat}
                    d={arcPath(cx, cy, R, r, start, end)}
                    fill={color}
                    stroke="white"
                    strokeWidth={2}
                  />
                )
              })}
              {/* Center label */}
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                className="text-xs"
                fontSize={10}
                fill="#9ca3af"
              >
                {trip.baseCurrency}
              </text>
              <text
                x={cx}
                y={cy + 10}
                textAnchor="middle"
                fontSize={13}
                fontWeight="600"
                fill="#1f2937"
              >
                {total.toFixed(0)}
              </text>
            </svg>

            {/* Legend */}
            <div className="flex-1 space-y-2 min-w-0">
              {categories.map(([cat, value]) => {
                const pct = total > 0 ? (value / total) * 100 : 0
                const color = CATEGORY_COLORS[cat] ?? DEFAULT_COLOR
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-gray-600 flex-1 truncate">{cat}</span>
                    <span className="text-xs font-medium text-gray-800 shrink-0">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Horizontal bars */}
          <div className="mt-4 space-y-2">
            {categories.map(([cat, value]) => {
              const pct = total > 0 ? (value / total) * 100 : 0
              const color = CATEGORY_COLORS[cat] ?? DEFAULT_COLOR
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{cat}</span>
                    <span>{value.toFixed(0)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
