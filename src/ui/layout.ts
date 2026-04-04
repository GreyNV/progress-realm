export function createLayoutUi(dashboardUi: ReturnType<typeof import("./dashboard").createDashboardUi>) {
    const getDrawerStorageKey = (drawer: HTMLElement) => drawer.dataset.drawerStorageKey || `progress-realm:drawer:${drawer.id || "default"}`;
    const getStoredDrawerState = (drawer: HTMLElement) => globalThis.localStorage?.getItem(getDrawerStorageKey(drawer));

    return {
        setDrawerState(drawer: HTMLElement, expanded: boolean) {
            drawer.classList.toggle("is-expanded", expanded);
            drawer.classList.toggle("is-collapsed", !expanded);
            const toggle = drawer.querySelector("[data-drawer-toggle]") as HTMLButtonElement | null;
            if (toggle) {
                toggle.setAttribute("aria-expanded", String(expanded));
                toggle.dataset.drawerState = expanded ? "expanded" : "collapsed";
            }
        },
        initDrawers() {
            document.querySelectorAll("[data-drawer]").forEach((node) => {
                const drawer = node as HTMLElement;
                const toggle = drawer.querySelector("[data-drawer-toggle]") as HTMLButtonElement | null;
                if (!toggle || toggle.dataset.drawerBound === "true") {
                    return;
                }

                const storedState = getStoredDrawerState(drawer);
                const defaultExpanded = drawer.dataset.drawerDefault !== "collapsed";
                this.setDrawerState(drawer, storedState ? storedState === "expanded" : defaultExpanded);

                // Keep drawer state local to the layout layer so future sidebars can reuse the same pattern.
                toggle.addEventListener("click", () => {
                    const nextExpanded = !drawer.classList.contains("is-expanded");
                    this.setDrawerState(drawer, nextExpanded);
                    globalThis.localStorage?.setItem(getDrawerStorageKey(drawer), nextExpanded ? "expanded" : "collapsed");
                });

                toggle.dataset.drawerBound = "true";
            });
        },
        loadTabs() {
            const registry = (globalThis as any).window?.__appContent;
            const layout = registry?.uiLayout || { overviewModules: [], tabs: [] };
            return {
                overviewModules: Array.isArray(layout.overviewModules) ? layout.overviewModules : [],
                tabs: Array.isArray(layout.tabs) ? layout.tabs : []
            };
        },
        applyOverviewModules(overviewModules: any[]) {
            const grid = document.querySelector(".dashboard-grid");
            if (!grid || !Array.isArray(overviewModules) || !overviewModules.length) return;
            const visibleIds = new Set(overviewModules.map((entry) => entry.id));
            grid.querySelectorAll(".dashboard-card").forEach((card) => {
                card.classList.toggle("hidden", !visibleIds.has((card as HTMLElement).id));
            });
            const fragments: HTMLElement[] = [];
            overviewModules
                .slice()
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .forEach((moduleConfig) => {
                    const element = document.getElementById(moduleConfig.id);
                    if (!element) return;
                    element.dataset.overviewSpan = moduleConfig.span || "normal";
                    fragments.push(element);
                });
            fragments.forEach((element) => grid.appendChild(element));
        },
        buildLayerCards(tabManager: any, lang: any) {
            const container = document.getElementById("layer-cards");
            if (!container) return;
            container.innerHTML = "";
            tabManager.getDashboardTabs().forEach((tab: any) => {
                const card = document.createElement("article");
                const accent = tab.dashboard && tab.dashboard.accent ? tab.dashboard.accent : tab.id;
                card.className = "layer-card";
                card.dataset.tab = tab.id;
                card.dataset.accent = accent;
                const title = document.createElement("h3");
                title.id = `layer-card-title-${tab.id}`;
                const description = document.createElement("p");
                description.id = `layer-card-description-${tab.id}`;
                const metricGrid = document.createElement("div");
                metricGrid.className = "layer-metrics";
                metricGrid.id = `layer-card-metrics-${tab.id}`;
                const footer = document.createElement("div");
                footer.className = "layer-card-footer";
                const status = document.createElement("span");
                status.className = "layer-status";
                status.id = `layer-card-status-${tab.id}`;
                const button = document.createElement("button");
                button.id = `layer-card-cta-${tab.id}`;
                button.dataset.workspace = tab.id;
                button.addEventListener("click", () => tabManager.openWorkspace(tab.id));
                footer.appendChild(status);
                footer.appendChild(button);
                card.appendChild(title);
                card.appendChild(description);
                card.appendChild(metricGrid);
                card.appendChild(footer);
                container.appendChild(card);
            });
        },
        buildWorkspaceSummary(tab: any) {
            const summary = document.getElementById("workspace-summary");
            if (!summary || !tab) return;
            summary.innerHTML = "";
            const metrics = dashboardUi.getWorkspaceMetrics(tab.id);
            metrics.forEach((metric) => {
                const card = document.createElement("div");
                card.className = "summary-metric";
                card.innerHTML = `<span class="metric-label">${metric.label}</span><strong>${metric.value}</strong>`;
                summary.appendChild(card);
            });
        },
        updateWorkspaceHeader(tab: any, lang: any) {
            const title = document.getElementById("workspace-title");
            const kicker = document.getElementById("workspace-kicker");
            const description = document.getElementById("workspace-description");
            if (!tab || !title || !kicker || !description) return;
            const displayName = lang?.ui(tab.name) || tab.name;
            const cardTitle = tab.dashboard && tab.dashboard.cardTitle ? tab.dashboard.cardTitle : displayName;
            title.textContent = displayName;
            kicker.textContent = cardTitle;
            description.textContent = tab.dashboard && tab.dashboard.description
                ? (lang?.ui(tab.dashboard.description) || tab.dashboard.description)
                : "";
            this.buildWorkspaceSummary(tab);
        }
    };
}
