import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import Template from "./Template.vue";
import store from "./store.js";

Vue.use(BootstrapVue);
Vue.config.productionTip = false;


import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
import StaticPageInfo from "@/components/StaticPageInfo.vue";
import DataDownload from "@/components/DataDownload.vue";
import uiUtils from "@/utils/uiUtils";
import keyParams from "@/utils/keyParams";
import host from "@/utils/hostUtils";
import JSZip from "jszip";
import Alert, {
    postAlert,
    postAlertNotice,
    postAlertError,
    closeAlert
} from "@/components/Alert";

// The dev registry is the same host on port 8000; prod drops the port.
const PEGASUS_HOST_DEV = "https://api.kpndataregistry.org:8000";
const PEGASUS_HOST_PROD = "https://api.kpndataregistry.org";

// Dev registry when served from localhost or any subdomain containing "dev"
// (e.g. dev.hugeamp.org, md-dev.hugeamp.org); prod registry everywhere else.
const PEGASUS_HOST = (function () {
    if (host.domain === "localhost") {
        return PEGASUS_HOST_DEV;
    }
    const isDev = (host.subDomain || "")
        .split(".")
        .some((label) => label.includes("dev"));
    return isDev ? PEGASUS_HOST_DEV : PEGASUS_HOST_PROD;
})();

// PEG evidence category definitions, verbatim from
// https://gwas-catalog.github.io/PEGASUS/docs/peg-evidence
// List columns are named "<CATEGORY>" or "<CATEGORY>_<SubLabel>", so lookups
// match on the part before the first underscore.
const PEG_EVIDENCE_CATEGORIES = {
    // Variant-centric
    LD: "Assessment of whether variant is correlated with another variant of interest and may act as a proxy.",
    FM: "Finemapping results - probability of variant being causal within a credible set, using Bayesian or probabilistic models",
    COLOC: "Variant affects two traits (typically a complex trait and a molecular phenotype) at the same locus.",
    QTL: "Variant affects a molecular phenotype, e.g. gene expression (eQTL), splicing (sQTL), or protein expression (pQTL).",
    MR: "Uses genetic variants as proxies for exposures to test their causal effect on outcomes.",
    REG: "Variant lies in open chromatin or enhancer/promoter elements in relevant tissue (e.g. ATAC-seq, DNase-seq, or histone mark data)",
    CHROMATIN: "Variant lies in a region physically interacting with a gene promoter via 3D chromatin architecture (e.g. Hi-C, Capture-C data).",
    FUNC: "Variant predicted to disrupt gene/protein function or regulatory motifs, e.g. via SIFT, PolyPhen, CADD.",
    PROX: "Assessment of whether variant is within or near gene boundaries.",
    GWAS: "P-value from source GWAS for association of variant with trait specified in metadata file",
    PHEWAS: "Variant is associated with multiple traits, suggesting pleiotropic effects",

    // Gene-centric
    PPI: "Gene's protein interacts with other disease-relevant proteins.",
    SET: "Gene is part of a known pathway or complex relevant to the phenotype, e.g. results of enrichment analyses using Reactome or KEGG.",
    GENEBASE: "Aggregated analysis of association of variants in gene with trait (e.g. SKAT, MAGMA, burden tests).",
    EXP: "Gene is differentially expressed in relevant tissue or disease e.g. the gene is more highly expressed in phenotype-related tissues compared to others.",
    PERTURB: "Gene perturbation causes phenotype-relevant effects in lab or model organisms (knock out animal/cell line, human organoid).",
    KNOW: "Gene–phenotype relationships can be inferred based on known biology, without providing specific references or direct experimental evidence linking the specific gene to the phenotype.",
    TPWAS: "Evidence from transcriptome- or proteome-wide association studies showing that gene's genetically predicted expression or protein level is associated with phenotype.",
    DRUG: "Evidence from drug mechanism of action, e.g. gene encodes a known drug target or interacts with targets of drugs used to treat the phenotype.",

    // Variant or gene-centric
    CROSSP: "Gene or variant already established in a related phenotype (biologically similar).",
    LIT: "Human-curated gene or variant–disease links from literature.",
    DB: "Variant or Gene is curated as causal or related to the phenotype from existing database, like ClinVar, ClinGen, OMIM, etc.",

    // Integration columns. Not on the evidence-categories page; described in the
    // PEG list / toy example docs as combining evidence across categories.
    INT: "Integration column: combined evidence across multiple evidence types for the prioritised gene.",
    Other: "Custom evidence category supplied by the submitter.",
};

