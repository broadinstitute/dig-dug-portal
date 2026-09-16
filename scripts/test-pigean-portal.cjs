/* Run with: node --test scripts/test-pigean-portal.cjs */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const babel = require("@babel/core");
const root = path.resolve(__dirname, "..");

function load(relative, globals = {}) {
  const filename = path.join(root, relative);
  const code = babel.transformSync(fs.readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      [
        "@babel/preset-env",
        { targets: { node: "current" }, modules: "commonjs" },
      ],
    ],
  }).code;
  const module = { exports: {} };
  vm.runInNewContext(
    code,
    {
      exports: module.exports,
      module,
      require,
      document: { cookie: "session=do-not-send-this-to-public-hosts" },
      console,
      ...globals,
    },
    { filename }
  );
  return module.exports;
}
const utils = load("src/utils/pigeanPortalUtils.js");
const plain = (value) => JSON.parse(JSON.stringify(value));
const page = (data) => ({ ok: true, status: 200, json: async () => data });

test("different hosts use their own positional keys", () => {
  assert.deepEqual(
    plain(utils.queryKeys(utils.modelFor("cfde-inc-v2"), "trait", "T2D")),
    ["T2D", "cfde-inc-v2"]
  );
  assert.deepEqual(
    plain(utils.queryKeys(utils.modelFor("small"), "trait", "T2D")),
    ["T2D", 2, "small"]
  );
  assert.deepEqual(
    plain(
      utils.queryKeys(utils.modelFor("large"), "across", "IRS2", {
        group: "portal",
      })
    ),
    ["portal", "IRS2", 2, "large"]
  );
  assert.throws(
    () => utils.queryKeys(utils.modelFor("small"), "trait", "T2D,large"),
    /exact identifier/
  );
  assert.throws(() => utils.modelFor("unknown"), /Unknown model/);
});

test("normalization keeps library, factor label, zero and missing values distinct", () => {
  const [row] = utils.normalizeRows(
    [
      {
        gene_set: "SET",
        source: "lincs",
        label: "factor label",
        beta: 0,
        beta_uncorrected: "1.2",
        weight: null,
      },
    ],
    "gene_set"
  );
  assert.equal(row.library, "lincs");
  assert.equal(row.factorLabel, "factor label");
  assert.equal(row.beta, 0);
  assert.equal(row.beta_uncorrected, 1.2);
  assert.equal(row.combined, null);
  assert.equal(row.weight, null);
});

test("fuzzy lookup preserves original canonical keys and ranking", () => {
  assert.ok(
    utils.fuzzyScore("IRS2", "IRS2") > utils.fuzzyScore("IRS2", "IRS2-AS1")
  );
  assert.ok(utils.fuzzyScore("T2D", "T2D") > utils.fuzzyScore("T2D", "xT2D"));
  const traits = [
    {
      id: "gcat_trait_Orofacial_cleft",
      name: "Orofacial cleft",
      models: ["cfde-inc-v2"],
      portal_id: "P:1",
    },
  ];
  assert.equal(
    utils.rankTraits(traits, "orofcl", "cfde-inc-v2")[0].id,
    "gcat_trait_Orofacial_cleft"
  );
});

test("comparison uses competition ranks, average-rank Spearman, and B minus A", () => {
  const a = [
    { id: "x", score: 10 },
    { id: "y", score: 10 },
    { id: "z", score: 2 },
    { id: "missing", score: null },
  ];
  const b = [
    { id: "x", score: 2 },
    { id: "y", score: 2 },
    { id: "z", score: 10 },
    { id: "other", score: 0 },
  ];
  const comparison = utils.compareResults(a, b, "score", 0);
  assert.equal(comparison.rows.find((row) => row.id === "z").aRank, 3);
  assert.equal(comparison.rows.find((row) => row.id === "x").delta, -8);
  assert.equal(comparison.rows.find((row) => row.id === "other").a, null);
  assert.equal(comparison.rows.find((row) => row.id === "other").b, 0);
  assert.equal(comparison.summary.n, 3);
  assert.equal(comparison.summary.spearman, -1);
  assert.deepEqual(plain(utils.averageRanks([2, 2, 10])), [1.5, 1.5, 3]);
});

