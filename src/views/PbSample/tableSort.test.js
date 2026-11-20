const assert = require("assert");
const { sortedRows, withPinnedRows, paginatePinnedRows } = require("./tableSort");

const rows = [
    { rank: 2, sampleId: "BCH-10", age: 8 },
    { rank: 1, sampleId: "BCH-2", age: 19 },
    { rank: 3, sampleId: "BCH-1", age: 8 },
];

assert.deepStrictEqual(sortedRows(rows, { key: "age", direction: "asc" }).map((row) => row.rank), [2, 3, 1]);
assert.deepStrictEqual(sortedRows(rows, { key: "sampleId", direction: "desc" }).map((row) => row.rank), [2, 1, 3]);
assert.deepStrictEqual(rows.map((row) => row.rank), [2, 1, 3]);
const sorted = sortedRows(rows, {key:'rank',direction:'asc'});
assert.deepStrictEqual(withPinnedRows(sorted,['BCH-1']).map(row=>row.rank),[3,1,2]);
assert.deepStrictEqual(withPinnedRows(sortedRows(rows,{key:'age',direction:'desc'}),['BCH-1']).map(row=>row.rank),[3,1,2],'Pinned samples stay above sorted results without changing their original ranks');
assert.deepStrictEqual(withPinnedRows(sorted,['BCH-10','BCH-1','BCH-10','missing']).map(row=>row.rank),[2,3,1],'Pinned order is stable and missing/duplicate IDs do not create rows');
assert.deepStrictEqual(withPinnedRows(sorted,[]),sorted,'Unpinning restores the chosen sort');
const many = Array.from({length:16},(_,index)=>({sampleId:'S'+index,rank:index+1}));
assert.deepStrictEqual(paginatePinnedRows(many,[],2).rows.map(row=>row.rank),[6,7,8,9,10]);
const second = paginatePinnedRows(many,['S0'],2);
assert.deepStrictEqual(second.rows.map(row=>row.rank),[1,7,8,9,10,11],'Pins remain on every page; unpinned results are replaced rather than appended');
assert.equal(second.pageCount,3);
assert.deepStrictEqual(paginatePinnedRows(many,['S0'],999).rows.map(row=>row.rank),[1,12,13,14,15,16]);
assert.equal(paginatePinnedRows([],[],1).pageCount,1);
for (const direction of ['asc','desc']) {
    const missing = [{sampleId:'missing',sharedGenes:null},{sampleId:'zero',sharedGenes:0},{sampleId:'two',sharedGenes:2}];
    assert.equal(sortedRows(missing,{key:'sharedGenes',direction}).at(-1).sampleId,'missing','Missing overlap stays last in either direction');
    assert.equal(sortedRows(missing,{key:'sharedGenes',direction}).find(row=>row.sampleId==='zero').sharedGenes,0);
}
console.log("PB Sample table sorting: PASS");