new Vue({
    store,

    components: {
        StaticPageInfo,
        PageHeader,
        PageFooter,
        DataDownload,
        Alert,
    },

    data() {
        return {
            studies: [],
            studiesLoading: false,
            fields: [
                { key: "phenotype", label: "Phenotype", sortable: true },
                { key: "mondo_id", label: "MONDO ID", sortable: true },
                { key: "name", label: "Study", sortable: true },
                { key: "study_author", label: "Author", sortable: true },
                { key: "publication_ref", label: "Publication" },
                { key: "published", label: "Status", sortable: true },
                { key: "gwas_source", label: "GWAS source", sortable: true },
                { key: "accession_id", label: "Accession", sortable: true },
                { key: "view_list", label: "" },
            ],
            filter: "",
            filteredCount: null,
            perPage: 25,
            currentPage: 1,

            // Study detail view, driven by the ?study=<accession_id> param.
            selectedAccession: keyParams.study || "",
            listRows: [],
            listFields: [],
            listLoading: false,
            zipping: false,
        };
    },

    async created() {
        this.$store.dispatch("bioPortal/getDiseaseGroups");
        await this.getStudies();
        if (this.selectedAccession) {
            this.getStudyList();
        }
    },

    render(createElement, context) {
        return createElement(Template);
    },

    methods: {
        ...uiUtils,
        postAlert,
        postAlertNotice,
        postAlertError,
        closeAlert,

        async getStudies() {
            this.studiesLoading = true;
            try {
                const response = await fetch(
                    `${PEGASUS_HOST}/api/peg/public/studies`
                );
                if (!response.ok) {
                    throw new Error(
                        `Could not fetch studies (HTTP ${response.status}).`
                    );
                }
                const json = await response.json();
                this.studies = Array.isArray(json) ? json : [];
            } catch (error) {
                this.postAlertError(error.message);
            } finally {
                this.studiesLoading = false;
            }
        },

        onFiltered(filteredItems) {
            this.filteredCount = filteredItems.length;
            this.currentPage = 1;
        },

        viewList(accession) {
            this.selectedAccession = accession;
            keyParams.set({ study: accession });
            this.getStudyList();
        },

        backToStudies() {
            this.selectedAccession = "";
            keyParams.set({ study: null });
            this.listRows = [];
            this.listFields = [];
        },

        // Study files are plain TSV with a header row; column sets vary by study.
        parseTsv(text) {
            const lines = String(text || "")
                .split(/\r?\n/)
                .filter((line) => line.trim() !== "");
            if (lines.length === 0) {
                return { fields: [], rows: [] };
            }
            const header = lines[0].split("\t");
            const rows = lines.slice(1).map((line) => {
                const cells = line.split("\t");
                const row = {};
                header.forEach((key, i) => {
                    row[key] = cells[i];
                });
                return row;
            });
            return {
                // label: key keeps the header exactly as the file spells it;
                // b-table would otherwise humanise it (LIT_RareVariant ->
                // "Lit Rare Variant").
                fields: header.map((key) => ({
                    key,
                    label: key,
                    sortable: true,
                    desc: this.categoryDefinition(key),
                })),
                rows,
            };
        },

        // Columns are "<CATEGORY>" or "<CATEGORY>_<SubLabel>".
        categoryDefinition(key) {
            const name = String(key || "").trim();
            return (
                PEG_EVIDENCE_CATEGORIES[name] ||
                PEG_EVIDENCE_CATEGORIES[name.split("_")[0]] ||
                null
            );
        },

        async getStudyList() {
            const file = this.studyFile("peg_list");
            if (!file) {
                this.postAlertError(
                    `No list file found for study ${this.selectedAccession}.`
                );
                return;
            }
            this.listLoading = true;
            try {
                const response = await fetch(this.fileUrl(file.download_url));
                if (!response.ok) {
                    throw new Error(
                        `Could not fetch list file (HTTP ${response.status}).`
                    );
                }
                const parsed = this.parseTsv(await response.text());
                this.listFields = parsed.fields;
                this.listRows = parsed.rows;
            } catch (error) {
                this.postAlertError(error.message);
            } finally {
                this.listLoading = false;
            }
        },

        studyFile(type) {
            return (this.selectedStudy?.files || []).find(
                (file) => file.file_type === type
            );
        },

        // Direct link; the endpoint redirects to a presigned URL that sets
        // Content-Disposition, so the browser downloads with the right name.
        fileHref(type) {
            const file = this.studyFile(type);
            return file ? this.fileUrl(file.download_url) : "";
        },

        // List columns are TSV text, so booleans arrive as "TRUE" / "FALSE".
        isBooleanValue(value) {
            const text = String(value ?? "").trim().toUpperCase();
            return text === "TRUE" || text === "FALSE";
        },

        isTrue(value) {
            return String(value ?? "").trim().toUpperCase() === "TRUE";
        },

        // The registry's own zip endpoint requires auth, so build it client-side
        // from the public per-file downloads.
        async downloadStudyZip() {
            const files = this.selectedStudy?.files || [];
            if (files.length === 0) {
                return;
            }
            this.zipping = true;
            try {
                const zip = new JSZip();
                await Promise.all(
                    files.map(async (file) => {
                        const response = await fetch(
                            this.fileUrl(file.download_url)
                        );
                        if (!response.ok) {
                            throw new Error(
                                `Could not fetch ${file.file_name} ` +
                                    `(HTTP ${response.status}).`
                            );
                        }
                        zip.file(file.file_name, await response.blob());
                    })
                );

                const blob = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${this.selectedAccession}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                this.postAlertError(error.message);
            } finally {
                this.zipping = false;
            }
        },

        // The registry returns download_url relative to its own host.
        fileUrl(url) {
            const path = String(url || "").trim();
            if (!path || path.startsWith("http")) {
                return path;
            }
            return `${PEGASUS_HOST}${path.startsWith("/") ? "" : "/"}${path}`;
        },
    },

    computed: {

        diseaseGroup() {
            return this.$store.getters["bioPortal/diseaseGroup"];
        },

        // Lift the nested metadata fields up so b-table can sort and filter on them.
        studiesRows() {
            return this.studies.map((study) => ({
                phenotype: study.metadata?.phenotype,
                mondo_id: study.metadata?.mondo_id,
                name: study.name,
                study_author: study.metadata?.study_author,
                publication_ref: study.metadata?.publication_ref,
                published: study.metadata?.published,
                gwas_source: study.metadata?.gwas_source,
                accession_id: study.accession_id,
            }));
        },

        selectedStudy() {
            if (!this.selectedAccession) {
                return null;
            }
            return (
                this.studies.find(
                    (study) => study.accession_id === this.selectedAccession
                ) || null
            );
        },

        // Study metadata as it came back from the studies listing, not the
        // metadata file. Grouped into a study column and a phenotype column;
        // empty values are dropped rather than shown blank.
        selectedStudyDetails() {
            const study = this.selectedStudy;
            if (!study) {
                return [];
            }
            const meta = study.metadata || {};
            const pub = meta.publication_ref;
            const notEmpty = (detail) =>
                detail.value !== null &&
                detail.value !== undefined &&
                detail.value !== "";

            return [
                [
                    { label: "Accession", value: study.accession_id },
                    { label: "Study", value: study.name },
                    { label: "Author", value: meta.study_author },
                    {
                        label: "Publication",
                        value: pub,
                        href: pub
                            ? `https://pubmed.ncbi.nlm.nih.gov/${pub}`
                            : null,
                    },
                    { label: "Published", value: meta.published },
                ],
                [
                    { label: "Phenotype", value: meta.phenotype },
                    { label: "MONDO ID", value: meta.mondo_id },
                    { label: "GWAS source", value: meta.gwas_source },
                    { label: "Source type", value: meta.gwas_source_type },
                ],
            ].map((column) => column.filter(notEmpty));
        },

        studiesRowCount() {
            return this.filteredCount === null
                ? this.studiesRows.length
                : this.filteredCount;
        },

        frontContents() {
            let contents = this.$store.state.kp4cd.frontContents;

            if (contents.length === 0) {
                return {};
            }
            return contents[0];
        },

        pageInfo() {
            let contents = this.$store.state.kp4cd.pageInfo;

            if (contents.length === 0) {
                return {};
            }
            return contents;
        },
    },

    watch: {
        diseaseGroup(group) {
            this.$store.dispatch("kp4cd/getFrontContents", group.name);
            this.$store.dispatch("kp4cd/getPageInfo", { "page": "collaborate", "portal": group.name });
        },

    }
}).$mount("#app");