test("top-N union correlation only includes paired scores and reports overlap separately", () => {
  const a = [
    { id: "a", score: 5 },
    { id: "b", score: 4 },
  ];
  const b = [
    { id: "b", score: 8 },
    { id: "c", score: 9 },
  ];
  const result = utils.compareResults(a, b, "score", 1);
  assert.equal(result.summary.n, 0);
  assert.equal(result.summary.overlap, 0);
  assert.equal(result.summary.jaccard, 0);
  assert.equal(result.summary.pearson, null);
  assert.equal(utils.pearson([1, 1], [2, 3]), null);
  assert.throws(
    () => utils.compareResults([...a, a[0]], b, "score"),
    /multiple rows/
  );
});

test("complete transport stays on the chosen host, omits total caps and public credentials", async () => {
  const calls = [];
  const responses = [
    page({
      data: [{ gene: "A" }],
      continuation: "next & opaque",
      progress: { bytes_read: 3, bytes_total: 9 },
    }),
    page({
      data: [{ gene: "B" }],
      continuation: null,
      progress: { bytes_read: 6, bytes_total: 6 },
    }),
  ];
  const api = load("src/utils/bioIndexUtils.js", {
    fetch: async (...args) => {
      calls.push(args);
      return responses.shift();
    },
  });
  const result = await api.queryComplete("genes", "T2D,model", {
    host: "https://source.test",
    publicRequest: true,
  });
  assert.equal(result.data.length, 2);
  assert.equal(result.pages, 2);
  assert.ok(calls.every(([url]) => url.startsWith("https://source.test/")));
  assert.ok(calls.every(([url]) => !url.includes("limit=")));
  assert.equal(Object.keys(calls[0][1].headers).length, 0);
  assert.equal(new URL(calls[1][0]).searchParams.get("token"), "next & opaque");
});

test("failed continuation rejects rather than returning partial rows or looping", async () => {
  let count = 0;
  const api = load("src/utils/bioIndexUtils.js", {
    fetch: async () =>
      ++count === 1
        ? page({ data: [{ gene: "A" }], continuation: "next" })
        : { ok: false, status: 503 },
  });
  await assert.rejects(
    api.queryComplete("genes", "T2D", { host: "https://source.test" }),
    /503/
  );
  assert.equal(count, 2);
});

test("complete transport rejects repeated tokens, restricted and silently capped responses", async () => {
  for (const [response, expected] of [
    [{ data: [], continuation: "repeat" }, /Repeated continuation/],
    [{ data: [], restricted: true }, /restricted/],
    [
      {
        data: [1],
        continuation: null,
        progress: { bytes_read: 2, bytes_total: 10 },
      },
      /Incomplete/,
    ],
    [{ error: "bad response" }, /Invalid response/],
  ]) {
    const api = load("src/utils/bioIndexUtils.js", {
      fetch: async () => page(response),
    });
    await assert.rejects(
      api.queryComplete("genes", "T2D", { host: "https://source.test" }),
      expected
    );
  }
});

test("empty complete responses remain distinct from a source failure", async () => {
  const api = load("src/utils/bioIndexUtils.js", {
    fetch: async () =>
      page({ data: [], progress: { bytes_read: 0, bytes_total: 0 } }),
  });
  const result = await api.queryComplete("genes", "T2D", {
    host: "https://source.test",
  });
  assert.equal(result.data.length, 0);
  assert.equal(result.complete, true);
});

test("source fixture is complete, normalized without fabrication, and useful for comparison", () => {
  const data = JSON.parse(
    fs.readFileSync(path.join(root, "public/pigean/registry/cfde-t2d.json"))
  );
  assert.equal(data.genes.data.length, 18321);
  assert.equal(data.geneSets.data.length, 5000);
  const genes = utils.normalizeRows(data.genes.data, "gene");
  assert.equal(genes[0].gene, "LEP");
  assert.equal(genes[0].combined, 11.5);
  assert.equal(genes[0].huge_score, null);
  const comparison = utils.compareResults(genes, genes, "combined", 100);
  assert.ok(Math.abs(comparison.summary.pearson - 1) < 1e-12);
  assert.ok(Math.abs(comparison.summary.spearman - 1) < 1e-12);
  assert.equal(comparison.summary.jaccard, 1);
});

