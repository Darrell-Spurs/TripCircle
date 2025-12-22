import { TripMember } from '../types'
import { useLanguage } from '../context/LanguageContext'

interface ActivityParticipantSelectorProps {
  members: TripMember[]
  selectedUserIds: number[]
  onChange: (userIds: number[]) => void
}

export default function ActivityParticipantSelector({
  members,
  selectedUserIds,
  onChange,
}: ActivityParticipantSelectorProps) {
  const { t } = useLanguage()

  const handleToggle = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId))
    } else {
      onChange([...selectedUserIds, userId])
    }
  }

  const handleSelectAll = () => {
    onChange(members.map((m) => m.userId))
  }

  const handleDeselectAll = () => {
    onChange([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {t.activity.participants || 'Participants'}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            {t.activity.selectAll || 'Select All'}
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-xs text-gray-600 hover:text-gray-700"
          >
            {t.activity.deselectAll || 'Deselect All'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
        {members.map((member) => {
          const isSelected = selectedUserIds.includes(member.userId)
          return (
            <label
              key={member.id}
              className="flex flex-col items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(member.userId)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {member.user.avatarUrl ? (
                <img
                  src={member.user.avatarUrl}
                  alt={member.user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                  {member.user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-gray-700 text-center truncate w-full">{member.user.name}</span>
            </label>
          )
        })}
      </div>
      {members.length === 0 && (
        <p className="text-sm text-gray-500">{t.activity.noMembers || 'No members in this trip'}</p>
      )}
    </div>
  )
}

