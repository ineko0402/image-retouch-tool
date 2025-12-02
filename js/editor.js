//js/editor.js
// エディター画面管理

import { getState, setCurrentEffect, setCanvas } from './state.js';
import { getEffectById } from './effects.js';
import { generateControls, getControlValues, resetControlValues, updateControlValue } from './ui.js';
import { setupCanvas, applyEffect, showOriginal, downloadImage } from './canvas.js';
import { setStep } from './steps.js';
import { initCropMode, destroyCropMode, getCropSelection, applyCrop, updateAspectRatio } from './crop.js';

let cropMode = false;
let cropSelection = null;
let cropUpdateInterval = null;

//js/editor.js の該当部分を修正

// openEditor関数内、トリミングモードのif文の後に追加
export function openEditor(effectId) {
  const effect = getEffectById(effectId);
  const state = getState();
  
  // 前回のトリミングモードをクリーンアップ
  if (cropMode) {
    destroyCropMode();
    if (cropUpdateInterval) {
      clearInterval(cropUpdateInterval);
      cropUpdateInterval = null;
    }
    cropMode = false;
    cropSelection = null;
  }
  
  setCurrentEffect(effect);
  
  document.getElementById('effectSelection').classList.add('hidden');
  document.getElementById('editor').classList.add('active');
  document.getElementById('editorTitle').textContent = effect.name;
  
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  setCanvas(canvas, ctx);
  
  setupCanvas(canvas);
  generateControls(effect, handleControlChange);
  
  // トリミングモードの場合
  if (effect.requiresInteraction) {
    cropMode = true;
    const overlay = document.getElementById('cropOverlay');
    const params = getControlValues(effect);
    initCropMode(canvas, overlay, state.originalImage, params);
    
    const presetControl = document.getElementById('control-preset');
    if (presetControl) {
      presetControl.addEventListener('change', (e) => {
        updateAspectRatio(e.target.value);
        updateCropInfo();
      });
    }
    
    cropUpdateInterval = setInterval(() => {
      if (cropMode) {
        updateCropInfo();
      }
    }, 100);
  } 
  // 拡縮モードの場合
  else if (effect.requiresSpecialHandling && effect.id === 'resize') {
    // 初期値を設定
    updateControlValue('width', state.originalImage.width);
    updateControlValue('height', state.originalImage.height);
    
    // モード変更の監視
    const modeControl = document.getElementById('control-mode');
    if (modeControl) {
      modeControl.addEventListener('change', () => {
        updateResizeInfo();
        handleControlChange();
      });
    }
    
    // 幅変更の監視（アスペクト比維持時）
    const widthControl = document.getElementById('control-width');
    if (widthControl) {
      widthControl.addEventListener('input', () => {
        const params = getControlValues(effect);
        if (params.mode === 'pixel' && params.maintainAspect === 'on') {
          const aspectRatio = state.originalImage.width / state.originalImage.height;
          const newHeight = Math.round(params.width / aspectRatio);
          updateControlValue('height', newHeight);
        }
        updateResizeInfo();
      });
    }
    
    // 各パラメータ変更時に出力サイズを更新
    ['scale', 'width', 'height', 'longSide', 'shortSide', 'maintainAspect'].forEach(controlId => {
      const control = document.getElementById(`control-${controlId}`);
      if (control) {
        control.addEventListener('input', () => {
          updateResizeInfo();
        });
      }
    });
    
    updateResizeInfo();
    handleControlChange();
  } 
  else {
    cropMode = false;
    handleControlChange();
  }
  
  setupEditorButtons();
  setupExportSettings();
  
  setStep(3);
}

// updateResizeInfo関数を追加
function updateResizeInfo() {
  const state = getState();
  const effect = state.currentEffect;
  
  if (!effect.calculateOutputSize) return;
  
  const params = getControlValues(effect);
  const outputSize = effect.calculateOutputSize(
    state.originalImage.width,
    state.originalImage.height,
    params
  );
  
  updateControlValue('resultWidth', outputSize.width);
  updateControlValue('resultHeight', outputSize.height);
}

// handleDownload関数を修正
function handleDownload() {
  const state = getState();
  const params = getControlValues(state.currentEffect);
  
  const format = document.getElementById('imageFormat').value;
  const quality = parseInt(document.getElementById('imageQuality').value) / 100;
  
  if (cropMode && cropSelection) {
    const actualCrop = applyCrop(state.originalImage);
    downloadCroppedImage(state.currentEffect, actualCrop, state.originalFileName, format, quality);
  } else if (state.currentEffect.requiresSpecialHandling && state.currentEffect.id === 'resize') {
    // 拡縮用のダウンロード処理
    downloadResizedImage(state.currentEffect, params, state.originalImage, state.originalFileName, format, quality);
  } else {
    downloadImage(state.currentEffect, params, state.originalFileName, format, quality);
  }
}

