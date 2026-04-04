function getScope(): any {
    return globalThis as any;
}

function toggleModal(id: string, hidden: boolean): void {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }
    element.classList.toggle("hidden", hidden);
}

export function createModalUi() {
    return {
        init() {
            const scope = getScope();
            if (typeof scope.PubSub === "undefined") {
                return;
            }
            const open = (id: string) => this.open(id);
            const close = (id: string) => this.close(id);
            scope.PubSub.subscribe("ui:modalOpen", open);
            scope.PubSub.subscribe("modal:open", open);
            scope.PubSub.subscribe("ui:modalClose", close);
            scope.PubSub.subscribe("modal:close", close);
        },
        open(id: string) {
            toggleModal(id, false);
        },
        close(id: string) {
            toggleModal(id, true);
        }
    };
}
