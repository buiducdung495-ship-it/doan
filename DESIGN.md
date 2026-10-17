---
name: E-Office Workflow Engine
description: Web-first internal E-Office system for documents, tasks, role-based workflows, and approvals.
colors:
  primary: "#4f46e5"
  primary-hover: "#4338ca"
  primary-soft: "#eef2ff"
  primary-ink: "#3730a3"
  surface-page: "#f8fafc"
  surface-panel: "#ffffff"
  surface-muted: "#f1f5f9"
  surface-dark: "#0f172a"
  surface-dark-raised: "#1e293b"
  ink: "#1e293b"
  ink-muted: "#64748b"
  ink-subtle: "#94a3b8"
  border-soft: "#e2e8f0"
  border-faint: "#f1f5f9"
  success: "#059669"
  success-soft: "#ecfdf5"
  warning: "#d97706"
  warning-soft: "#fffbeb"
  danger: "#e11d48"
  danger-soft: "#fff1f2"
  info: "#0284c7"
  info-soft: "#f0f9ff"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.04em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-panel}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.surface-panel}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.surface-panel}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-danger-soft:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: E-Office Workflow Engine

## 1. Overview

**Creative North Star: "The Clear Operations Desk"**

This product is a web-first internal operations desk: dense enough for real business work, restrained enough that employees can trust it, and clear enough that role, status, owner, and next action are visible without ceremony. The system should feel like a well-run office: structured navigation, readable labels, consistent state color, and no decorative friction between a user and the task.

The visual language is professional, compact, and explicit. White panels sit on a pale slate workspace; a dark slate sidebar anchors navigation; indigo marks the system accent for active navigation, focus, and primary workflow actions. Semantic colors are reserved for status and authority: emerald for approval/success, amber for pending/risk, rose for rejection/error, and sky/blue for informational categories.

The system explicitly rejects PRODUCT.md's anti-references: "mau me", "qua roi mat", "qua nhieu hieu ung", and any landing-page marketing treatment. This is a task surface, not a campaign.

**Key Characteristics:**
- Dense product UI built around side navigation, top context, white task panels, tables, cards, and forms.
- Restrained color strategy: slate neutrals carry most surfaces; indigo is rare and functional.
- Role and workflow state are always visible through badges, tabs, list selection, and action buttons.
- Motion is short state feedback, never page choreography.
- Web-first, cloud-ready, and built for employees working in a browser.

## 2. Colors

The palette is a restrained operations palette: slate for structure, white for task panels, indigo for system action, and semantic colors for workflow state.

### Primary
- **Command Indigo**: The primary system accent used for active navigation, focus rings, selected list items, AI/action highlights, and standard primary buttons.
- **Soft Command Indigo**: The quiet supporting tint for selected cards, icon wells, secondary action buttons, and AI assistant panels.
- **Deep Command Indigo**: The hover/pressed version of the primary action.

### Secondary
- **Success Emerald**: Used for approvals, completed states, positive confirmations, and irreversible success actions.
- **Pending Amber**: Used for waiting, review, medium risk, and transitional workflow states.
- **Decision Rose**: Used for rejection, errors, destructive actions, urgent banners, and risk warnings.
- **Info Sky**: Used for category markers and informational status that is not approval-related.

### Neutral
- **Workspace Slate**: The pale page background that keeps the app bright without becoming stark.
- **Panel White**: The default surface for cards, tables, forms, and modals.
- **Muted Slate Layer**: The soft background for nested details, empty states, table headers, input fills, and AI explanation boxes.
- **Navigation Slate**: The dark sidebar and auth surface foundation.
- **Raised Navigation Slate**: Dark hover and inset surfaces inside the sidebar/auth screens.
- **Ink Slate**: Primary text for titles, data, and important labels.
- **Muted Ink Slate**: Secondary text, descriptions, metadata, and table supporting data.
- **Subtle Ink Slate**: Timestamps, empty-state copy, low-priority labels, and helper text.
- **Soft Border Slate**: Standard border for cards, inputs, dividers, tables, and panels.

### Named Rules

