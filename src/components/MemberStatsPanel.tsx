import { Expense, Trip } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  餐飲: '#f97316',
  交通: '#3b82f6',
  住宿: '#8b5cf6',
  購物: '#ec4899',
  票券: '#14b8a6',
  其他: '#6b7280',
}

const PAYMENT_PALETTE = [
  '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#0ea5e9', '#84cc16', '#94a3b8',
]

interface MemberStatsPanelProps {
  trip: Trip
  memberId: string
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) }
}

function arcPath(cx: number, cy: number, R: number, r: number, s: number, e: number): string {
  const os = polarToCartesian(cx, cy, R, s)
  const oe = polarToCartesian(cx, cy, R, e)
  const is = polarToCartesian(cx, cy, r, s)
  const ie = polarToCartesian(cx, cy, r, e)
  const large = e - s > Math.PI ? 1 : 0
  return `M ${os.x} ${os.y} A ${R} ${R} 0 ${large} 1 ${oe.x} ${oe.y} L ${ie.x} ${ie.y} A ${r} ${r} 0 ${large} 0 ${is.x} ${is.y} Z`
}

interface ChartEntry { label: string; value: number; color: string }

function DonutSection({ title, entries, currency }: { title: string; entries: ChartEntry[]; currency: string }) {
  const total = entries.reduce((s, e) => s + e.value, 0)
  if (total === 0) return null

  const cx = 80, cy = 80, R = 68, r = 42, size = 160
  let angle = -Math.PI / 2
  const segments = entries.map((entry) => {
    const sweep = (entry.value / total) * 2 * Math.PI
    const start = angle
    angle += sweep
    return { ...entry, start, end: angle }
  })

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="flex items-center gap-4">
        <svg width={size} height={size} className="shrink-0">
          {segments.map(({ label, color, start, end }) => {
            const sweep = end - start
            if (sweep >= 2 * Math.PI - 0.001) {
              return (
                <g key={label}>
                  <circle cx={cx} cy={cy} r={R} fill={color} />
                  <circle cx={cx} cy={cy} r={r} fill="white" />
                </g>
              )
            }
            return (
              <path key={label} d={arcPath(cx, cy, R, r, start, end)}
                fill={color} stroke="white" strokeWidth={2} />
            )
          })}
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={10} fill="#9ca3af">{currency}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={13} fontWeight="600" fill="#1f2937">
            {total.toFixed(0)}
          </text>
        </svg>

        <div className="flex-1 space-y-2 min-w-0">
          {entries.map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600 flex-1 truncate">{label}</span>
              <span className="text-xs font-medium text-gray-800 shrink-0">
                {total > 0 ? ((value / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {entries.map(({ label, value, color }) => (
          <div key={label}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{label}</span>
              <span>{value.toFixed(0)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full"
                style={{ width: `${total > 0 ? (value / total) * 100 : 0}%`, backgroundColor: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MemberStatsPanel({ trip, memberId }: MemberStatsPanelProps) {
  const paid = trip.expenses
    .filter((e) => e.paidBy === memberId)
    .reduce((sum, e) => sum + e.amount * e.exchangeRate, 0)

  const owed = trip.expenses.reduce((sum, e) => {
    const split = e.splits.find((s) => s.memberId === memberId)
    if (!split) return sum
    const ratioSum = e.splits.reduce((s, sp) => s + sp.ratio, 0)
    if (ratioSum === 0) return sum
    return sum + e.amount * e.exchangeRate * (split.ratio / ratioSum)
  }, 0)

  const net = paid - owed

  // Category breakdown (member's share)
  const categoryMap: Record<string, number> = {}
  // Payment method breakdown (member's share)
  const paymentMap: Record<string, number> = {}

  for (const e of trip.expenses) {
    const split = e.splits.find((s) => s.memberId === memberId)
    if (!split) continue
    const ratioSum = e.splits.reduce((s, sp) => s + sp.ratio, 0)
    if (ratioSum === 0) continue
    const share = e.amount * e.exchangeRate * (split.ratio / ratioSum)
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + share
    paymentMap[e.paymentMethod] = (paymentMap[e.paymentMethod] ?? 0) + share
  }

  const categoryEntries: ChartEntry[] = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label] ?? '#94a3b8' }))

  const paymentEntries: ChartEntry[] = Object.entries(paymentMap)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], i) => ({ label, value, color: PAYMENT_PALETTE[i % PAYMENT_PALETTE.length] }))

  // Expenses this member is involved in (paid or in splits), newest first
  const relatedExpenses: (Expense & { share: number; isPayer: boolean })[] = trip.expenses
    .filter((e) => e.paidBy === memberId || e.splits.some((s) => s.memberId === memberId))
    .map((e) => {
      const split = e.splits.find((s) => s.memberId === memberId)
      const ratioSum = e.splits.reduce((s, sp) => s + sp.ratio, 0)
      const share = split && ratioSum > 0
        ? e.amount * e.exchangeRate * (split.ratio / ratioSum)
        : 0
      return { ...e, share, isPayer: e.paidBy === memberId }
    })
    .sort((a, b) => b.date.localeCompare(a.date))

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

      {categoryEntries.length === 0 ? (
        <p className="text-center text-gray-400 py-6 text-sm">無支出記錄</p>
      ) : (
        <>
          <DonutSection title="消費分類" entries={categoryEntries} currency={trip.baseCurrency} />
          <DonutSection title="付款方式" entries={paymentEntries} currency={trip.baseCurrency} />

          {/* Related expense list */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <h3 className="text-sm font-semibold px-4 pt-4 pb-2">相關支出</h3>
            {relatedExpenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-t">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{e.description}</p>
                  <p className="text-xs text-gray-400">{e.date} · {e.category} · {e.paymentMethod}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">
                    {e.currency} {e.amount.toLocaleString()}
                  </p>
                  <p className={`text-xs ${e.isPayer ? 'text-blue-500' : 'text-gray-400'}`}>
                    {e.isPayer ? `付款 ${(e.amount * e.exchangeRate).toFixed(0)}` : `分攤 ${e.share.toFixed(0)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