test("Markdown uses the requested media order and resolved manuscript numbers", () => {
  const dir = path.join(root, "public/pigean/content");
  const doc = fs.readFileSync(path.join(dir, "documentation.md"), "utf8");
  const sources = [...doc.matchAll(/<source src="\.\/media\/([^"]+)"/g)].map(
    (match) => match[1]
  );
  assert.deepEqual(sources, [
    "regularization.webm",
    "set_regularization.webm",
    "pigean_model.webm",
    "support_decomposition.webm",
  ]);
  sources.forEach((file) =>
    assert.ok(fs.statSync(path.join(dir, "media", file)).size > 0)
  );
  const abstract = fs.readFileSync(path.join(dir, "abstract.md"), "utf8");
  assert.ok(!abstract.includes("{{"));
  assert.ok(abstract.includes("144,627"));
  assert.ok(abstract.includes("295,547"));
  assert.ok(abstract.includes("pigean-figure-1.png"));
  assert.ok(doc.includes("](#explorer)"));
});

test("gene-set highlights use phenotype and model scoped joined records and cache each selection separately", async () => {
  const calls = [];
  const api = load("src/utils/pigeanPortalApi.js", {
    require: (name) => {
      if (name === "./pigeanPortalUtils") return utils;
      if (name === "./bioIndexUtils")
        return {
          queryComplete: async (index, q, options) => {
            calls.push({ index, q, host: options.host });
            const [trait, id, ...rest] = q.split(",");
            const model = rest.at(-1);
            return {
              data: [
                {
                  phenotype: trait,
                  gene_set: id,
                  gene_set_size: model,
                  gene: "IRS2",
                  prior: 0,
                  combined: 3,
                },
              ],
              source: options.host,
            };
          },
        };
      return require(name);
    },
  });
  const cfde = await api.loadContext("cfde-inc-v2", "T2D", "gene_set", "SET_A");
  assert.equal(cfde.rows[0].id, "IRS2");
  assert.equal(cfde.rows[0].prior, 0);
  assert.equal(cfde.rows[0].log_bf, null);
  assert.equal(
    await api.loadContext("cfde-inc-v2", "T2D", "gene_set", "SET_A"),
    cfde
  );
  await api.loadContext("small", "T2D", "gene_set", "SET_A");
  await api.loadContext("cfde-inc-v2", "BMI", "gene_set", "SET_A");
  assert.deepEqual(calls, [
    {
      index: "pigean-joined-gene-set",
      q: "T2D,SET_A,cfde-inc-v2",
      host: "https://cfde-dev.hugeampkpnbi.org",
    },
    {
      index: "pigean-joined-gene-set",
      q: "T2D,SET_A,2,small",
      host: "https://bioindex.hugeamp.org",
    },
    {
      index: "pigean-joined-gene-set",
      q: "BMI,SET_A,cfde-inc-v2",
      host: "https://cfde-dev.hugeampkpnbi.org",
    },
  ]);
});

test("relationships from the wrong selection are rejected and are never cached", async () => {
  for (const mismatch of [
    { phenotype: "BMI" },
    { gene_set_size: "cfde" },
    { gene_set: "OTHER" },
  ]) {
    let wrong = true;
    const api = load("src/utils/pigeanPortalApi.js", {
      require: (name) => {
        if (name === "./pigeanPortalUtils") return utils;
        if (name === "./bioIndexUtils")
          return {
            queryComplete: async () => ({
              data: [
                {
                  phenotype: "T2D",
                  gene_set_size: "cfde-inc-v2",
                  gene_set: "SET",
                  gene: "IRS2",
                  ...(wrong ? mismatch : {}),
                },
              ],
            }),
          };
        return require(name);
      },
    });
    await assert.rejects(
      api.loadContext("cfde-inc-v2", "T2D", "gene_set", "SET"),
      /different selection/
    );
    wrong = false;
    assert.equal(
      (await api.loadContext("cfde-inc-v2", "T2D", "gene_set", "SET")).rows[0]
        .id,
      "IRS2"
    );
  }
});

