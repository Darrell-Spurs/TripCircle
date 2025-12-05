import { useState } from 'react'
import { useInviteMember } from '../hooks/useMembers'
import { useLanguage } from '../context/LanguageContext'

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: number
}

export default function InviteMemberModal({ isOpen, onClose, tripId }: InviteMemberModalProps) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const inviteMember = useInviteMember()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await inviteMember.mutateAsync({ tripId, data: { email, role } })
      setEmail('')
      onClose()
    } catch (error: any) {
      alert(error.response?.data?.detail || t.members.failedToInvite)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">{t.members.inviteMember}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.members.email} *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.members.role}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="viewer">{t.trip.viewer}</option>
              <option value="editor">{t.trip.editor}</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={inviteMember.isPending}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {inviteMember.isPending ? t.members.inviting : t.members.invite}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