**The Functional Accent Rule.** Indigo is reserved for selection, primary action, focus, and system intelligence. Do not use it as decoration.

**The Semantic State Rule.** Emerald, amber, rose, and sky must describe state or category. If a color does not clarify status, remove it.

**The Slate Majority Rule.** Most screens should read as slate/white first, indigo second, and semantic color third. If color competes with task scanning, the screen is too loud.

## 3. Typography

**Display Font:** Inter (with ui-sans-serif, system-ui fallback)  
**Body Font:** Inter (with ui-sans-serif, system-ui fallback)  
**Label/Mono Font:** JetBrains Mono for IDs, timestamps, technical codes, and audit-like metadata.

**Character:** The type system is compact and operational. Inter carries all product UI, while JetBrains Mono marks machine-readable values and audit trails without making the whole product feel technical.

### Hierarchy
- **Display** (800, 24px, 1.15): Used sparingly on auth headings or document-title moments. It must not become a marketing hero scale.
- **Headline** (700, 18px, 1.35): Used for page-level screen titles and large task headings.
- **Title** (700, 14px, 1.4): Used for card titles, panel headings, modal titles, and selected workflow detail headers.
- **Body** (500, 13px, 1.55): Used for descriptions, table content, card summaries, and form explanatory copy. Long prose should stay readable and avoid running beyond 65-75ch where possible.
- **Label** (700, 11px, 0.04em tracking): Used for compact uppercase section labels, table headers, badge text, and field labels. Use sparingly; not every section needs an uppercase label.
- **Mono** (500-700, 10-11px): Used for request IDs, employee IDs, dates, internal codes, and audit metadata.

### Named Rules

**The One-Sans Rule.** Product UI uses Inter for headings, body, labels, controls, and data. Do not introduce display fonts into workflow screens.

**The Small But Legible Rule.** Compact type is allowed because this is an operations app, but text must remain readable: muted labels need sufficient contrast, focus states must be visible, and placeholders cannot be pale gray after polish.

## 4. Elevation

The system uses a hybrid of tonal layering, hairline borders, and small shadows. Cards are mostly flat white panels with faint slate borders; shadows appear lightly on toasts, modal dialogs, sticky toolbars, and hoverable cards. Depth should clarify stacking and interaction, not decorate the page.

### Shadow Vocabulary
- **Panel Rest** (`border: 1px solid #f1f5f9; box-shadow: none or 0 1px 2px rgba(15, 23, 42, 0.04)`): Default card and table treatment.
- **Panel Hover** (`box-shadow: 0 4px 6px rgba(15, 23, 42, 0.06)`): Hoverable cards and selectable items only.
- **Floating Toolbar** (`box-shadow: 0 10px 15px rgba(15, 23, 42, 0.10)`): Sticky quick-add toolbars, toasts, and small floating controls.
- **Modal Lift** (`box-shadow: 0 20px 25px rgba(15, 23, 42, 0.12)`): Dialogs and workflow canvases that sit above the task surface.

### Named Rules

**The Flat-By-Default Rule.** Resting surfaces are flat and bordered. Shadows appear when the surface floats, overlays, or responds to hover.

**The No Ghost-Card Rule.** Do not combine decorative heavy borders with wide blurred shadows on ordinary cards. Pick one structural cue and keep it quiet.

## 5. Components

### Buttons

Buttons are compact, direct, and state-colored.

- **Shape:** Gently curved rectangles (8px radius) for most actions; 12px only for larger auth or document actions.
- **Primary:** Command Indigo background with white text, compact padding (8px 14px), bold 12px label, optional Lucide icon.
- **Hover / Focus:** Darken the background one step; focus must use a visible indigo ring or border change. Transitions stay around 150-250ms.
- **Success:** Emerald filled button for approve, submit, confirm, and complete.
- **Danger:** Rose soft button with border for reject/cancel/destructive decisions unless the action is truly destructive enough to require filled rose.
- **Secondary / Ghost:** Slate or indigo-tinted soft buttons for non-primary actions such as export, view, print, or write form.

### Chips

