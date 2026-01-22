/**
 * Pure Image Processing Functions
 */
import { MathUtils } from '../utils/math-utils.js';

export const Processor = {
    // --- Pixel Manipulation Effects ---

    vignette: (imageData, params) => {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radiusX = width / 2;
        const radiusY = height / 2;

        const amount = params.amount / 100;
        const isLighten = amount > 0;
        const absAmount = Math.abs(amount);

        const midpoint = 1 - (params.midpoint / 100);
        const roundness = params.roundness / 100;
        const feather = params.feather / 100;

        const innerRadius = midpoint * 0.3;
        const outerRadius = midpoint * 1.2 + 0.2;
        const transitionStart = innerRadius;
        const transitionEnd = innerRadius + (outerRadius - innerRadius) * (0.3 + feather * 0.7);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = (x - centerX) / radiusX;
                const dy = (y - centerY) / radiusY;

                let dist;
                if (roundness === 0) {
                    dist = Math.sqrt(dx * dx + dy * dy);
                } else {
                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);
                    const maxDist = Math.max(absDx, absDy);
                    const ellipseDist = Math.sqrt(dx * dx + dy * dy);
                    dist = ellipseDist * (1 - roundness) + maxDist * roundness;
                }

                let strength = 0;
                if (dist < transitionStart) {
                    strength = 0;
                } else if (dist > transitionEnd) {
                    strength = 1;
                } else {
                    const t = (dist - transitionStart) / (transitionEnd - transitionStart);
                    if (feather < 0.5) {
                        strength = Math.pow(t, 2 - feather * 2);
                    } else {
                        strength = t * t * (3 - 2 * t);
                    }
                }

                strength *= absAmount;

                const idx = (y * width + x) * 4;

                if (isLighten) {
                    data[idx] = Math.min(255, data[idx] + (255 - data[idx]) * strength);
                    data[idx + 1] = Math.min(255, data[idx + 1] + (255 - data[idx + 1]) * strength);
                    data[idx + 2] = Math.min(255, data[idx + 2] + (255 - data[idx + 2]) * strength);
                } else {
                    data[idx] = data[idx] * (1 - strength);
                    data[idx + 1] = data[idx + 1] * (1 - strength);
                    data[idx + 2] = data[idx + 2] * (1 - strength);
                }
            }
        }
        return imageData;
    },





    adjust: (imageData, params) => {
        const data = imageData.data;
        const brightness = params.brightness / 100;
        const contrast = (params.contrast + 100) / 100;
        const saturation = (params.saturation + 100) / 100;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            r += 255 * brightness;
            g += 255 * brightness;
            b += 255 * brightness;

            r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
            g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
            b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

            const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
            r = gray + (r - gray) * saturation;
            g = gray + (g - gray) * saturation;
            b = gray + (b - gray) * saturation;

            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }
        return imageData;
    },



    temperature: (imageData, params) => {
        const data = imageData.data;
        const temp = params.temperature / 100;
        const tint = params.tint / 100;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            if (temp > 0) {
                r += temp * (255 - r) * 0.3;
                b -= temp * b * 0.3;
            } else {
                r += temp * r * 0.3;
                b -= temp * (255 - b) * 0.3;
            }

            if (tint > 0) {
                g += tint * (255 - g) * 0.3;
            } else {
                r -= tint * (255 - r) * 0.15;
                b -= tint * (255 - b) * 0.15;
            }

            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }
        return imageData;
    },



    // --- Canvas Drawing Effects ---
    // These operate on a Context, not ImageData, because they use fillRect/Gradients/DrawImage

    gradient: (ctx, width, height, params) => {
        let x0, y0, x1, y1;
        const range = params.range / 100;

        switch (params.direction) {
            case 'left':
                x0 = 0; y0 = height / 2;
                x1 = width * range; y1 = height / 2;
                break;
            case 'right':
                x0 = width; y0 = height / 2;
                x1 = width * (1 - range); y1 = height / 2;
                break;
            case 'top':
                x0 = width / 2; y0 = 0;
                x1 = width / 2; y1 = height * range;
                break;
            case 'bottom':
                x0 = width / 2; y0 = height;
                x1 = width / 2; y1 = height * (1 - range);
                break;
        }

        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

        const isHighlight = params.type === 'highlight';
        const color = isHighlight ? '255,255,255' : '0,0,0';

        gradient.addColorStop(0, `rgba(${color},${params.strength})`);
        gradient.addColorStop(1, `rgba(${color},0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    },

    spotlight: (ctx, width, height, params) => {
        // Create offscreen canvas for the overlay
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = width;
        overlayCanvas.height = height;
        const ovCtx = overlayCanvas.getContext('2d');

        // 1. Fill with darkness
        ovCtx.fillStyle = `rgba(0, 0, 0, ${params.darkness})`;
        ovCtx.fillRect(0, 0, width, height);

        // 2. Prepare to cut out the hole
        ovCtx.globalCompositeOperation = 'destination-out';

        // 3. Apply feathering using filter
        // Note: params.feather is percentage, convert to px roughly based on min dimension
        const featherPx = (Math.min(width, height) * (params.feather / 100)) / 2;
        if (featherPx > 0) {
            ovCtx.filter = `blur(${featherPx}px)`;
        }

        // 4. Define shape dimensions
        const rectX = width * (params.x / 100) - (width * params.width / 200);
        const rectY = height * (params.y / 100) - (height * params.height / 200);
        const rectW = width * (params.width / 100);
        const rectH = height * (params.height / 100);

        // 5. Draw the cutout shape (opacity doesn't matter for destination-out, just shape)
        ovCtx.fillStyle = 'rgba(0,0,0,1)';
        ovCtx.beginPath();

        if (params.shape === 'rectangle') {
            ovCtx.rect(rectX, rectY, rectW, rectH);
        } else {
            // Default to circle/ellipse
            // Ellipse is better to fit the width/height aspect
            ovCtx.ellipse(
                rectX + rectW / 2,
                rectY + rectH / 2,
                Math.abs(rectW / 2),
                Math.abs(rectH / 2),
                0, 0, 2 * Math.PI
            );
        }
        ovCtx.fill();

        // 6. Draw overlay onto main canvas
        // Reset composite operation on main canvas just in case, though we usually just drawImage over
        ctx.save();
        ctx.globalAlpha = 1; // Ensure we draw the overlay fully
        ctx.drawImage(overlayCanvas, 0, 0);
        ctx.restore();
    },

    // Resize and Crop return new dimensions/canvas, usually handled by specific logic
    // But we can put the calculation logic here.


};