test("phenotype sidecar preserves names, ontology assertions and source provenance", () => {
  const metadata = JSON.parse(
    fs.readFileSync(path.join(root, "public/pigean/registry/phenotypes.json"))
  );
  const registry = JSON.parse(
    fs.readFileSync(path.join(root, "public/pigean/registry/catalog.json"))
  );
  const t2d = utils.phenotypeFor(metadata, "T2D");
  assert.equal(t2d.name, "Type 2 diabetes (T2D)");
  assert.equal(t2d.portal_id, "PORTAL:0000398");
  assert.equal(t2d.mappings.length, 6);
  assert.equal(t2d.trait_group, "metabolic");
  assert.equal(t2d.gwas_source_category, "portal");
  const efo = t2d.mappings.find((m) => m.target_id === "EFO:0004468");
  assert.equal(efo.predicate, "skos:broadMatch");
  assert.equal(efo.confidence, 0.7);
  assert.equal(efo.justification, "manual_curation");
  assert.equal(efo.source, "broad EFO parent assignment by display_group");
  assert.equal(metadata.source.sha256, registry.sources.phenotypesSha256);
  assert.equal(
    Object.keys(metadata.phenotypes).length,
    metadata.coverage.phenotypes
  );
  assert.equal(
    Object.values(metadata.phenotypes).reduce(
      (n, p) => n + p.mappings.length,
      0
    ),
    metadata.coverage.mappings
  );
  assert.equal(
    utils.phenotypeName(metadata, "Orphanet_100031"),
    "Hypoplastic amelogenesis imperfecta"
  );
  assert.equal(
    utils.phenotypeName(metadata, "unmapped-trait"),
    "unmapped-trait"
  );
  assert.equal(utils.phenotypeFor(metadata, "t2d"), null);
  const variant = "gcat_trait_C-reactive_protein_measurement";
  assert.equal(metadata.lookup[variant].match, "gcat_hyphen_variant");
  assert.ok(utils.phenotypeFor(metadata, variant).name.includes("C-reactive"));
  assert.equal(registry.traits.find((row) => row.id === variant).id, variant);
});

test("phenotype discovery and cross-trait filters accept ontology and portal identifiers", () => {
  const metadata = JSON.parse(
    fs.readFileSync(path.join(root, "public/pigean/registry/phenotypes.json"))
  );
  const registry = JSON.parse(
    fs.readFileSync(path.join(root, "public/pigean/registry/catalog.json"))
  );
  for (const query of ["MONDO:0005148", "PORTAL:0000398", "Type 2 diabetes"]) {
    const ranked = utils.rankTraits(registry.traits, query, "cfde-inc-v2");
    assert.ok(
      ranked.some((row) => row.id === "T2D"),
      query
    );
    assert.ok(
      utils.phenotypeSearchText(metadata, "T2D").includes(query.toLowerCase()),
      query
    );
  }
});

test("ontology links preserve namespaces and do not turn arbitrary input into a URL", () => {
  assert.equal(
    utils.ontologyUrl("MESH:D003924"),
    "https://meshb.nlm.nih.gov/record/ui?ui=D003924"
  );
  assert.equal(
    utils.ontologyUrl("ORPHANET:100031"),
    "https://www.orpha.net/en/disease/detail/100031"
  );
  assert.equal(
    utils.ontologyUrl("ICD10CM:E11"),
    "https://bioregistry.io/ICD10CM%3AE11"
  );
  assert.ok(utils.ontologyUrl("MONDO:0005148").endsWith("q=MONDO%3A0005148"));
  assert.equal(utils.mappingRelation("skos:broadMatch"), "Broader match");
  for (const invalid of [
    null,
    "",
    "javascript:alert(1)",
    "https://example.org",
    'HP:1" onmouseover="alert(1)',
  ])
    assert.equal(utils.ontologyUrl(invalid), null);
});

