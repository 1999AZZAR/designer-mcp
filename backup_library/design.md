# Design System: Library Checkout Card

## Overview
This directory contains a complete, reusable UI/UX design system based on the concept of **Vintage manila library book due-date card.**. 
It was originally engineered as part of the anti-slop Ellis UI Library, demonstrating how thematic, physical, and highly constrained aesthetics can replace generic web frameworks.

## Design Tokens
* **Typography:** Special Elite (Typewriter)
* **Color Palette:** Faded manila (#fcf8eb), light blue lines, red vertical margin
* **Core Layout Strategy:** Highly structural, relying on the physical constraints of the real-world object.

## Engineering & CSS Features
* CSS linear-gradient math to draw horizontal blue rules and vertical red margins. Rotated ink stamps for dates.
* **Zero Dependencies:** Built entirely with raw HTML/CSS (via Tailwind utility classes) without heavy JS frameworks.
* **Responsive:** Designed to scale beautifully from mobile viewports up to desktop resolutions.

## Reusability Guide
To repurpose this design system for other projects:
1. **Extract the HTML structure:** The core layout constraints are baked into the wrapper `div`s.
2. **Copy the custom CSS:** Any custom `<style>` blocks in the `head` are critical for the specific aesthetic (e.g., filters, gradients, clip-paths).
3. **Swap the content:** The data (text, images) is decoupled from the styling. Replace the text and image `src` attributes to apply this aesthetic to new content.
