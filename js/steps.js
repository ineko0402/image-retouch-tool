//js/steps.js
// ステップインジケーター管理

let currentStep = 1;

export function setStep(step) {
  currentStep = step;
  updateStepIndicator();
}

export function getCurrentStep() {
  return currentStep;
}

function updateStepIndicator() {
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
  // 完了したステップをクリックで戻れるようにする
  document.getElementById('step1').addEventListener('click', () => {
    if (currentStep > 1) {
      goToUploadScreen();
    }
  });
  
  document.getElementById('step2').addEventListener('click', () => {
    if (currentStep > 2) {
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