import { useState } from 'react'
import { Trip, Activity } from '../types'
import { useLanguage } from '../context/LanguageContext'
import { exportPlanToPDF } from '../utils/exportPlan'

interface ExportPlanModalProps {
  isOpen: boolean
  onClose: () => void
  trip: Trip
  activitiesByDate: Record<string, Activity[]>
}

export default function ExportPlanModal({
  isOpen,
  onClose,
  trip,
  activitiesByDate,
}: ExportPlanModalProps) {
  const { t, language } = useLanguage()
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const handleExport = async () => {
    try {
      setIsGenerating(true)
      exportPlanToPDF({
        trip,
        activitiesByDate,
        language: language as 'zh-TW' | 'en',
      })
      // Small delay to show generating state
      await new Promise((resolve) => setTimeout(resolve, 500))
      onClose()
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert(t.export.exportFailed)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">{t.export.exportPlan}</h2>
        
        <p className="text-gray-600 mb-6">
          {t.export.exportDescription}
        </p>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">{t.trip.title}:</h3>
            <p className="text-gray-700">{trip.title}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">{t.export.activitiesCount}:</h3>
            <p className="text-gray-700">
              {Object.values(activitiesByDate).reduce((sum, activities) => sum + activities.length, 0)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleExport}
            disabled={isGenerating}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? t.export.generating : t.export.exportToPDF}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}

