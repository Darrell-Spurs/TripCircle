import { useLanguage } from '../context/LanguageContext'
import { useSetActivityPreference, useRemoveActivityPreference } from '../hooks/useActivityPreferences'
import { useAuth } from '../context/AuthContext'

interface ActivityPreferenceButtonsProps {
  activityId: number
  preferenceCounts?: {
    interested: number
    not_interested: number
  }
  currentUserPreference?: 'interested' | 'not_interested' | null
}

export default function ActivityPreferenceButtons({
  activityId,
  preferenceCounts,
  currentUserPreference,
}: ActivityPreferenceButtonsProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const setPreference = useSetActivityPreference()
  const removePreference = useRemoveActivityPreference()

  if (!user) return null

  const handlePreferenceClick = (preference: 'interested' | 'not_interested') => {
    if (currentUserPreference === preference) {
      // Remove preference if clicking the same one
      removePreference.mutate(activityId)
    } else {
      // Set new preference
      setPreference.mutate({ activityId, preference })
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => handlePreferenceClick('interested')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
          currentUserPreference === 'interested'
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-green-50'
        }`}
      >
        <span>👍</span>
        <span>{t.activity.interested || 'Interested'}</span>
        {preferenceCounts && preferenceCounts.interested > 0 && (
          <span className="text-xs">({preferenceCounts.interested})</span>
        )}
      </button>
      <button
        type="button"
        onClick={() => handlePreferenceClick('not_interested')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
          currentUserPreference === 'not_interested'
            ? 'bg-red-100 text-red-800 border border-red-300'
            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-red-50'
        }`}
      >
        <span>👎</span>
        <span>{t.activity.notInterested || 'Not Interested'}</span>
        {preferenceCounts && preferenceCounts.not_interested > 0 && (
          <span className="text-xs">({preferenceCounts.not_interested})</span>
        )}
      </button>
    </div>
  )
}

