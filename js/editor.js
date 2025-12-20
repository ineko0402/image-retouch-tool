/**
 * Editor Controller
 */
import { store } from './store/store.js';
import { getEffectById } from './effects.js';
import { EditorView } from './ui/editor-view.js';
import { Processor } from './core/processor.js';
import { setStep } from './steps.js';
import { initCropMode, destroyCropMode, updateAspectRatio, getCurrentCropSelection } from './controllers/crop-controller.js';
import { debounce } from './utils/utils.js';

export function openEditor(effectId) {
  const effect = getEffectById(effectId);
  store.setEffect(effectId);

  // Initialize store params with defaults
  const defaults = {};
  if (effect.controls) {
    effect.controls.forEach(c => defaults[c.id] = c.value);
  }
  store.updateEffectParams(defaults);

  EditorView.show();
  EditorView.setTitle(effect.name);

  // Canvas Setup
  const canvas = document.getElementById('previewCanvas');
  const overlay = document.getElementById('cropOverlay');
  const image = store.getState().image.original;

  // Initial Render
  render();

  // Crop Mode Setup
  if (effect.id === 'crop') {
    initCropMode(canvas, overlay, image, defaults);
  } else {
    destroyCropMode();
  }

  // Bind Events
  EditorView.bindEvents({
    close: closeEditor,
    reset: resetEditor,
    download: downloadImage,
    startCompare: () => {
      store.state.ui.isComparing = true;
      render(); // Need to re-render to show original
    },
    endCompare: () => {
      store.state.ui.isComparing = false;
      render();
    },
    changeFormat: (fmt) => { /* Update export format in store if we had it */ },
    changeQuality: (q) => { /* Update quality in store */ }
  });

  // Debounced Render for Sliders
  const debouncedRender = debounce(render, 30); // 30ms delay

  // Generate Controls
  EditorView.renderControls(effect, defaults, (id, val) => {
    const updates = { [id]: val };

    if (effect.id === 'resize') {
      handleResizeLogic(id, val, image, updates);
    }

    // Handle Crop Preset Change
    if (effect.id === 'crop' && id === 'preset') {
      updateAspectRatio(val);
      const sel = getCurrentCropSelection();
      EditorView.updateControlValue('x', Math.round(sel.x));
      EditorView.updateControlValue('y', Math.round(sel.y));
      EditorView.updateControlValue('width', Math.round(sel.width));
      EditorView.updateControlValue('height', Math.round(sel.height));
    }

    store.updateEffectParams(updates);

    if (effect.id !== 'crop') {
      debouncedRender();
    }
  });

  // Quick fix for crop updates: Poll
  if (effect.id === 'crop') {
    const interval = setInterval(() => {
      if (store.getState().effect.currentId !== 'crop') {
        clearInterval(interval);
        return;
      }
      const sel = getCurrentCropSelection();
      if (sel) {
        EditorView.updateControlValue('x', Math.round(sel.x));
        EditorView.updateControlValue('y', Math.round(sel.y));
        EditorView.updateControlValue('width', Math.round(sel.width));
        EditorView.updateControlValue('height', Math.round(sel.height));
      }
    }, 100);
  }

  setStep(3);
}

function handleResizeLogic(changedId, newVal, originalImage, updates) {
  const currentParams = { ...store.getState().effect.params, ...updates };

  if (Processor.calculateResizeOutput) {
    const size = Processor.calculateResizeOutput(originalImage.width, originalImage.height, currentParams);
    updates.resultWidth = size.width;
    updates.resultHeight = size.height;
    EditorView.updateControlValue('resultWidth', size.width);
    EditorView.updateControlValue('resultHeight', size.height);
  }
}

export function closeEditor() {
  destroyCropMode();
  EditorView.hide();
  setStep(2);
  store.setEffect(null);
}

function resetEditor() {
  const effectId = store.getState().effect.currentId;
  const effect = getEffectById(effectId);
  const defaults = {};
  effect.controls.forEach(c => defaults[c.id] = c.value);
  store.updateEffectParams(defaults);

  if (effectId === 'crop') {
    destroyCropMode();
    const canvas = document.getElementById('previewCanvas');
    const overlay = document.getElementById('cropOverlay');
    const image = store.getState().image.original;
    initCropMode(canvas, overlay, image, defaults);
  }

  EditorView.renderControls(effect, defaults, (id, val) => {
    store.updateEffectParams({ [id]: val });
    if (effectId !== 'crop') render();
    else updateAspectRatio(val);
  });

  if (effectId !== 'crop') render();
}

function render() {
  const state = store.getState();
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const img = state.image.original;

  if (!img) return;

  // Reset / Scale
  const scale = Math.min(800 / img.width, 600 / img.height, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  if (state.ui.isComparing) return;

  const effect = getEffectById(state.effect.currentId);
  if (!effect) return;

  if (!effect.requiresInteraction && !effect.requiresSpecialHandling) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const processorFunc = Processor[effect.id];
    if (processorFunc) {
      processorFunc(imageData, state.effect.params, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);
    }
  } else if (effect.id === 'gradient') {
    Processor.gradient(ctx, canvas.width, canvas.height, state.effect.params);
  } else if (effect.id === 'spotlight') {
    Processor.spotlight(ctx, canvas.width, canvas.height, state.effect.params);
  } else if (effect.id === 'resize') {
    if (state.effect.params.interpolation === 'pixelated') ctx.imageSmoothingEnabled = false;
    else ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
}

function downloadImage() {
  const state = store.getState();
  const effect = getEffectById(state.effect.currentId);
  const img = state.image.original;

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');

  if (effect.id === 'crop') {
    const sel = getCurrentCropSelection();
    const previewCanvas = document.getElementById('previewCanvas');
    const scale = img.width / previewCanvas.width;

    const cropX = sel.x * scale;
    const cropY = sel.y * scale;
    const cropW = sel.width * scale;
    const cropH = sel.height * scale;

    canvas.width = cropW;
    canvas.height = cropH;
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  }
  else if (effect.id === 'resize') {
    const size = Processor.calculateResizeOutput(img.width, img.height, state.effect.params);
    canvas.width = size.width;
    canvas.height = size.height;
    if (state.effect.params.interpolation === 'pixelated') ctx.imageSmoothingEnabled = false;
    else ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  else {
    ctx.drawImage(img, 0, 0);
    if (!effect.requiresInteraction && !effect.requiresSpecialHandling) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const processorFunc = Processor[effect.id];
      if (processorFunc) {
        processorFunc(imageData, state.effect.params, canvas.width, canvas.height);
        ctx.putImageData(imageData, 0, 0);
      }
    } else if (effect.id === 'gradient') {
      Processor.gradient(ctx, canvas.width, canvas.height, state.effect.params);
    } else if (effect.id === 'spotlight') {
      Processor.spotlight(ctx, canvas.width, canvas.height, state.effect.params);
    }
  }

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = (state.image.fileName || 'output') + '-' + effect.id + '.' + (state.image.fileType === 'jpeg' ? 'jpg' : 'png');
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, state.image.fileType === 'jpeg' ? 'image/jpeg' : 'image/png');
}