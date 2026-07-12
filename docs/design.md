# UI/UX & Frontend Design System

This document is the absolute source of truth for all styling, typography, color palettes, and component designs for the Student Financial Management and Budget Tracker Application. It defines a high-contrast, dark-mode-first, alternative tech aesthetic inspired by modern mobile banking interfaces, maximized for readability, data scanning, and premium user experience (UX).

---

## 1. Core Identity & Shape Language

The application bridges a dark-mode tech aesthetic with high-end mobile dashboard patterns, avoiding both sharp brutalism and overly generic bubble layouts.

### Shape & Corner Radius Conventions
*   **Cards & Primary Widgets**: Moderately rounded corners to convey modern quality.
    *   *Tailwind utility*: `rounded-xl` (or `rounded-lg` for smaller sub-components).
    *   *CSS property*: `border-radius: 10px` or `12px` (mapped to `--radius: 10px`).
*   **Toggles, Segmented Tabs, & Switchers**: Fully rounded pills.
    *   *Tailwind utility*: `rounded-full`.
    *   *Example*: The header account switcher and timeframe filters (Day/Week/Month/Year).
*   **Icon Buttons**: Fully circular buttons.
    *   *Tailwind utility*: `rounded-full w-10 h-10 flex items-center justify-center`.
    *   *Example*: Top action buttons, navigation back buttons, and refresh buttons.

### Typography Stacks
*   **UI & Body Typography**: **Geist Sans** or **Inter**
    *   *Stack*: `var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
    *   *Use*: General navigation, labels, headings, body text, form elements.
*   **Financial & Data Typography**: **Geist Mono** or **JetBrains Mono**
    *   *Stack*: `var(--font-geist-mono), monospace`
    *   *Use*: Transaction amounts, ledger values, dates, percentages, daily quotas.
    *   *Rule*: Use tabular numerals (`font-variant-numeric: tabular-nums` / Tailwind's `tabular-nums`) to ensure numbers align perfectly in tables and vertical summaries.

---

## 2. Color Palette (Dark-Mode Theme)

Below is the complete set of shadcn/ui compatible CSS variables in HSL format, optimized for a sleek, alternative pitch-black interface with neon volt accents.

```css
:root {
  /* Light Mode (Minimal Fallback) */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 10px;
}

.dark {
  /* Core Base Colors */
  --background: 240 10% 2%;        /* Pitch-black canvas */
  --foreground: 0 0% 98%;          /* High-contrast off-white */
  
  /* Surface Containers */
  --card: 240 10% 4%;              /* Very deep charcoal gray for widgets */
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 4%;           /* Overlay drop-down background */
  --popover-foreground: 0 0% 98%;
  
  /* Primary Actions & Accents */
  --primary: 142 86% 55%;          /* Electric Neon Emerald/Volt Green for positive indicators */
  --primary-foreground: 240 10% 2%; /* Contrast dark text for button overlays */
  
  /* Secondary Elements */
  --secondary: 240 5% 15%;         /* Mid-tone dark gray */
  --secondary-foreground: 0 0% 98%;
  
  /* Muted Text / Placeholders */
  --muted: 240 5% 45%;             /* Medium gray */
  --muted-foreground: 240 5% 65%;  /* Soft readable gray */
  
  /* Interaction Accents */
  --accent: 240 5% 15%;
  --accent-foreground: 0 0% 98%;
  
  /* Semantic Colors (Expenses / Income) */
  --destructive: 0 100% 60%;       /* Vibrant Neon Red for expenses and warnings */
  --destructive-foreground: 0 0% 98%;
  
  /* Structural Separators */
  --border: 240 6% 12%;            /* Subtle separator line */
  --input: 240 6% 12%;             /* Form component border */
  --ring: 142 86% 55%;             /* Neon green focus ring outline */
  
  /* Custom Extended Variables */
  --chula-pink: 340 82% 52%;       /* Chulalongkorn University hot pink accent */
  --safe-to-spend: 180 100% 50%;   /* Neon Cyan for Safe-to-Spend metrics */
  --warning: 45 93% 47%;           /* High-contrast Amber */
}
```

---

## 3. Typography & Currency Sizing Hierarchy

To capture the high-end mobile dashboard feel, financial amounts must not be rendered as a single flat string. Instead, they use a sizing hierarchy where larger values have greater visual weight than minor ones.

### The Number Sizing Rule
Format both the thousands/hundreds and cents with distinct sizing.
*   **Format**: `$XX,XXX.XX`
*   **Weights**:
    *   The primary integer (e.g., `$60`) uses a large, prominent font size in bright white (`font-bold text-foreground`).
    *   The hundreds/thousands separator and following digits (e.g., `,312` or `,382`) are rendered in a slightly smaller size and muted opacity (`text-sm/md text-muted-foreground font-semibold`).
    *   The decimal/cents portion (e.g., `.45` or `.80`) is rendered as a subscript or smaller font at the end (`text-xs text-muted-foreground/80 font-medium`).

### React Component Pattern
To maintain consistency, use a custom component for currency displays:

```tsx
interface CurrencyDisplayProps {
  amount: number;
  className?: string;
}

