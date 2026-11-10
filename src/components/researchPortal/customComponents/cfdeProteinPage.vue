<template>
    <div class="cfde-protein-page">
        <div class="cfde-protein-card">
            <div>
                <b-tabs class="cfde-tabs">
                    <b-tab title="Protein Functions">
                        <div class="card-body">
                            <h4>
                                Which functions, gene ontologies, and pathways
                                are associated with
                                {{ displayName }}?
                            </h4>
                            <div v-if="loading">Loading...</div>
                            <div v-else-if="geneFunction">
                                <h4>Function</h4>
                                <div>{{ geneFunction }}</div>
                            </div>
                            <div v-else><h5>Protein function not found</h5></div>
                        </div>
                    </b-tab>
                    <b-tab
                        title="Protein Structure (Alphafold)"
                        lazy
                        @click="loadStructure"
                    >
                        <div class="card-body">
                            <div v-if="structureError">{{ structureError }}</div>
                            <div v-else>
                                <div
                                    ref="structureViewer"
                                    style="
                                        width: 100%;
                                        height: 500px;
                                        position: relative;
                                    "
                                ></div>
                                <div v-if="afEntry" class="mt-2">
                                    <a :href="afEntry.url" target="_blank"
                                        >{{ afEntry.id }} on AlphaFold DB</a
                                    >
                                    <span class="ml-3 small"
                                        >Colored by pLDDT confidence (blue =
                                        high, orange = low)</span
                                    >
                                </div>
                            </div>
                        </div>
                    </b-tab>
                    <b-tab title="Protein Pathway" lazy>
                        <translator-predicate-table
                            v-if="uniprotId"
                            title="Pathway Annotations (Reactome, KEGG, BioCarta, WikiPathways)"
                            :gene-symbol="uniprotQuery"
                            :field="'pathway'"
                            :hide-search="true"
                        >
                        </translator-predicate-table>
                    </b-tab>
                </b-tabs>
            </div>
        </div>

        <div v-if="ptmLoading" class="cfde-protein-card">
            <div class="cfde-ptm-panel">Loading...</div>
        </div>
        <div v-else-if="ptmGroups.length === 0" class="cfde-protein-card">
            <div class="cfde-ptm-panel">
                No post-translational modifications found.
            </div>
        </div>
        <!-- one card per PTM source -->
        <div
            v-else
            v-for="group in ptmGroups"
            :key="group.source"
            class="cfde-protein-card"
        >
            <div>
                <div class="cfde-ptm-panel">
                    <h4>{{ group.source }}</h4>
                    <!-- PTM type filter, independent for each card -->
                    <div v-if="group.types.length > 1" class="cfde-ptm-filter">
                        <strong class="mr-2">PTM type:</strong>
                        <label
                            v-for="t in group.types"
                            :key="t"
                            class="mr-3 mb-0 cfde-ptm-filter-item"
                        >
                            <input
                                type="checkbox"
                                :value="t"
                                v-model="ptmTypeFilters[group.source]"
                                @change="ptmPages[group.source] = 1"
                            />
                            {{ t }}
                        </label>
                    </div>
                    <b-table
                        :items="group.visibleRows"
                        :fields="ptmFields"
                        :per-page="ptmPerPage"
                        :current-page="ptmPages[group.source]"
                        small
                        striped
                    >
                        <template #empty>
                            No rows match the selected PTM types.
                        </template>
                    </b-table>
                    <b-pagination
                        v-model="ptmPages[group.source]"
                        :total-rows="group.visibleRows.length"
                        :per-page="ptmPerPage"
                        size="sm"
                    ></b-pagination>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import "@/components/NCATS/old/PredicateTable.vue";

