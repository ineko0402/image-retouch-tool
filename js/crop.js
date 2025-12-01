//js/crop.js
// トリミング機能

let cropState = {
    isDragging: false,
    dragType: null, // 'move', 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
    startX: 0,
    startY: 0,
    selection: { x: 0, y: 0, width: 0, height: 0 },
    aspectRatio: null,
    canvas: null,
    overlay: null,
    ctx: null,
    overlayCtx: null,
    image: null
};

export function initCropMode(canvas, overlay, image, params) {
    cropState.canvas = canvas;
    cropState.overlay = overlay;
    cropState.ctx = canvas.getContext('2d');
    cropState.overlayCtx = overlay.getContext('2d');
    cropState.image = image;

    // メインキャンバスに元画像を描画（重要！）
    cropState.ctx.clearRect(0, 0, canvas.width, canvas.height);
    cropState.ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // オーバーレイのサイズを合わせる
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.classList.add('active');

    // 初期選択範囲（画像の80%）
    const margin = 0.1;
    cropState.selection = {
        x: canvas.width * margin,
        y: canvas.height * margin,
        width: canvas.width * (1 - margin * 2),
        height: canvas.height * (1 - margin * 2)
    };

    // アスペクト比の設定
    updateAspectRatio(params.preset);

    // イベントリスナー
    overlay.addEventListener('mousedown', handleMouseDown);
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('mouseup', handleMouseUp);
    overlay.addEventListener('mouseleave', handleMouseUp);

    drawCropUI();
}

export function destroyCropMode() {
    if (cropState.overlay) {
        // オーバーレイキャンバスをクリア
        if (cropState.overlayCtx) {
            cropState.overlayCtx.clearRect(0, 0, cropState.overlay.width, cropState.overlay.height);
        }
        
        // クラスを削除
        cropState.overlay.classList.remove('active');
        
        // イベントリスナーを削除
        cropState.overlay.removeEventListener('mousedown', handleMouseDown);
        cropState.overlay.removeEventListener('mousemove', handleMouseMove);
        cropState.overlay.removeEventListener('mouseup', handleMouseUp);
        cropState.overlay.removeEventListener('mouseleave', handleMouseUp);
        
        // カーソルをリセット
        cropState.overlay.style.cursor = 'crosshair';
    }
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

    // アスペクト比が設定されている場合、現在の選択範囲を調整
    if (cropState.aspectRatio) {
        adjustSelectionToAspectRatio();
    }

    drawCropUI();
}

function adjustSelectionToAspectRatio() {
    if (!cropState.aspectRatio) return;

    const sel = cropState.selection;
    const currentRatio = sel.width / sel.height;

    if (currentRatio > cropState.aspectRatio) {
        // 幅を調整
        sel.width = sel.height * cropState.aspectRatio;
    } else {
        // 高さを調整
        sel.height = sel.width / cropState.aspectRatio;
    }

    // 範囲内に収める
    constrainSelection();
}

function constrainSelection() {
    const sel = cropState.selection;

    if (sel.x < 0) sel.x = 0;
    if (sel.y < 0) sel.y = 0;
    if (sel.x + sel.width > cropState.canvas.width) {
        sel.x = cropState.canvas.width - sel.width;
    }
    if (sel.y + sel.height > cropState.canvas.height) {
        sel.y = cropState.canvas.height - sel.height;
    }

    if (sel.width > cropState.canvas.width) {
        sel.width = cropState.canvas.width;
        sel.x = 0;
    }
    if (sel.height > cropState.canvas.height) {
        sel.height = cropState.canvas.height;
        sel.y = 0;
    }
}

function handleMouseDown(e) {
    const rect = cropState.overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dragType = detectDragType(x, y);

    if (dragType) {
        cropState.isDragging = true;
        cropState.dragType = dragType;
        cropState.startX = x;
        cropState.startY = y;
        cropState.startSelection = { ...cropState.selection };
    }
}

function handleMouseMove(e) {
    const rect = cropState.overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (cropState.isDragging) {
        const dx = x - cropState.startX;
        const dy = y - cropState.startY;

        updateSelection(dx, dy);
        drawCropUI();
    } else {
        // カーソルの変更
        const dragType = detectDragType(x, y);
        updateCursor(dragType);
    }
}

function handleMouseUp(e) {
    cropState.isDragging = false;
    cropState.dragType = null;
}

function detectDragType(x, y) {
    const sel = cropState.selection;
    const handleSize = 12;
    const edgeThreshold = 8;

    // 四隅のハンドル
    if (isNear(x, sel.x, handleSize) && isNear(y, sel.y, handleSize)) return 'nw';
    if (isNear(x, sel.x + sel.width, handleSize) && isNear(y, sel.y, handleSize)) return 'ne';
    if (isNear(x, sel.x, handleSize) && isNear(y, sel.y + sel.height, handleSize)) return 'sw';
    if (isNear(x, sel.x + sel.width, handleSize) && isNear(y, sel.y + sel.height, handleSize)) return 'se';

    // 辺のハンドル
    if (isNear(x, sel.x + sel.width / 2, handleSize) && isNear(y, sel.y, handleSize)) return 'n';
    if (isNear(x, sel.x + sel.width / 2, handleSize) && isNear(y, sel.y + sel.height, handleSize)) return 's';
    if (isNear(x, sel.x, handleSize) && isNear(y, sel.y + sel.height / 2, handleSize)) return 'w';
    if (isNear(x, sel.x + sel.width, handleSize) && isNear(y, sel.y + sel.height / 2, handleSize)) return 'e';

    // 選択範囲内（移動）
    if (x >= sel.x && x <= sel.x + sel.width && y >= sel.y && y <= sel.y + sel.height) {
        return 'move';
    }

    return null;
}

