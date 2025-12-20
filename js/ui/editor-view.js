/**
 * Editor UI View
 */

export const EditorView = {
    elements: {
        editor: document.getElementById('editor'),
        effectSelection: document.getElementById('effectSelection'),
        title: document.getElementById('editorTitle'),
        controlsPanel: document.getElementById('controlsPanel'),
        canvas: document.getElementById('previewCanvas'),
        overlay: document.getElementById('cropOverlay'),
        backBtn: document.getElementById('backBtn'),
        resetBtn: document.getElementById('resetBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        toggleComparison: document.getElementById('toggleComparison'),
        formatSelect: document.getElementById('imageFormat'),
        qualitySlider: document.getElementById('imageQuality'),
        qualityValue: document.getElementById('qualityValue'),
        qualityOption: document.getElementById('qualityOption')
    },

    show() {
        this.elements.effectSelection.classList.add('hidden');
        this.elements.editor.classList.add('active');
    },

    hide() {
        this.elements.editor.classList.remove('active');
        this.elements.effectSelection.classList.remove('hidden');
    },

    setTitle(title) {
        this.elements.title.textContent = title;
    },

    renderControls(effect, params, onParamChange) {
        const panel = this.elements.controlsPanel;
        panel.innerHTML = '';

        if (!effect.controls) return;

        effect.controls.forEach(control => {
            const group = document.createElement('div');
            group.className = 'control-group';
            group.id = `group-${control.id}`;

            if (control.type === 'select') {
                const select = this.createSelect(control, params[control.id]);
                select.addEventListener('change', (e) => {
                    onParamChange(control.id, e.target.value);
                    this.updateDependentControls(effect, params); // Handle visibility/etc
                });
                group.appendChild(this.createLabel(control.label));
                group.appendChild(select);
            } else if (control.type === 'number') {
                // ... (Similar logic to existing ui.js but cleaner)
                // For brevity and time, I'll simplify or use innerHTML
                group.innerHTML = `
          <div class="control-label"><span>${control.label}</span></div>
          <div class="number-input-wrapper">
             <input type="number" id="control-${control.id}"
                    min="${control.min}" max="${control.max}"
                    value="${params[control.id]}" step="${control.step || 1}"
                    class="number-input ${control.readonly ? 'readonly' : ''}"
                    ${control.readonly ? 'disabled' : ''}>
             <span class="number-unit">${control.unit}</span>
          </div>
        `;
                const input = group.querySelector('input');
                if (!control.readonly) {
                    input.addEventListener('input', (e) => onParamChange(control.id, parseFloat(e.target.value)));
                }
            } else {
                // Slider
                group.innerHTML = `
          <div class="control-label">
            <span>${control.label}</span>
            <span class="control-value" id="value-${control.id}">${params[control.id]}${control.unit}</span>
          </div>
          <input type="range" id="control-${control.id}"
                 min="${control.min}" max="${control.max}"
                 value="${params[control.id]}" step="${control.step || 1}">
        `;
                const input = group.querySelector('input');
                const display = group.querySelector('.control-value');
                input.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    display.textContent = `${val}${control.unit}`;
                    onParamChange(control.id, val);
                });
            }
            panel.appendChild(group);
        });

        if (effect.id === 'resize') {
            this.updateResizeVisibility(params.mode);
        }
    },

    createLabel(text) {
        const div = document.createElement('div');
        div.className = 'control-label';
        div.innerHTML = `<span>${text}</span>`;
        return div;
    },

    createSelect(control, currentValue) {
        const select = document.createElement('select');
        select.id = `control-${control.id}`;
        control.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === currentValue) option.selected = true;
            select.appendChild(option);
        });
        return select;
    },

    updateResizeVisibility(mode) {
        const groups = ['scale', 'width', 'height', 'maintainAspect', 'longSide', 'shortSide'];
        groups.forEach(id => {
            const el = document.getElementById(`group-${id}`);
            if (el) el.style.display = 'none';
        });

        if (mode === 'percent') document.getElementById('group-scale').style.display = 'block';
        else if (mode === 'pixel') {
            document.getElementById('group-width').style.display = 'block';
            document.getElementById('group-height').style.display = 'block';
            document.getElementById('group-maintainAspect').style.display = 'block';
        }
        else if (mode === 'long') document.getElementById('group-longSide').style.display = 'block';
        else if (mode === 'short') document.getElementById('group-shortSide').style.display = 'block';
    },

    updateControlValue(id, value, unit = '') {
        const input = document.getElementById(`control-${id}`);
        if (input) input.value = value;
        const display = document.getElementById(`value-${id}`);
        if (display) display.textContent = `${value}${unit}`;
    },

    bindEvents(handlers) {
        this.elements.backBtn.onclick = handlers.close;
        this.elements.resetBtn.onclick = handlers.reset;
        this.elements.downloadBtn.onclick = handlers.download;

        // Comparison
        const btn = this.elements.toggleComparison;
        btn.onmousedown = handlers.startCompare;
        btn.onmouseup = btn.onmouseleave = handlers.endCompare;

        // Export settings
        this.elements.formatSelect.onchange = (e) => handlers.changeFormat(e.target.value);
        this.elements.qualitySlider.oninput = (e) => {
            this.elements.qualityValue.textContent = `${e.target.value}%`;
            handlers.changeQuality(e.target.value);
        };
    }
};
