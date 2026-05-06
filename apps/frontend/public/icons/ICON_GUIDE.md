# PWA Icons Guide - What You Need

## Required Icons (3 files)

You need to create **3 icon files** and place them in `/apps/frontend/public/icons/`:

### 1. `icon-192x192.png` (192×192 pixels)
- **Purpose**: Home screen icon for Android devices
- **What it shows**: Your app logo/icon
- **Background**: Can be transparent or pink (#ec4899)

### 2. `icon-512x512.png` (512×512 pixels) ⭐ **MOST IMPORTANT**
- **Purpose**: 
  - Splash screen icon (shown when app opens)
  - High-resolution home screen icon
- **What it shows**: Your app logo/icon
- **Background**: Can be transparent or pink (#ec4899)
- **Note**: This is the icon that appears on the pink splash screen!

### 3. `apple-touch-icon.png` (180×180 pixels)
- **Purpose**: Home screen icon for iOS devices (iPhone/iPad)
- **What it shows**: Your app logo/icon
- **Background**: Can be transparent or pink (#ec4899)

## How the Splash Screen Works

When your PWA opens, it will show:
- **Background color**: Pink (#ec4899) - from `background_color` in manifest.json
- **Icon**: The `icon-512x512.png` centered on the screen
- **App name**: "اینفینیتی" (from `short_name` in manifest.json)

The splash screen appears automatically while your app loads, giving a native app-like experience!

## What Should the Icons Be?

The icons should be **your app logo** (`/images/full-logo.png`):

1. **Open** `/apps/frontend/public/images/full-logo.png` in an image editor
2. **Resize** it to each required size (192×192, 512×512, 180×180)
3. **Add padding** around the logo (10-15% of canvas size) so it doesn't touch edges
4. **Background**: 
   - Option A: Transparent background (recommended - will show pink behind it)
   - Option B: Pink background (#ec4899) matching your theme
5. **Save** as PNG files in `/apps/frontend/public/icons/`

## Quick Generation Methods

### Option 1: Online Tool (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload `/images/full-logo.png`
3. Configure settings:
   - Android Chrome: 192×192 and 512×512
   - iOS: 180×180
   - Background color: #ec4899 (pink)
4. Download and extract icons to `/apps/frontend/public/icons/`

### Option 2: ImageMagick (Command Line)
```bash
cd apps/frontend/public
convert images/full-logo.png -resize 192x192 -background "#ec4899" -gravity center -extent 192x192 icons/icon-192x192.png
convert images/full-logo.png -resize 512x512 -background "#ec4899" -gravity center -extent 512x512 icons/icon-512x512.png
convert images/full-logo.png -resize 180x180 -background "#ec4899" -gravity center -extent 180x180 icons/apple-touch-icon.png
```

### Option 3: Photoshop/GIMP
1. Open `images/full-logo.png`
2. Create new canvas: 512×512px (for the main icon)
3. Set background to pink (#ec4899) or transparent
4. Paste logo, center it, add padding
5. Export as PNG
6. Repeat for 192×192 and 180×180 sizes

## File Structure After Adding Icons

```
apps/frontend/public/icons/
├── icon-192x192.png      ← Your logo at 192×192
├── icon-512x512.png      ← Your logo at 512×512 (splash screen icon!)
├── apple-touch-icon.png  ← Your logo at 180×180
└── README.md
```

## Testing

After adding icons:
1. Build your app: `npm run build`
2. Open in Chrome/Edge on mobile
3. Install the PWA
4. Open the installed app
5. You should see: **Pink background + your logo icon** as splash screen! 🎉

