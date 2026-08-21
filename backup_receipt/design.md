# Design System: Thermal Receipt

## Overview
This directory contains a complete, reusable UI/UX design system based on the concept of **Supermarket/Bodega printed thermal paper receipt.**. 
It was originally engineered as part of the anti-slop Ellis UI Library, demonstrating how thematic, physical, and highly constrained aesthetics can replace generic web frameworks.

## Design Tokens
* **Typography:** Space Mono / VT323 (Monospaced Receipt Font)
* **Color Palette:** Thermal paper white (#f8f9fa), faded black/blue ink
* **Core Layout Strategy:** Highly structural, relying on the physical constraints of the real-world object.

## Engineering & CSS Features
* Zig-zag torn edges at the top and bottom (using CSS clip-path or gradients). Dotted line dividers. Tabular itemized layout.
* **Zero Dependencies:** Built entirely with raw HTML/CSS (via Tailwind utility classes) without heavy JS frameworks.
* **Responsive:** Designed to scale beautifully from mobile viewports up to desktop resolutions.

## Reusability Guide
To repurpose this design system for other projects:
1. **Extract the HTML structure:** The core layout constraints are baked into the wrapper `div`s.
2. **Copy the custom CSS:** Any custom `<style>` blocks in the `head` are critical for the specific aesthetic (e.g., filters, gradients, clip-paths).
3. **Swap the content:** The data (text, images) is decoupled from the styling. Replace the text and image `src` attributes to apply this aesthetic to new content.