- **Style:** Small badges use 9-10px bold text, tight horizontal padding, and either pill or 4px rounded corners depending on density.
- **State:** Status chips use soft semantic backgrounds: emerald for approved, amber for pending, rose for rejected/error, sky for informational category, indigo for system category.
- **Rule:** Chips must communicate role, category, or status. They are not decoration.

### Cards / Containers

- **Corner Style:** Standard cards use 12px radius. Modals may use 16px. Avoid 24px+ card rounding in product screens.
- **Background:** White panels on pale slate workspace; muted slate panels for nested detail areas.
- **Shadow Strategy:** Flat at rest with subtle border; small hover shadow only for selectable cards.
- **Border:** Faint slate border is the default structural line.
- **Internal Padding:** 20px is the standard card padding; dense list items use 12-14px.

### Inputs / Fields

- **Style:** Inputs use muted slate fill or white fill, slate border, 8-12px radius, and compact 12-13px text.
- **Focus:** Focus changes to white fill plus indigo ring or border. Never rely on color alone; keep a visible outline/ring.
- **Error / Disabled:** Error uses rose tint, rose border, and explicit message. Disabled uses opacity plus cursor state, never only a lighter text color.
- **Document Fields:** The form-builder document canvas can use underline-style fields, but focus still shifts to indigo and must remain keyboard-visible.

### Navigation

- **Sidebar:** Dark slate sidebar with white/gray labels, indigo active item, Lucide icons at 16px, and compact 12px labels.
- **Top Bar:** White sticky header with bottom border, compact page context text, notification center, and profile metadata.
- **Tabs:** Border-bottom tabs use indigo for active state and slate muted labels for inactive state.
- **Mobile Treatment:** Sidebar should collapse into a top or drawer-like structure on narrow screens; dense tables need horizontal scrolling or responsive summaries.

### Tables

- **Style:** White table container, slate-50 header row, 10px uppercase headers, 12px body text, divide-y slate lines.
- **Data:** IDs and timestamps use JetBrains Mono; important workflow names use bold slate text.
- **State:** Row hover can use a very light slate tint. Status badges must remain the primary state signal.

### Modals / Dialogs

- **Style:** Slate overlay at about 60% opacity, centered white panel, 16px radius, clear header, and scrollable body.
- **Rule:** Use modals for focused document creation, print preview, and workflow diagram inspection. Do not use modals as the first answer for every edit.

### Signature Component: Workflow Canvas

The workflow canvas is the app's distinctive dark-mode inspection surface. It uses slate-950 / slate-900 panels, indigo active markers, semantic status chips, compact avatars, and line-connected stages. Keep it contained to workflow visualization; do not spread dark-mode styling across ordinary task screens without a reason.

## 6. Do's and Don'ts

### Do:

- **Do** keep screens professional, clear, and task-first: page context, current state, owner, and next action should be easy to scan.
- **Do** preserve the slate/white/indigo system: slate and white carry structure, indigo marks action and selection.
- **Do** use emerald, amber, rose, and sky only for clear workflow status, category, risk, or feedback.
- **Do** keep cards at 12px radius, buttons around 8px radius, and typography compact but readable.
- **Do** provide visible focus states, keyboard-friendly controls, readable contrast, and reduced-motion alternatives for Strict / Advanced accessibility.
- **Do** use Lucide icons consistently inside buttons, navigation, empty states, and status headers.
- **Do** make cloud-readiness visible through stable loading, error, empty, retry, and offline/backend-unavailable states.

### Don't:

- **Don't** make the interface "mau me", "qua roi mat", or dependent on decorative color.
- **Don't** make screens look like a landing page, campaign hero, or marketing site. This is an authenticated E-Office product.
- **Don't** add gratuitous gradients, glass effects, animated decoration, or large hero typography to task screens.
- **Don't** use full-saturation accents on inactive states; inactive UI should stay slate and quiet.
- **Don't** use side-stripe borders greater than 1px as card accents. Use badges, icons, full borders, or soft background tints instead.
- **Don't** ship tiny pale placeholder or helper text that fails contrast. Muted text still has to be readable.
- **Don't** introduce inconsistent button shapes, form controls, or icon styles across departments and workflow modules.
