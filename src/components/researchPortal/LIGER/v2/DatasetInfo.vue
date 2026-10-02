<script>
import Vue from "vue";

// The source-data tab: metadata for the single-cell dataset the programs in the
// canvas were generated from.
//
// Presentational. The parent fetches `dataset_metadata.json.gz`, matches the row on
// dataset ID and passes the matched row in.
//
// Fields are rendered only when present. The metadata file covers every single-cell
// dataset the portal has and the rows are not uniform, so an empty field is normal
// -- printing a label with nothing after it would read as missing data rather than
// as a field this dataset does not carry.
export default Vue.component("DatasetInfo", {
    props: {
        // one row from the metadata file, or null when nothing matched
        dataset: {
            type: Object,
            default: null
        },
        // the dataset ID we looked for, shown when the lookup found nothing
        datasetId: {
            type: String,
            default: ""
        },
        // resolved single-cell browser link, or "" when not configured
        browserUrl: {
            type: String,
            default: ""
        },
        loading: {
            type: Boolean,
            default: false
        },
        error: {
            type: String,
            default: ""
        },
        // [{ key, label, expressionText, expressionRawText, selected }], already
        // sorted strongest expression first by the parent.
        cellTypes: {
            type: Array,
            default: () => []
        },
        // Named in the section heading, because the column is this gene's reading in
        // each cell type rather than a property of the cell type.
        cellTypeGene: {
            type: String,
            default: ""
        },
        loadingCellTypes: {
            type: Boolean,
            default: false
        },
        cellTypeError: {
            type: String,
            default: ""
        }
    },

    computed: {
        // Left column: what the dataset is.
        summaryText() {
            return this.value("summary");
        },

        authorsText() {
            return this.joined("authors");
        },

        // Right columns: the facts, as label/value pairs so the markup does not
        // repeat once per field.
        provenanceFields() {
            return this.presentFields([
                ["Dataset ID", this.value("datasetId")],
                ["Species", this.value("species")],
                ["Tissue", this.value("tissue")],
                ["Donors", this.count("totalDonors")],
                ["Samples", this.count("totalSamples")]
            ]);
        },

        methodFields() {
            return this.presentFields([
                ["Data type", this.value("data_type")],
                ["Method", this.value("method")],
                ["Assay", this.joined("assay")],
                ["Contact", this.value("contact")],
                ["Email", this.value("email")]
            ]);
        },

        hasAnyFields() {
            return this.provenanceFields.length > 0 || this.methodFields.length > 0;
        },

        // Rendered whenever there is anything to say -- including an error or a
        // finished-but-empty fetch, because "this dataset reported no cell types"
        // is a fact about the source data and hiding the section would make it
        // indistinguishable from a section that was never built.
        showCellTypes() {
            return this.cellTypes.length > 0 || this.loadingCellTypes || !!this.cellTypeError;
        }
    },

    methods: {
        value(key) {
            let raw = this.dataset ? this.dataset[key] : null;

            if (raw === null || raw === undefined || raw === "") {
                return "";
            }

            return String(raw);
        },

        // Several of these fields are a string on some datasets and an array on
        // others, so both have to render.
        joined(key) {
            let raw = this.dataset ? this.dataset[key] : null;

            if (Array.isArray(raw)) {
                return raw.filter((part) => part !== null && part !== undefined && part !== "").join(", ");
            }

            return this.value(key);
        },

        count(key) {
            let raw = this.dataset ? this.dataset[key] : null;
            let number = Number(raw);

            // A real 0 is a fact worth showing; a missing count is not.
            if (raw === null || raw === undefined || raw === "" || !Number.isFinite(number)) {
                return "";
            }

            return number.toLocaleString();
        },

        presentFields(pairs) {
            return pairs
                .filter(([, fieldValue]) => !!fieldValue)
                .map(([label, fieldValue]) => ({ label, value: fieldValue }));
        },

        isEmail(label) {
            return label === "Email";
        }
    }
});
</script>

