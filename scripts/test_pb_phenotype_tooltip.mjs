import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync('src/views/PbPhenotype/tooltipPosition.js');
const { tooltipPosition } = await import(`data:text/javascript;base64,${source.toString('base64')}`);
for (const width of [1440, 1980]) {
    const viewport = { width, height: 1100 }, box = { width: 384, height: 180 };
    for (const anchor of [
        { left: 10, top: 10, width: 20, bottom: 30 },
        { left: width - 30, top: 10, width: 20, bottom: 30 },
        { left: 10, top: 1050, width: 20, bottom: 1070 },
        { left: width - 30, top: 1050, width: 20, bottom: 1070 },
        { left: width / 2, top: 500, width: 20, bottom: 520 },
    ]) {
        const result = tooltipPosition(anchor, box, viewport);
        assert.ok(result.left >= 12 && result.left + box.width <= width - 12);
        assert.ok(result.top >= 12 && result.top + box.height <= viewport.height - 12);
        assert.ok(result.arrow >= 16 && result.arrow <= box.width - 16);
        if (anchor.top < 40) { assert.equal(result.placement, 'bottom'); assert.equal(result.top, anchor.bottom + 8); }
        else { assert.equal(result.placement, 'top'); assert.equal(result.top + box.height, anchor.top - 8); }
    }
}
console.log('Tooltip viewport edges, above/below fallback, anchor gap and arrow bounds PASS');
