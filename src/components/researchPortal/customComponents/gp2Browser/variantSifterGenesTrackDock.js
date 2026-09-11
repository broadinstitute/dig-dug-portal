/**
 * Scroll targets for plot chrome that should react to page / panel scrolling.
 */
export function collectOverflowScrollTargets(rootEl) {
    const targets = new Set([window]);
    let node = rootEl?.parentElement;

    while (node) {
        const style = window.getComputedStyle(node);
        const overflow = `${style.overflow} ${style.overflowY} ${style.overflowX}`;
        if (/(auto|scroll|overlay)/.test(overflow)) {
            targets.add(node);
        }
        if (node === document.body || node === document.documentElement) {
            break;
        }
        node = node.parentElement;
    }

    return Array.from(targets);
}

/**
 * Pin the genes track when the plot stack is on screen and the genes row would
 * fall below the viewport (including when it has scrolled out of view above).
 */
export function shouldPinGenesTrackDock(plotStackRect, genesTrackHeight) {
    if (!plotStackRect || genesTrackHeight <= 0) {
        return false;
    }

    const viewportHeight = window.innerHeight;
    if (plotStackRect.bottom <= 0 || plotStackRect.top >= viewportHeight) {
        return false;
    }

    const naturalGenesTop = plotStackRect.bottom;
    return naturalGenesTop + genesTrackHeight > viewportHeight;
}

export function buildPinnedGenesTrackDockStyle(plotStackRect) {
    if (!plotStackRect) {
        return {};
    }

    return {
        left: `${Math.max(0, plotStackRect.left)}px`,
        width: `${Math.max(0, plotStackRect.width)}px`,
    };
}