<template>
    <div class="dataset-info">
        <div v-if="loading" class="info-state">
            <span class="info-spinner" aria-hidden="true"></span>
            <span>Loading dataset metadata…</span>
        </div>

        <div v-else-if="error" class="info-state error">{{ error }}</div>

        <div v-else-if="!datasetId" class="info-state">
            Select a tissue to see the dataset these programs were generated from.
        </div>

        <!-- The lookup ran and found nothing. Name the ID that was missed: this is
             a join between the LIGER indexes and the single-cell metadata file, and
             when it fails the ID is the only thing worth reporting. -->
        <div v-else-if="!dataset" class="info-state">
            No dataset metadata found for <code>{{ datasetId }}</code>.
        </div>

        <template v-else>
            <div class="info-head">
                <div class="info-titles">
                    <div class="info-eyebrow">Source dataset</div>
                    <h4 class="info-title">{{ value("datasetName") || datasetId }}</h4>
                    <div v-if="authorsText" class="info-authors">{{ authorsText }}</div>
                </div>

                <a
                    v-if="browserUrl"
                    class="info-link"
                    :href="browserUrl"
                    target="_blank"
                    rel="noopener"
                >View in Single Cell Browser</a>
            </div>

            <div class="info-body">
                <div v-if="summaryText" class="info-summary">{{ summaryText }}</div>
                <div v-else class="info-summary muted">No summary provided for this dataset.</div>

                <div v-if="hasAnyFields" class="info-columns">
                    <dl v-if="provenanceFields.length" class="info-fields">
                        <template v-for="fieldItem in provenanceFields">
                            <dt :key="fieldItem.label + '-label'">{{ fieldItem.label }}</dt>
                            <dd :key="fieldItem.label + '-value'">{{ fieldItem.value }}</dd>
                        </template>
                    </dl>

                    <dl v-if="methodFields.length" class="info-fields">
                        <template v-for="fieldItem in methodFields">
                            <dt :key="fieldItem.label + '-label'">{{ fieldItem.label }}</dt>
                            <dd :key="fieldItem.label + '-value'">
                                <a v-if="isEmail(fieldItem.label)" :href="'mailto:' + fieldItem.value">{{ fieldItem.value }}</a>
                                <template v-else>{{ fieldItem.value }}</template>
                            </dd>
                        </template>
                    </dl>
                </div>
            </div>
        </template>

        <!-- Outside the guards above on purpose. The cell types come from the LIGER
             expression index, not from the single-cell metadata file, so a failed or
             unmatched metadata lookup must not take them down with it -- that is the
             case where knowing what is in the dataset matters most. -->
        <section v-if="showCellTypes" class="cell-types">
            <div class="section-head">
                <h5 class="section-title">Cell types</h5>
                <span v-if="cellTypes.length" class="section-count">{{ cellTypes.length }}</span>
                <span class="section-note">
                    {{ cellTypeGene || "Gene" }} expression, log10_cpk
                </span>
            </div>

            <div v-if="loadingCellTypes" class="info-state">
                <span class="info-spinner" aria-hidden="true"></span>
                <span>Loading cell types…</span>
            </div>

            <div v-else-if="cellTypeError" class="info-state error">{{ cellTypeError }}</div>

            <!-- Every cell type the index reports for this tissue, strongest first,
                 with the one the canvas is built from marked. This is the reading
                 that used to sit inside the cell-type dropdown: a list of fifteen
                 numbers is something to compare, which a dropdown you have to hold
                 open is the wrong place for. -->
            <ul v-else class="cell-type-grid">
                <li
                    v-for="cellType in cellTypes"
                    :key="cellType.key"
                    class="cell-type"
                    :class="{ selected: cellType.selected }"
                    :title="'log10_cpk ' + cellType.expressionRawText"
                >
                    <span class="cell-type-label">{{ cellType.label }}</span>
                    <span class="cell-type-value">{{ cellType.expressionText }}</span>
                </li>
            </ul>
        </section>
    </div>
</template>

<style scoped>
.dataset-info{
    padding: 16px 18px;
}

