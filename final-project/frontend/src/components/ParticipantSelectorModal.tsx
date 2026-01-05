import { useLanguage } from '../context/LanguageContext'
import { User } from '../types'

interface ParticipantSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  participants: User[]
  selectedParticipantId: number | 'all' | null
  onSelect: (participantId: number | 'all' | null) => void
}

export default function ParticipantSelectorModal({
  isOpen,
  onClose,
  participants,
  selectedParticipantId,
  onSelect,
}: ParticipantSelectorModalProps) {
  const { t } = useLanguage()
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          {t.activity.selectParticipantView || 'Select Participant View'}
        </h2>
        
        <div className="space-y-2 mb-4">
          <button
            onClick={() => {
              onSelect('all')
              onClose()
            }}
            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
              selectedParticipantId === 'all'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">{t.activity.viewAll || 'View All Participants'}</span>
            </div>
          </button>
          
          {participants.map(participant => (
            <button
              key={participant.id}
              onClick={() => {
                onSelect(participant.id)
                onClose()
              }}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                selectedParticipantId === participant.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                  {participant.name?.[0]?.toUpperCase() || participant.email?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="font-medium">{participant.name || participant.email}</span>
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-gray-700 font-medium"
        >
          {t.common.cancel || 'Cancel'}
        </button>
      </div>
    </div>
  )
}

