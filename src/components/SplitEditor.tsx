import { Member, Split } from '../types'

interface SplitEditorProps {
  members: Member[]
  splits: Split[]
  totalBaseAmount: number
  onChange: (splits: Split[]) => void
}

export default function SplitEditor({
  members,
  splits,
  totalBaseAmount,
  onChange,
}: SplitEditorProps) {
  const ratioSum = splits.reduce((s, sp) => s + sp.ratio, 0)

  function getShare(memberId: string): number {
    const split = splits.find((s) => s.memberId === memberId)
    if (!split || ratioSum === 0) return 0
    return totalBaseAmount * (split.ratio / ratioSum)
  }

  function handleCheck(memberId: string, checked: boolean) {
    if (checked) {
      onChange([...splits, { memberId, ratio: 1 }])
    } else {
      onChange(splits.filter((s) => s.memberId !== memberId))
    }
  }

  function handleRatio(memberId: string, value: number) {
    onChange(
      splits.map((s) =>
        s.memberId === memberId ? { ...s, ratio: isNaN(value) ? 1 : value } : s
      )
    )
  }

  function stepRatio(memberId: string, delta: number) {
    const split = splits.find((s) => s.memberId === memberId)
    if (!split) return
    const next = Math.max(1, split.ratio + delta)
    handleRatio(memberId, next)
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const split = splits.find((s) => s.memberId === member.id)
        const included = !!split
        return (
          <label
            key={member.id}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer select-none transition-colors ${
              included ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-transparent'
            }`}
          >
            {/* Hidden checkbox keeps test compatibility via getAllByRole('checkbox') */}
            <input
              type="checkbox"
              className="sr-only"
              checked={included}
              onChange={(e) => handleCheck(member.id, e.target.checked)}
            />
            <div
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                included ? 'bg-blue-600' : 'bg-white border border-gray-300'
              }`}
            >
              {included && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={`flex-1 text-sm font-medium ${included ? 'text-blue-800' : 'text-gray-500'}`}>
              {member.name}
            </span>
            {included && (
              <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                <button
                  type="button"
                  onClick={() => stepRatio(member.id, -1)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-600 text-lg leading-none flex items-center justify-center"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={split!.ratio}
                  onChange={(e) => handleRatio(member.id, parseFloat(e.target.value))}
                  className="w-12 border rounded-lg px-1 py-1 text-base text-center"
                />
                <button
                  type="button"
                  onClick={() => stepRatio(member.id, 1)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-600 text-lg leading-none flex items-center justify-center"
                >
                  ＋
                </button>
              </div>
            )}
            <span className={`w-16 text-right text-xs ${included ? 'text-blue-600' : 'text-gray-300'}`}>
              {getShare(member.id).toFixed(2)}
            </span>
          </label>
        )
      })}
    </div>
  )
}
