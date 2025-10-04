# AMIGOS Delivery Dashboard - Design Guidelines

## Design Approach

**Selected Approach:** Design System - Modern Admin Dashboard Pattern

**Justification:** This is a data-intensive operational dashboard requiring efficiency, clarity, and consistent patterns. Drawing inspiration from modern admin interfaces like Linear, Vercel, and Stripe dashboards, prioritizing information density, quick navigation, and actionable insights.

**Key Design Principles:**
- **Clarity First:** Every element serves a functional purpose
- **Information Hierarchy:** Clear visual prioritization of critical data
- **Efficient Navigation:** Minimal clicks to reach any function
- **Responsive Data Display:** Adapts gracefully from desktop to tablet
- **Operational Speed:** Design supports quick decision-making

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: `24 88% 58%` (AMIGOS Orange #F28C38)
- Background: `0 0% 100%` (White)
- Surface: `0 0% 98%` (Light grey for cards)
- Border: `0 0% 90%` (Subtle borders)
- Text Primary: `0 0% 10%` (Near black)
- Text Secondary: `0 0% 40%` (Medium grey)
- Success: `142 71% 45%` (Green for completed orders)
- Warning: `38 92% 50%` (Amber for pending)
- Danger: `0 84% 60%` (Red for issues)

**Dark Mode:**
- Primary: `24 88% 58%` (Same orange, maintains brand)
- Background: `0 0% 8%` (Deep dark)
- Surface: `0 0% 12%` (Elevated panels)
- Border: `0 0% 20%` (Visible separation)
- Text Primary: `0 0% 95%` (Near white)
- Text Secondary: `0 0% 65%` (Muted text)
- Success/Warning/Danger: Adjust lightness for dark mode readability

### B. Typography

**Font Stack:**
- Primary: Inter (via Google Fonts CDN) for all UI text
- Monospace: JetBrains Mono for order IDs, codes, timestamps

**Type Scale:**
- Page Headers: text-2xl font-semibold (32px)
- Section Headers: text-lg font-medium (20px)
- Card Titles: text-base font-medium (16px)
- Body Text: text-sm (14px)
- Labels/Meta: text-xs (12px)
- Data Tables: text-sm with tabular-nums

**Hierarchy:**
- Use font-weight variations (medium: 500, semibold: 600) over size changes
- Maintain consistent line-height: leading-relaxed for readability

### C. Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 8, 12, 16** for consistency
- Component padding: p-4 to p-6
- Section spacing: space-y-8
- Card margins: gap-4 or gap-6 in grids
- Form fields: space-y-4

**Grid Structure:**
- Sidebar Navigation: w-64 fixed (collapsed to w-16 on mobile)
- Main Content: flex-1 with max-w-7xl container
- Dashboard Cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Data Tables: Full width with horizontal scroll on mobile

**Responsive Breakpoints:**
- Mobile: Base styles (sidebar collapses to icons only)
- Tablet: md: (768px) - 2 column grids
- Desktop: lg: (1024px) - Full 3-4 column layouts

### D. Component Library

**Navigation:**
- Sidebar: Fixed left navigation with sections (Dashboard, Orders, Clients, Delivery, Providers, Products, Analytics, Settings)
- Icons from Heroicons (outline for inactive, solid for active states)
- Active state: bg-primary/10 with text-primary and border-l-2 border-primary

**Dashboard Cards:**
- Stats Cards: White/dark surface with icon, metric number (text-3xl), label, and trend indicator
- Quick Action Cards: Prominent CTAs with icon + text
- Recent Activity: Compact list with avatars/icons, timestamps

**Data Tables:**
- Striped rows for readability (even:bg-surface)
- Sticky headers on scroll
- Row actions: Dropdown menu (3 dots) on hover
- Sortable columns with arrow indicators
- Pagination: Show 10/25/50 rows with page numbers

**Forms:**
- Input fields: border rounded-lg with focus:ring-2 focus:ring-primary
- Labels: text-sm font-medium mb-2
- Validation: Inline error messages in text-danger
- Buttons: Primary (bg-primary), Secondary (outline), Danger (bg-danger)
- File uploads: Drag-and-drop zones with dashed borders

**Status Badges:**
- Pills with dot indicator: 
  - Pending: bg-warning/10 text-warning
  - In Progress: bg-blue-500/10 text-blue-600
  - Completed: bg-success/10 text-success
  - Cancelled: bg-danger/10 text-danger

**Modals/Drawers:**
- Slide-in drawer from right for order details (max-w-2xl)
- Center modals for confirmations (max-w-md)
- Backdrop: bg-black/50 backdrop-blur-sm

**Order Management Specific:**
- Order Card: Compact view with order ID, customer, status, total, time
- Order Details: Full breakdown with items list, delivery info, timeline tracker
- Real-time updates: Subtle pulse animation on status changes

**Client Management:**
- Client list: Avatar, name, phone, total orders, join date
- Client profile: Tab layout (Info, Orders History, Stats)

**Charts & Analytics:**
- Use Chart.js with orange primary color
- Simple bar/line charts for revenue, orders over time
- Donut charts for delivery status distribution

### E. Interactions & Animations

**Minimize Animations - Only Use:**
- Subtle fade-in for page transitions (200ms)
- Smooth height transitions for collapsible sections
- Pulse effect for real-time order updates (from backend)
- Loading states: Skeleton screens (not spinners)

**Hover States:**
- Table rows: bg-surface on hover
- Buttons: Slight brightness increase
- Cards: Subtle shadow lift (shadow-md to shadow-lg)

---

## Page-Specific Layouts

**Dashboard Home:**
- Top: 4 stat cards (Total Orders, Active Deliveries, Revenue Today, Active Users)
- Middle: Recent orders table + Delivery map visualization
- Bottom: Quick actions + Revenue chart

**Orders Page:**
- Filter bar: Status tabs, date range, search
- Order table with inline actions
- Click row → Slide-in drawer with full details

**Clients Page:**
- Search + filter controls
- Grid/list toggle view
- Client cards or table rows

**Analytics:**
- Date range selector at top
- Grid of metric cards
- Large charts section
- Export data button

---

## Implementation Notes

- Use Heroicons CDN for all icons
- Implement consistent dark mode with class-based toggle
- All forms maintain dark mode styling (including inputs/textareas)
- API endpoints: Use placeholder comments like `// API: GET /api/admin/orders`
- Tables should support sorting, filtering, and pagination
- Maintain loading states for all async operations