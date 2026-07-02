import { useState } from 'react'
import { Trip } from '../types'
import { calculateSettlement } from '../utils/settlement'
import MemberStatsPanel from './MemberStatsPanel'

interface SettlementViewProps {
  trip: Trip
}

export default function SettlementView({ trip }: SettlementViewProps) {
  const transfers = calculateSettlement(trip)
  const [selectedMemberId, setSelectedMemberId] = useState(trip.members[0]?.id ?? '')

  function getMemberName(memberId: string): string {
    return trip.members.find((m) => m.id === memberId)?.name ?? memberId
  }

  return (
    <div className="p-4 space-y-6">
      {/* Per-member stats with tab selector */}
      {trip.members.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">個人統計</h2>

          {/* Member pill tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {trip.members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  selectedMemberId === member.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>

          {selectedMemberId && (
            <MemberStatsPanel trip={trip} memberId={selectedMemberId} />
          )}
        </section>
      )}

      {/* Minimum transfers */}
      <section>
        <h2 className="text-base font-semibold mb-3">轉帳清單</h2>
        {transfers.length === 0 ? (
          <p className="text-center text-gray-400 py-6">無需轉帳，已結清</p>
        ) : (
          <div className="space-y-2">
            {transfers.map((transfer, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{getMemberName(transfer.from)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{getMemberName(transfer.to)}</span>
                </div>
                <span className="font-semibold text-blue-600">
                  {trip.baseCurrency} {transfer.amount.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
