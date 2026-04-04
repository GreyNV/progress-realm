(function (global) {
    function resolveQueueResourceCap(name) {
        if (typeof State === 'undefined' || !State || !State.resources) {
            return undefined;
        }
        const res = State.resources[name];
        if (!res) {
            return undefined;
        }
        if (
            typeof SoftCapSystem !== 'undefined' &&
            SoftCapSystem &&
            typeof SoftCapSystem.getResourceCap === 'function'
        ) {
            const cap = SoftCapSystem.getResourceCap(name);
            if (cap !== undefined && cap !== null) {
                return cap;
            }
        }
        if (
            typeof ResourceSystem !== 'undefined' &&
            ResourceSystem &&
            typeof ResourceSystem.max === 'function'
        ) {
            return ResourceSystem.max(res);
        }
        return res.baseMax;
    }

    function resourceAtQueueThreshold(name, explicitThreshold) {
        if (typeof State === 'undefined' || !State || !State.resources) {
            return false;
        }
        const res = State.resources[name];
        if (!res || typeof res.value !== 'number') {
            return false;
        }
        if (typeof explicitThreshold === 'number' && !Number.isNaN(explicitThreshold)) {
            return res.value >= explicitThreshold;
        }
        const cap = resolveQueueResourceCap(name);
        if (cap === undefined || cap === null) {
            return res.value > 0;
        }
        return res.value >= cap;
    }

    const helpers = { resolveQueueResourceCap, resourceAtQueueThreshold };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = helpers;
    } else {
        global.QueueResourceHelper = helpers;
        global.resolveQueueResourceCap = resolveQueueResourceCap;
        global.resourceAtQueueThreshold = resourceAtQueueThreshold;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this));
