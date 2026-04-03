# UI Guidelines — DoctorCode

The UI must be **minimal, clean, and usable by non-technical patients and doctors** on mobile devices first.

## Principles

1. **Mobile-first** — design for 375px width, enhance for larger screens
2. **Large and readable** — base font 16px minimum; body text 18px on mobile
3. **Fat-finger friendly** — all tap targets ≥ 44px height/width
4. **Plain language** — no medical jargon in UI copy; no abbreviations without explanation
5. **Progressive disclosure** — show essential info first; details on demand
6. **Confirm before destroy** — always show a confirmation dialog before delete/unlink actions

## Color Palette

```
Background:   #F9FAFB  (gray-50)  — page background
Surface:      #FFFFFF              — cards, modals
Border:       #E5E7EB  (gray-200)
Text primary: #111827  (gray-900)
Text muted:   #6B7280  (gray-500)

Accent:       #2563EB  (blue-600)  — primary buttons, links
Accent hover: #1D4ED8  (blue-700)

Status — Normal:      #16A34A (green-600)  bg: #F0FDF4 (green-50)
Status — Borderline:  #D97706 (amber-600)  bg: #FFFBEB (amber-50)
Status — High/Crisis: #DC2626 (red-600)    bg: #FEF2F2 (red-50)
Status — Low:         #7C3AED (violet-600) bg: #F5F3FF (violet-50)
```

All color combinations must meet **WCAG AA contrast (4.5:1 for text)**.

## Typography

```
Font family: Inter (Google Fonts)
Base:        16px / 1.5 line-height
Body:        18px on mobile (text-lg)
Heading 1:   30px bold (text-3xl font-bold)
Heading 2:   24px semibold (text-2xl font-semibold)
Heading 3:   20px semibold (text-xl font-semibold)
Label:       14px medium (text-sm font-medium)
Caption:     12px normal (text-xs)
Reading value: 48px bold (text-5xl font-bold) — big number display
```

## Spacing

Use Tailwind's default scale. Key values:
- Page padding: `px-4 py-6` (mobile), `px-6 py-8` (md+)
- Card padding: `p-4` (mobile), `p-6` (md+)
- Section gap: `space-y-6`
- Form field gap: `space-y-4`

## Component Patterns

### `ReadingCard`
Displays a single reading entry in a list.
```
┌─────────────────────────────────┐
│  🩸 Blood Sugar        [Normal] │
│  ─────────────────────────────  │
│  6.2 mmol/L                     │
│  After meal · Today 9:41 AM     │
│  "Felt a bit dizzy"             │
└─────────────────────────────────┘
```
- Left icon (blood drop or heart for BP)
- Status badge (top-right): green/amber/red
- Big value in primary text
- Context + relative time in muted text
- Optional notes in smaller italic text
- Tap anywhere to open detail view

### `ReadingForm`
Form for logging a new reading.
- One screen per reading type (no tabs/toggles mid-form)
- Large number input with `inputmode="decimal"` for mobile keyboard
- Context selector: big tappable chips (not a dropdown)
- Date/time defaults to now; editable for backdating
- Single prominent "Save Reading" button at bottom
- Inline validation — show error under the field, not in a toast

### `TrendChart`
Recharts LineChart for showing readings over time.
- Responsive: `ResponsiveContainer width="100%" height={240}`
- Reference bands for normal ranges (shaded area)
- Dot colored by status (green/amber/red)
- X-axis: dates; Y-axis: value with unit
- Tap/hover tooltip: exact value + date + status
- Date range selector: 7 days / 30 days / 90 days (tabs above chart)

### `StatusBadge`
Small pill showing reading status.
```tsx
<StatusBadge status="normal" />   // Green — "Normal"
<StatusBadge status="high" />     // Red — "High"
<StatusBadge status="low" />      // Violet — "Low"
<StatusBadge status="borderline" /> // Amber — "Check"
```
- Never use only color to convey status — always include text label
- Size: `text-xs font-medium px-2 py-0.5 rounded-full`

### `ConfirmDialog`
Used before any destructive action.
```
┌─────────────────────────┐
│  Delete this reading?   │
│                         │
│  This cannot be undone. │
│                         │
│  [Cancel]  [Delete]     │
└─────────────────────────┘
```
- Cancel button on the left; destructive action on the right
- Destructive button is red (`bg-red-600`)
- Use shadcn/ui `AlertDialog` component

### `PatientCard` (Doctor view)
```
┌──────────────────────────────────┐
│  [Avatar]  Jane Smith  [2 alerts]│
│  Last BS: 8.1 mmol/L · 2h ago   │
│  Last BP: 145/92 · Yesterday    │
└──────────────────────────────────┘
```
- Tap to open full patient detail
- Alert count badge (red dot) if any out-of-range readings in last 7 days

## Navigation

Mobile bottom nav bar (4 items max):
```
[Home]  [Log Reading]  [History]  [Settings]
```
Doctor gets:
```
[Patients]  [Log Reading]  [History]  [Settings]
```

Active item: filled icon + blue text label. Inactive: gray icon, no label shown.

## Forms & Validation

- All form fields need visible `<label>` elements (not placeholder-only)
- Use `aria-describedby` to link error messages to inputs
- Show errors **below** the field in red text (`text-red-600 text-sm`)
- Do not disable submit button for validation — show errors on submit instead
- Loading state: show a spinner inside the button; disable the button; keep its text

## Accessibility

- All interactive elements must be keyboard focusable
- Focus rings: `focus-visible:ring-2 focus-visible:ring-blue-600`
- Images must have `alt` text; decorative images `alt=""`
- Color alone must never be the sole indicator of meaning
- Page `<title>` must be descriptive and unique per page

## Keeping This Document Current

- After building a new component → add its pattern/description here
- After changing the color palette → update the Colors section
- After adding a new page layout → describe it here
- Commit with: `docs: update UI-GUIDELINES.md — <what changed>`
