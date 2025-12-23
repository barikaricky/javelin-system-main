# Notification Panel Visual Guide

## Component Structure

```
┌─────────────────────────────────────────────────┐
│  🔔 Notifications              [Mark All Read]  │  ← Gradient Header (Blue)
│  5 unread                                       │
│  ┌─────────────┬──────────────┐                │
│  │  All (12)   │  Unread (5)  │                │  ← Filter Tabs
│  └─────────────┴──────────────┘                │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔵 [UserPlus Icon]        •unread           │ │  ← Notification Item
│ │ New Supervisor Approval Pending             │ │
│ │ John Doe submitted supervisor application   │ │
│ │ 🕐 2 hours ago • URGENT                     │ │
│ │                        [✓] [🗑]  ← Hover    │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔴 [AlertTriangle Icon]                     │ │
│ │ Incident Reported at Location X             │ │
│ │ Emergency incident requires immediate...     │ │
│ │ 🕐 5 hours ago • URGENT                     │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🟣 [Calendar Icon]                          │ │
│ │ Meeting Scheduled                           │ │
│ │ Quarterly review meeting at 2 PM            │ │
│ │ 🕐 1 day ago                                │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│        👁 View All Notifications                │  ← Footer Link
└─────────────────────────────────────────────────┘
```

## Color Scheme

### Notification Types & Colors
- **Approval** → Blue gradient (`from-blue-500 to-blue-600`)
- **Incident** → Red gradient (`from-red-500 to-red-600`)
- **Meeting** → Purple gradient (`from-purple-500 to-purple-600`)
- **Message** → Green gradient (`from-green-500 to-green-600`)
- **Alert** → Orange gradient (`from-orange-500 to-orange-600`)
- **Info** → Gray gradient (`from-gray-500 to-gray-600`)

### Priority Borders (Left Side)
- **Urgent** → Red border (`border-l-4 border-red-500`)
- **High** → Orange border (`border-l-4 border-orange-500`)
- **Medium** → Yellow border (`border-l-4 border-yellow-500`)
- **Low** → Gray border (`border-l-4 border-gray-300`)

## Interactive States

### Default State
```
Notification Item:
- Background: White
- Border: None (except priority left border)
- Opacity: 100%
```

### Unread State
```
Notification Item:
- Background: Blue tint (`bg-blue-50/50`)
- Badge: Blue dot (top-right)
- Font: Bold title
```

### Hover State
```
Notification Item:
- Background: Gray (`hover:bg-gray-50`)
- Action Buttons: Visible
  - Mark Read: Blue button with checkmark
  - Delete: Red button with trash icon
```

### Empty State
```
┌─────────────────────────────────────┐
│                                     │
│         [🔔 Large Bell Icon]        │
│         No notifications            │
│      You're all caught up!          │
│                                     │
└─────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────┐
│                                     │
│         [🔄 Spinning Icon]          │
│                                     │
└─────────────────────────────────────┘
```

## Responsive Breakpoints

### Mobile (<640px)
- Header padding: `px-4 py-4`
- Icon size: `w-4 h-4`
- Text size: `text-xs`
- Max height: `400px`
- Filter tabs: Full width, stacked

### Tablet (640px - 1024px)
- Header padding: `px-5 py-5`
- Icon size: `w-5 h-5`
- Text size: `text-sm`
- Max height: `500px`

### Desktop (>1024px)
- Header padding: `px-5 py-5`
- Icon size: `w-5 h-5`
- Text size: `text-base`
- Max height: `500px`
- Filter tabs: Side by side

## Animation Details

1. **Header Badge Pulse**
   - Unread count badge has subtle scale animation
   - Draws attention to new notifications

2. **Transition Effects**
   - All buttons: `transition-all` (200ms)
   - Hover states: Smooth background color change
   - Action buttons: Opacity fade (0 → 100%)

3. **Loading Spinner**
   - RefreshCw icon with `animate-spin`
   - Blue color (`text-blue-500`)
   - Centered in content area

## Accessibility Features

1. **Keyboard Navigation**
   - Tab through filter buttons
   - Enter to activate notifications
   - Escape to close (when in modal)

2. **Screen Readers**
   - Semantic HTML (`<button>`, `<nav>`)
   - ARIA labels on icon-only buttons
   - Title attributes for tooltips

3. **Color Contrast**
   - Text: Minimum 4.5:1 ratio
   - Buttons: Meets WCAG AA standards
   - Priority borders enhance visual distinction

## Integration Points

### API Endpoints
```typescript
GET    /director/notifications          // Fetch all
PATCH  /director/notifications/:id/read // Mark read
PATCH  /director/notifications/mark-all-read // Mark all
DELETE /director/notifications/:id      // Delete
```

### Data Flow
```
Component Mount
    ↓
Fetch Notifications (API)
    ↓
Store in State
    ↓
Auto-refresh (every 30s)
    ↓
User Interaction (click/mark/delete)
    ↓
Optimistic UI Update
    ↓
API Call
    ↓
State Update
```

## Usage Example

```tsx
import NotificationCard from '../../components/director/NotificationCard';

function DirectorDashboard() {
  return (
    <div className="dashboard-grid">
      <NotificationCard />
    </div>
  );
}
```

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

**Component:** NotificationCard
**Status:** Production Ready
**Last Updated:** 2024