export function CurrencyDisplay({ amount, className = "" }: CurrencyDisplayProps) {
  // Format to standard localized currency string (e.g., "$60,312.45")
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  const formatted = formatter.format(amount); // e.g. "$60,312.45"
  
  // Parse digits
  const parts = formatted.split(".");
  const cents = parts[1] || "00";
  const integerPart = parts[0]; // e.g. "$60,312"
  
  // Split the integer to separate the major digits (thousands) from minor ones
  const match = integerPart.match(/^(\$[0-9]+)(,[0-9]+)$/);
  
  if (match) {
    const [_, major, minor] = match;
    return (
      <span className={`font-mono inline-flex items-baseline ${className}`}>
        <span className="text-2xl font-bold text-foreground">{major}</span>
        <span className="text-base font-semibold text-muted-foreground">{minor}</span>
        <span className="text-xs font-medium text-muted-foreground/80 ml-0.5">.{cents}</span>
      </span>
    );
  }
  
  return (
    <span className={`font-mono inline-flex items-baseline ${className}`}>
      <span className="text-2xl font-bold text-foreground">{integerPart}</span>
      <span className="text-xs font-medium text-muted-foreground/80 ml-0.5">.{cents}</span>
    </span>
  );
}
```

---

## 4. Navigation & Layout Structure

### Top Header Pill Switcher (Account Switcher)
Toggling between different bank profiles or funding wallets is done via a prominent pill switcher in the top navigation header:
*   **Design**: A capsule pill with standard branding icons.
*   **Structure**:
    ```tsx
    <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-accent/50 transition-colors">
      <span className="text-xs font-medium text-foreground">Stipend Account</span>
      <div className="w-5 h-5 flex items-center justify-center bg-red-500 rounded-full text-[10px] text-white font-bold">
        CU
      </div>
      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
    </button>
    ```

### Segmented Timeframe Controls
Timeframe selection (Day, Week, Month, Year) uses a pill segmented control:
*   *Layout*: A horizontal row of text elements enclosed in circular pill wrappers (`rounded-full`).
*   *Inactive*: Transparent background, thin border, gray text.
*   *Active*: Solid border (`border-white` or `border-primary`), white/neon text, indicating active focus.

---

## 5. Component Styling Guidelines

### Data Tables
*   **Structure**: Clean rows with no vertical grid lines.
*   **Row Styling**:
    *   *Normal*: Solid background matching `--card`.
    *   *Hover*: Subtle highlight (`hover:bg-accent/40 transition-colors`).
    *   *Active/Selected indicator*: A thin vertical line appears on the far left edge of a row upon hover (`relative hover:before:absolute hover:before:left-0 hover:before:top-0 hover:before:bottom-0 hover:before:w-[2px] hover:before:bg-primary`).
*   **Alignment**: Text labels are left-aligned. Financial amounts and dates are right-aligned using `font-mono tabular-nums`.

### Cards & Dashboard Widgets
*   **Borders**: Thin solid outline (`border border-border`).
*   **Radius**: Rounded corners (`rounded-xl` / `10px`).
*   **Hover effect**: Glow border and shadow on interactive cards:
    *   `hover:border-primary/40 hover:shadow-[0_0_15px_rgba(57,255,20,0.06)] transition-all duration-200`

### Buttons
All buttons have standard shapes based on function, using rounded pills or circular outlines.
*   **Primary Button (`variant="default"`)**:
    *   *Style*: Solid Neon Volt Green (`bg-primary`) with dark text (`text-primary-foreground`), shaped as a rounded rectangle (`rounded-lg`).
    *   *Hover*: Glow effect (`hover:shadow-[0_0_12px_rgba(57,255,20,0.35)]`).
*   **Outline Button (`variant="outline"`)**:
    *   *Style*: Border border-border with transparent background.
    *   *Hover*: Secondary gray background with neon border (`hover:border-primary hover:bg-secondary`).
*   **Icon Action Button**:
    *   *Style*: Circular button (`rounded-full p-2.5 bg-secondary/50 border border-border`).
    *   *Hover*: Glow outline.

### Inputs & Forms
*   **Corners**: Rounded borders (`rounded-lg`).
*   **Focus Ring**: Smooth transition (`focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring outline-none transition-all`).
*   **Errors**: Dark red border (`border-destructive focus-visible:ring-destructive`).

---

## 6. Custom Progress Widget (Budget & Safe-To-Spend)

For visualizing stipend usage, remaining daily budgets, and Safe-to-Spend quotas, we reject thin generic progress bars in favor of a thick track layout with a pointer handle underneath.

### Layout Details
*   **Track**: A thick bar (`h-3 rounded-full bg-secondary`).
*   **Fill**: A thick contrasting highlight bar (`bg-white` or `bg-safetospend`).
*   **Indicator Pointer**: A small upward-pointing triangle positioned absolute below the current progress value to visually ground the spend indicator.

```tsx
interface TechProgressProps {
  value: number; // percentage (0 - 100)
  label?: string;
  minVal?: string;
  maxVal?: string;
}

export function TechProgress({ value, label, minVal, maxVal }: TechProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
        <span>{label}</span>
      </div>
      
      {/* Thick Progress Bar */}
      <div className="relative h-3 w-full bg-secondary rounded-full overflow-visible">
        <div 
          className="h-full bg-foreground rounded-full transition-all duration-500" 
          style={{ width: `${value}%` }}
        />
        
        {/* Indicator Triangle Underneath */}
        <div 
          className="absolute -bottom-2.5 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-foreground transition-all duration-500"
          style={{ left: `calc(${value}% - 5px)` }}
        />
      </div>
      
      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono pt-1">
        <span>{minVal}</span>
        <span>{maxVal}</span>
      </div>
    </div>
  );
}
```

---

## 7. Spacing & Grid Layout Constants

*   **Global Container**: Centered width container of `max-w-7xl` (`1280px`).
*   **Grid gap**: Standard grid spacing uses `gap-6` (`24px`) for dashboard sections, and `gap-4` (`16px`) for dashboard widgets.
*   **Card Inner Padding**: Default padding is `p-6` (`24px`). Compact card cells use `p-4` (`16px`).
*   **Layout Sections**: Vertical section stacks separated by `space-y-8` (`32px`).
