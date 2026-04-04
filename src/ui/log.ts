export function createLogUi() {
    return {
        messages: [] as Array<{ html: string; options: Record<string, unknown> }>,
        dashboardContainer: null as HTMLElement | null,
        dashboardEl: null as HTMLElement | null,
        adventureContainer: null as HTMLElement | null,
        adventureEl: null as HTMLElement | null,
        init() {
            this.dashboardContainer = document.getElementById("log-container");
            this.dashboardEl = document.getElementById("log");
            this.adventureContainer = document.getElementById("adventure-log-container");
            this.adventureEl = document.getElementById("adventure-log");
        },
        appendTo(element: HTMLElement | null, container: HTMLElement | null, html: string) {
            if (!element) return;
            const div = document.createElement("div");
            div.className = "log-entry";
            div.innerHTML = html;
            element.appendChild(div);
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        },
        add(msg: any) {
            const scope = globalThis as any;
            let options: Record<string, unknown> = {};
            if (msg && typeof msg === "object") {
                options = msg.options || {};
                if (options.encounter && scope.State.showEncounterLog === false) {
                    return;
                }
                msg = msg.text || "";
            }
            this.messages.push({ html: msg, options });
            this.appendTo(this.dashboardEl, this.dashboardContainer, msg);
            if (options.encounter) {
                this.appendTo(this.adventureEl, this.adventureContainer, msg);
            }
        }
    };
}
