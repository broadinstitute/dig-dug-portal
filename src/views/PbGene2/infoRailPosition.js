// All offsets share the shell's coordinate space, including Gene2's CSS zoom.
function infoRailPosition({shell, shellWidth, anchor, card, viewportWidth, reserved = false}) {
    const scale = shell.width / shellWidth || 1;
    const top = (anchor.top - shell.top) / scale;
    const rightRoom = (viewportWidth - shell.right) / scale - 24;
    const leftRoom = shell.left / scale - 24;
    if (rightRoom >= 220 || reserved) return {layout: 'right', left: shellWidth + 16, top, width: Math.min(300, Math.max(220, rightRoom))};
    if (leftRoom >= 220) {
        const width = Math.min(300, leftRoom);
        return {layout: 'left', left: -width - 16, top, width};
    }
    if (viewportWidth >= 700) return {layout: 'reserve'};
    return {layout: 'inline', left: 0, top: ((card || anchor).bottom - shell.top) / scale + 12, width: shellWidth};
}
module.exports = {infoRailPosition};