test("HPO traits are excluded without dropping HPO mappings of other phenotypes", () => {
  const metadata = JSON.parse(
    fs.readFileSync(path.join(root, "public/pigean/registry/phenotypes.json"))
  );
  const mapped = utils.phenotypeFor(
    metadata,
    "gcat_trait_type_2_diabetes_mellitus"
  );
  assert.ok(
    mapped.mappings.some((mapping) => mapping.target_id.startsWith("HP:"))
  );
  const traits = [
    {
      id: "T2D",
      name: "Type 2 diabetes",
      models: [],
      mappings: [{ target_id: "HP:0005978" }],
    },
    {
      id: "HP_0008291_Pituitary_corticotropic_cell_adenoma",
      name: "Pituitary adenoma",
      models: [],
    },
    { id: "other", name: "Other", group: "hpo", models: [] },
  ];
  assert.deepEqual(
    plain(utils.rankTraits(traits, "", "small").map((row) => row.id)),
    ["T2D"]
  );
  assert.equal(utils.isHpoTrait({ phenotype: "HP:0008291" }), true);
  assert.equal(
    utils.isHpoTrait({ phenotype: "T2D", trait_group: "portal" }),
    false
  );
});

test("cross-trait requests skip the HPO group and remove HPO rows from mixed responses", async () => {
  const calls = [];
  const api = load("src/utils/pigeanPortalApi.js", {
    require: (name) => {
      if (name === "./pigeanPortalUtils") return utils;
      if (name === "./bioIndexUtils")
        return {
          queryComplete: async (index, q) => {
            calls.push(q);
            return {
              data: [
                { phenotype: "T2D", trait_group: "portal", gene: "LEP" },
                {
                  phenotype: "HP_0008291_Pituitary_corticotropic_cell_adenoma",
                  gene: "LEP",
                },
                {
                  phenotype: "opaque-hpo-key",
                  trait_group: "hpo",
                  gene: "LEP",
                },
              ],
            };
          },
        };
      return require(name);
    },
  });
  const rows = await api.loadAcross("large", "gene", "LEP");
  assert.equal(calls.length, 4);
  assert.ok(calls.every((q) => !q.startsWith("hpo,")));
  assert.ok(rows.every((row) => row.phenotype === "T2D"));
  const cfde = await api.loadAcross("cfde-inc-v2", "gene", "LEP");
  assert.equal(cfde.length, 1);
  await assert.rejects(
    api.loadResult("large", "HP_0008291_Pituitary_corticotropic_cell_adenoma"),
    /HPO traits are excluded/
  );
});

test("default support thresholds are inclusive and exclude missing scores", () => {
  const rows = [
    { id: "boundary", log_bf: 0, combined: 1, prior: 1 },
    { id: "negative-direct", log_bf: -0.1, combined: 2, prior: 2.1 },
    { id: "low-combined", log_bf: 2, combined: 0.99, prior: -1.01 },
    { id: "negative-indirect", log_bf: 2, combined: 1, prior: -1 },
    { id: "missing-direct", log_bf: null, combined: 2, prior: 2 },
    { id: "missing-combined", log_bf: 0, combined: null, prior: 2 },
  ];
  assert.deepEqual(
    plain(utils.filterGenesBySupport(rows).map((row) => row.id)),
    ["boundary", "negative-indirect"]
  );
  assert.equal(
    utils.filterGenesBySupport(rows, { log_bf: "", combined: "", prior: "" })
      .length,
    rows.length
  );
  assert.deepEqual(
    plain(
      utils
        .filterGenesBySupport(rows, { log_bf: 0, combined: 1, prior: 0 })
        .map((row) => row.id)
    ),
    ["boundary"]
  );
});

test("default CFDE gene view is smaller without dropping the full cached source fixture", () => {
  const data = JSON.parse(
    fs.readFileSync(path.join(root, "public/pigean/registry/cfde-t2d.json"))
  );
  const genes = utils.normalizeRows(data.genes.data, "gene");
  assert.equal(utils.filterGenesBySupport(genes).length, 924);
  assert.equal(genes.length, 18321);
  assert.equal(
    utils.filterGenesBySupport(genes, { log_bf: "", combined: "", prior: "" })
      .length,
    18321
  );
});
