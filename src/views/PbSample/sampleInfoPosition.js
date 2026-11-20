// Measure in the shell's CSS coordinate space, including CSS/browser zoom.
function sampleInfoPosition({ shell, shellWidth, anchor, viewportWidth, viewportHeight }) {
    const scale = shell.width / shellWidth || 1;
    const gap = 12, preferredWidth = 360, minimumMarginWidth = 240;
    const rightRoom = (viewportWidth - shell.right) / scale - gap * 2;
    const leftRoom = shell.left / scale - gap * 2;
    let width = Math.min(preferredWidth, (viewportWidth - gap * 2) / scale);
    let left;
    if (rightRoom >= minimumMarginWidth) { width = Math.min(width, rightRoom); left = shellWidth + gap; }
    else if (leftRoom >= minimumMarginWidth) { width = Math.min(width, leftRoom); left = -width - gap; }
    else {
        const minLeft = (gap - shell.left) / scale;
        const maxLeft = (viewportWidth - gap - shell.left) / scale - width;
        left = Math.max(minLeft, Math.min(maxLeft, (anchor.left - shell.left) / scale));
    }
    return { left, width, top: (anchor.bottom - shell.top) / scale + 4,
        maxHeight: Math.max(40, (viewportHeight - anchor.bottom - gap) / scale - 4) };
}
module.exports = { sampleInfoPosition };
