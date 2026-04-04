function getScope(): any {
    return globalThis as any;
}

export function createStoryUi() {
    return {
        active: false,
        init() {
            const scope = getScope();
            if (typeof scope.PubSub === "undefined") {
                return;
            }
            scope.PubSub.subscribe("story:show", (data: { text: string; image?: string; onClose?: () => void }) => {
                this.show(data.text, data.image || "", data.onClose);
            });
        },
        show(text: string, image: string, onClose?: () => void) {
            if (this.active) {
                return;
            }
            this.active = true;
            const scope = getScope();
            const modal = document.getElementById("story-modal");
            const textEl = document.getElementById("story-text");
            const imageEl = document.getElementById("story-image");
            const closeButton = document.getElementById("story-close");
            if (!modal || !textEl || !imageEl || !closeButton) {
                this.active = false;
                return;
            }

            textEl.textContent = text;
            imageEl.innerHTML = "";
            if (image) {
                const img = document.createElement("img");
                img.src = image;
                img.alt = "";
                img.loading = "lazy";
                imageEl.appendChild(img);
            }

            modal.classList.remove("hidden");
            scope.PubSub?.publish("modal:open", "story-modal");

            const close = () => {
                modal.classList.add("hidden");
                scope.PubSub?.publish("modal:close", "story-modal");
                closeButton.removeEventListener("click", close);
                this.active = false;
                scope.Log?.add(text);
                onClose?.();
            };

            closeButton.addEventListener("click", close);
        }
    };
}