export default {
    name: "cfdeProteinPage",
    props: {
        phenotypesInUse: {
            type: [Array, Object],
            default: () => [],
        },
        utilsBox: {
            type: Object,
            default: () => ({}),
        },
        sectionConfigs: {
            type: [Array, Object],
            default: () => ({}),
        },
    },
    data() {
        return {
            uniprotId: "",
            geneSymbol: "",
            geneFunction: "",
            proteinName: "",
            loading: false,
            afEntry: null,
            structureError: "",
            ptmRows: [],
            ptmLoading: false,
            ptmPages: {},
            ptmTypeFilters: {},
            ptmPerPage: 10,
            ptmFields: [
                { key: "site_id", label: "Site ID", sortable: true },
                { key: "position", sortable: true },
                { key: "residue", sortable: true },
                { key: "ptm_type", label: "PTM type", sortable: true },
                { key: "subtype", sortable: true },
                { key: "flanking_sequence", label: "Flanking sequence" },
            ],
            structureLoading: false,
            pdbText: "",
        };
    },
    computed: {
        // "<protein name> (uniprot)"
        displayName() {
            const name = this.proteinName || this.geneSymbol;
            return name ? `${name} (${this.uniprotId})` : this.uniprotId;
        },
        // PTM rows grouped by the "source" column, one card per source.
        // Each card has its own PTM type list and filter selection.
        ptmGroups() {
            const map = {};
            this.ptmRows.forEach((r) => {
                const s = r.source || "unknown";
                (map[s] = map[s] || []).push(r);
            });
            return Object.keys(map)
                .sort()
                .map((source) => {
                    const rows = map[source];
                    const selected = this.ptmTypeFilters[source] || [];
                    return {
                        source,
                        types: [
                            ...new Set(
                                rows.map((r) => r.ptm_type).filter(Boolean)
                            ),
                        ].sort(),
                        visibleRows: rows.filter((r) =>
                            selected.includes(r.ptm_type)
                        ),
                    };
                });
        },
        // MyGene.info scoped query by UniProt accession
        uniprotQuery() {
            return `uniprot:${this.uniprotId}`;
        },
    },
    mounted() {
        this.uniprotId = (
            new URLSearchParams(window.location.search).get("uniprot") || ""
        ).trim();
        if (this.uniprotId) {
            this.loadUniprot();
            this.loadPtm();
        }
    },
    methods: {
        async loadPtm() {
            const host = "https://cfde-dev.hugeampkpnbi.org";
            this.ptmLoading = true;
            try {
                let url = `${host}/api/bio/query/ptm?q=${encodeURIComponent(
                    this.uniprotId
                )}`;
                const rows = [];
                while (url) {
                    const resp = await fetch(url);
                    if (!resp.ok) throw new Error(`PTM HTTP ${resp.status}`);
                    const json = await resp.json();
                    rows.push(...json.data);
                    url = json.continuation
                        ? `${host}/api/bio/cont?token=${json.continuation}`
                        : null;
                }
                const pages = {};
                const filters = {};
                rows.forEach((r) => {
                    const s = r.source || "unknown";
                    pages[s] = 1;
                    // all PTM types selected by default, per card
                    filters[s] = filters[s] || [];
                    if (r.ptm_type && !filters[s].includes(r.ptm_type))
                        filters[s].push(r.ptm_type);
                });
                this.ptmPages = pages;
                this.ptmTypeFilters = filters;
                this.ptmRows = rows;
            } catch (e) {
                console.error(e);
            } finally {
                this.ptmLoading = false;
            }
        },
        loadScript(src) {
            return new Promise((resolve, reject) => {
                if (window.$3Dmol) return resolve();
                const s = document.createElement("script");
                s.src = src;
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });
        },
        async loadStructure() {
            if (!this.uniprotId || this.structureLoading) return;
            this.structureLoading = true;
            try {
                // fetch once, cache; the lazy tab destroys its DOM on
                // deactivate so the viewer must be re-created every time
                if (!this.pdbText) {
                    const resp = await fetch(
                        `https://alphafold.ebi.ac.uk/api/prediction/${encodeURIComponent(
                            this.uniprotId
                        )}`
                    );
                    if (!resp.ok)
                        throw new Error(`AlphaFold HTTP ${resp.status}`);
                    const entry = (await resp.json())[0];
                    this.afEntry = {
                        id: entry.entryId,
                        url: `https://alphafold.ebi.ac.uk/entry/${this.uniprotId}`,
                    };
                    await this.loadScript(
                        "https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.4/3Dmol-min.js"
                    );
                    this.pdbText = await (await fetch(entry.pdbUrl)).text();
                }
                const pdb = this.pdbText;
                await this.$nextTick();
                if (!this.$refs.structureViewer) return;
                this.$refs.structureViewer.innerHTML = "";
                const viewer = window.$3Dmol.createViewer(
                    this.$refs.structureViewer,
                    { backgroundColor: "white" }
                );
                viewer.addModel(pdb, "pdb");
                viewer.setStyle(
                    {},
                    {
                        cartoon: {
                            colorfunc: (atom) =>
                                atom.b > 90
                                    ? "#0053d6"
                                    : atom.b > 70
                                    ? "#65cbf3"
                                    : atom.b > 50
                                    ? "#ffdb13"
                                    : "#ff7d45",
                        },
                    }
                );
                viewer.zoomTo();
                viewer.render();
            } catch (e) {
                console.error(e);
                this.structureError =
                    "AlphaFold structure not available for this protein.";
            } finally {
                this.structureLoading = false;
            }
        },
        async loadUniprot() {
            this.loading = true;
            try {
                const resp = await fetch(
                    `https://rest.uniprot.org/uniprotkb/${encodeURIComponent(
                        this.uniprotId
                    )}.json`
                );
                if (!resp.ok) throw new Error(`UniProt HTTP ${resp.status}`);
                const doc = await resp.json();
                this.geneSymbol = doc.genes?.[0]?.geneName?.value || "";
                this.proteinName =
                    doc.proteinDescription?.recommendedName?.fullName?.value ||
                    doc.proteinDescription?.submissionNames?.[0]?.fullName
                        ?.value ||
                    "";
                const fn = (doc.comments || []).find(
                    (c) => c.commentType === "FUNCTION"
                );
                this.geneFunction = fn?.texts?.[0]?.value || "";
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        },
    },
};
</script>

<style>
/* Styled after cfdeknowledge.org kc_entity_gene tabs/card */
.cfde-protein-page .cfde-protein-card {
    background: none;
    border-radius: 10px;
    padding: 10px 20px 30px;
    font-family: Roboto, Arial, sans-serif;
}
.cfde-protein-page .cfde-protein-card h4 {
    font-size: 22px;
    font-weight: 500;
    margin: 0 0 7px;
    padding: 10px 0;
    color: #212529;
}
.cfde-protein-page .cfde-tabs .nav-tabs {
    border-bottom: 0;
}
.cfde-protein-page .cfde-tabs .nav-tabs .nav-item {
    margin: 0 5px -1px 0;
}
.cfde-protein-page .cfde-tabs .nav-tabs .nav-link {
    background: #ddd;
    color: #5a5a5a;
    border: 0;
    border-radius: 5px 5px 0 0;
    padding: 10px 15px;
    font-size: 14px;
}
.cfde-protein-page .cfde-tabs .nav-tabs .nav-link.active {
    background: #fff;
    border-bottom: 1px solid #fff;
}
.cfde-protein-page .cfde-ptm-filter {
    padding: 0 0 10px;
    font-size: 14px;
}
.cfde-protein-page .cfde-ptm-panel,
.cfde-protein-page .cfde-tabs .tab-content {
    background: #fff;
    border-radius: 5px;
    padding: 17.5px;
}
</style>
