// Every production page, in vue.config.js order, with what it takes to load it in e2e runs.
//
//   id        the page key in vue.config.js
//   path      the built HTML file, from the server root
//   query     URL parameters the page needs to render (values taken from links the site generates)
//   landmark  CSS selector that is visible once the page body has rendered (default DEFAULT_LANDMARK).
//             Never `#app`: Vue 2 replaces the #app element when it mounts, Vue 3 renders inside it.
//   mask      selectors to mask in screenshots (A/B comparison)
//   maxDiff   allowed screenshot difference (A/B comparison)
//   skip      why the page cannot be checked yet
//
// Some pages rewrite their own query string on load (keyParams.set: keys sorted by query-string,
// defaults filled in). Their queries are written in that canonical form, so the URL a page ends
// on is the URL it was opened with.
//
// e2e/catalog.test.mjs keeps this list in step with vue.config.js.

/** The page body container that every Template.vue renders, except the pages that set `landmark`. */
export const DEFAULT_LANDMARK = '.mdkp-body';

// The portal front pages render the banner, not .mdkp-body, once the portal's disease group loads.
const FRONT_PAGE_LANDMARK = '.front-top-banner';

// The page throws while rendering when its CMS content is missing; it needs CMS fixtures.
const needsCms = (urls) => `needs CMS fixtures: ${urls}`;

