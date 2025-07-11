// Simple script to create basic PWA icons
// This creates placeholder icons - you should replace with professional designs

const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // P2P text
    const fontSize = size * 0.15;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillText('P2P', size / 2, size * 0.4);
    
    // AI text
    const aiSize = size * 0.08;
    ctx.font = `${aiSize}px Arial`;
    ctx.fillText('AI Photo', size / 2, size * 0.6);
    ctx.fillText('Enhancement', size / 2, size * 0.7);
    
    return canvas.toBuffer('image/png');
}

// Generate icons
const sizes = [192, 512, 1024];

sizes.forEach(size => {
    const iconData = createIcon(size);
    const filename = `icon-${size}.png`;
    
    fs.writeFileSync(filename, iconData);
    console.log(`Created ${filename}`);
});

console.log('Icons generated successfully!');