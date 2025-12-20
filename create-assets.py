from PIL import Image, ImageDraw, ImageFont
import os

# Tạo thư mục assets nếu chưa có
os.makedirs('assets', exist_ok=True)

def create_icon(size, filename, text="LD"):
    """Tạo icon với background gradient màu hồng"""
    img = Image.new('RGB', (size, size), color='#FF69B4')
    draw = ImageDraw.Draw(img)

    # Vẽ hình tròn ở giữa
    margin = size // 4
    draw.ellipse([margin, margin, size - margin, size - margin],
                 fill='#FF1493', outline='#ffffff', width=size//20)

    # Thêm text
    try:
        font_size = size // 3
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()

    # Căn giữa text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((size - text_width) // 2, (size - text_height) // 2 - size//20)

    draw.text(position, text, fill='#ffffff', font=font)

    img.save(filename)
    print(f"Created: {filename} ({size}x{size})")

def create_splash(filename):
    """Tạo splash screen"""
    img = Image.new('RGB', (1242, 2688), color='#ffffff')
    draw = ImageDraw.Draw(img)

    # Vẽ gradient background
    for y in range(2688):
        r = int(255 - (y / 2688) * 50)
        g = int(105 + (y / 2688) * 50)
        b = int(180)
        draw.line([(0, y), (1242, y)], fill=(r, g, b))

    # Vẽ logo ở giữa
    center_x, center_y = 1242 // 2, 2688 // 2
    radius = 200
    draw.ellipse([center_x - radius, center_y - radius,
                  center_x + radius, center_y + radius],
                 fill='#FF1493', outline='#ffffff', width=10)

    # Thêm text
    try:
        font = ImageFont.truetype("arial.ttf", 100)
        title_font = ImageFont.truetype("arial.ttf", 80)
    except:
        font = ImageFont.load_default()
        title_font = font

    # Text "LD"
    text = "LD"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    draw.text((center_x - text_width // 2, center_y - text_height // 2 - 20),
              text, fill='#ffffff', font=font)

    # Title
    title = "Ngày Quan Trọng"
    bbox = draw.textbbox((0, 0), title, font=title_font)
    text_width = bbox[2] - bbox[0]
    draw.text((center_x - text_width // 2, center_y + radius + 100),
              title, fill='#ffffff', font=title_font)

    img.save(filename)
    print(f"Created: {filename}")

# Tạo các icon
print("Creating assets...")
create_icon(1024, 'assets/icon.png', 'LD')
create_icon(1024, 'assets/adaptive-icon.png', 'LD')
create_icon(96, 'assets/notification-icon.png', 'LD')
create_icon(48, 'assets/favicon.png', 'LD')

# Tạo splash screen
create_splash('assets/splash.png')

print("\nAll assets created successfully!")
print("You can now add them back to app.json and rebuild.")
