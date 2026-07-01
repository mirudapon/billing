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

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const split = splits.find((s) => s.memberId === member.id)
        const included = !!split
        return (
          <div key={member.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={included}
              onChange={(e) => handleCheck(member.id, e.target.checked)}
              className="w-4 h-4"
            />
            <span className="flex-1 text-sm">{member.name}</span>
            <input
              type="number"
              min={1}
              value={included ? split!.ratio : ''}
              disabled={!included}
              onChange={(e) => handleRatio(member.id, parseFloat(e.target.value))}
              className="w-16 border rounded px-2 py-1 text-sm text-center disabled:bg-gray-100"
            />
            <span className="w-20 text-right text-sm text-gray-600">
              {getShare(member.id).toFixed(2)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
