/**
 * Crop Controller
 */
import { store } from '../store/store.js';

let cropState = {
    isDragging: false,
    dragType: null,
    startX: 0,
    startY: 0,
    startSelection: null,
    aspectRatio: null
};

let elements = {
    canvas: null,
    overlay: null,
    ctx: null,
    overlayCtx: null
};

export function initCropMode(canvas, overlay, image, params) {
    elements.canvas = canvas;
    elements.overlay = overlay;
    elements.ctx = canvas.getContext('2d');
    elements.overlayCtx = overlay.getContext('2d');

    elements.ctx.clearRect(0, 0, canvas.width, canvas.height);
    elements.ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.classList.add('active');

    const margin = 0.1;
    const initialSelection = {
        x: canvas.width * margin,
        y: canvas.height * margin,
        width: canvas.width * (1 - margin * 2),
        height: canvas.height * (1 - margin * 2)
    };

    store.updateCropSelection(initialSelection);
    updateAspectRatio(params.preset);

    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
    overlay.addEventListener('mouseleave', handleMouseUp);

    drawCropUI();
    store.setCropMode(true);
}

export function destroyCropMode() {
    if (!elements.overlay) return;

    elements.overlayCtx.clearRect(0, 0, elements.overlay.width, elements.overlay.height);
    elements.overlay.classList.remove('active');

    elements.overlay.removeEventListener('mousedown', handleMouseDown);
    elements.overlay.removeEventListener('mousemove', handleMouseMove);
    elements.overlay.removeEventListener('mouseup', handleMouseUp);
    elements.overlay.removeEventListener('mouseleave', handleMouseUp);

    elements.overlay.style.cursor = 'default';
    store.setCropMode(false);
}

export function updateAspectRatio(preset) {
    const ratios = {
        'free': null,
        '1:1': 1,
        '4:3': 4 / 3,
        '3:4': 3 / 4,
        '16:9': 16 / 9,
        '9:16': 9 / 16
    };
    cropState.aspectRatio = ratios[preset] || null;

    if (cropState.aspectRatio) {
        adjustSelectionToAspectRatio();
    }
    drawCropUI();
}

function adjustSelectionToAspectRatio() {
    if (!cropState.aspectRatio) return;
    const sel = { ...store.getState().crop.selection };

    const currentRatio = sel.width / sel.height;
    if (currentRatio > cropState.aspectRatio) {
        sel.width = sel.height * cropState.aspectRatio;
    } else {
        sel.height = sel.width / cropState.aspectRatio;
    }
    constrainSelection(sel);
    store.updateCropSelection(sel);
}

function constrainSelection(sel) {
    const width = elements.canvas.width;
    const height = elements.canvas.height;

    if (sel.x < 0) sel.x = 0;
    if (sel.y < 0) sel.y = 0;
    if (sel.x + sel.width > width) sel.x = width - sel.width;
    if (sel.y + sel.height > height) sel.y = height - sel.height;

    if (sel.width > width) { sel.width = width; sel.x = 0; }
    if (sel.height > height) { sel.height = height; sel.y = 0; }
}

function handleMouseDown(e) {
    const rect = elements.overlay.getBoundingClientRect();
    // Scaling for HiDPI or CSS resize
    const scaleX = elements.overlay.width / rect.width;
    const scaleY = elements.overlay.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const dragType = detectDragType(x, y);
    if (dragType) {
        cropState.isDragging = true;
        cropState.dragType = dragType;
        cropState.startX = x;
        cropState.startY = y;
        cropState.startSelection = { ...store.getState().crop.selection };
    }
}

function handleMouseMove(e) {
    const rect = elements.overlay.getBoundingClientRect();
    const scaleX = elements.overlay.width / rect.width;
    const scaleY = elements.overlay.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (cropState.isDragging) {
        const dx = x - cropState.startX;
        const dy = y - cropState.startY;
        updateSelection(dx, dy);
        drawCropUI();
    } else {
        const dragType = detectDragType(x, y);
        elements.overlay.style.cursor = getCursor(dragType);
    }
}

