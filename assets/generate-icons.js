const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('📱 Generating app icons from SVG...');

// Icon sizes needed
const sizes = {
  'icon.png': 1024,           // App icon
  'adaptive-icon.png': 1024,  // Android adaptive icon
  'favicon.png': 48,          // Web favicon
  'notification-icon.png': 96, // Notification icon
  'splash.png': 2048          // Splash screen
};

const svgPath = path.join(__dirname, 'logo.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// For each size, we'll use a simple approach
// Since we can't rely on external tools, we'll create a simple HTML canvas approach

Object.entries(sizes).forEach(([filename, size]) => {
  console.log(`Generating ${filename} (${size}x${size})...`);

  // Create HTML file for conversion
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas" width="${size}" height="${size}"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, 0, 0, ${size}, ${size});

      // Download as PNG
      canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '${filename}';
        a.click();
      });
    };

    // Load SVG
    const svg = \`${svgContent}\`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.src = url;
  </script>
</body>
</html>
  `;

  const htmlPath = path.join(__dirname, `temp-${filename}.html`);
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`✓ Created ${htmlPath} - Open in browser to generate PNG`);
});

console.log(`
🎨 SVG logo created successfully!

To generate PNG files:
1. Open each temp-*.html file in your browser
2. The PNG will auto-download
3. Or use ImageMagick/Inkscape:

   Using ImageMagick:
   magick convert -background none logo.svg -resize 1024x1024 icon.png
   magick convert -background none logo.svg -resize 96x96 notification-icon.png

   Using online tool:
   https://svgtopng.com/

🚀 Or install sharp package for automatic conversion:
   npm install sharp
   node generate-icons-sharp.js
`);
