/**
 * Home View (Effect Grid)
 */

import { effects } from '../effects.js';

export function generateEffectPreviews(onEffectSelect) {
  const grid = document.getElementById('effectGrid');
  grid.innerHTML = '';

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