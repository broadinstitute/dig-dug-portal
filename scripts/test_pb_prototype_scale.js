const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const template = require('lodash').template(fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8'));
const render = filename => template({htmlWebpackPlugin:{options:{filename,title:'Prototype'}}});
const pages = ['pb_gene2.html','pb_Gene.html','pb_gene.html','pb_variant.html','pb_phenotype.html','pb_sample.html','pb_Front.html','pb_front2.html','pb_Front_legacy.html','public_Gene.html','krFront.html','krSample.html','krPhenotype.html'];
for (const filename of pages) {
    const html = render(filename);
    assert.match(html, /<html lang="en" class="pb-prototype-scale">/, filename);
    assert.match(html, /zoom:\s*0\.8\s*;/);
    assert.match(html, /@supports not \(zoom: 0\.8\)/);
    assert.match(html, /transform:\s*scale\(0\.8\)/);
    assert.match(html, /-webkit-text-size-adjust:\s*100%/);
    assert(html.indexOf('id="pb-prototype-default-scale"') < html.indexOf('<link'), 'Scale must be available before CSS/scripts and first paint');
    assert(html.indexOf('id="pb-prototype-default-scale"') < html.indexOf('<body'), 'Every prototype page starts with its scale, without waiting for Vue');
    const style = html.match(/<style id="pb-prototype-default-scale">([\s\S]*?)<\/style>/)[1];
    require('postcss').parse(style);
}
for (const filename of ['index.html','gene.html','variant.html']) {
    assert(!render(filename).includes('pb-prototype-default-scale'), 'Unrelated portal entries retain their own display policy');
}
console.log('PB prototype scale: 13 entries, pre-paint 80%, WebKit text sizing and transform fallback PASS');
