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

    sepia: (imageData, params) => {
        const data = imageData.data;
        const intensity = params.intensity / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const tr = 0.393 * r + 0.769 * g + 0.189 * b;
            const tg = 0.349 * r + 0.686 * g + 0.168 * b;
            const tb = 0.272 * r + 0.534 * g + 0.131 * b;

            data[i] = r + (tr - r) * intensity;
            data[i + 1] = g + (tg - g) * intensity;
            data[i + 2] = b + (tb - b) * intensity;
        }
        return imageData;
    },

    grayscale: (imageData, params) => {
        const data = imageData.data;
        const contrastFactor = (params.contrast + 100) / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            let gray;
            switch (params.method) {
                case 'luminosity':
                    gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    break;
                case 'average':
                    gray = (r + g + b) / 3;
                    break;
                case 'desaturation':
                    gray = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
                    break;
                default:
                    gray = 0.299 * r + 0.587 * g + 0.114 * b;
            }

            gray = ((gray / 255 - 0.5) * contrastFactor + 0.5) * 255;
            gray = Math.max(0, Math.min(255, gray));

            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
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

    colorOverlay: (imageData, params) => {
        const data = imageData.data;
        // HSL to RGB helper
        const hslToRgb = (h, s, l) => {
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        };

        const h = params.hue / 360;
        const s = params.saturation / 100;
        const l = 0.5;
        const [overlayR, overlayG, overlayB] = hslToRgb(h, s, l);
        const opacity = params.opacity / 100;

        const blendFunctions = {
            normal: (base, overlay) => overlay,
            multiply: (base, overlay) => (base * overlay) / 255,
            screen: (base, overlay) => 255 - ((255 - base) * (255 - overlay)) / 255,
            overlay: (base, overlay) => {
                return base < 128
                    ? (2 * base * overlay) / 255
                    : 255 - (2 * (255 - base) * (255 - overlay)) / 255;
            }
        };

        const blendFunc = blendFunctions[params.blendMode] || blendFunctions.normal;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const blendedR = blendFunc(r, overlayR);
            const blendedG = blendFunc(g, overlayG);
            const blendedB = blendFunc(b, overlayB);

            data[i] = r + (blendedR - r) * opacity;
            data[i + 1] = g + (blendedG - g) * opacity;
            data[i + 2] = b + (blendedB - b) * opacity;
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

    rounded: (imageData, params) => {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        const bgColors = {
            transparent: [0, 0, 0, 0],
            white: [255, 255, 255, 255],
            black: [0, 0, 0, 255],
            gray: [128, 128, 128, 255]
        };
        const bgColor = bgColors[params.background] || bgColors.transparent;

        const radiusPercent = params.radius / 100;
        const exponent = params.exponent;
        const useAntialias = params.antialias === 'on';
        const cornerRadius = Math.min(width, height) * radiusPercent * 0.5;

        // Using MathUtils logic directly inside loop for performance or via call?
        // Calling function in tight loop is slow in JS, but for readability let's duplicate or inline.
        // Let's inline the relevant parts of MathUtils.isInsideSuperEllipse for performance here, 
        // or trust the engine to inline. Since we extracted it to MathUtils, let's try to use it 
        // but maybe modify MathUtils to be very raw. 
        // Actually, let's keep the logic here for performance as it was in original effects.js, 
        // but cleaner.

        const centerX = width / 2;
        const centerY = height / 2;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // We can reuse the MathUtils function if we import it.
                const result = MathUtils.isInsideSuperEllipse(x, y, centerX, centerY, width, height, cornerRadius, exponent);

                if (!result.inside) {
                    const idx = (y * width + x) * 4;
                    if (useAntialias && result.distance < 0.3) {
                        const alpha = Math.min(1, result.distance / 0.3);
                        data[idx] = data[idx] * (1 - alpha) + bgColor[0] * alpha;
                        data[idx + 1] = data[idx + 1] * (1 - alpha) + bgColor[1] * alpha;
                        data[idx + 2] = data[idx + 2] * (1 - alpha) + bgColor[2] * alpha;
                        if (params.background === 'transparent') {
                            data[idx + 3] = data[idx + 3] * (1 - alpha);
                        }
                    } else {
                        data[idx] = bgColor[0];
                        data[idx + 1] = bgColor[1];
                        data[idx + 2] = bgColor[2];
                        data[idx + 3] = bgColor[3];
                    }
                }
            }
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
        const rectX = width * (params.x / 100) - (width * params.width / 200);
        const rectY = height * (params.y / 100) - (height * params.height / 200);
        const rectW = width * (params.width / 100);
        const rectH = height * (params.height / 100);
        const featherSize = Math.min(rectW, rectH) * (params.feather / 100);

        ctx.fillStyle = `rgba(0,0,0,${params.darkness})`;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'destination-out';

        if (featherSize > 0) {
            const innerRadius = Math.max(0, Math.min(rectW, rectH) / 2 - featherSize);
            const outerRadius = Math.min(rectW, rectH) / 2 + featherSize;

            const gradient = ctx.createRadialGradient(
                rectX + rectW / 2, rectY + rectH / 2, innerRadius,
                rectX + rectW / 2, rectY + rectH / 2, outerRadius
            );
            gradient.addColorStop(0, `rgba(0,0,0,${params.darkness})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(rectX - featherSize, rectY - featherSize,
                rectW + featherSize * 2, rectH + featherSize * 2);
        } else {
            ctx.fillStyle = `rgba(0,0,0,${params.darkness})`;
            ctx.fillRect(rectX, rectY, rectW, rectH);
        }

        ctx.globalCompositeOperation = 'source-over';
    },

    // Resize and Crop return new dimensions/canvas, usually handled by specific logic
    // But we can put the calculation logic here.

    calculateResizeOutput: (originalWidth, originalHeight, params) => {
        let outputWidth, outputHeight;

        switch (params.mode) {
            case 'percent':
                const scale = params.scale / 100;
                outputWidth = Math.round(originalWidth * scale);
                outputHeight = Math.round(originalHeight * scale);
                break;
            case 'pixel':
                if (params.maintainAspect === 'on') {
                    const aspectRatio = originalWidth / originalHeight;
                    outputWidth = params.width;
                    outputHeight = Math.round(outputWidth / aspectRatio);
                } else {
                    outputWidth = params.width;
                    outputHeight = params.height;
                }
                break;
            case 'long':
                if (originalWidth >= originalHeight) {
                    outputWidth = params.longSide;
                    outputHeight = Math.round(outputWidth * originalHeight / originalWidth);
                } else {
                    outputHeight = params.longSide;
                    outputWidth = Math.round(outputHeight * originalWidth / originalHeight);
                }
                break;
            case 'short':
                if (originalWidth <= originalHeight) {
                    outputWidth = params.shortSide;
                    outputHeight = Math.round(outputWidth * originalHeight / originalWidth);
                } else {
                    outputHeight = params.shortSide;
                    outputWidth = Math.round(outputHeight * originalWidth / originalHeight);
                }
                break;
            default:
                outputWidth = originalWidth;
                outputHeight = originalHeight;
        }
        return { width: outputWidth, height: outputHeight };
    }
};
