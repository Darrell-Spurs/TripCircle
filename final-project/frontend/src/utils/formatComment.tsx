import React from 'react'

/**
 * Formats comment text with markdown-style links [text](url) and renders them as clickable links
 * Preserves line breaks and handles multi-line text
 */
export function formatCommentText(text: string): React.ReactNode {
  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let keyCounter = 0

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index)
      if (beforeText) {
        // Split by newlines and add each line as a separate element
        const lines = beforeText.split('\n')
        lines.forEach((line, idx) => {
          if (idx > 0) {
            parts.push(<br key={`br-${keyCounter++}`} />)
          }
          if (line) {
            parts.push(<span key={`text-${keyCounter++}`}>{line}</span>)
          }
        })
      }
    }

    // Add the link
    const linkText = match[1]
    const linkUrl = match[2]
    
    // Check if this is a Google Maps link (location tag)
    const isGoogleMapsLink = linkUrl.includes('google.com/maps')
    
    if (isGoogleMapsLink) {
      // Render as a tag-like badge
      parts.push(
        <a
          key={`link-${keyCounter++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors cursor-pointer mb-1 mr-1"
        >
          {linkText}
        </a>
      )
    } else {
      // Render as regular link
      parts.push(
        <a
          key={`link-${keyCounter++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 underline"
        >
          {linkText}
        </a>
      )
    }

    lastIndex = linkRegex.lastIndex
  }

  // Add remaining text after the last link
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex)
    if (remainingText) {
      // Split by newlines and add each line as a separate element
      const lines = remainingText.split('\n')
      lines.forEach((line, idx) => {
        if (idx > 0) {
          parts.push(<br key={`br-${keyCounter++}`} />)
        }
        if (line) {
          parts.push(<span key={`text-${keyCounter++}`}>{line}</span>)
        }
      })
    }
  }

  // If no links were found, return the original text with line breaks preserved
  if (parts.length === 0) {
    const lines = text.split('\n')
    return lines.map((line, idx) => (
      <React.Fragment key={idx}>
        {idx > 0 && <br />}
        {line}
      </React.Fragment>
    ))
  }

  return <>{parts}</>
}

