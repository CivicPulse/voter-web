# Election District Visual Indicator Options

Alternative animation styles for highlighting districts with active elections on the map. These were considered alongside the **pulsating fill** approach (currently implemented).

All options work by adding a CSS class to Leaflet SVG `<path>` elements via the `className` property in `PathOptions`.

---

## Option 1: Marching Ants Border

Animated dashed border where the dashes appear to move along the district outline. Gives a "selection" feel similar to image editing tools.

```css
@keyframes marching-ants {
  to { stroke-dashoffset: -20; }
}

.election-marching-ants {
  stroke-dasharray: 10 5;
  animation: marching-ants 0.5s linear infinite;
}
```

**Pros:** Very distinctive, universally recognized as "selected". Works regardless of fill color.
**Cons:** Can feel busy on complex polygon shapes with many vertices. May look jittery at certain zoom levels.

---

## Option 2: Pulsating Border Glow

Border gently pulses between normal and a bright/thick glowing state. Draws attention to the boundary without changing the fill.

```css
@keyframes border-glow {
  0%, 100% { stroke-width: 2; stroke-opacity: 0.7; }
  50% { stroke-width: 5; stroke-opacity: 1; }
}

.election-border-glow {
  animation: border-glow 2s ease-in-out infinite;
}
```

**Pros:** Subtle, doesn't affect fill readability. Good when fill color conveys other meaning (e.g., party affiliation).
**Cons:** Less noticeable than fill-based options, especially on small districts. Border width changes can cause visual "jitter" on adjacent districts.

---

## Option 3: Combined Glow + Fill Pulse

Pulsating fill opacity combined with a glowing border for maximum visibility.

```css
@keyframes combined-pulse {
  0%, 100% {
    fill-opacity: 0.15;
    stroke-width: 2;
    stroke-opacity: 0.7;
  }
  50% {
    fill-opacity: 0.45;
    stroke-width: 4;
    stroke-opacity: 1;
  }
}

.election-combined-pulse {
  animation: combined-pulse 2s ease-in-out infinite;
}
```

**Pros:** Maximum visibility — impossible to miss. Good for high-stakes elections or when only one or two districts are active.
**Cons:** Can be visually distracting if many districts have active elections simultaneously. May overwhelm other map information.

---

## Implementation Notes

- All options use CSS `@keyframes` animations applied via Leaflet's `className` PathOption
- CSS animations override Leaflet's inline SVG styles per CSS cascade rules
- The class is set once at path creation and persists through `setStyle()` calls (hover/mouseout)
- Animation timing (duration, easing) can be tuned per option
- Consider adding `prefers-reduced-motion` media query to disable animations for accessibility
