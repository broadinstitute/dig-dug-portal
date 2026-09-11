/**
 * Keep anchored popups (menus, tooltips) inside a positioned plot container.
 */
export function clampAnchoredPopupPosition({
    containerWidth,
    containerHeight,
    anchorX,
    anchorY,
    popupWidth = 0,
    popupHeight = 0,
    padding = 8,
    offsetX = 12,
    offsetY = 12,
}) {
    if (!containerWidth || !containerHeight) {
        return {
            x: anchorX + offsetX,
            y: anchorY + offsetY,
        };
    }

    let x = anchorX + offsetX;
    let y = anchorY + offsetY;

    if (popupWidth > 0 && x + popupWidth + padding > containerWidth) {
        x = anchorX - popupWidth - offsetX;
    }
    if (popupHeight > 0 && y + popupHeight + padding > containerHeight) {
        y = anchorY - popupHeight - offsetY;
    }

    if (popupWidth > 0) {
        x = Math.max(padding, Math.min(x, containerWidth - popupWidth - padding));
    } else {
        x = Math.max(padding, Math.min(x, containerWidth - padding));
    }

    if (popupHeight > 0) {
        y = Math.max(padding, Math.min(y, containerHeight - popupHeight - padding));
    } else {
        y = Math.max(padding, Math.min(y, containerHeight - padding));
    }

    return { x, y };
}

export function resolvePopupContainerBounds(element) {
    const container = element?.offsetParent || element?.parentElement;
    if (!container) {
        return { width: 0, height: 0 };
    }

    return {
        width: container.clientWidth,
        height: container.clientHeight,
    };
}

export function positionAnchoredPopupElement(element, anchorX, anchorY, containerElement) {
    if (!element) {
        return;
    }

    const bounds = resolvePopupContainerBounds(containerElement || element);
    const { x, y } = clampAnchoredPopupPosition({
        containerWidth: bounds.width,
        containerHeight: bounds.height,
        anchorX,
        anchorY,
        popupWidth: element.offsetWidth,
        popupHeight: element.offsetHeight,
    });

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
}
