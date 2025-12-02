# PWA Icons

This directory should contain the following PWA icons:

## Required Icons

1. **icon-192x192.png** - 192x192 pixels (for Android home screen)
2. **icon-512x512.png** - 512x512 pixels (for Android splash screen)
3. **apple-touch-icon.png** - 180x180 pixels (for iOS home screen)

## Generating Icons

You can generate these icons from the existing logo (`/images/full-logo.png`) using one of these methods:

### Method 1: Online Tools
- Use [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- Use [RealFaviconGenerator](https://realfavicongenerator.net/)
- Use [PWA Builder](https://www.pwabuilder.com/imageGenerator)

### Method 2: ImageMagick (Command Line)
```bash
# Install ImageMagick first
# Then run:
convert images/full-logo.png -resize 192x192 icons/icon-192x192.png
convert images/full-logo.png -resize 512x512 icons/icon-512x512.png
convert images/full-logo.png -resize 180x180 icons/apple-touch-icon.png
```

### Method 3: Photoshop/GIMP
1. Open `images/full-logo.png`
2. Resize to each required size
3. Export as PNG with transparency
4. Save to this directory

## Icon Requirements

- **Format**: PNG with transparency
- **Background**: Transparent or solid color matching theme (#ec4899)
- **Padding**: Leave some padding around the logo (10-15% of canvas)
- **Quality**: High quality, no compression artifacts

## Temporary Placeholder

Until proper icons are generated, you can use a simple colored square as placeholder:
- Create a 192x192px square with background color #ec4899
- Add white text "اینفینیتی" in the center
- Repeat for 512x512 and 180x180 sizes

