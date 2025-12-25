# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Quick Add to Folder Feature** in Explore page
  - Quick add buttons for location folders when saving places from search results
  - If user has 5 or fewer folders: shows quick add buttons for all folders
  - If user has more than 5 folders: shows quick add buttons for top 5 most recently used folders
  - Tracks recently used folders in localStorage
  - Success animation: button turns green with white checkmark and "saved" text after successful save
  - Animation automatically resets after 2 seconds
  - Allows saving locations directly to folders without opening the full modal

