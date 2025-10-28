# Planner.tsx Component Breakdown Plan

**Current State:** 2,701 lines - Monolithic component
**Target:** 20+ focused components with custom hooks

---

## Analysis

### Current Structure Issues:
1. ❌ 2,701 lines in a single component
2. ❌ Mixed concerns (auth, events, exports, UI, state)
3. ❌ 40+ useEffect hooks
4. ❌ 30+ handler functions
5. ❌ Deeply nested tab structures (3-4 levels deep)
6. ❌ Hard to test individual features
7. ❌ Difficult to maintain and navigate

### Proposed Structure:

```
client/src/
├── pages/
│   └── planner.tsx                    # Main orchestrator (~150 lines)
├── components/
│   └── planner/
│       ├── PlannerHeader.tsx          # Header with view mode toggles
│       ├── PlannerNavigation.tsx      # Date navigation controls
│       ├── PlannerCalendarView.tsx    # Calendar tab content
│       ├── PlannerClientsView.tsx     # Clients tab content
│       ├── PlannerProductivityView.tsx # Productivity tab content
│       ├── PlannerAppointmentsView.tsx # Appointments tab content
│       ├── PlannerExportView.tsx      # Export tab content
│       └── productivity/
│           ├── ProductivityHubTab.tsx
│           ├── SmartSchedulingTab.tsx
│           ├── AutomationTab.tsx
│           └── IntegrationsTab.tsx
├── hooks/
│   └── planner/
│       ├── usePlannerEvents.ts        # Event fetching & filtering
│       ├── usePlannerAuth.ts          # Auth state & handlers
│       ├── usePlannerSync.ts          # Calendar sync logic
│       ├── usePlannerMutations.ts     # Create/update/delete events
│       ├── usePlannerExport.ts        # PDF export handlers
│       ├── usePlannerNavigation.ts    # Date navigation logic
│       └── usePlannerFilters.ts       # Calendar filters state
└── utils/
    └── planner/
        ├── exportHandlers.ts          # Centralized export logic
        └── authHelpers.ts             # Auth utility functions
```

---

## Component Breakdown

### 1. Main Orchestrator (planner.tsx)
**Lines:** ~150
**Responsibilities:**
- Import and compose all child components
- Manage top-level state (viewMode, selectedDate)
- Provide context to child components

### 2. PlannerHeader Component
**Lines:** ~80
**Responsibilities:**
- Display title and current view badge
- User authentication status badge
- Logout button
- View mode toggle buttons (Weekly, Daily, Monthly, Yearly)

**Props:**
```typescript
interface PlannerHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  user: User | null;
}
```

### 3. PlannerNavigation Component
**Lines:** ~100
**Responsibilities:**
- Previous/Next navigation based on view mode
- Today button
- Refresh events button
- Month/Quarter navigation
- Display current date range

**Props:**
```typescript
interface PlannerNavigationProps {
  viewMode: ViewMode;
  selectedDate: Date;
  currentWeek: CalendarDay[];
  onNavigate: (direction: 'prev' | 'next', unit: 'day' | 'week' | 'month' | 'quarter' | 'year') => void;
  onToday: () => void;
  onRefresh: () => void;
}
```

### 4. PlannerCalendarView Component
**Lines:** ~200
**Responsibilities:**
- Render appropriate calendar view (Weekly/Daily/Monthly/Yearly)
- Calendar legend
- Event interactions
- Loading states

**Props:**
```typescript
interface PlannerCalendarViewProps {
  viewMode: ViewMode;
  selectedDate: Date;
  currentWeek: CalendarDay[];
  events: CalendarEvent[];
  isLoading: boolean;
  onDayClick: (date: Date) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventMove: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
}
```

### 5. PlannerClientsView Component
**Lines:** ~80
**Responsibilities:**
- Render SimpleClientDatabase component
- Handle client-related operations

**Props:**
```typescript
interface PlannerClientsViewProps {
  events: CalendarEvent[];
}
```

### 6. PlannerProductivityView Component
**Lines:** ~300 (with nested tabs)
**Responsibilities:**
- Nested tab structure for productivity features
- Hub, Smart Scheduling, Automation, Integrations tabs

**Props:**
```typescript
interface PlannerProductivityViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onCreateEvent: (event: Partial<CalendarEvent>) => void;
}
```

**Sub-components:**
- **ProductivityHubTab** - Overview dashboard
- **SmartSchedulingTab** - Smart appointment scheduling
- **AutomationTab** - Task automation (Basic, Workflows, AI Engine)
- **IntegrationsTab** - Cross-platform sync (Overview, Notion, Advanced)

### 7. PlannerAppointmentsView Component
**Lines:** ~150
**Responsibilities:**
- Appointment status view
- Appointment statistics
- Status modal

**Props:**
```typescript
interface PlannerAppointmentsViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
}
```

### 8. PlannerExportView Component
**Lines:** ~400
**Responsibilities:**
- Export dropdown menu
- All PDF export handlers
- Audit system buttons
- Authentication fix buttons

**Props:**
```typescript
interface PlannerExportViewProps {
  selectedDate: Date;
  currentWeek: CalendarDay[];
  events: CalendarEvent[];
}
```

---

## Custom Hooks

### 1. usePlannerEvents
**Responsibilities:**
- Fetch events from API
- Filter events by source (google, simplepractice, manual)
- Auto-refetch logic
- Event error handling

**Returns:**
```typescript
{
  events: CalendarEvent[];
  filteredEvents: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  filters: CalendarFilters;
  setFilters: (filters: CalendarFilters) => void;
}
```

