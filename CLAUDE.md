# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server (accessible on all interfaces via -H 0.0.0.0)
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run compress` - Compress images using scripts/compress-images.js

### Code Quality
The project uses ESLint with custom rules:
- Files must be ≤300 lines (enforced by ESLint max-lines rule)
- When files exceed 300 lines, split into smaller components/hooks

## Project Architecture

### Tech Stack
- **Framework**: Next.js 13 (App Router) + React 18 + TypeScript
- **Maps**: Leaflet with leaflet-rotate and leaflet-rotatedmarker plugins
- **Real-time Communication**: MQTT.js via WebSocket
- **State Management**: Zustand (with persistence)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI components with shadcn/ui patterns
- **PWA**: next-pwa for Progressive Web App capabilities

### Core Features
This is a real-time sailing race management tool for sailing judges:
1. **Real-time Position Sync**: Admin (signal boat) broadcasts GPS position via MQTT
2. **Course Visualization**: Dynamic course rendering based on wind direction and race parameters
3. **Multi-role Support**: Admin (signal boat) vs Observer (judges) with different capabilities
4. **Observer Tracking**: All judges can see each other's positions in real-time

### Key Architecture Patterns

#### Feature-based Structure
```
src/features/
├── course/          # Course management and plugins
├── map/             # Map components and hooks
├── mqtt/            # MQTT communication layer
```

#### Plugin Architecture
Course types are implemented as plugins in `src/features/course/plugins/`:
- Each plugin implements `CoursePlugin` interface
- Supports dynamic parameter schemas for auto-generated forms
- Current types: `simple`, `oneFour`, `simple1a`
- Adding new courses: create plugin file and register in `registry.ts`

#### MQTT Communication Pattern
- Admin publishes to: `race/{courseId}/location/admin`
- Observers publish to: `race/{courseId}/location/observer/{observerId}`
- All messages use retain=true with TTL for offline handling
- Position change detection (1m threshold) prevents unnecessary publishes

#### Custom Hooks Pattern
Major functionality is extracted into custom hooks:
- `useLeafletMap` - Map initialization and management
- `useGpsWatch` - GPS tracking with throttling
- `useMqttPosSync` - MQTT position synchronization
- `useCourseDraw` - Dynamic course rendering
- `useDeviceOrientation` - Device compass integration

### TypeScript Path Aliases
```json
{
  "@components/*": ["components/*"],
  "@utils/*": ["utils/*"],
  "@features/*": ["src/features/*"],
  "@shared/*": ["src/shared/*"]
}
```

### State Management
- **Course Settings**: Zustand store with persistence and migration support
- **GPS Context**: React Context for GPS position management  
- **Local State**: Component-level state for UI interactions

### MQTT Message Format
```json
{
  "id": "ADMIN",
  "lat": 31.229221,
  "lng": 121.476419,
  "course": {
    "type": "simple",
    "params": {
      "axis": 40,
      "distanceNm": 0.9,
      "startLineM": 100
    }
  },
  "timestamp": 1688888888
}
```

## Development Guidelines

### File Organization
- Keep components ≤300 lines (ESLint enforced)
- Extract complex logic into custom hooks
- Place UI components in `src/features/map/components/`
- Use feature-based directory structure

### Performance Optimizations
- GPS position throttling with 1m change detection
- MQTT message deduplication
- Leaflet marker reuse vs recreation
- Dynamic viewport height handling for mobile

### Mobile Considerations
- Safe area handling with tailwindcss-safe-area
- Viewport zoom disabled for consistent UX
- Device orientation integration for compass features
- PWA capabilities for offline usage

### Code Quality
- TypeScript strict mode enabled
- ESLint with Next.js and recommended rules
- 300-line file size limit enforced
- No automatic Prettier integration (manual formatting)

## Race Management Logic

### Room Code System
- 6-character Base36 uppercase codes (e.g., "ABC123")
- Auto-generated on first visit, stored in localStorage
- URL format: `/race/[id]` where id = courseId
- Admin role: when visited courseId matches user's generated ID

### Position Publishing
- **Admin**: Publishes every second if position changed >1m
- **Observers**: Publish own position, subscribe to admin + other observers
- **Online Count**: Calculated from active MQTT retained messages

### Course Types
Current supported course types via plugin system:
- **simple**: Basic axis + distance + start line
- **oneFour**: Includes mark 4 width and distance parameters
- **simple1a**: Variant of simple course

### Device Integration
- **GPS**: High-accuracy positioning with fallback polling
- **Compass**: Device orientation for map bearing alignment
- **Viewport**: Dynamic height calculation for mobile browsers