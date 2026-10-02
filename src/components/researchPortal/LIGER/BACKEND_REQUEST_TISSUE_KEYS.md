# Request: make tissue identity resolvable from the API

**Ask:** two additive changes to the existing `gene-program-*` indexes, so the portal front end can
stop maintaining its own tissue → dataset mapping. No new endpoints needed.

## Why

The front end currently hardcodes a table of 9 tissues with their dataset IDs per portal, plus logic
to sniff which of two argument conventions each endpoint expects. Consequences today:

- Adding a tissue, onboarding a portal, or bumping a pipeline version (`v2.2` → `v3.2`) requires a
  front-end release.
- Endpoints disagree on whether argument 1 is a tissue key or a dataset ID, and nothing declares
  which. Guessing wrong returns **HTTP 500**, so a mismatch is an outage rather than an empty result.
- The portal has to infer a tissue's dataset ID by watching which ID appears in responses.

Both requests below are backward compatible — existing queries keep working, so they can ship
independently and we migrate after.

---

## Request 1 — accept the tissue key as argument 1, everywhere

Where an endpoint takes a dataset ID as its first argument, please **also** accept the tissue key and
resolve it server-side. Dataset IDs must keep working unchanged.

Some of this already exists: hugeamp serves `gene-program-expression-cell-type?q=pancreas,INS` today.
The request is to make that true for every endpoint on every portal.

| Endpoint | Argument 1 today | Should also accept |
|---|---|---|
| `gene-program-expression-cell-type` | tissue key **or** dataset ID, varies by portal | tissue key |
| `gene-program-expression-cell-state` (3-arg) | tissue key **or** dataset ID, varies by portal | tissue key |
| `gene-program-heatmap` | tissue key **or** dataset ID, varies by portal | tissue key |
| `gene-program-cell-state-trait-factor` | tissue key **or** dataset ID, varies by portal | tissue key |
| `gene-program-expression-program` (4-arg) | dataset ID | tissue key |
| `gene-program-factor` | dataset ID | tissue key |
| `gene-program-gene-factor` | dataset ID | tissue key |
| `gene-program-gene-set-factor` | dataset ID | tissue key |
| `gene-program-qc-factor` | dataset ID | tissue key |
| `gene-program-trait-factor` | dataset ID | tissue key |

`gene-program-cell-state-metadata` / `-extended` are already tissue-keyed on every portal — no change.

**Resolution rule:** within a single portal, tissue → dataset is 1:1, so this is a lookup rather than
a policy decision. If a portal ever serves more than one dataset for a tissue, resolve to that
portal's current/default dataset; passing the dataset ID explicitly stays the way to pin a specific
one.

**Acceptance:** for every endpoint above, on every portal, these two return the same rows:

```
gene-program-factor?q=vat,adipocyte,mouse_msigdb
gene-program-factor?q=FNIH_VAT_scRNA_v2.2,adipocyte,mouse_msigdb
```

---

## Request 2 — report tissue and dataset on every row

Please include these three fields on every row of every `gene-program-*` endpoint, with one
consistent spelling:

| Field | Type | Example | Purpose |
|---|---|---|---|
| `tissue` | string, the canonical key | `vat` | attribute a row to a tissue without a reverse lookup |
| `tissue_label` | string, display name | `VAT` | the only reason we currently store labels client-side |
| `dataset` | string, the dataset actually queried | `FNIH_VAT_scRNA_v2.2` | name the source, and join to `single_cell_all_metadata/dataset_metadata.json.gz` |

Today some responses carry `tissue`, others carry only `dataset`, and the spellings vary — the client
probes `["tissue_label", "tissue"]` and `["dataset_id", "dataset"]` to cope. **One spelling each,
always present**, is what matters here; if `dataset_id` is the established name, we will use that
instead, just consistently.

`dataset` is requested even though Request 1 means we no longer need it to *query* — we still need it
to tell the user which dataset they are looking at and to link to the single-cell browser.

**Acceptance:** every row of every `gene-program-*` response carries all three fields, non-empty, on
every portal.

---

## What we retire on our side

The hardcoded 9-tissue table and its reverse index, the keying detection, and the dataset-ID
observation logic — about 150 lines, plus the README section documenting the traps in it.

## Open questions for you

1. **Is tissue → dataset 1:1 on every portal today?** We assume yes and that the multi-ID case in our
   table only exists because it spans portals. If any portal serves two datasets for one tissue, we
   need to know how Request 1 should resolve it.
2. **Preferred field spellings** — `dataset` vs `dataset_id`, `tissue` vs `tissue_key`. We will match
   whatever you pick; we only need it to be the same everywhere.
3. **Is there a canonical tissue key list**, or are keys derived from dataset IDs? If a tissue's key
   could change, that affects shareable links, which currently carry `?tissue=vat`.

## Not requested

A tissue dictionary index (e.g. `gene-program-tissue?q=1`) would be nice but is **not needed** — with
Request 2, we learn the tissue list and labels from the gene-level response we already fetch. Only
worth building if something needs the portal's tissue list before a gene is selected.
