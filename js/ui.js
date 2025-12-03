//js/ui.js
// UI生成と管理

import { effects } from './effects.js';

export function generateEffectPreviews(onEffectSelect) {
  const grid = document.getElementById('effectGrid');
  
  effects.forEach(effect => {
    const card = document.createElement('div');
    card.className = 'effect-card';
    card.onclick = () => onEffectSelect(effect.id);
    
    card.innerHTML = `
      <div class="effect-preview">${effect.icon}</div>
      <div class="effect-name">${effect.name}</div>
      <div class="effect-desc">${effect.desc}</div>
    `;
    
    grid.appendChild(card);
  });
}

//js/ui.js の generateControls関数を修正

export function generateControls(effect, onControlChange) {
  const panel = document.getElementById('controlsPanel');
  panel.innerHTML = '';
  
  effect.controls.forEach(control => {
    const group = document.createElement('div');
    group.className = 'control-group';
    group.id = `group-${control.id}`;
    
    if (control.type === 'select') {
      group.innerHTML = `
        <div class="control-label">
          <span>${control.label}</span>
        </div>
        <select id="control-${control.id}" data-control="${control.id}">
          ${control.options.map(opt => 
            `<option value="${opt.value}" ${opt.value === control.value ? 'selected' : ''}>${opt.label}</option>`
          ).join('')}
        </select>
      `;
    } else if (control.type === 'number') {
      const readonlyAttr = control.readonly ? 'disabled' : '';
      const readonlyClass = control.readonly ? 'readonly' : '';
      
      group.innerHTML = `
        <div class="control-label">
          <span>${control.label}</span>
        </div>
        <div class="number-input-wrapper">
          <input type="number" 
                 id="control-${control.id}" 
                 data-control="${control.id}"
                 min="${control.min}" 
                 max="${control.max}" 
                 value="${control.value}" 
                 step="${control.step || 1}"
                 class="number-input ${readonlyClass}"
                 ${readonlyAttr}>
          <span class="number-unit">${control.unit}</span>
        </div>
      `;
    } else {
      const readonlyAttr = control.readonly ? 'disabled' : '';
      const readonlyClass = control.readonly ? 'readonly' : '';
      const hideSlider = control.hideSlider ? 'style="display:none;"' : '';
      
      group.innerHTML = `
        <div class="control-label">
          <span>${control.label}</span>
          <span class="control-value ${readonlyClass}" id="value-${control.id}">${control.value}${control.unit}</span>
        </div>
        <input type="range" 
               id="control-${control.id}" 
               data-control="${control.id}"
               min="${control.min}" 
               max="${control.max}" 
               value="${control.value}" 
               step="${control.step || 1}"
               ${readonlyAttr}
               ${hideSlider}>
      `;
    }
    
    panel.appendChild(group);
    
    const input = document.getElementById(`control-${control.id}`);
    
    if (!control.readonly) {
      if (control.type === 'number') {
        input.addEventListener('input', (e) => {
          onControlChange();
        });
      } else if (control.type !== 'select') {
        input.addEventListener('input', (e) => {
          document.getElementById(`value-${control.id}`).textContent = 
            e.target.value + control.unit;
          onControlChange();
        });
      } else {
        input.addEventListener('change', onControlChange);
      }
    }
  });
  
  // 拡縮モードの場合、初期表示を調整
  if (effect.id === 'resize') {
    updateResizeControlVisibility();
    
    const modeControl = document.getElementById('control-mode');
    if (modeControl) {
      modeControl.addEventListener('change', updateResizeControlVisibility);
    }
  }
}

// 拡縮モードのコントロール表示/非表示を制御
function updateResizeControlVisibility() {
  const modeControl = document.getElementById('control-mode');
  if (!modeControl) return;
  
  const mode = modeControl.value;
  
  // 全て非表示
  const allGroups = ['scale', 'width', 'height', 'maintainAspect', 'longSide', 'shortSide'];
  allGroups.forEach(id => {
    const group = document.getElementById(`group-${id}`);
    if (group) group.style.display = 'none';
  });
  
  // モードに応じて表示
  switch (mode) {
    case 'percent':
      document.getElementById('group-scale').style.display = 'block';
      break;
    case 'pixel':
      document.getElementById('group-width').style.display = 'block';
      document.getElementById('group-height').style.display = 'block';
      document.getElementById('group-maintainAspect').style.display = 'block';
      break;
    case 'long':
      document.getElementById('group-longSide').style.display = 'block';
      break;
    case 'short':
      document.getElementById('group-shortSide').style.display = 'block';
      break;
  }
}
export function getControlValues(effect) {
  const params = {};
  effect.controls.forEach(control => {
    const input = document.getElementById(`control-${control.id}`);
    params[control.id] = control.type === 'select' ? 
      input.value : parseFloat(input.value);
  });
  return params;
}

export function resetControlValues(effect, onControlChange) {
  effect.controls.forEach(control => {
    const input = document.getElementById(`control-${control.id}`);
    input.value = control.value;
    
    if (control.type === 'number') {
      // 数値入力型は何もしない（inputのvalueのみ更新）
    } else if (control.type !== 'select') {
      // スライダー型の場合は表示用のvalueも更新
      const valueElement = document.getElementById(`value-${control.id}`);
      if (valueElement) {
        valueElement.textContent = control.value + control.unit;
      }
    }
  });
  onControlChange();
}

export function updateControlValue(controlId, value) {
  const inputElement = document.getElementById(`control-${controlId}`);
  
  if (inputElement) {
    inputElement.value = value;
    
    // スライダー型の場合は表示用のvalueも更新
    const valueElement = document.getElementById(`value-${controlId}`);
    if (valueElement) {
      const unit = valueElement.textContent.replace(/[\d.-]/g, '').trim();
      valueElement.textContent = `${value}${unit}`;
    }
  }
}