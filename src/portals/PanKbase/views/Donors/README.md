# Donors View Overview

This folder contains the PanKbase `Donors` page implementation. The page loads a donor metadata dataset, infers column types, and presents the data through:

- a filter sidebar
- a donor availability plot
- a pageable/exportable donor table
- a donor snapshot summary comparing the full cohort to donors with assay data

The page is built as a Vue 2 multi-file view with `main.js` as the entrypoint and `Template.vue` as the main page controller.

## High-Level Data Flow

1. `main.js` boots the page, loads CMS/content HTML, and fetches the donor metadata dataset.
2. `donorDataset.js` defines the default donor metadata source and delegates loading.
3. `datasetUtils.js` fetches raw data, detects the file format, parses rows, and infers column metadata.
4. `Template.vue` consumes the prepared dataset and drives the interactive page UI.
5. `DonorSnapshot.vue` derives donor-level rollups from the dataset for a compact summary view.

## File Responsibilities

### `main.js`

Entrypoint for the Donors page.

- mounts the Vue app
- loads page content with `getPankbaseContent`
- loads donor metadata with `loadDonorDataset`
- stores page-level loading/error state
- exposes page-level config such as `donorTableConfig`

This file is intentionally thin. Most page behavior lives in `Template.vue`.

### `Template.vue`

Primary page container and controller. This is the main file to inspect for most feature work.

Responsibilities:

- renders page content, loading states, and dataset states
- manages selected table columns and the column picker modal
- builds numeric and categorical filter state from inferred dataset columns
- applies filters to rows and generates filter pills
- renders the donor availability plot and legend
- creates scoped table tabs for selected data-type/group combinations
- renders the main data table and per-scope tables
- handles chart export/download behavior
- passes `preparedDataset` into `DonorSnapshot.vue`

Key patterns:

- Filter availability is coupled to `selectedColumns`
- Plot and scoped tables are based on `filteredRows`
- Several helper methods here are dataset-shape-specific, especially around donor IDs and availability parsing

### `DonorSnapshot.vue`

Compact donor summary component shown below the main dataset UI.

Responsibilities:

- converts row-level data into donor-level records
- deduplicates repeated donor rows by donor accession/ID
- normalizes and resolves core donor attributes:
  - diabetes status
  - age
  - BMI
  - sex
  - collections
  - assay/data-type availability
- renders a side-by-side comparison of:
  - all donors
  - donors with assay data
- builds categorical micro-bar cards and numeric histogram cards
- shows skeleton loading UI until a dataset is available

This file is the main edit point for “donor snapshot” changes.

### `datasetUtils.js`

Generic tabular dataset preparation utilities used by this page.

Responsibilities:

- loads raw data from a URL, blob/file, or raw text object
- detects whether the payload is JSON or delimited text
- parses delimited text into row objects
- normalizes cell values
- infers column types and tags
- exposes `prepareDataset()` and `parseNumericValue()`

Important outputs:

- `rows`
- `columns`
- inferred metadata such as `inferredType`, `tags`, and numeric stats

### `donorDataset.js`

Very small dataset loader wrapper for this view.

- defines `DEFAULT_DONOR_METADATA_SOURCE`
- exports `loadDonorDataset()`

If the donor metadata source changes, this is the first file to update.

### `NumericRangeFilter.vue`

Reusable numeric filter card used by `Template.vue`.

Responsibilities:

- displays a compact histogram/sparkline for numeric values
- provides dual range-slider controls
- supports direct min/max text input
- emits updated numeric range filters through `v-model`

This component expects sorted numeric values and does not fetch or infer data on its own.

### `CategoricalFilter.vue`

Reusable categorical filter card used by `Template.vue`.

Responsibilities:

- renders selectable categorical options with counts
- supports “All” and “None” quick actions
- emits updated selected values through `v-model`

This component is presentation-oriented; option counting is prepared upstream in `Template.vue`.

### `BarPlotD3.vue`

D3-based chart renderer used for the donor availability plot.

Responsibilities:

- renders the horizontal bar plot for donor counts by data type
- supports grouped/stacked series
- handles sizing, axes, labels, and coloring

This is the main chart primitive for the availability plot, while `Template.vue` owns the plot data preparation and surrounding UI.

### `TableConfigButton.vue`

Small configuration helper for table columns.

Responsibilities:

- presents table config controls when `configure` mode is enabled
- emits updated column configuration back to `Template.vue`

The page currently uses it for column label/show-on-load settings.

## Common Edit Entry Points

Use this as a quick shortcut when returning later:

- Snapshot card/content/layout changes: `DonorSnapshot.vue`
- Filter behavior or table behavior: `Template.vue`
- Availability plot behavior or scoped table tabs: `Template.vue`
- Dataset source changes: `donorDataset.js`
- Parsing/type inference changes: `datasetUtils.js`
- Numeric filter control behavior: `NumericRangeFilter.vue`
- Categorical filter UI behavior: `CategoricalFilter.vue`

## Coupling Notes

There are a few important implementation details to remember:

- `Template.vue` and `DonorSnapshot.vue` each contain their own helper logic for finding columns and parsing availability-like fields.
- The main page works from row-level data; the snapshot works from donor-level rollups.
- Filters are generated only from currently selected columns, which means column visibility changes the filter sidebar.
- The availability plot and its dynamic “See table” tabs reflect the currently filtered dataset, not the raw dataset.

## Recommended Re-Ramp Checklist

If revisiting this folder in a later session, the fastest path is usually:

1. Read this `README.md`
2. Open `main.js`
3. Open `Template.vue`
4. Open `DonorSnapshot.vue`
5. Only then inspect supporting components if the task touches filters, charts, or column config
