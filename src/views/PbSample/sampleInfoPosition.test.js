const assert = require('assert');
const { sampleInfoPosition } = require('./sampleInfoPosition');
function check(scale, side) {
    const shell = {left: side === 'left' ? 360 : 40, top: -100, width: 1000 * scale};
    shell.right = shell.left + shell.width;
    const anchor = {left: shell.left + 300 * scale, top: 210, bottom: 226};
    const viewportWidth = side === 'left' ? shell.right + 30 : shell.right + 360;
    const box = sampleInfoPosition({shell, shellWidth:1000, anchor, viewportWidth, viewportHeight:800});
    const paintedLeft = shell.left + box.left * scale;
    const paintedTop = shell.top + box.top * scale;
    assert(paintedTop >= anchor.bottom, 'Help stays below the info control');
    assert(paintedLeft >= 0 && paintedLeft + box.width * scale <= viewportWidth, 'Help stays inside the viewport');
    assert(side === 'left' ? paintedLeft + box.width * scale < shell.left : paintedLeft > shell.right, 'Use the available side margin');
}
for (const scale of [1, .8, .64]) { check(scale, 'left'); check(scale, 'right'); }
const inline = sampleInfoPosition({shell:{left:10,right:390,top:0,width:380},shellWidth:380,anchor:{left:350,top:200,bottom:216},viewportWidth:400,viewportHeight:600});
assert(inline.left + 10 >= 12 && inline.left + inline.width + 10 <= 388);
assert(inline.top >= 216);
console.log('Sample info positioning: side margins, 100/80/64% scaling, narrow screen and below-anchor placement PASS');
