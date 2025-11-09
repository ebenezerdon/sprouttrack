# SproutTrack

SproutTrack is a gentle, modern web app for tracking your child's growth with clarity. It was built by [Teda.dev](https://teda.dev), the AI app builder for everyday problems, and designed to feel like a polished, privacy-first product.

## Features
- Add multiple children with colorful avatars
- Log measurements for weight, height, and head circumference
- Automatic BMI and age-at-entry calculation
- Clean sparkline charts for quick trend insights
- Metric or imperial display (data stored reliably in metric under the hood)
- Private by default: data is saved in your browser's localStorage
- Import/Export your data as JSON for safekeeping
- Responsive, accessible UI with keyboard navigation and high contrast

## Tech stack
- HTML5, Tailwind CSS (CDN), jQuery 3.7.x
- Modular JavaScript with a single global namespace (window.App)
- Local persistence with localStorage

## Getting started
1. Download or clone this project.
2. Open `index.html` in your browser to explore the landing page.
3. Click "Launch the tracker" to use the app (`app.html`).
4. Add your first child, then start logging measurements.
5. Use Export to download a JSON backup and Import to restore it later.

## Files
- `index.html` – Marketing landing page with CTAs
- `app.html` – Main application interface
- `styles/main.css` – Custom styles (no Tailwind directives)
- `scripts/helpers.js` – Utilities for storage, units, dates, charts
- `scripts/ui.js` – UI rendering and event logic
- `scripts/main.js` – App bootstrap and error-guarded startup

## Accessibility
- Semantic HTML, ARIA attributes for dialogs
- Keyboard-friendly controls and visible focus states
- Color palette meets WCAG AA contrast for text and actionable elements

## Privacy
All data remains on your device in localStorage. No accounts, no analytics scripts. Use Import/Export to keep your own backups.

## Notes
If you switch between metric and imperial, inputs and displays update immediately. Data is always stored in metric so you never lose precision.
