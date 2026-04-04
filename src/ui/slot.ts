export class BaseSlot {
    el: HTMLDivElement;
    label: HTMLSpanElement;
    meta: HTMLDivElement;
    progressWrapper?: HTMLDivElement;
    progress: HTMLProgressElement | null;
    progressText?: HTMLSpanElement;

    constructor(hasProgress = true) {
        this.el = document.createElement("div");
        this.el.className = "slot";
        this.label = document.createElement("span");
        this.label.className = "label";
        this.el.appendChild(this.label);
        this.meta = document.createElement("div");
        this.meta.className = "slot-meta";
        this.el.appendChild(this.meta);
        if (hasProgress) {
            this.progressWrapper = document.createElement("div");
            this.progressWrapper.className = "progress-wrapper";
            this.progress = document.createElement("progress");
            this.progress.value = 0;
            this.progress.max = 1;
            this.progressWrapper.appendChild(this.progress);
            this.progressText = document.createElement("span");
            this.progressText.className = "progress-text";
            this.progressWrapper.appendChild(this.progressText);
            this.el.appendChild(this.progressWrapper);
        } else {
            this.progress = null;
        }
    }

    setLabel(text: string) {
        this.label.textContent = text || "";
    }

    setImage(url: string | null) {
        if (url) {
            this.el.style.backgroundImage = `url(${url})`;
            this.el.style.backgroundSize = "cover";
        } else {
            this.el.style.backgroundImage = "none";
        }
    }

    setTooltip(text: string) {
        this.el.dataset.tooltip = text || "";
    }

    setMeta(html: string) {
        this.meta.innerHTML = html || "";
    }

    setProgress(value: number, text: string) {
        if (this.progress) this.progress.value = value;
        if (this.progressText) this.progressText.textContent = text || "";
    }
}

export function installSlotGlobals(): void {
    (globalThis as any).BaseSlot = BaseSlot;
}
