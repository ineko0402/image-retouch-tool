//js/main.js
// メインエントリーポイント

import { setupUpload } from './upload.js';
import { generateEffectPreviews } from './ui.js';
import { openEditor } from './editor.js';

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  setupUpload();
  generateEffectPreviews(openEditor);
});