// downloadResizedImage関数を追加
function downloadResizedImage(effect, params, originalImage, fileName, format = 'png', quality = 0.95) {
  requestAnimationFrame(() => {
    const outputSize = effect.calculateOutputSize(originalImage.width, originalImage.height, params);
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = outputSize.width;
    tempCanvas.height = outputSize.height;
    
    // 補間方法の設定
    if (params.interpolation === 'pixelated') {
      tempCtx.imageSmoothingEnabled = false;
    } else if (params.interpolation === 'smooth') {
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
    } else {
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'medium';
    }
    
    tempCtx.drawImage(originalImage, 0, 0, outputSize.width, outputSize.height);
    
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    
    tempCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${fileName}-resized.${extension}`;
      link.href = url;
      link.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, mimeType, quality);
  });
}

export function closeEditor() {
  if (cropMode) {
    destroyCropMode();
    if (cropUpdateInterval) {
      clearInterval(cropUpdateInterval);
      cropUpdateInterval = null;
    }
    cropMode = false;
    cropSelection = null;
  }
  
  document.getElementById('editor').classList.remove('active');
  document.getElementById('effectSelection').classList.remove('hidden');
  setStep(2);
}

function updateCropInfo() {
  const state = getState();
  const sel = getCropSelection();
  
  if (!sel) return;
  
  // プレビューキャンバスのスケール
  const scale = state.originalImage.width / state.canvas.width;
  
  // 実際の画像サイズでの値を表示
  updateControlValue('x', Math.round(sel.x * scale));
  updateControlValue('y', Math.round(sel.y * scale));
  updateControlValue('width', Math.round(sel.width * scale));
  updateControlValue('height', Math.round(sel.height * scale));
  
  cropSelection = sel;
}

function handleControlChange() {
  const state = getState();
  const params = getControlValues(state.currentEffect);
  
  if (cropMode) {
    // トリミングモードではプレビューを更新しない
    return;
  }
  
  applyEffect(state.currentEffect, params);
}

function handleReset() {
  const state = getState();
  
  if (cropMode) {
    // トリミングのリセット
    const overlay = document.getElementById('cropOverlay');
    const params = { preset: 'free' };
    destroyCropMode();
    initCropMode(state.canvas, overlay, state.originalImage, params);
    
    // プリセットをリセット
    const presetControl = document.getElementById('control-preset');
    if (presetControl) {
      presetControl.value = 'free';
    }
    
    updateCropInfo();
  } else {
    resetControlValues(state.currentEffect, handleControlChange);
  }
}


function downloadCroppedImage(effect, cropRect, fileName, format = 'png', quality = 0.95) {
  const state = getState();
  
  requestAnimationFrame(() => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = cropRect.width;
    tempCanvas.height = cropRect.height;
    
    // トリミング範囲を描画
    tempCtx.drawImage(
      state.originalImage,
      cropRect.x, cropRect.y, cropRect.width, cropRect.height,
      0, 0, cropRect.width, cropRect.height
    );
    
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    
    tempCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${fileName}-cropped.${extension}`;
      link.href = url;
      link.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }, mimeType, quality);
  });
}

function setupExportSettings() {
  const state = getState();
  const formatSelect = document.getElementById('imageFormat');
  const qualitySlider = document.getElementById('imageQuality');
  const qualityValue = document.getElementById('qualityValue');
  const qualityOption = document.getElementById('qualityOption');
  
  formatSelect.value = state.originalFileType;
  
  if (state.originalFileType === 'jpeg') {
    qualityOption.style.display = 'block';
  } else {
    qualityOption.style.display = 'none';
  }
  
  formatSelect.addEventListener('change', (e) => {
    if (e.target.value === 'jpeg') {
      qualityOption.style.display = 'block';
    } else {
      qualityOption.style.display = 'none';
    }
  });
  
  qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = `${e.target.value}%`;
  });
}

function setupEditorButtons() {
  document.getElementById('backBtn').onclick = closeEditor;
  document.getElementById('resetBtn').onclick = handleReset;
  document.getElementById('downloadBtn').onclick = handleDownload;
  
  let isShowingBefore = false;
  const toggleBtn = document.getElementById('toggleComparison');
  
  toggleBtn.onmousedown = () => {
    if (cropMode) return; // トリミングモードでは無効
    isShowingBefore = true;
    showOriginal();
  };
  
  toggleBtn.onmouseup = toggleBtn.onmouseleave = () => {
    if (isShowingBefore) {
      isShowingBefore = false;
      handleControlChange();
    }
  };
}