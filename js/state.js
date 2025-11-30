//js/state.js
// アプリケーションの状態管理

export const state = {
  originalImage: null,
  currentEffect: null,
  originalFileName: 'output',
  originalFileType: 'png',
  canvas: null,
  ctx: null,
  currentStep: 1
};

export function setOriginalImage(img, fileName, fileType) {
  state.originalImage = img;
  state.originalFileName = fileName;
  state.originalFileType = fileType;
}

export function setCurrentEffect(effect) {
  state.currentEffect = effect;
}

export function setCanvas(canvas, ctx) {
  state.canvas = canvas;
  state.ctx = ctx;
}

export function getState() {
  return state;
}