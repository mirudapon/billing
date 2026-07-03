import { useState } from 'react'
import { Trip } from '../types'
import MemberStatsPanel from './MemberStatsPanel'

interface SettlementViewProps {
  trip: Trip
}

export default function SettlementView({ trip }: SettlementViewProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(trip.members[0]?.id ?? '')

  return (
    <div className="p-4 space-y-6">
      {trip.members.length > 0 ? (
        <section>
          <h2 className="text-base font-semibold mb-3">個人統計</h2>
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
      ) : (
        <p className="text-center text-gray-400 py-12 text-sm">尚無成員</p>
      )}
    </div>
  )
}
