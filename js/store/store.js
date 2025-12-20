/**
 * Centralized State Management Store
 */

class Store {
    constructor() {
        this.state = {
            image: {
                original: null, // Image object
                fileName: 'output',
                fileType: 'png',
                width: 0,
                height: 0
            },
            effect: {
                currentId: null,
                params: {} // Current effect parameters
            },
            crop: {
                isActive: false,
                selection: null, // {x, y, width, height}
                preset: 'free'
            },
            ui: {
                currentStep: 1,
                isComparing: false
            }
        };

        this.listeners = new Set();
    }

    getState() {
        return this.state;
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // --- Actions ---

    setImage(img, fileName, fileType) {
        this.state.image = {
            original: img,
            fileName: fileName,
            fileType: fileType,
            width: img.width,
            height: img.height
        };
        this.notify();
    }

    setStep(step) {
        this.state.ui.currentStep = step;
        this.notify();
    }

    setEffect(effectId) {
        this.state.effect.currentId = effectId;
        this.state.effect.params = {}; // Reset params on effect change
        this.state.crop.isActive = false; // Reset crop mode
        this.notify();
    }

    updateEffectParams(params) {
        this.state.effect.params = { ...this.state.effect.params, ...params };
        this.notify();
    }

    setCropMode(isActive) {
        this.state.crop.isActive = isActive;
        this.notify();
    }

    updateCropSelection(selection) {
        this.state.crop.selection = selection;
        this.notify();
    }

    setCropPreset(preset) {
        this.state.crop.preset = preset;
        this.notify();
    }
}

export const store = new Store();
