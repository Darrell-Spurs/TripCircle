import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Trip, Activity } from '../types'

interface ExportOptions {
  trip: Trip
  activitiesByDate: Record<string, Activity[]>
  language: 'zh-TW' | 'en'
}

export function exportPlanToPDF({ trip, activitiesByDate, language }: ExportOptions) {
  const doc = new jsPDF()
  const isZhTW = language === 'zh-TW'
  
  // Title
  doc.setFontSize(20)
  doc.text(trip.title, 14, 20)
  
  // Trip details
  doc.setFontSize(12)
  const startDate = new Date(trip.startDate).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US')
  const endDate = new Date(trip.endDate).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US')
  doc.text(`${isZhTW ? '日期' : 'Dates'}: ${startDate} - ${endDate}`, 14, 30)
  
  if (trip.description) {
    doc.setFontSize(10)
    const descriptionLines = doc.splitTextToSize(trip.description, 180)
    doc.text(descriptionLines, 14, 40)
  }
  
  let yPos = trip.description ? 50 : 40
  
  // Group activities by date
  const sortedDates = Object.keys(activitiesByDate).sort()
  
  sortedDates.forEach((dateStr, dateIndex) => {
    const activities = activitiesByDate[dateStr]
    if (activities.length === 0) return
    
    const date = new Date(dateStr)
    const dateLabel = date.toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    
    // Add new page if needed (except for first date)
    if (dateIndex > 0 && yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    // Date header
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(dateLabel, 14, yPos)
    yPos += 10
    
    // Activities table
    const tableData = activities.map((activity) => {
      const startTime = activity.startTime
        ? new Date(activity.startTime).toLocaleTimeString(language === 'zh-TW' ? 'zh-TW' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : ''
      const endTime = activity.endTime
        ? new Date(activity.endTime).toLocaleTimeString(language === 'zh-TW' ? 'zh-TW' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        : ''
      const timeRange = activity.activityType === 'gathering_point'
        ? startTime
        : startTime && endTime
          ? `${startTime} - ${endTime}`
          : startTime || endTime || ''
      
      return [
        timeRange,
        activity.title || activity.locationName || 'Untitled Activity',
        activity.address || activity.locationName || '',
        activity.notes || '',
        activity.activityType === 'gathering_point' ? (isZhTW ? '集合點' : 'Gathering Point') : '',
      ]
    })
    
    ;(doc as any).autoTable({
      startY: yPos,
      head: [[
        isZhTW ? '時間' : 'Time',
        isZhTW ? '活動' : 'Activity',
        isZhTW ? '地點' : 'Location',
        isZhTW ? '備註' : 'Notes',
        isZhTW ? '類型' : 'Type',
      ]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
    })
    
    // Update yPos after table
    const finalY = (doc as any).lastAutoTable.finalY || yPos + activities.length * 10
    yPos = finalY + 10
  })
  
  // Save PDF
  doc.save(`${trip.title.replace(/[^a-z0-9]/gi, '_')}_itinerary.pdf`)
}

