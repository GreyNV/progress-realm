// Handles creation and behavior of tooltips

function setupTooltips() {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
    function show(e) {
        const text = e.target.dataset.tooltip;
        if (!text) return;
        tooltip.innerHTML = text;
        tooltip.style.left = e.pageX + 'px';
        tooltip.style.top = (e.pageY + 10) + 'px';
        tooltip.style.display = 'block';
    }
    function hide() { tooltip.style.display = 'none'; }
    ['mouseover', 'mousemove', 'focusin'].forEach(evt => {
        document.addEventListener(evt, show);
    });
    ['mouseout', 'focusout'].forEach(evt => {
        document.addEventListener(evt, hide);
    });
}

if (typeof module !== 'undefined') {
    module.exports = { setupTooltips };
}
