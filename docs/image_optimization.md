# Image Optimization Plan

To keep load times reasonable as the game library of assets grows, the game now lazily loads story images and will implement further optimizations:

- **Lazy loading**: story images use the `loading="lazy"` attribute so they only load when visible. Additional screens may adopt the same approach.
- **Automatic resizing and compression**: the image pipeline scripts will be extended to resize large images and save optimized files. Libraries such as Pillow or ImageMagick can handle this step so existing images don't need manual replacement.

These changes will be rolled out alongside other improvements to the asset pipeline.
