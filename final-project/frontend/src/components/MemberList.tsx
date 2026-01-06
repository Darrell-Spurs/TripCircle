import { TripMember } from '../types'
import { useRemoveMember, useUpdateMemberRole } from '../hooks/useMembers'
import { useLanguage } from '../context/LanguageContext'

interface MemberListProps {
  members: TripMember[]
  tripId: number
  isOwner: boolean
  isViewOnly?: boolean
}

export default function MemberList({ members, tripId, isOwner, isViewOnly = false }: MemberListProps) {
  const { t } = useLanguage()
  const removeMember = useRemoveMember()
  const updateRole = useUpdateMemberRole()

  const handleRemove = async (memberId: number) => {
    if (confirm(t.members.removeConfirm)) {
      await removeMember.mutateAsync({ memberId, tripId })
    }
  }

  const handleRoleChange = async (memberId: number, newRole: string) => {
    await updateRole.mutateAsync({ memberId, data: { role: newRole } })
  }

  if (isViewOnly) {
    // View-only mode: only show avatar and name
    return (
      <div className="flex flex-wrap gap-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2"
          >
            {member.user.avatarUrl ? (
              <img
                src={member.user.avatarUrl}
                alt={member.user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                {member.user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-gray-700">{member.user.name}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            {member.user.avatarUrl ? (
              <img
                src={member.user.avatarUrl}
                alt={member.user.name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {member.user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium">{member.user.name}</p>
              <p className="text-sm text-gray-500">{member.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isOwner && member.role !== 'owner' ? (
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="viewer">{t.trip.viewer}</option>
                <option value="editor">{t.trip.editor}</option>
              </select>
            ) : (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded text-sm capitalize">
                {member.role === 'owner' ? t.trip.owner : member.role === 'editor' ? t.trip.editor : member.role === 'viewer' ? t.trip.viewer : member.role}
              </span>
            )}
            {isOwner && member.role !== 'owner' && (
              <button
                onClick={() => handleRemove(member.id)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                {t.members.remove}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

