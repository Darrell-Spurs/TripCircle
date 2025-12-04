import { Activity } from '../types'
import ActivityCard from './ActivityCard'
import { useLanguage } from '../context/LanguageContext'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ItineraryDayProps {
  date: string
  activities: Activity[]
  onEdit: (activity: Activity) => void
  onDelete: (activityId: number) => void
  onReorder: (activityIds: number[]) => void
  canEdit: boolean
}

function SortableActivityItem({ activity, onEdit, onDelete, canEdit }: {
  activity: Activity
  onEdit: (activity: Activity) => void
  onDelete: (activityId: number) => void
  canEdit: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ActivityCard
        activity={activity}
        onEdit={onEdit}
        onDelete={onDelete}
        canEdit={canEdit}
      />
    </div>
  )
}

export default function ItineraryDay({
  date,
  activities,
  onEdit,
  onDelete,
  onReorder,
  canEdit,
}: ItineraryDayProps) {
  const { t, language } = useLanguage()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = activities.findIndex((a) => a.id === active.id)
      const newIndex = activities.findIndex((a) => a.id === over.id)

      const newActivities = arrayMove(activities, oldIndex, newIndex)
      onReorder(newActivities.map((a) => a.id))
    }
  }

  const dateObj = new Date(date)
  // Use the current language for date formatting
  const locale = language === 'zh-TW' ? 'zh-TW' : 'en-US'
  const formattedDate = dateObj.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4">{formattedDate}</h3>
      
      {activities.length === 0 ? (
        <p className="text-gray-500 text-sm">{t.activity.noActivitiesForDay}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activities.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {activities.map((activity) => (
                <SortableActivityItem
                  key={activity.id}
                  activity={activity}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  canEdit={canEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