.info-state{
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 22px 0;
    font-size: 12px;
    color: var(--ce-muted);
}
.info-state.error{ color: #b42318; }
.info-state code{
    font-size: 11px;
    background: var(--ce-sunken);
    padding: 1px 5px;
    border-radius: 4px;
}
.info-spinner{
    width: 14px;
    height: 14px;
    border: 2px solid var(--ce-line);
    border-top-color: var(--ce-accent);
    border-radius: 50%;
    animation: ce-spin .7s linear infinite;
}
@keyframes ce-spin{ to { transform: rotate(360deg); } }

.info-head{
    display: flex;
    align-items: flex-start;
    gap: 18px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--ce-line);
}
.info-titles{
    flex: 1;
    min-width: 0;
}
.info-eyebrow{
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--ce-muted);
}
.info-title{
    margin: 2px 0 0 !important;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--ce-ink);
}
.info-authors{
    margin-top: 3px;
    font-size: 11px;
    font-style: italic;
    line-height: 1.5;
    color: var(--ce-muted);
}
/* The portal's global anchor color wins over a plain scoped rule here, which left
   blue text on the blue button. Forced, in every link state. */
.info-link,
.info-link:link,
.info-link:visited,
.info-link:hover,
.info-link:focus,
.info-link:active{
    flex: none;
    padding: 6px 12px;
    border-radius: 8px;
    background: var(--ce-accent);
    color: #fff !important;
    font-size: 11px;
    font-weight: 700;
    text-decoration: none !important;
    white-space: nowrap;
}
.info-link:hover{
    filter: brightness(1.08);
}

.info-body{
    display: flex;
    gap: 28px;
    padding-top: 12px;
}
.info-summary{
    flex: 1;
    min-width: 220px;
    font-size: 12px;
    line-height: 1.65;
    color: var(--ce-ink);
}
.info-summary.muted{
    color: var(--ce-muted);
    font-style: italic;
}

.info-columns{
    flex: none;
    display: flex;
    gap: 28px;
}
/* Label/value pairs as a real definition list: two tracks, so the values line up
   across rows without each pair carrying its own width. */
.info-fields{
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 5px 14px;
    margin: 0;
    min-width: 190px;
}
.info-fields dt{
    font-size: 11px;
    font-weight: 700;
    color: var(--ce-muted);
    white-space: nowrap;
}
.info-fields dd{
    margin: 0;
    font-size: 11px;
    color: var(--ce-ink);
    overflow-wrap: anywhere;
}
.info-fields dd a{
    color: var(--ce-accent);
}

/* --- cell types --- */

.cell-types{
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--ce-line);
}
.section-head{
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 9px;
}
.section-title{
    margin: 0 !important;
    font-size: 12px;
    font-weight: 700;
    color: var(--ce-ink);
}
.section-count{
    padding: 1px 7px;
    border-radius: 999px;
    background: var(--ce-sunken);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    color: var(--ce-muted);
}
/* The column is this gene's reading in each cell type, not a property of the cell
   type, so the heading has to name the gene and the field. */
.section-note{
    margin-left: auto;
    font-size: 10px;
    color: var(--ce-muted);
}

/* Wrapping columns rather than one tall list: fifteen cell types in a single column
   would run past the card, and these numbers are meant to be compared. */
.cell-type-grid{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 2px 18px;
    margin: 0;
    padding: 0;
    list-style: none;
}
.cell-type{
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 3px 6px;
    border-radius: 5px;
    font-size: 11px;
    cursor: help;
}
/* The one the canvas is built from. Not a link: the selector in the band above is
   where cell type is chosen, and a second control for it here would split that. */
.cell-type.selected{
    background: var(--ce-accent-soft);
    font-weight: 700;
}
.cell-type-label{
    flex: 1;
    min-width: 0;
    color: var(--ce-ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.cell-type-value{
    flex: none;
    font-variant-numeric: tabular-nums;
    color: var(--ce-muted);
}
.cell-type.selected .cell-type-value{
    color: var(--ce-ink);
}

@media (max-width: 1100px){
    .info-body{ flex-wrap: wrap; }
}
</style>