function isNear(a, b, threshold) {
    return Math.abs(a - b) <= threshold;
}

function updateCursor(dragType) {
    const cursors = {
        'nw': 'nw-resize',
        'ne': 'ne-resize',
        'sw': 'sw-resize',
        'se': 'se-resize',
        'n': 'n-resize',
        's': 's-resize',
        'e': 'e-resize',
        'w': 'w-resize',
        'move': 'move'
    };

    cropState.overlay.style.cursor = cursors[dragType] || 'crosshair';
}

function updateSelection(dx, dy) {
    const sel = cropState.selection;
    const start = cropState.startSelection;

    switch (cropState.dragType) {
        case 'move':
            sel.x = start.x + dx;
            sel.y = start.y + dy;
            break;

        case 'nw':
            sel.x = start.x + dx;
            sel.y = start.y + dy;
            sel.width = start.width - dx;
            sel.height = start.height - dy;
            break;

        case 'ne':
            sel.y = start.y + dy;
            sel.width = start.width + dx;
            sel.height = start.height - dy;
            break;

        case 'sw':
            sel.x = start.x + dx;
            sel.width = start.width - dx;
            sel.height = start.height + dy;
            break;

        case 'se':
            sel.width = start.width + dx;
            sel.height = start.height + dy;
            break;

        case 'n':
            sel.y = start.y + dy;
            sel.height = start.height - dy;
            break;

        case 's':
            sel.height = start.height + dy;
            break;

        case 'w':
            sel.x = start.x + dx;
            sel.width = start.width - dx;
            break;

        case 'e':
            sel.width = start.width + dx;
            break;
    }

    // アスペクト比の維持
    if (cropState.aspectRatio && cropState.dragType !== 'move') {
        maintainAspectRatio();
    }

    // 最小サイズ
    if (sel.width < 50) sel.width = 50;
    if (sel.height < 50) sel.height = 50;

    constrainSelection();
}

function maintainAspectRatio() {
    const sel = cropState.selection;
    const type = cropState.dragType;

    if (['nw', 'ne', 'sw', 'se'].includes(type)) {
        // 対角のリサイズ：幅に合わせて高さを調整
        sel.height = sel.width / cropState.aspectRatio;

        if (type === 'nw' || type === 'ne') {
            sel.y = cropState.startSelection.y + cropState.startSelection.height - sel.height;
        }
    } else if (['n', 's'].includes(type)) {
        // 上下のリサイズ：高さに合わせて幅を調整
        const newWidth = sel.height * cropState.aspectRatio;
        sel.x = sel.x + (sel.width - newWidth) / 2;
        sel.width = newWidth;
    } else if (['e', 'w'].includes(type)) {
        // 左右のリサイズ：幅に合わせて高さを調整
        const newHeight = sel.width / cropState.aspectRatio;
        sel.y = sel.y + (sel.height - newHeight) / 2;
        sel.height = newHeight;
    }
}

function drawCropUI() {
    const ctx = cropState.overlayCtx;
    const sel = cropState.selection;

    ctx.clearRect(0, 0, cropState.overlay.width, cropState.overlay.height);

    // 暗いオーバーレイ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, cropState.overlay.width, cropState.overlay.height);

    // 選択範囲を明るく
    ctx.clearRect(sel.x, sel.y, sel.width, sel.height);

    // 選択範囲の枠
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.strokeRect(sel.x, sel.y, sel.width, sel.height);

    // グリッド線（Rule of Thirds）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;

    // 縦線
    ctx.beginPath();
    ctx.moveTo(sel.x + sel.width / 3, sel.y);
    ctx.lineTo(sel.x + sel.width / 3, sel.y + sel.height);
    ctx.moveTo(sel.x + sel.width * 2 / 3, sel.y);
    ctx.lineTo(sel.x + sel.width * 2 / 3, sel.y + sel.height);
    ctx.stroke();

    // 横線
    ctx.beginPath();
    ctx.moveTo(sel.x, sel.y + sel.height / 3);
    ctx.lineTo(sel.x + sel.width, sel.y + sel.height / 3);
    ctx.moveTo(sel.x, sel.y + sel.height * 2 / 3);
    ctx.lineTo(sel.x + sel.width, sel.y + sel.height * 2 / 3);
    ctx.stroke();

    // ハンドル
    drawHandle(ctx, sel.x, sel.y); // nw
    drawHandle(ctx, sel.x + sel.width, sel.y); // ne
    drawHandle(ctx, sel.x, sel.y + sel.height); // sw
    drawHandle(ctx, sel.x + sel.width, sel.y + sel.height); // se
    drawHandle(ctx, sel.x + sel.width / 2, sel.y); // n
    drawHandle(ctx, sel.x + sel.width / 2, sel.y + sel.height); // s
    drawHandle(ctx, sel.x, sel.y + sel.height / 2); // w
    drawHandle(ctx, sel.x + sel.width, sel.y + sel.height / 2); // e

    // サイズ表示
    ctx.fillStyle = 'rgba(102, 126, 234, 0.9)';
    ctx.fillRect(sel.x + 4, sel.y + 4, 100, 24);
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${Math.round(sel.width)} × ${Math.round(sel.height)}`, sel.x + 10, sel.y + 20);
}

function drawHandle(ctx, x, y) {
    const size = 12;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.strokeRect(x - size / 2, y - size / 2, size, size);
}

export function getCropSelection() {
    return cropState.selection;
}

export function applyCrop(originalImage) {
    const sel = cropState.selection;
    const scale = originalImage.width / cropState.canvas.width;

    return {
        x: sel.x * scale,
        y: sel.y * scale,
        width: sel.width * scale,
        height: sel.height * scale
    };
}