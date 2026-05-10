// Allowlist of CMS resources the SysBio portal depends on at runtime.
// fetch-cmsdata.js downloads each of these at build time and writes
// the result under public/cmsdata/.
//
// When adding a new getTextContent("...") slug, a new news_list project,
// or a new directcsv id, add it here. The fetch script will refuse to
// build if a literal hugeampkpncms.org slug is found in source that
// isn't represented below.

module.exports = {
    byor_content: [
        // Per-page documentation
        "sysbio_GWAS",
        "sysbio_singlecell",
        "sysbiofairplex_geneexpressionbrowser",
        "sysbio_data_summary",
        // Enrichr libraries definition (Comparator, BulkBrowser)
        "matkp_enrichrlibraries",
        // About view: fallback + sysbiofairplex_<page> for every page key
        // listed in src/portals/SysBio/views/About/main.js -> data().pages
        "sysBio_help",
        "sysbiofairplex_contact",
        "sysbiofairplex_collaborate",
        "sysbiofairplex_people",
        "sysbiofairplex_policies",
        "sysbiofairplex_aboutus",
        "sysbiofairplex_howtoaccessampdatadirectly",
        "sysbiofairplex_glossary",
        "sysbiofairplex_ampdata",
        "sysbiofairplex_harmonization",
        "sysbiofairplex_sharefeedback",
        "sysbiofairplex_datasets",
    ],
    news_list: ["sysbio"],
    directcsv: ["sysbio_data_summary"],
    // Asset paths referenced outside fetched JSON (e.g. public/sysbio_style_template.html).
    // The crawler discovers /sites/default/files/ URLs embedded in fetched JSON
    // automatically; this list covers the ones it can't see from outside.
    extraAssets: [
        "/sites/default/files/images/sysbio/logos/sb-color-icon.svg",
        "/sites/default/files/images/sysbio/logos/sb-color-h.svg",
        "/sites/default/files/images/sysbio/logos/sb-white-v.svg",
    ],
};
