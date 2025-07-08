class BaseSlot {
    constructor(hasProgress = true) {
        this.el = document.createElement('div');
        this.el.className = 'slot';
        this.label = document.createElement('span');
        this.label.className = 'label';
        this.el.appendChild(this.label);
        if (hasProgress) {
            this.progressWrapper = document.createElement('div');
            this.progressWrapper.className = 'progress-wrapper';
            this.progress = document.createElement('progress');
            this.progress.value = 0;
            this.progress.max = 1;
            this.progressWrapper.appendChild(this.progress);
            this.el.appendChild(this.progressWrapper);
        } else {
            this.progress = null;
        }
    }

    setLabel(text) {
        this.label.textContent = text || '';
    }

    setImage(url) {
        if (url) {
            this.el.style.backgroundImage = `url(${url})`;
            this.el.style.backgroundSize = 'cover';
        } else {
            this.el.style.backgroundImage = 'none';
        }
    }

    setTooltip(text) {
        this.el.dataset.tooltip = text || '';
    }

    setProgress(value) {
        if (this.progress) this.progress.value = value;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { BaseSlot };
}
