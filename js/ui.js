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

export function generateControls(effect, onControlChange) {
  const panel = document.getElementById('controlsPanel');
  panel.innerHTML = '';
  
  effect.controls.forEach(control => {
    const group = document.createElement('div');
    group.className = 'control-group';
    
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
    } else {
      group.innerHTML = `
        <div class="control-label">
          <span>${control.label}</span>
          <span class="control-value" id="value-${control.id}">${control.value}${control.unit}</span>
        </div>
        <input type="range" 
               id="control-${control.id}" 
               data-control="${control.id}"
               min="${control.min}" 
               max="${control.max}" 
               value="${control.value}" 
               step="${control.step || 1}">
      `;
    }
    
    panel.appendChild(group);
    
    const input = document.getElementById(`control-${control.id}`);
    input.addEventListener('input', (e) => {
      if (control.type !== 'select') {
        document.getElementById(`value-${control.id}`).textContent = 
          e.target.value + control.unit;
      }
      onControlChange();
    });
  });
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
    if (control.type !== 'select') {
      document.getElementById(`value-${control.id}`).textContent = 
        control.value + control.unit;
    }
  });
  onControlChange();
}