/** @type {Array<{ id: string, path: string, query?: Record<string, string>, landmark?: string, mask?: string[], maxDiff?: number, skip?: string }>} */
export const PAGES = [
  {
    id: 'index',
    path: '/index.html',
    landmark: FRONT_PAGE_LANDMARK,
    skip: needsCms('rest/directcsv, rest/views/news2vueportal, rest/views/a2f_community_kps, reset/views/portal_front'),
  },
  { id: 'phenotype', path: '/phenotype.html', query: { phenotype: 'T2D' } },
  // Once its associations load, the page writes the region's top phenotype into the URL (keys sorted),
  // before or after `load` depending on timing; pinning that phenotype (CHOL here) keeps the URL fixed.
  // Site links to region.html carry a phenotype too (GeneAssociationsTable, HugeScoresTable).
  { id: 'region', path: '/region.html', query: { chr: '1', end: '55100000', phenotype: 'CHOL', start: '55000000' } },
  // rs11591147 as its varId: the form the site's variant links use, and the one the page writes back
  // into its URL once the variant loads (an rsID gets rewritten, before or after `load`).
  { id: 'variant', path: '/variant.html', query: { variant: '1:55505647:G:T' } },
  { id: 'gene', path: '/gene.html', query: { gene: 'PCSK9' } },
  { id: 'datasets', path: '/datasets.html' },
  { id: 'dinspector', path: '/dinspector.html' },
  { id: 'downloads', path: '/downloads.html' },
  { id: 'policies', path: '/policies.html' },
  { id: 'about', path: '/about.html' },
  { id: 'collaborate', path: '/collaborate.html', skip: needsCms('rest/views/collaborate, reset/views/portal_front') },
  { id: 'resources', path: '/resources.html' },
  { id: 'publications', path: '/publications.html' },
  { id: 'news', path: '/news.html' },
  { id: 'contacts', path: '/contacts.html', skip: needsCms('rest/views/contacts, reset/views/portal_front') },
  { id: 'kplab', path: '/kplab.html' },
  { id: 'apis', path: '/apis.html', skip: needsCms('rest/views/apis, reset/views/portal_front') },
  { id: 'epigeneticdatasets', path: '/epigeneticdatasets.html' },
  { id: 'epigenomicdatasets', path: '/epigenomicdatasets.html' },
  { id: 'ampt2dpartnership', path: '/ampt2dpartnership.html' },
  { id: 'effectorgenes', path: '/effectorgenes.html' },
  { id: 'eglmethod', path: '/method.html' },
  { id: 'hugecalculator', path: '/hugecalculator.html' },
  { id: 'genesifter', path: '/genesifter.html' },
  { id: 'signalsifter', path: '/signalsifter.html' },
  { id: 'complicationsviewer', path: '/complicationsviewer.html' },
  { id: 'page404', path: '/404.html' },
  { id: 'gait', path: '/gait.html' },
  { id: 'gait2', path: '/ncgait.html' },
  { id: 'project', path: '/project.html' },
  { id: 'variantsearch', path: '/variantsearch.html' },
  // pageid from LigerBrowser's documentation link.
  {
    id: 'research',
    path: '/research.html',
    query: { pageid: 'kp_liger_documentation' },
    skip: needsCms('view/rest/get_research_page_access, reset/views/portal_front'),
  },
  { id: 'egggenerator', path: '/egggenerator.html' },
  { id: 'help', path: '/help.html' },
  // tissue from the c2ct-annotation links on phenotype.html?phenotype=T2D (C2ctTable).
  {
    id: 'tissue',
    path: '/tissue.html',
    query: { tissue: 'adipose_tissue' },
    skip:
      'loads a single-cell fields.json.gz from bioindex-dev.hugeamp.org that is ~160-220 MB decoded; ' +
      'replaying a body that size through route.fulfill disconnects Chromium',
  },
  // With no phenotype the page writes its default trait group into the URL after it loads.
  { id: 'pigeangraph', path: '/pigeangraph.html', query: { traitGroup: 'portal' } },
  { id: 'pigean_index', path: '/pigean/index.html', landmark: FRONT_PAGE_LANDMARK },
  // gene + suffix as PigeanTable links them; genesetSize and traitGroup are the defaults the page writes back.
  { id: 'pigean_gene', path: '/pigean/gene.html', query: { gene: 'PCSK9', genesetSize: 'mouse_msigdb', traitGroup: 'all_but_hpo' } },
  // geneset from the PigeanTable links on pigean/phenotype.html (default phenotype T2D).
  {
    id: 'pigean_geneset',
    path: '/pigean/geneset.html',
    query: { geneset: 'mp_impaired_glucose_tolerance', genesetSize: 'mouse_msigdb', traitGroup: 'all_but_hpo' },
  },
  { id: 'pigean_phenotype', path: '/pigean/phenotype.html' },
  // The "Mechanism Graph" link on pigean/phenotype.html (default phenotype T2D), keys in the sorted
  // order the page writes back.
  { id: 'network_graph', path: '/pigean/network_graph.html', query: { genesetSize: 'mouse_msigdb', phenotype: 'T2D' } },
  { id: 'factorization', path: '/factorization.html' },
  { id: 'cvdi_pigean_index', path: '/cvdi_pigean/index.html', landmark: FRONT_PAGE_LANDMARK },
  // gene from the cvdi_pigean/index.html search examples. CVDI data (cvdi.hugeampkpnbi.org) is not a
  // live host, so the CVDI pages render without it.
  { id: 'cvdi_pigean_gene', path: '/cvdi_pigean/gene.html', query: { gene: 'PLAU' } },
  // CVDI's own gene set values come from cvdi.hugeampkpnbi.org; this one is from the PIGEAN gene set links.
  { id: 'cvdi_pigean_geneset', path: '/cvdi_pigean/geneset.html', query: { geneset: 'mp_impaired_glucose_tolerance' } },
  // phenotype from the cvdi_pigean/index.html phenotype search, which offers the KP phenotypes.
  {
    id: 'cvdi_pigean_phenotype',
    path: '/cvdi_pigean/phenotype.html',
    query: { phenotype: 'T2D' },
    skip: 'needs cvdi.hugeampkpnbi.org (pigean/phenotypes/phenotypes_with_labels.tsv), which is not a live host',
  },
  { id: 'liger', path: '/liger.html' },
  { id: 'pigean_method', path: '/pigean-method.html', landmark: '.pigean-method-page' },
  { id: 'eaggl', path: '/EAGGL.html' },
  // The GP2 browser workspace, rendered once the session's phenotypes load.
  { id: 'gp2browser', path: '/gp2browser.html', landmark: '.kp-variant-sifter-workspace' },
  { id: 'pegasus', path: '/pegasus.html' },
  { id: 'bottomline', path: '/bottom-line.html' },
  { id: 'birds', path: '/birds.html' },
  { id: 't2d_assays', path: '/t2d_assays.html' },
];

/** The page path plus its URL-encoded query, if any. */
export function pageUrl(entry) {
  const search = new URLSearchParams(entry.query ?? {}).toString();
  return search ? `${entry.path}?${search}` : entry.path;
}
