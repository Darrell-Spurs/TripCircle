# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Quick Save to Folder Feature** in Explore page
  - Quick save buttons for location folders when saving places from search results
  - If user has 5 or fewer folders: shows quick add buttons for all folders
  - If user has more than 5 folders: shows quick add buttons for top 5 most recently used folders
  - Tracks recently used folders in localStorage
  - Success animation: button turns green with white checkmark and "saved" text after successful save
  - Animation automatically resets after 2 seconds
  - Allows saving locations directly to folders without opening the full modal

- **Enhanced Transportation Display**
  - Simplified transportation options to only show "transit" mode
  - Display all transportation steps when transit is selected
  - Added "show detail" button for transit steps with detailed information
  - Display route information in format: (起站 -> 終點站, x 分鐘)
  - Show route numbers (e.g., "202公車", "捷運板南線") instead of start/end points in summary
  - Save user-selected transportation method to database (defaults to "driving" if empty)
  - Display "自訂" (Custom) in transportation method dropdown when manually changed
  - Transportation note feature with note icon next to "Open in Google Maps" button
  - Notes appear below "交通 路線：" text
  - Delete and restore buttons for transportation activities
  - Default Google Maps link set to "transit" mode, changes to "driving" or "walking" when user switches
  - Added departure time and date to Google Maps links for transportation

- **Location Tags in Comments and Notes**
  - Add locations to comments using Google Places API search
  - Locations appear as tag-like links to Google Maps (without address)
  - Tags styled with smaller height and spacing between them
  - Same tag-like link feature added to activity notes section
  - "Add Location" button in activity edit note popup

- **Calendar View and Day Management**
  - Calendar view at top of activities section (only shows in calendar view mode)
  - Calendar displays only weeks with schedules
  - Clicking a day filters to show only that day's schedule
  - Hide/show day feature with triangle button next to date
  - Collapsed state persisted in localStorage
  - List view (default) hides calendar, calendar view shows it

- **Activity View Modes**
  - Simple view (default) and detail view toggle
  - Eye icon changed to "detail view / 詳細檢視"
  - In simple view: removed address row, added Google Maps link button (paper airplane icon) next to title
  - "Show Comments" button repositioned above the line, aligned to the right
  - Address row removed in simple view

- **Activity Management Improvements**
  - "+" button now inserts new activity after the clicked activity (following its start time)
  - Time conflict detection with "Add Anyway" option when warning appears
  - Screen scrolls to recently updated activity after itinerary update (instead of jumping to top)
  - Activity notes support location tags (same as comments)

- **Branch Itinerary Feature**
  - Branch point and merge point activity types
  - Create separate itineraries for different participants at the same time
  - Participant selector button next to "+" button below branch point activity
  - View specific participant's itinerary or "Show All" participants
  - DFS-style display for "Show All": shows all branches sequentially until merge point
  - Transportation displayed correctly between activities with overlapping participants
  - Different colors for branch point (purple) and merge point (orange) activities
  - Branch point activities ignore conflict errors if participants are different
  - Manual merge point setting (auto-detection removed)
  - Default view shows current user's itinerary when branch point exists
  - Transportation from branch point to each branch's first activity
  - Transportation from each branch's last activity to merge point

- **UI/UX Improvements**
  - Paper airplane icon for Google Maps links (diagonal, lighter color)
  - Improved button spacing and alignment
  - Better visual indicators for activity types
  - Removed green "Merge Point" indicator bar

### Changed
- Removed auto-update feature for transportation times (only updates when "update button" is clicked)
- Transportation method dropdown shows "自訂" instead of "manual" indicator when manually changed
- Default view changed to simple view
- Transportation segment hidden state now uses localStorage instead of database (frontend-only display)
- Activity conflict detection now considers participant overlap (allows simultaneous activities for different people)

### Fixed
- Fixed route query infinite loop causing "loading route" and "displaying route" flicker
- Fixed calendar view crash when switching back to previously viewed day
- Fixed transportation method reverting after user changes it
- Fixed "儲存交通時間失敗" error when adding note to transportation activity
- Fixed time conflict detection for adjacent activities (allowing activities that end exactly when another starts)
- Fixed editing activities causing other days to disappear
- Fixed transportation segment positioning issues
- Fixed branch itinerary filtering logic for specific participants
- Fixed transportation display when selecting single user after branch point
- Fixed TypeScript errors across multiple files
- Fixed localization issues for transit route names

