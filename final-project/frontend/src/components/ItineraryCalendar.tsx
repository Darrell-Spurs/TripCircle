import { useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'

interface ItineraryCalendarProps {
  days: string[] // Array of date strings in YYYY-MM-DD format
  activitiesByDate: Record<string, any[]> // Activities grouped by date
  selectedDate: string | null // Currently selected date (null = show all)
  onDateSelect: (date: string | null) => void // Callback when a date is clicked
}

export default function ItineraryCalendar({
  days,
  activitiesByDate,
  selectedDate,
  onDateSelect,
}: ItineraryCalendarProps) {
  const { t, language } = useLanguage()

  // Get all dates that have activities
  const datesWithActivities = useMemo(() => {
    return days.filter((date) => {
      const activities = activitiesByDate[date] || []
      return activities.length > 0
    })
  }, [days, activitiesByDate])

  // Group dates by week
  const weeks = useMemo(() => {
    if (datesWithActivities.length === 0) return []

    const weekMap = new Map<string, string[]>()
    
    datesWithActivities.forEach((dateStr) => {
      const date = new Date(dateStr + 'T00:00:00')
      const weekStart = getWeekStart(date)
      const year = weekStart.getFullYear()
      const month = String(weekStart.getMonth() + 1).padStart(2, '0')
      const day = String(weekStart.getDate()).padStart(2, '0')
      const weekKey = `${year}-${month}-${day}`
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, [])
      }
      weekMap.get(weekKey)!.push(dateStr)
    })

    // Convert to array and sort by week start date
    return Array.from(weekMap.entries())
      .map(([weekKey, dates]) => ({
        weekKey,
        dates: dates.sort(),
        startDate: weekKey,
      }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [datesWithActivities])

  // Get week start date (Monday) for a given date
  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    return new Date(d.setDate(diff))
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    })
  }

  // Format weekday
  const formatWeekday = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
    return date.toLocaleDateString(locale, { weekday: 'short' })
  }

  // Get all days in a week (Monday to Sunday)
  const getWeekDays = (weekStartDate: string): string[] => {
    const start = new Date(weekStartDate + 'T00:00:00')
    const weekDays: string[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      weekDays.push(`${year}-${month}-${day}`)
    }
    
    return weekDays
  }

  if (weeks.length === 0) {
    return null
  }

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t.trip?.calendarView || 'Calendar'}
        </h3>
        {selectedDate && (
          <button
            type="button"
            onClick={() => onDateSelect(null)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {t.common?.showAll || 'Show All'}
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {weeks.map((week) => {
          const weekDays = getWeekDays(week.startDate)
          
          return (
            <div key={week.weekKey} className="border border-gray-200 rounded-lg p-3">
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((dateStr) => {
                  const hasActivities = (activitiesByDate[dateStr] || []).length > 0
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === new Date().toISOString().split('T')[0]
                  
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        if (hasActivities) {
                          onDateSelect(isSelected ? null : dateStr)
                        }
                      }}
                      disabled={!hasActivities}
                      className={`
                        relative p-2 rounded-lg text-sm transition-colors
                        ${!hasActivities 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : isSelected
                            ? 'bg-indigo-600 text-white font-semibold'
                            : isToday
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                      title={hasActivities ? formatDate(dateStr) : ''}
                    >
                      <div className="text-xs mb-1">{formatWeekday(dateStr)}</div>
                      <div className="font-medium">{new Date(dateStr + 'T00:00:00').getDate()}</div>
                      {hasActivities && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

