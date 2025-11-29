//js/editor.js
// エディター画面管理

import { getState, setCurrentEffect, setCanvas } from './state.js';
import { getEffectById } from './effects.js';
import { generateControls, getControlValues, resetControlValues } from './ui.js';
import { setupCanvas, applyEffect, showOriginal, downloadImage } from './canvas.js';

export function openEditor(effectId) {
  const effect = getEffectById(effectId);
  const state = getState();
  
  setCurrentEffect(effect);
  
  document.getElementById('effectSelection').classList.add('hidden');
  document.getElementById('editor').classList.add('active');
  document.getElementById('editorTitle').textContent = effect.name;
  
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  setCanvas(canvas, ctx);
  
  setupCanvas(canvas);
  generateControls(effect, handleControlChange);
  handleControlChange();
  
  setupEditorButtons();
  setupExportSettings();
}

export function closeEditor() {
  document.getElementById('editor').classList.remove('active');
  document.getElementById('effectSelection').classList.remove('hidden');
}

function handleControlChange() {
  const state = getState();
  const params = getControlValues(state.currentEffect);
  applyEffect(state.currentEffect, params);
}

function handleReset() {
  const state = getState();
  resetControlValues(state.currentEffect, handleControlChange);
}

function handleDownload() {
  const state = getState();
  const params = getControlValues(state.currentEffect);
  
  // エクスポート設定を取得
  const format = document.getElementById('imageFormat').value;
  const quality = parseInt(document.getElementById('imageQuality').value) / 100;
  
  downloadImage(state.currentEffect, params, state.originalFileName, format, quality);
}

function setupExportSettings() {
  const state = getState();
  const formatSelect = document.getElementById('imageFormat');
  const qualitySlider = document.getElementById('imageQuality');
  const qualityValue = document.getElementById('qualityValue');
  const qualityOption = document.getElementById('qualityOption');
  
  // 元画像の形式に合わせてデフォルトを設定
  formatSelect.value = state.originalFileType;
  
  // 初期表示の設定
  if (state.originalFileType === 'jpeg') {
    qualityOption.style.display = 'block';
  } else {
    qualityOption.style.display = 'none';
  }
  
  // 画像形式変更時の処理
  formatSelect.addEventListener('change', (e) => {
    // JPEGの場合のみ品質設定を表示
    if (e.target.value === 'jpeg') {
      qualityOption.style.display = 'block';
    } else {
      qualityOption.style.display = 'none';
    }
  });
  
  // 品質スライダーの値表示
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