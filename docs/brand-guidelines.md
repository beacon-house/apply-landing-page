# Beacon House Brand Guidelines

**Last Updated:** 2025-11-25
**Version:** 2.0

This document defines the complete design system, brand identity, color palette, typography, UX patterns, and interaction design principles used across the Beacon House application. Use this as context for maintaining design consistency across all features.

---

## Table of Contents
1. [Brand Identity](#brand-identity)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Design Patterns](#component-design-patterns)
6. [Animation & Motion](#animation--motion)
7. [UX & Interaction Patterns](#ux--interaction-patterns)
8. [Responsive Design](#responsive-design)
9. [Accessibility](#accessibility)

---

## Brand Identity

### Brand Positioning
Beacon House positions itself as a premium education consulting service for ambitious families seeking admission to elite universities (Ivy League, Oxford, Cambridge, and other top-tier institutions).

### Brand Voice & Tone
- **Professional yet Approachable:** Confident authority without being intimidating
- **Achievement-Oriented:** Focus on results, success rates, and outcomes
- **Trustworthy:** Emphasis on proven track record and credibility
- **Aspirational:** Language that inspires excellence and ambition
- **Data-Driven:** Specific statistics and metrics (e.g., "7X higher acceptance rates", "620+ Ivy League Acceptances")

### Key Messaging
- Insider expertise through Former Admissions Officers
- Exclusive access to research and internship opportunities
- Exceptional outcomes with proven success rates
- Premium positioning for "the most ambitious families"

---

## Color Palette

### Primary Colors

#### Navy Blue (Primary)
- **HEX:** `#002F5C`
- **HSL:** `hsl(221.2, 83.2%, 53.3%)`
- **Light Variant:** `#1a4573`
- **Usage:** Headers, navigation, primary text, brand elements, CTAs (text color on accent backgrounds)
- **Psychology:** Authority, trust, professionalism, intelligence

#### Golden Yellow (Accent)
- **HEX:** `#FFC736`
- **HSL:** `hsl(48, 100%, 60.8%)`
- **Light Variant:** `#FFD469`
- **Alternative Dark:** `#FFB800`
- **Usage:** CTAs, highlights, important stats, icons, underlines, progress indicators
- **Psychology:** Achievement, excellence, aspiration, premium quality

### Neutral Colors

#### Gray Scale
- **Gray 50:** `#F4F4F4` - Light backgrounds, subtle borders
- **Gray 100:** `#E9E9E9` - Card backgrounds, disabled states
- **Gray 200:** Borders, dividers
- **Gray 600:** Secondary text, helper text
- **Gray 700:** Navigation text, body text secondary
- **Gray 800:** Helper text emphasis, error messages
- **Gray 900:** Primary body text

#### White
- **HEX:** `#FFFFFF`
- **HSL:** `hsl(0, 0%, 100%)`
- **Usage:** Card backgrounds, primary content backgrounds, text on dark backgrounds

### Semantic Colors

#### Success/Validation
- **Green 600:** `text-green-600` - Completed states
- **Green 700:** `text-green-700` - Success indicators
- **Green 50:** `bg-green-50` - Success backgrounds
- **Green 100:** `bg-green-100` - Success badge backgrounds

#### Error/Validation
- **Red 500:** `#EF4444` - Error text, validation errors
- **HSL:** `hsl(0, 84.2%, 60.2%)`
- **Usage:** Form validation, error messages, required field indicators

### Background Gradients

#### Hero Section
```css
bg-gradient-to-br from-gray-50 to-white
```

#### Primary Section
```css
bg-primary text-white
```

#### Overlay Gradients
```css
bg-gradient-to-tr from-primary/20 to-transparent
```

---

## Typography

### Font Families

#### Headings (Sans)
- **Font:** Poppins
- **Weights:** 600 (Semi-bold), 700 (Bold)
- **Usage:** All headings (h1-h6), section titles, card headings, CTAs
- **Fallback:** `'Poppins', 'system-ui', 'sans-serif'`
- **Loading:** `font-display: swap` with optimized loading

#### Body (Body)
- **Font:** Open Sans
- **Weight:** 400 (Regular)
- **Usage:** Body text, form labels, descriptions, secondary content
- **Fallback:** `'Open Sans', 'system-ui', 'sans-serif'`
- **Loading:** `font-display: swap`

### Type Scale & Hierarchy

#### Hero Headlines (H1)
- **Mobile:** `text-4xl` (36px)
- **Tablet:** `md:text-5xl` (48px)
- **Desktop:** `lg:text-6xl` (60px)
- **Weight:** `font-bold` (700)
- **Color:** `text-primary`
- **Line Height:** `leading-tight` (1.25)
- **Font:** Poppins

#### Section Titles (H2)
- **Mobile:** `text-3xl` (30px)
- **Desktop:** `md:text-4xl` (36px)
- **Weight:** `font-bold` (700)
- **Color:** `text-primary`
- **Margin:** `mb-6` (24px)
- **Alignment:** `text-center`
- **Font:** Poppins

#### Card/Component Headings (H3)
- **Size:** `text-2xl` (24px) or `text-xl` (20px)
- **Weight:** `font-bold` (700)
- **Color:** `text-primary` or `text-[#0a2342]`
- **Font:** Poppins

#### Body Text
- **Size:** `text-base` (16px)
- **Size (Large):** `text-lg` (18px) or `text-xl` (20px)
- **Weight:** 400 (Regular)
- **Color:** `text-gray-600` or `text-gray-900`
- **Line Height:** `leading-relaxed` (1.625)
- **Font:** Open Sans

#### Small Text
- **Size:** `text-sm` (14px)
- **Size (Extra Small):** `text-xs` (12px)
- **Color:** `text-gray-600`
- **Usage:** Helper text, metadata, captions
- **Font:** Open Sans

#### Stat Numbers
- **Size:** `text-2xl` (24px)
- **Weight:** `font-bold` (700)
- **Color:** `text-primary/90`
- **Font:** Poppins

### Text Emphasis

#### Underline Decoration
```css
underline decoration-accent decoration-4
```
Used on key phrases in hero section (e.g., "Ivy League", "Oxford & Cambridge")

#### Italic Emphasis
```css
italic
```
Used for emphatic statements, helper text, error messages

---

## Spacing & Layout

### Spacing System
Based on **8px grid system**:
- **Unit:** `0.25rem` = 4px
- **Scale:** 1, 2, 3, 4, 6, 8, 12, 16, 20, 24 (multiples of 4px)

### Common Spacing Values
- **2:** 8px - Tight spacing between related elements
- **3:** 12px - Small gaps
- **4:** 16px - Standard gap between items
- **6:** 24px - Medium section spacing
- **8:** 32px - Large section spacing
- **12:** 48px - Extra large section spacing
- **16:** 64px - Mega section spacing
- **20:** 80px - Section vertical padding

### Container Widths
- **Max Width:** `max-w-7xl` (1280px) - Main content container
- **Form Width (Mobile):** `max-w-full`
- **Form Width (Desktop):** `max-w-5xl` (1024px)
- **Text Content:** `max-w-3xl` (768px) or `max-w-4xl` (896px)
- **Centered:** `mx-auto`

### Padding
- **Page Horizontal:** `px-4 sm:px-6 lg:px-8`
- **Section Vertical:** `py-16` (mobile) to `py-20` or `py-24` (desktop)
- **Card Padding:** `p-6` to `p-10`

### Border Radius
- **Default:** `var(--radius)` = `0.75rem` (12px)
- **Large:** `rounded-lg` (8px)
- **Extra Large:** `rounded-xl` (12px)
- **2X Large:** `rounded-2xl` (16px)
- **Full:** `rounded-full` (9999px) - For badges, icons

---

## Component Design Patterns

### Cards

#### Standard Card
```css
bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300
```
- **Background:** White
- **Padding:** 24px
- **Border Radius:** 8px
- **Shadow:** Medium, increases on hover
- **Transition:** All properties, 300ms

#### Feature Card (Blueprint Section)
```css
bg-white rounded-2xl p-10 shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] group
```
- **Background:** White
- **Padding:** 40px
- **Border Radius:** 16px
- **Hover:** Lifts up 4px, increases shadow
- **Icon Container:** `w-12 h-12 bg-accent/10 rounded-xl` with bounce animation on hover

#### Form Section Card
```css
bg-white rounded-xl p-6 shadow-sm border border-gray-100
```
- **Background:** White
- **Padding:** 24px
- **Border Radius:** 12px
- **Border:** Light gray (100)
- **Shadow:** Subtle

### Buttons

#### Primary CTA (Accent)
```css
bg-accent text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-accent-light transition-all duration-300 shadow-md hover:shadow-lg
```
- **Background:** Golden yellow (`#FFC736`)
- **Text Color:** Navy blue
- **Padding:** Horizontal 32px, Vertical 16px
- **Font Size:** 18px
- **Font Weight:** 600 (Semi-bold)
- **Hover:** Lighter yellow, increased shadow
- **Border Radius:** 8px

#### Sticky CTA Button
```css
w-full py-4 rounded-lg text-base md:text-lg font-bold transition-all duration-300 shadow-md flex items-center justify-center space-x-2 bg-accent text-primary hover:bg-accent-light hover:shadow-lg
```
- Full width with consistent styling
- Includes chevron icon for direction
- Animated slide-up entrance

#### Secondary Button
```css
bg-secondary text-secondary-foreground hover:bg-secondary/80
```

#### Toggle Button (Grade Format Selection)
```css
/* Selected State */
bg-primary text-white border-primary

/* Unselected State */
bg-white text-gray-700 border-gray-300 hover:bg-gray-50
```

### Form Elements

#### Input Fields
```css
h-12 bg-white border border-gray-300 rounded-md
/* Error State */
border-red-500 focus:border-red-500
```
- **Height:** 48px
- **Background:** White
- **Border Radius:** 6px
- **Font Size:** 16px (prevents auto-zoom on mobile)

#### Select Dropdowns
```css
h-12 bg-white
```
- Same styling as input fields
- Radix UI components for accessibility

#### Radio Buttons (Styled Container)
```css
flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors
```

#### Checkbox Container
```css
flex items-start space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors
```

#### Labels
```css
text-gray-700 font-medium
```

#### Helper Text
```css
text-sm text-gray-600 italic
```

#### Error Messages
```css
text-sm text-red-500 italic
```

### Icons

#### Section Header Icons
- **Size:** `w-5 h-5` (20px)
- **Color:** `text-primary`
- **Library:** Lucide React

#### Stat Icons
- **Size:** `w-10 h-10` to `w-12 h-12` (40-48px)
- **Color:** `text-accent`
- **Background:** Optional `bg-accent/10 rounded-xl`

#### Feature Icons
- **Container:** `w-12 h-12` or `w-14 h-14`
- **Background:** `bg-accent/10 rounded-xl`
- **Icon Size:** `w-8 h-8`
- **Color:** `text-accent` or `text-[#FFB800]`

#### Checkmark Icons (Feature Lists)
- **Size:** `w-5 h-5`
- **Color:** `text-[#FFB800]`
- **Style:** Circle check icon
- **Animation:** `animate-fadeIn` with optional delay

### Progress Indicators

#### Progress Bar
- **Background:** Light gray
- **Fill:** `bg-accent` (golden yellow)
- **Height:** `h-2` or `h-3`
- **Border Radius:** `rounded-full`
- **Animation:** `progressGrow` linear

#### Sequential Loading Steps
- **Step Circle:** `w-8 h-8 rounded-full`
- **Completed:** `border-green-600 bg-green-50 text-green-700`
- **Current:** `border-primary bg-primary/10 text-primary`
- **Pending:** `border-gray-400 bg-gray-50 text-gray-500`
- **Progress Bar:** Animated with pulsing dots

### Badges & Tags
```css
inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold
```

---

## Animation & Motion

### Principles
- **Purposeful:** Animations enhance UX, never distract
- **Performant:** Use transform and opacity for smooth 60fps
- **Consistent:** 300ms duration for most transitions
- **Subtle:** Gentle easing, not overly dramatic

### Transition Durations
- **Fast:** `duration-200` (200ms) - Toggle states
- **Standard:** `duration-300` (300ms) - Hover, focus states
- **Slow:** `duration-500` (500ms) - Page transitions, fades

### Easing
- **Default:** `ease-out` - Natural deceleration
- **Fade In:** `ease-in`
- **Complex:** `ease-in-out`

### Key Animations

#### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 0.5s ease-in
```
**Usage:** Page loads, content reveals

#### Slide Up
```css
@keyframes slide-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
animation: slide-up 0.3s ease-out forwards
```
**Usage:** Sticky buttons appearing from bottom

#### Slide Down
```css
@keyframes slide-down {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
animation: slide-down 0.3s ease-out forwards
```
**Usage:** Sticky CTAs appearing from top

#### Hover Translate Up
```css
hover:translate-y-[-4px]
```
**Usage:** Card hover effects

#### Pulse Animation (Loading Dots)
```css
@keyframes pulseDot1/2/3 {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1); }
}
```
**Stagger:** 0.2s delay between dots
**Usage:** Loading states

#### Bounce Animation
```css
group-hover:animate-bounce
```
**Usage:** Icon animations on card hover

#### Progress Bar Growth
```css
@keyframes progressGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```
**Usage:** Progress indicators, loading states

### Hover Effects

#### Cards
```css
hover:shadow-lg transition-all duration-300
```

#### Buttons
```css
hover:bg-accent-light hover:shadow-lg
```

#### Links
```css
hover:text-primary transition-colors duration-200
```

---

## UX & Interaction Patterns

### Form Experience

#### Progressive Disclosure
- **2-Page Form:** Split complexity across pages
- **Qualification First:** Capture essential info on Page 1
- **Detailed Info Second:** Full details only for qualified leads

#### Sticky CTAs
- **Mobile:** Sticky button appears after scrolling 200px
- **Tablet/Desktop:** Header CTA appears after hero section
- **Behavior:** Smooth slide-in animation, fixed positioning
- **Progress Hint:** "Step 1 of 2 " Takes less than 2 minutes"

#### Field Organization
- **Grouped Sections:** Logical grouping with headers and icons
  - Student Information (User icon)
  - Academic Information (Graduation Cap icon)
  - Study Preferences (Trophy icon)
- **Visual Hierarchy:** Clear section separation with cards

#### Validation & Error Handling
- **Real-time Validation:** On blur and submit
- **Error Focus:** Auto-scroll to first error field
- **Error Styling:** Red border, italic error text below field
- **Required Indicators:** Red asterisk `*`
- **Success States:** Green checkmark icons

#### Input Enhancements
- **Numeric Inputs:** `inputMode="decimal"` for mobile keyboards
- **Phone Inputs:** Split country code and number
- **Toggle Selections:** Visual button toggles for GPA/Percentage
- **Checkbox Groups:** Styled containers with hover states
- **Radio Groups:** Card-style containers with descriptions

### Loading States

#### Evaluation Animation
- **Duration:** 10 seconds total
- **Steps:** 3 sequential steps with progress bars
- **Visual Feedback:**
  - Step indicators (numbered circles)
  - Progress bars for current step
  - Pulsing dots animation
  - Completed checkmarks
- **Background:** Full-screen white overlay

#### Form Submission
```html
"Processing Your Application"
+ "Please wait while we securely submit your application..."
```
- Pulse animation on text
- Centered layout

#### Success State
- **Icon:** Green checkmark in circle
- **Heading:** "Thank You for Your Interest"
- **Message:** Contextual based on lead category and booking

### Navigation

#### Header
- **Fixed Position:** Always visible at top
- **Height:** 64px (h-16)
- **Background:** White with subtle border
- **Logo:** Left-aligned, responsive sizing
- **Nav Links:** Hidden on mobile, visible tablet+
- **Smooth Scroll:** JavaScript smooth scroll to sections

#### Scroll Behavior
- **Smooth Scroll:** Enabled globally
- **Auto-scroll:** To top on page transitions
- **Section Links:** Smooth scroll to anchored sections

### Micro-interactions

#### Hover States
- **Cards:** Shadow increase, slight lift
- **Buttons:** Background color lightens, shadow increases
- **Links:** Color change to primary
- **Icons:** Bounce animation on feature cards

#### Focus States
- **Inputs:** Ring with primary color
- **Buttons:** Outline with ring offset
- **Links:** Keyboard accessible with visible focus

#### Transitions
- **Property:** `transition-all` or `transition-colors`
- **Duration:** 300ms standard
- **Easing:** `ease-out`

---

## Responsive Design

### Breakpoints
```javascript
'sm': '577px',    // Tablet
'md': '1025px',   // Desktop
'lg': '1441px',   // Large desktop
```

### Mobile-First Approach
- Base styles target mobile
- Progressive enhancement for larger screens
- Touch-friendly targets (min 48px)

### Layout Patterns

#### Hero Section
- **Mobile:** Single column, hidden image
- **Tablet+:** Two-column grid with image

#### Stats Grid
- **Mobile:** 2 columns
- **Tablet+:** 4 columns

#### Feature Cards
- **Mobile:** Single column
- **Tablet:** 2 columns
- **Desktop:** 3 columns

#### Success Rate Cards
- **Mobile:** Single column
- **Tablet+:** 2 columns, max 4xl container

### Typography Scaling
- **Headlines:** Scale from 4xl � 5xl � 6xl
- **Section Titles:** Scale from 3xl � 4xl
- **Body:** Remains 16px base for readability
- **Buttons:** Scale from base � lg

### Spacing Adjustments
- **Section Padding:** `py-16` � `py-20` � `py-24`
- **Container Padding:** `px-4` � `px-6` � `px-8`

### Form Responsiveness
- **Page 1 Form:** Contained width on desktop, full on mobile
- **Page 2 Calendar:** Full width on mobile for better iframe experience
- **Sticky Buttons:** Different behavior for mobile vs desktop

---

## Accessibility

### WCAG Compliance
- **Color Contrast:** Minimum AA compliance
- **Primary on Accent:** Navy (`#002F5C`) on Yellow (`#FFC736`) - High contrast
- **Gray Text:** `text-gray-600` on white backgrounds - AA compliant
- **Error Text:** Red 500 on white - High contrast

### Semantic HTML
- **Headings:** Proper h1-h6 hierarchy
- **Labels:** Associated with form inputs
- **Buttons:** Descriptive text, not just icons
- **Landmarks:** Header, main, footer, section elements

### Keyboard Navigation
- **Focus Visible:** Custom ring styles
- **Tab Order:** Logical flow
- **Skip Links:** Implemented for navigation
- **Enter/Space:** Activates buttons and links

### Screen Reader Support
- **Alt Text:** All images have descriptive alt attributes
- **ARIA Labels:** On interactive elements
- **Form Errors:** Announced to screen readers
- **Loading States:** Announced status changes

### Mobile Accessibility
- **Touch Targets:** Minimum 48x48px
- **Font Size:** 16px minimum (prevents auto-zoom)
- **Scroll Behavior:** Smooth but not disorienting
- **Orientation:** Works in portrait and landscape

---

## Implementation Notes

### CSS Architecture
- **Tailwind CSS:** Primary styling framework
- **Custom Layers:** Base, components, utilities
- **CSS Variables:** HSL color tokens for theme support
- **Component Classes:** Reusable patterns in `@layer components`

### Font Loading
- **Strategy:** `font-display: swap`
- **Feature Settings:** `font-feature-settings: 'kern' 1`
- **Optimization:** Subset fonts, preload critical fonts

### Performance
- **Image Optimization:** WebP with fallbacks
- **Lazy Loading:** Non-critical images
- **Priority Loading:** Hero images with `fetchpriority="high"`
- **Code Splitting:** Route-based chunks

### Browser Support
- **Modern Browsers:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Progressive Enhancement:** Core functionality works without JS
- **Vendor Prefixes:** Handled by autoprefixer

---

## Design Tokens Summary

### Colors (Quick Reference)
```javascript
primary: {
  DEFAULT: '#002F5C',  // Navy Blue
  light: '#1a4573',
}
accent: {
  DEFAULT: '#FFC736',  // Golden Yellow
  light: '#FFD469',
}
```

### Typography (Quick Reference)
```javascript
fontFamily: {
  sans: ['Poppins', 'system-ui', 'sans-serif'],  // Headings
  body: ['Open Sans', 'system-ui', 'sans-serif'], // Body
}
```

### Spacing (Quick Reference)
- **Grid:** 8px base
- **Container:** max-w-7xl (1280px)
- **Section Padding:** py-20 (80px)

### Border Radius (Quick Reference)
- **Default:** 0.75rem (12px)
- **Cards:** rounded-xl (12px) to rounded-2xl (16px)
- **Buttons:** rounded-lg (8px)

---

## Usage Guidelines

### For Developers
1. **Always use Tailwind utility classes** over custom CSS when possible
2. **Follow mobile-first** responsive design patterns
3. **Use semantic HTML** and proper heading hierarchy
4. **Implement accessibility** features from the start
5. **Test on multiple devices** and screen sizes
6. **Optimize images** and use appropriate formats

### For Designers
1. **Maintain color consistency** with primary and accent palette
2. **Use Poppins** for headings, Open Sans for body text
3. **Follow 8px spacing grid** for all layouts
4. **Design with mobile-first** approach
5. **Ensure sufficient contrast** for all text elements
6. **Use established component patterns** before creating new ones

### For AI Agents
1. **Reference this document** for all design decisions
2. **Extract exact color values** from the palette section
3. **Use defined typography scales** and font pairings
4. **Follow animation principles** and timing values
5. **Implement UX patterns** consistently across features
6. **Maintain responsive breakpoints** as specified
7. **Preserve accessibility** requirements in all implementations

---

**Document Version:** 2.0
**Last Updated:** 2025-11-25
**Maintained By:** Development Team
