function getScope(): any {
    return globalThis as any;
}

export const Utils = {
    weightedRandomChoice<T>(items: T[], weights: number[]): T {
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (let i = 0; i < items.length; i += 1) {
            r -= weights[i];
            if (r <= 0) return items[i];
        }
        return items[items.length - 1];
    },
    formatCost(cost: Record<string, number> = {}): string {
        const scope = getScope();
        return Object.entries(cost)
            .map(([id, qty]) => {
                const item = scope.ItemGenerator?.itemList?.find((entry: any) => entry.id === id) || null;
                const name = item ? item.name : id;
                return `${qty}x ${name}`;
            })
            .join(", ");
    },
    allResourcesFull(): boolean {
        const scope = getScope();
        return (scope.RESOURCE_KEYS || []).every((key: string) => {
            const res = scope.State.resources[key];
            return res && res.value >= scope.ResourceSystem.max(res);
        });
    }
};

export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDelta(v: number): string {
    const numeric = Number(v || 0);
    const sign = numeric > 0 ? "+" : "";
    return sign + numeric.toFixed(1);
}

export function installUtilityGlobals(): void {
    const scope = globalThis as any;
    scope.Utils = Utils;
    scope.capitalize = capitalize;
    scope.formatDelta = formatDelta;
}
