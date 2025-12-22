import { useLanguage } from '../context/LanguageContext'

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'error' | 'warning' | 'info' | 'success'
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'error',
}: AlertModalProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  const typeStyles = {
    error: {
      icon: '❌',
      bg: 'bg-red-50',
      border: 'border-red-200',
      title: 'text-red-800',
      message: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: '⚠️',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: 'ℹ️',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      title: 'text-blue-800',
      message: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    success: {
      icon: '✅',
      bg: 'bg-green-50',
      border: 'border-green-200',
      title: 'text-green-800',
      message: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
    },
  }

  const styles = typeStyles[type]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div
        className={`bg-white rounded-lg max-w-md w-full shadow-xl ${styles.bg} ${styles.border} border-2`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">{styles.icon}</div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${styles.title}`}>{title}</h3>
              <p className={`text-sm ${styles.message} whitespace-pre-line`}>{message}</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 text-white rounded-lg font-medium transition ${styles.button}`}
          >
            {t.common.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}

