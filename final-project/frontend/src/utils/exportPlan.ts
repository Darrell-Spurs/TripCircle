import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Trip, Activity } from '../types'
// 導入字型文件以註冊字型
import '../fonts/NotoSansTC-VariableFont_wght-normal'
import '../fonts/NotoSansJP-VariableFont_wght-normal'

interface ExportOptions {
  trip: Trip
  activitiesByDate: Record<string, Activity[]>
  language: 'zh-TW' | 'en'
}

// 解析 Markdown 連結格式 [text](url)
function parseMarkdownLinks(text: string): Array<{ text: string; url?: string }> {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: Array<{ text: string; url?: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    // 添加連結前的文字
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index)
      if (beforeText) {
        parts.push({ text: beforeText })
      }
    }

    // 添加連結
    const linkText = match[1]
    const linkUrl = match[2]
    parts.push({ text: linkText, url: linkUrl })

    lastIndex = linkRegex.lastIndex
  }

  // 添加剩餘文字
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex)
    if (remainingText) {
      parts.push({ text: remainingText })
    }
  }

  // 如果沒有連結，返回原始文字
  if (parts.length === 0) {
    return [{ text }]
  }

  return parts
}


export function exportPlanToPDF({ trip, activitiesByDate, language }: ExportOptions) {
  try {
    // Create PDF with proper encoding settings
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      compress: true,
    })
    
    const isZhTW = language === 'zh-TW'
    // 根據語言選擇字型：中文用 TC，其他用 TC（也支援英文和日文）
    const fontName = 'NotoSansTC-VariableFont_wght'
    let yPos = 15
    
    // Set default font - 使用中文字型
    doc.setFont(fontName, 'normal')
    // 設定更深的黑色 (0, 0, 0) 已經是純黑，但我們可以確保使用它
    doc.setTextColor(0, 0, 0)
    
    // Title
    doc.setFontSize(16)
    doc.setFont(fontName, 'normal')
    // Split long titles to fit on page
    const titleLines = doc.splitTextToSize(trip.title, 180)
    doc.text(titleLines, 15, yPos)
    yPos += titleLines.length * 7 + 5
    
    // Trip details
    doc.setFontSize(10)
    doc.setFont(fontName, 'normal')
    doc.setTextColor(0, 0, 0) // 確保是黑色
    const startDate = new Date(trip.startDate).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US')
    const endDate = new Date(trip.endDate).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'en-US')
    const dateText = `${isZhTW ? '日期' : 'Dates'}: ${startDate} - ${endDate}`
    doc.text(dateText, 15, yPos)
    yPos += 8
    
    if (trip.description) {
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      const descLines = doc.splitTextToSize(trip.description, 180)
      doc.text(descLines, 15, yPos)
      yPos += descLines.length * 5 + 5
    }
    
    yPos += 5
    
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
      
      // Check if we need a new page
      if (dateIndex > 0 && yPos > 250) {
        doc.addPage()
        yPos = 15
      }
      
      // Date header
      doc.setFontSize(12)
      doc.setFont(fontName, 'normal')
      doc.setTextColor(0, 0, 0) // 確保是黑色
      doc.text(dateLabel, 15, yPos)
      yPos += 8
      doc.setFont(fontName, 'normal')
      
      // Prepare table data with transportation
      const tableData: any[] = []
      
      activities.forEach((activity, activityIndex) => {
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
        
        // 處理備註中的連結 - 保留原始格式供 didDrawCell 使用
        const notesText = activity.notes || ''
        
        // 獲取交通資訊（從前一個活動到當前活動）
        let transportationText = ''
        if (activityIndex > 0) {
          const prevActivity = activities[activityIndex - 1]
          // 計算交通時間（如果有結束時間）
          if (prevActivity.endTime && activity.startTime) {
            const prevEnd = new Date(prevActivity.endTime)
            const currStart = new Date(activity.startTime)
            const diffMinutes = Math.round((currStart.getTime() - prevEnd.getTime()) / 1000 / 60)
            if (diffMinutes > 0) {
              transportationText = `→ ${diffMinutes}${isZhTW ? '分' : 'min'}`
            } else {
              transportationText = '→'
            }
          } else {
            transportationText = '→'
          }
        }
        
        // 保存原始備註文字（包含 Markdown 連結格式）供 didDrawCell 使用
        tableData.push([
          timeRange,
          activity.title || activity.locationName || (isZhTW ? '未命名活動' : 'Untitled Activity'),
          activity.address || activity.locationName || '',
          notesText, // 保留原始格式
          transportationText,
        ])
        
        // 保存連結資訊到行數據
        const notesParts = parseMarkdownLinks(notesText)
        ;(tableData[tableData.length - 1] as any).__notesParts = notesParts
        
      })
      
      // Create table
      autoTable(doc, {
        startY: yPos,
        head: [[
          isZhTW ? '時間' : 'Time',
          isZhTW ? '活動' : 'Activity',
          isZhTW ? '地點' : 'Location',
          isZhTW ? '備註' : 'Notes',
          isZhTW ? '交通' : 'Transportation',
        ]],
        body: tableData,
        theme: 'grid',
        styles: {
          font: fontName,  // 使用中文字型
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap',
          textColor: [0, 0, 0], // 更深的黑色
        },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: [255, 255, 255],
          fontStyle: 'normal',
          fontSize: 9,
          font: fontName,
        },
        columnStyles: {
          0: { cellWidth: 25 },  // Time
          1: { cellWidth: 40 },  // Activity
          2: { cellWidth: 45 },  // Location
          3: { cellWidth: 50 },  // Notes
          4: { cellWidth: 20 },  // Transportation
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { left: 15, right: 15 },
        didParseCell: (data) => {
          // 確保所有文字都是黑色
          if (typeof data.cell.text === 'string') {
            data.cell.styles.textColor = [0, 0, 0]
          }
        },
        didDrawCell: (data) => {
          // 在備註列中，繪製連結
          if (data.column.dataKey === 3 && typeof data.cell.text === 'string') {
            const rowData = data.row.raw as any
            const notesParts = rowData.__notesParts || parseMarkdownLinks(data.cell.text as string)
            
            if (notesParts.length > 0) {
              const cellX = data.cell.x + 2
              const cellY = data.cell.y + 5
              let currentX = cellX
              
              notesParts.forEach((part: { text: string; url?: string }) => {
                if (part.url) {
                  // 繪製可點擊連結（藍色，有底線）
                  doc.setTextColor(0, 0, 255) // 藍色
                  doc.textWithLink(part.text, currentX, cellY, {
                    url: part.url,
                    underline: true,
                  })
                } else {
                  // 繪製普通文字（黑色）
                  doc.setTextColor(0, 0, 0) // 黑色
                  doc.text(part.text, currentX, cellY)
                }
                currentX += doc.getTextWidth(part.text)
              })
              
              // 重置文字顏色
              doc.setTextColor(0, 0, 0)
            }
          }
        },
        didDrawPage: () => {
          doc.setFontSize(8)
          doc.setFont(fontName, 'normal')
          doc.setTextColor(0, 0, 0)
          doc.text(
            `${isZhTW ? '第' : 'Page'} ${doc.getCurrentPageInfo().pageNumber} ${isZhTW ? '頁' : ''}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          )
        },
      })
      
      // Update yPos after table
      yPos = (doc as any).lastAutoTable.finalY + 10
    })
    
    // Save PDF
    const fileName = trip.title.replace(/[^a-z0-9\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/gi, '_')
    doc.save(`${fileName}_itinerary.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}
