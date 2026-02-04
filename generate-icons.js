const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const scale = size / 128;
    const centerX = size / 2;
    const centerY = size / 2;

    // Gradient Background
    const bgGradient = ctx.createLinearGradient(0, 0, size, size);
    bgGradient.addColorStop(0, '#667eea');
    bgGradient.addColorStop(0.5, '#764ba2');
    bgGradient.addColorStop(1, '#f093fb');

    // Rounded rectangle background
    const radius = size * 0.22;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fillStyle = bgGradient;
    ctx.fill();

    // Glassmorphism overlay circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(centerX - 15 * scale, centerY - 15 * scale, 50 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Clock face - frosted glass effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 42 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Clock face inner
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Clock border with gradient
    const borderGradient = ctx.createLinearGradient(
        centerX - 40 * scale, centerY - 40 * scale,
        centerX + 40 * scale, centerY + 40 * scale
    );
    borderGradient.addColorStop(0, '#667eea');
    borderGradient.addColorStop(1, '#764ba2');
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Hour markers
    for (let i = 0; i < 12; i++) {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const markerRadius = i % 3 === 0 ? 2.5 * scale : 1.5 * scale;
        const markerDist = 30 * scale;
        const x = centerX + Math.cos(angle) * markerDist;
        const y = centerY + Math.sin(angle) * markerDist;

        ctx.fillStyle = '#764ba2';
        ctx.beginPath();
        ctx.arc(x, y, markerRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Hour hand
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 4 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const hourAngle = (-60) * Math.PI / 180;
    ctx.lineTo(
        centerX + Math.cos(hourAngle) * 18 * scale,
        centerY + Math.sin(hourAngle) * 18 * scale
    );
    ctx.stroke();

    // Minute hand
    ctx.strokeStyle = '#764ba2';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const minuteAngle = (60) * Math.PI / 180;
    ctx.lineTo(
        centerX + Math.cos(minuteAngle) * 26 * scale,
        centerY + Math.sin(minuteAngle) * 26 * scale
    );
    ctx.stroke();

    // Center dot
    const centerGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 4 * scale
    );
    centerGradient.addColorStop(0, '#667eea');
    centerGradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Plus badge
    const badgeX = centerX + 28 * scale;
    const badgeY = centerY + 28 * scale;
    const badgeRadius = 16 * scale;

    // Badge shadow
    ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
    ctx.beginPath();
    ctx.arc(badgeX, badgeY + 2 * scale, badgeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Badge gradient
    const badgeGradient = ctx.createLinearGradient(
        badgeX - badgeRadius, badgeY - badgeRadius,
        badgeX + badgeRadius, badgeY + badgeRadius
    );
    badgeGradient.addColorStop(0, '#4ade80');
    badgeGradient.addColorStop(1, '#22d3ee');
    ctx.fillStyle = badgeGradient;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Plus symbol
    ctx.fillStyle = 'white';
    ctx.fillRect(badgeX - 6 * scale, badgeY - 1.5 * scale, 12 * scale, 3 * scale);
    ctx.fillRect(badgeX - 1.5 * scale, badgeY - 6 * scale, 3 * scale, 12 * scale);

    return canvas;
}

// Generate icons
const iconsDir = path.join(__dirname, 'docs', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [192, 512];
sizes.forEach(size => {
    const canvas = drawIcon(size);
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(iconsDir, `icon-${size}.png`);
    fs.writeFileSync(filename, buffer);
    console.log(`Generated: ${filename}`);
});

console.log('Done!');