### 2. usePlannerAuth
**Responsibilities:**
- Manage authentication state
- Handle OAuth callbacks
- Auto-fix authentication
- Refresh auth tokens

**Returns:**
```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetchAuth: () => void;
  handleOAuthLogin: () => void;
  handleLogout: () => void;
}
```

### 3. usePlannerSync
**Responsibilities:**
- Calendar sync mutation
- Sync status and errors
- Token refresh handling

**Returns:**
```typescript
{
  syncCalendar: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}
```

### 4. usePlannerMutations
**Responsibilities:**
- Create event mutation
- Update event mutation
- Delete event mutation
- Optimistic updates

**Returns:**
```typescript
{
  createEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}
```

### 5. usePlannerExport
**Responsibilities:**
- All PDF export handlers
- Export state management
- Error handling for exports

**Returns:**
```typescript
{
  exportPDF: (type: ExportType) => Promise<void>;
  runAudit: () => Promise<AuditResults>;
  isExporting: boolean;
  exportError: Error | null;
}
```

### 6. usePlannerNavigation
**Responsibilities:**
- Date navigation logic
- View mode navigation
- Current week calculation

**Returns:**
```typescript
{
  navigateWeek: (direction: 'prev' | 'next') => void;
  navigateDay: (direction: 'prev' | 'next') => void;
  navigateMonth: (direction: 'prev' | 'next') => void;
  navigateQuarter: (direction: 'prev' | 'next') => void;
  navigateYear: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  currentWeek: CalendarDay[];
}
```

### 7. usePlannerFilters
**Responsibilities:**
- Manage calendar source filters
- Filter events based on active filters

**Returns:**
```typescript
{
  filters: CalendarFilters;
  setFilters: (filters: CalendarFilters) => void;
  toggleFilter: (source: 'google' | 'simplepractice' | 'personal') => void;
}
```

---

## Implementation Plan

### Phase 1: Extract Custom Hooks (Foundation)
**Priority:** HIGH
**Estimated Lines Reduced:** ~800 lines

1. ✅ Create `hooks/planner/` directory
2. Extract `usePlannerEvents.ts` - Event fetching & filtering logic
3. Extract `usePlannerAuth.ts` - Authentication logic
4. Extract `usePlannerSync.ts` - Calendar sync logic
5. Extract `usePlannerMutations.ts` - Event CRUD operations
6. Extract `usePlannerNavigation.ts` - Navigation logic
7. Extract `usePlannerFilters.ts` - Filter state

**Why First:** Hooks reduce duplication and make components much simpler

### Phase 2: Extract Header & Navigation (Simple Components)
**Priority:** HIGH
**Estimated Lines Reduced:** ~200 lines

1. Create `components/planner/` directory
2. Extract `PlannerHeader.tsx`
3. Extract `PlannerNavigation.tsx`
4. Update planner.tsx to use new components

**Why Second:** Simple, no nested complexity, quick wins

### Phase 3: Extract Tab View Components (Main Views)
**Priority:** MEDIUM
**Estimated Lines Reduced:** ~1,000 lines

1. Extract `PlannerCalendarView.tsx`
2. Extract `PlannerClientsView.tsx`
3. Extract `PlannerAppointmentsView.tsx`
4. Extract `PlannerExportView.tsx`

### Phase 4: Extract Productivity Sub-Components (Complex Nested)
**Priority:** MEDIUM
**Estimated Lines Reduced:** ~400 lines

1. Create `components/planner/productivity/` directory
2. Extract `ProductivityHubTab.tsx`
3. Extract `SmartSchedulingTab.tsx`
4. Extract `AutomationTab.tsx`
5. Extract `IntegrationsTab.tsx`
6. Extract `PlannerProductivityView.tsx` (orchestrator)

### Phase 5: Extract Export Handlers
**Priority:** LOW
**Estimated Lines Reduced:** ~300 lines

1. Create `utils/planner/exportHandlers.ts`
2. Consolidate all export functions
3. Update `PlannerExportView.tsx` to use centralized handlers

### Phase 6: Cleanup & Testing
**Priority:** HIGH

1. Remove duplicate code
2. Add TypeScript types for all props
3. Add JSDoc comments
4. Write tests for hooks
5. Write tests for components
6. Delete unused code

---

## Expected Results

### Before:
- ❌ 2,701 lines in one file
- ❌ 40+ useEffect hooks
- ❌ 30+ handler functions
- ❌ Untestable monolith
- ❌ 4-level deep nesting

### After:
- ✅ ~150 lines main orchestrator
- ✅ 7 custom hooks (~100 lines each = 700 lines)
- ✅ 15+ focused components (~80 lines each = 1,200 lines)
- ✅ Testable, maintainable code
- ✅ Single Responsibility Principle
- ✅ 2-level max nesting
- ✅ **94% reduction** in largest file size (2,701 → 150)

---

## Benefits

1. **Maintainability** - Each component/hook has a single, clear purpose
2. **Testability** - Can test each hook and component independently
3. **Reusability** - Hooks can be reused across different views
4. **Readability** - Smaller files are easier to understand
5. **Performance** - Better code splitting and lazy loading opportunities
6. **Collaboration** - Multiple developers can work on different components
7. **Type Safety** - Proper TypeScript interfaces for all props
8. **Debugging** - Easier to isolate and fix bugs

---

**Created:** October 28, 2025
**Status:** Ready for Implementation
**Estimated Time:** 2-3 days for full refactor
