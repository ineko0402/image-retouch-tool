/**
 * Main Entry Point
 */
import { setupUpload } from './upload.js';
import { generateEffectPreviews } from './ui/home-view.js';
import { openEditor } from './editor.js';
import { setupStepNavigation, setStep } from './steps.js';

document.addEventListener('DOMContentLoaded', () => {
  setStep(1);
  setupStepNavigation();
  setupUpload();
  generateEffectPreviews(openEditor);
});