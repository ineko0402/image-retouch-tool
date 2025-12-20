/**
 * Steps Controller
 */
import { store } from './store/store.js';

export function setStep(step) {
  store.setStep(step);
  updateStepIndicator(step);
}

function updateStepIndicator(currentStep) {
  for (let i = 1; i <= 3; i++) {
    const stepElement = document.getElementById(`step${i}`);
    stepElement.classList.remove('active', 'completed');

    if (i === currentStep) {
      stepElement.classList.add('active');
    } else if (i < currentStep) {
      stepElement.classList.add('completed');
    }
  }
}

export function setupStepNavigation() {
  const state = store.getState();

  document.getElementById('step1').addEventListener('click', () => {
    if (store.getState().ui.currentStep > 1) {
      goToUploadScreen();
    }
  });

  document.getElementById('step2').addEventListener('click', () => {
    if (store.getState().ui.currentStep > 2) {
      goToEffectSelection();
    }
  });
}

function goToUploadScreen() {
  document.getElementById('editor').classList.remove('active');
  document.getElementById('effectSelection').classList.add('hidden');
  document.getElementById('uploadSection').classList.remove('hidden');
  setStep(1);
}

function goToEffectSelection() {
  document.getElementById('editor').classList.remove('active');
  document.getElementById('effectSelection').classList.remove('hidden');
  setStep(2);
}