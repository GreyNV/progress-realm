// Compatibility shim. The browser runtime installs `setupTooltips` from `src/ui`.

function setupTooltips() {
    let tooltipsBound = false;
    return function bindTooltips() {
        if (tooltipsBound) return;
        tooltipsBound = true;
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
        function show(e) {
            const text = e.target?.dataset?.tooltip;
            if (!text) return;
            tooltip.innerHTML = text;
            tooltip.style.left = `${e.pageX}px`;
            tooltip.style.top = `${e.pageY + 10}px`;
            tooltip.style.display = 'block';
        }
        function hide() { tooltip.style.display = 'none'; }
        ['mouseover', 'mousemove', 'focusin'].forEach(evt => {
            document.addEventListener(evt, show);
        });
        ['mouseout', 'focusout'].forEach(evt => {
            document.addEventListener(evt, hide);
        });
    };
}

const boundSetupTooltips = setupTooltips();

if (typeof module !== 'undefined') {
    module.exports = { setupTooltips: boundSetupTooltips };
}
