const assert=require('node:assert/strict');
const {collectVariantIdentifiers,matchVariantIdentifiers,sameHgvs}=require('../src/views/PbGene/variantLookup');
const source=[
 {id:'chr13:20189551:CG:C',HGVSc:'ENST00000382848.5:c.35del',Existing_variation:'rs80338939&CD972240&CM000167'},
 {id:'chr13:20189551:C:CG',HGVSc:'ENST00000382848.5:c.35dup',Existing_variation:'rs80338939'},
 {id:'chr13:20189414:CA:C',HGVSc:'ENST00000382848.5:c.167del',Existing_variation:'rs80338942'},
 {id:'chr13:20189348:AG:A',HGVSc:'ENST00000382848.5:c.235del',Existing_variation:'rs80338943'},
];
const rows=source.map(row=>({id:row.id,...collectVariantIdentifiers([row])}));
assert.deepEqual(matchVariantIdentifiers(rows,'c.35delG').matches.map(row=>row.id),[source[0].id]);
assert.deepEqual(matchVariantIdentifiers(rows,'c.167delT').matches.map(row=>row.id),[source[2].id]);
assert.deepEqual(matchVariantIdentifiers(rows,'c.235delC').matches.map(row=>row.id),[source[3].id]);
assert.equal(matchVariantIdentifiers(rows,'RS80338939').matches.length,2,'All alleles sharing an rsID must be returned');
assert.equal(matchVariantIdentifiers(rows,'rs8033893').matches.length,0,'Do not match rsID prefixes');
assert.equal(matchVariantIdentifiers(rows,'c.35delG, c.167delT, c.235delC').matches.length,3);
assert.equal(matchVariantIdentifiers(rows,'rs80338939,c.35delG').unmatched.length,0,'Different aliases of a single row are all marked matched');
assert.equal(matchVariantIdentifiers(rows,source[0].id).matches.length,1);
assert.equal(matchVariantIdentifiers(rows,'13:20189551:CG:C').matches.length,1);
assert.equal(matchVariantIdentifiers(rows,'ENST00000382848.5:c.35delG').matches.length,1);
assert.equal(matchVariantIdentifiers(rows,'ENST00000382848.6:c.35delG').matches.length,0,'No unverified transcript/version conversion');
assert.equal(sameHgvs('c.35delG','c.35dup'),false);
assert.equal(sameHgvs('c.35delG','c.35delT'),false);
assert.equal(sameHgvs('c.35delG','c.36del'),false);
assert.equal(sameHgvs('c.35delG','c.35delinsT'),false);
assert.ok(matchVariantIdentifiers(rows,'random text').error);
const aliases=collectVariantIdentifiers([{HGVSc:'NA',Existing_variation:'rs123&CD0001'},{hgvsc:'NM_000001.1:c.2G>A',Existing_variation:'rs123&rs456'}]);
assert.deepEqual(aliases.rsids,['rs123','rs456']);
assert.deepEqual(aliases.hgvscAliases,['NM_000001.1:c.2G>A']);
console.log('HGVS deletion aliases, transcript specificity, multi-allelic rsID lookup and exact variant lookup: PASS');
