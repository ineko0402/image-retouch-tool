//js/canvas.js
// Canvas操作

import { getState } from './state.js';

export function setupCanvas(canvas) {
  const state = getState();
  const scale = Math.min(800 / state.originalImage.width, 600 / state.originalImage.height, 1);
  canvas.width = state.originalImage.width * scale;
  canvas.height = state.originalImage.height * scale;
}

export function applyEffect(effect, params) {
  const state = getState();
  effect.apply(state.canvas, state.ctx, state.originalImage, params);
}

export function showOriginal() {
  const state = getState();
  state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  state.ctx.drawImage(state.originalImage, 0, 0, state.canvas.width, state.canvas.height);
}

export function downloadImage(effect, params, fileName, format = 'png', quality = 0.95) {
  const state = getState();
  
  // 非同期処理を避けるため、requestAnimationFrameを使用
  requestAnimationFrame(() => {
    // 元画像サイズで再描画
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = state.originalImage.width;
    tempCanvas.height = state.originalImage.height;
    
    // エフェクトを適用
    effect.apply(tempCanvas, tempCtx, state.originalImage, params);
    
    // MIMEタイプと拡張子を決定
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    
    // ダウンロード
    tempCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${fileName}-${effect.id}.${extension}`;
      link.href = url;
      link.click();
      
      // メモリリーク防止
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, mimeType, quality);
  });
}