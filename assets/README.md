# Assets Directory

This folder contains app assets (icons, images, splash screens).

## Required Files

Create these files to fix the missing assets warning:

### **1. icon.png** (1024x1024)
- App icon shown in Expo Go and on device
- Can be any PNG image, recommended 1024x1024px
- Create at: `assets/icon.png`

### **2. splash.png** (1242x2436)
- Splash screen shown when app loads
- Recommended size: 1242x2436px (iPhone portrait)
- Create at: `assets/splash.png`

### **3. adaptive-icon.png** (1024x1024, Android only)
- Android adaptive icon foreground
- Recommended: 1024x1024px
- Create at: `assets/adaptive-icon.png`

### **4. favicon.png** (48x48, Web only)
- Website favicon
- Recommended: 48x48px or 32x32px
- Create at: `assets/favicon.png`

### **5. notification-icon.png** (Optional)
- Custom notification icon
- Recommended: 96x96px
- Create at: `assets/notification-icon.png`

## Quick Fix (Temporary)

For development, you can use any PNG images or download free placeholders:

```bash
# Option 1: Create simple colored squares (requires ImageMagick)
convert -size 1024x1024 xc:blue assets/icon.png
convert -size 1024x1024 xc:green assets/adaptive-icon.png
convert -size 1242x2436 xc:white assets/splash.png
convert -size 48x48 xc:blue assets/favicon.png

# Option 2: Download placeholders
curl https://via.placeholder.com/1024x1024.png -o assets/icon.png
curl https://via.placeholder.com/1024x1024.png -o assets/adaptive-icon.png
curl https://via.placeholder.com/1242x2436.png -o assets/splash.png
curl https://via.placeholder.com/48x48.png -o assets/favicon.png
```

## For Production

Replace placeholder images with professional designs:
- Use design tools: Figma, Sketch, Canva
- Follow platform guidelines:
  - iOS: [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
  - Android: [Material Design Icons](https://material.io/design/iconography)

## Current Status

⚠️ **MISSING**: All asset files need to be created

The app will still run without these files, but you'll see warnings.
