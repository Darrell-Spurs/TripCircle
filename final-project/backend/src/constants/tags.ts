// Predefined tags for activities
export const PREDEFINED_TAGS = [
  'Food',
  'Sightseeing',
  'Shopping',
  'Entertainment',
  'Transportation',
  'Accommodation',
  'Nature',
  'Culture',
  'Adventure',
  'Relaxation',
] as const

export type PredefinedTag = typeof PREDEFINED_TAGS[number]

// Validate tag name
export function validateTagName(tag: string): { valid: boolean; error?: string } {
  if (!tag || tag.trim().length === 0) {
    return { valid: false, error: 'Tag name cannot be empty' }
  }
  
  if (tag.length > 50) {
    return { valid: false, error: 'Tag name must be 50 characters or less' }
  }
  
  // Allow Unicode letters/numbers, spaces, hyphens, and underscores (supports Chinese, Japanese, etc.)
  // \p{L} matches any letter from any language
  // \p{N} matches any number from any language
  if (!/^[\p{L}\p{N}\s\-_]+$/u.test(tag)) {
    return { valid: false, error: 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores' }
  }
  
  return { valid: true }
}

// Check if tag is predefined
export function isPredefinedTag(tag: string): boolean {
  return PREDEFINED_TAGS.includes(tag as PredefinedTag)
}

