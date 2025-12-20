/**
 * Upload Controller
 */
import { store } from './store/store.js';
import { setStep } from './steps.js';

export function setupUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');
  const changeImageBtn = document.getElementById('changeImageBtn');

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      loadImage(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      loadImage(e.target.files[0]);
    }
  });

  // Change Image Button
  changeImageBtn.addEventListener('click', () => {
    document.getElementById('effectSelection').classList.add('hidden');
    document.getElementById('uploadSection').classList.remove('hidden');
    fileInput.value = '';
    setStep(1);
  });
}

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      const fileType = detectFileType(file);

      store.setImage(img, fileName, fileType);

      document.getElementById('uploadSection').classList.add('hidden');
      document.getElementById('effectSelection').classList.remove('hidden');
      setStep(2);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function detectFileType(file) {
  const mimeType = file.type.toLowerCase();

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpeg';
  if (mimeType === 'image/png') return 'png';

  const extension = file.name.split('.').pop().toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'jpeg';

  return 'png';
}