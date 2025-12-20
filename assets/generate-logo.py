#!/usr/bin/env python3
"""
Generate beautiful app icons for Love Date app
Creates icon.png, adaptive-icon.png, splash.png, etc.
"""

from PIL import Image, ImageDraw, ImageFont
import math

def create_gradient_circle(size, colors):
    """Create a gradient circle background"""
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Draw gradient using multiple circles
    steps = 100
    for i in range(steps):
        # Interpolate colors
        r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * i / steps)
        g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * i / steps)
        b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * i / steps)

        # Calculate radius
        radius = int((size / 2) * (1 - i / steps))
        if radius < 1:
            break

        # Draw circle
        center = size // 2
        draw.ellipse(
            [center - radius, center - radius, center + radius, center + radius],
            fill=(r, g, b, 255)
        )

    return image

def draw_heart(draw, x, y, size, fill):
    """Draw a heart shape"""
    # Heart using bezier approximation
    points = []
    for angle in range(0, 360, 2):
        t = math.radians(angle)
        # Parametric heart equation
        hx = 16 * math.sin(t) ** 3
        hy = -(13 * math.cos(t) - 5 * math.cos(2*t) - 2 * math.cos(3*t) - math.cos(4*t))

        # Scale and translate
        px = x + hx * size / 32
        py = y + hy * size / 32
        points.append((px, py))

    draw.polygon(points, fill=fill)

def create_icon(size=1024):
    """Create the main app icon"""
    # Colors
    bg_color1 = (255, 107, 157)  # #FF6B9D - Pink
    bg_color2 = (192, 108, 132)  # #C06C84 - Darker pink
    white = (255, 255, 255, 255)
    light_pink = (255, 143, 177, 255)  # #FF8FB1
    pink = (255, 107, 157, 255)

    # Create gradient background
    image = create_gradient_circle(size, [bg_color1, bg_color2])
    draw = ImageDraw.Draw(image)

    # Calendar dimensions
    cal_width = size // 2
    cal_height = int(size * 0.44)
    cal_x = size // 4
    cal_y = int(size * 0.31)

    # Draw calendar shadow
    shadow_offset = size // 80
    draw.rounded_rectangle(
        [cal_x + shadow_offset, cal_y + shadow_offset,
         cal_x + cal_width + shadow_offset, cal_y + cal_height + shadow_offset],
        radius=size // 26,
        fill=(0, 0, 0, 60)
    )

    # Draw calendar body (white)
    draw.rounded_rectangle(
        [cal_x, cal_y, cal_x + cal_width, cal_y + cal_height],
        radius=size // 26,
        fill=(248, 232, 238, 255)  # Light pink-white
    )

    # Draw calendar header (pink)
    header_height = cal_height // 4
    draw.rounded_rectangle(
        [cal_x, cal_y, cal_x + cal_width, cal_y + header_height],
        radius=size // 26,
        fill=pink
    )
    draw.rectangle(
        [cal_x, cal_y + size // 40, cal_x + cal_width, cal_y + header_height],
        fill=pink
    )

    # Draw calendar rings (3 rings at top)
    ring_y = cal_y + header_height // 2
    ring_radius = size // 51
    ring_positions = [cal_x + cal_width // 6, cal_x + cal_width // 2, cal_x + 5 * cal_width // 6]

    for ring_x in ring_positions:
        # Outer circle (white border)
        draw.ellipse(
            [ring_x - ring_radius, ring_y - ring_radius,
             ring_x + ring_radius, ring_y + ring_radius],
            outline=white,
            width=size // 85,
            fill=None
        )

    # Draw calendar grid (simple squares for dates)
    grid_start_y = cal_y + header_height + size // 40
    grid_size = cal_width // 7
    grid_padding = grid_size // 6

    for row in range(4):
        for col in range(6):
            if row == 3 and col >= 2:  # Last row only 2 items
                break

            x = cal_x + grid_padding + col * (grid_size + grid_padding)
            y = grid_start_y + grid_padding + row * (grid_size + grid_padding)

            # Highlight special date (middle of row 3)
            if row == 2 and col == 2:
                # Special date - pink background
                draw.rounded_rectangle(
                    [x, y, x + grid_size, y + grid_size],
                    radius=size // 128,
                    fill=pink
                )
                # Draw small heart
                heart_x = x + grid_size // 2
                heart_y = y + grid_size // 2
                draw_heart(draw, heart_x, heart_y, grid_size // 4, white)
            else:
                # Normal date
                draw.rounded_rectangle(
                    [x, y, x + grid_size, y + grid_size],
                    radius=size // 128,
                    fill=(192, 108, 132, 100)  # Semi-transparent pink
                )

    # Draw large decorative heart (top left)
    heart_size = size // 5
    heart_x = size // 5
    heart_y = size // 5

    # Heart shadow
    draw_heart(draw, heart_x + size // 100, heart_y + size // 100,
               heart_size, (0, 0, 0, 60))

    # Main heart
    draw_heart(draw, heart_x, heart_y, heart_size, light_pink)

    # Small notification indicator (bottom right corner)
    notif_x = int(size * 0.83)
    notif_y = int(size * 0.68)
    notif_size = size // 20

    # Bell shape (simplified as circle with line)
    draw.ellipse(
        [notif_x, notif_y, notif_x + notif_size, notif_y + notif_size],
        fill=white
    )

    # Notification badge (yellow dot)
    badge_size = size // 40
    draw.ellipse(
        [notif_x + notif_size - badge_size, notif_y,
         notif_x + notif_size, notif_y + badge_size],
        fill=(255, 215, 0, 255)  # Gold
    )

    return image

def create_splash(size=2048):
    """Create splash screen"""
    # Reuse icon but larger
    icon = create_icon(size)

    # Add text below (optional)
    # This would need a font file

    return icon

def main():
    print("Generating Love Date app icons...")

    # Generate icon (1024x1024)
    print("Creating icon.png (1024x1024)...")
    icon = create_icon(1024)
    icon.save('icon.png', 'PNG')
    print("OK icon.png created")

    # Adaptive icon (same as icon for now)
    print("Creating adaptive-icon.png (1024x1024)...")
    icon.save('adaptive-icon.png', 'PNG')
    print("OK adaptive-icon.png created")

    # Notification icon (96x96, smaller version)
    print("Creating notification-icon.png (96x96)...")
    notification = create_icon(96)
    notification.save('notification-icon.png', 'PNG')
    print("OK notification-icon.png created")

    # Favicon (48x48)
    print("Creating favicon.png (48x48)...")
    favicon = create_icon(48)
    favicon.save('favicon.png', 'PNG')
    print("OK favicon.png created")

    # Splash screen (2048x2048)
    print("Creating splash.png (2048x2048)...")
    splash = create_splash(2048)
    splash.save('splash.png', 'PNG')
    print("OK splash.png created")

    print("\nAll icons generated successfully!")
    print("Ready to use in your Expo app")

if __name__ == '__main__':
    main()