function handleMouseUp() {
    cropState.isDragging = false;
    cropState.dragType = null;
}

function detectDragType(x, y) {
    const sel = store.getState().crop.selection;
    if (!sel) return null;

    const handleSize = 12;
    if (isNear(x, sel.x, handleSize) && isNear(y, sel.y, handleSize)) return 'nw';
    if (isNear(x, sel.x + sel.width, handleSize) && isNear(y, sel.y, handleSize)) return 'ne';
    if (isNear(x, sel.x, handleSize) && isNear(y, sel.y + sel.height, handleSize)) return 'sw';
    if (isNear(x, sel.x + sel.width, handleSize) && isNear(y, sel.y + sel.height, handleSize)) return 'se';

    if (isNear(x, sel.x + sel.width / 2, handleSize) && isNear(y, sel.y, handleSize)) return 'n';
    if (isNear(x, sel.x + sel.width / 2, handleSize) && isNear(y, sel.y + sel.height, handleSize)) return 's';
    if (isNear(x, sel.x, handleSize) && isNear(y, sel.y + sel.height / 2, handleSize)) return 'w';
    if (isNear(x, sel.x + sel.width, handleSize) && isNear(y, sel.y + sel.height / 2, handleSize)) return 'e';

    if (x >= sel.x && x <= sel.x + sel.width && y >= sel.y && y <= sel.y + sel.height) return 'move';

    return null;
}

function isNear(a, b, t) { return Math.abs(a - b) <= t; }

function getCursor(type) {
    if (!type) return 'default';
    if (type === 'move') return 'move';
    return `${type}-resize`;
}

function updateSelection(dx, dy) {
    let sel = { ...store.getState().crop.selection };
    const start = cropState.startSelection;
    const type = cropState.dragType;

    if (type === 'move') {
        sel.x = start.x + dx;
        sel.y = start.y + dy;
    } else {
        if (type.includes('w')) { sel.x = start.x + dx; sel.width = start.width - dx; }
        if (type.includes('e')) { sel.width = start.width + dx; }
        if (type.includes('n')) { sel.y = start.y + dy; sel.height = start.height - dy; }
        if (type.includes('s')) { sel.height = start.height + dy; }
    }

    if (cropState.aspectRatio && type !== 'move') {
        if (type.includes('e') || type.includes('w')) {
            sel.height = sel.width / cropState.aspectRatio;
        } else {
            sel.width = sel.height * cropState.aspectRatio;
        }
    }

    if (sel.width < 50) sel.width = 50;
    if (sel.height < 50) sel.height = 50;

    constrainSelection(sel);
    store.updateCropSelection(sel);
}

function drawCropUI() {
    const ctx = elements.overlayCtx;
    const sel = store.getState().crop.selection;
    if (!sel) return;

    ctx.clearRect(0, 0, elements.overlay.width, elements.overlay.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, elements.overlay.width, elements.overlay.height);

    ctx.clearRect(sel.x, sel.y, sel.width, sel.height);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.strokeRect(sel.x, sel.y, sel.width, sel.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sel.x + sel.width / 3, sel.y); ctx.lineTo(sel.x + sel.width / 3, sel.y + sel.height);
    ctx.moveTo(sel.x + 2 * sel.width / 3, sel.y); ctx.lineTo(sel.x + 2 * sel.width / 3, sel.y + sel.height);
    ctx.moveTo(sel.x, sel.y + sel.height / 3); ctx.lineTo(sel.x + sel.width, sel.y + sel.height / 3);
    ctx.moveTo(sel.x, sel.y + 2 * sel.height / 3); ctx.lineTo(sel.x + sel.width, sel.y + 2 * sel.height / 3);
    ctx.stroke();
}

export function getCurrentCropSelection() {
    return store.getState().crop.selection;
}
