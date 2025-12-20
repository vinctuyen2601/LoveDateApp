#!/usr/bin/env python3
"""
Generate placeholder images for Love Date App
Requires: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os

    def create_icon(filename, size, bg_color, text=""):
        """Create a simple colored icon with optional text"""
        img = Image.new('RGB', size, color=bg_color)

        if text:
            draw = ImageDraw.Draw(img)
            # Try to use a font, fallback to default if not available
            try:
                font = ImageFont.truetype("arial.ttf", size[0] // 10)
            except:
                font = ImageFont.load_default()

            # Center the text
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2)
            draw.text(position, text, fill=(255, 255, 255), font=font)

        img.save(filename)
        print(f"✅ Created: {filename}")

    # Create assets directory if not exists
    os.makedirs(os.path.dirname(__file__) or '.', exist_ok=True)

    # Generate all required images
    create_icon('icon.png', (1024, 1024), (74, 144, 226), '❤️')  # Blue
    create_icon('adaptive-icon.png', (1024, 1024), (74, 144, 226), '❤️')
    create_icon('splash.png', (1242, 2436), (255, 255, 255), 'Love Date')  # White
    create_icon('favicon.png', (48, 48), (74, 144, 226), '❤️')

    # Notification icon (optional)
    try:
        create_icon('notification-icon.png', (96, 96), (74, 144, 226), '🔔')
    except:
        pass

    print("\n✅ All placeholder images created successfully!")
    print("\n📝 Note: These are temporary placeholders.")
    print("   Replace with professional designs for production.")

except ImportError:
    print("❌ PIL/Pillow not installed!")
    print("\nInstall with: pip install Pillow")
    print("\nAlternatively, create the following files manually:")
    print("  - icon.png (1024x1024)")
    print("  - adaptive-icon.png (1024x1024)")
    print("  - splash.png (1242x2436)")
    print("  - favicon.png (48x48)")
    print("\nYou can use any PNG images or online generators:")
    print("  - https://www.canva.com/")
    print("  - https://www.figma.com/")
    print("  - Or just use any image from your computer")
