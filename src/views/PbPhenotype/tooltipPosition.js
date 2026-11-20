// All inputs and outputs are viewport coordinates, before conversion to CSS zoom.
export function tooltipPosition(anchor, box, viewport) {
    const margin = 12, gap = 8;
    const below = viewport.height - anchor.bottom - margin;
    const above = anchor.top - margin;
    const placement = above >= box.height + gap || above > below ? 'top' : 'bottom';
    const left = Math.max(margin, Math.min(anchor.left + anchor.width / 2 - box.width / 2, viewport.width - margin - box.width));
    const top = Math.max(margin, Math.min(placement === 'top' ? anchor.top - gap - box.height : anchor.bottom + gap, viewport.height - margin - box.height));
    const arrow = Math.max(16, Math.min(anchor.left + anchor.width / 2 - left, box.width - 16));
    return { left, top, placement, arrow };
}
