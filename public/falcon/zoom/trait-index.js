/* ============================================================
   FalconTraitIndex — client-side index over the canonical trait
   table (falcon_traits_with_categories.tsv), the single source of
   truth for trait code -> human-readable description -> category.
   Every trait code used on the site is unique in this table, so
   code lookups are always exact; only the reverse (description ->
   code) can be ambiguous for the rare duplicate description.
   Powers every trait search/autocomplete so users can search and
   see the description while the app still queries BioIndex by code.
   ============================================================ */
(function () {
  const TSV_URL = 'data/falcon_traits_with_categories.tsv';

  let loadPromise = null;
  let allRows = [];
  let byCodeMap = new Map();

  function parseTsv(text) {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    if (!lines.length) return [];
    const header = lines[0].split('\t');
    const idxIdName = header.indexOf('IdName');
    const idxDesc = header.indexOf('Description');
    const idxCat = header.indexOf('Category');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split('\t');
      const idName = cols[idxIdName];
      if (!idName) continue;
      rows.push({ idName, description: cols[idxDesc] || '', category: cols[idxCat] || '' });
    }
    return rows;
  }

  function load() {
    if (loadPromise) return loadPromise;
    loadPromise = fetch(TSV_URL)
      .then(r => { if (!r.ok) throw new Error('trait index HTTP ' + r.status); return r.text(); })
      .then(text => {
        allRows = parseTsv(text);
        byCodeMap = new Map(allRows.map(r => [r.idName.toUpperCase(), r]));
        return allRows;
      })
      .catch(() => { allRows = []; byCodeMap = new Map(); return allRows; });
    return loadPromise;
  }

  function byCode(code) {
    if (!code) return null;
    return byCodeMap.get(String(code).toUpperCase()) || null;
  }

  function describeCode(code) {
    const row = byCode(code);
    return (row && row.description) || code || '';
  }

  function getAll() {
    return allRows;
  }

  function search(query, limit) {
    const q = String(query || '').trim().toLowerCase();
    const max = limit || 8;
    if (!q) return [];
    const starts = [], contains = [];
    for (const r of allRows) {
      const desc = (r.description || '').toLowerCase();
      const code = r.idName.toLowerCase();
      if (desc.startsWith(q) || code.startsWith(q)) starts.push(r);
      else if (desc.includes(q) || code.includes(q)) contains.push(r);
      if (starts.length >= max) break;
    }
    return starts.concat(contains).slice(0, max);
  }

  // Resolve free-typed text back to a trait code: exact code match, then
  // exact description match, then the top local search result (covers a
  // user typing a partial description and submitting without picking a
  // suggestion), else the text unchanged (covers a custom/unknown code
  // pasted directly — matches pre-existing behavior for such cases).
  function resolveCode(text) {
    const q = String(text || '').trim();
    if (!q) return '';
    const exactCode = byCode(q);
    if (exactCode) return exactCode.idName;
    const lower = q.toLowerCase();
    const exactDesc = allRows.find(r => r.description && r.description.toLowerCase() === lower);
    if (exactDesc) return exactDesc.idName;
    const top = search(q, 1);
    if (top.length) return top[0].idName;
    return q;
  }

  window.FalconTraitIndex = { load, byCode, describeCode, getAll, search, resolveCode };
})();
