<template>
  <div class="card mdkp-card">
    <div class="card-body">
      <h4 class="card-title">
        Gene-level trait associations for {{ (gene || "").toUpperCase() }}
      </h4>

        
      <b-tabs v-model="activeTab">
        <b-tab title="Combined genetic support (GWAS + gene sets)">
            <div class="tab-documentation">
                Documentation for combined genetic support
            </div>
            <research-pigean-phewas-plot
                v-if="pigeanDataFiltered.length > 0"
                ref="combinedPhewasPlot"
                canvas-id="combinedPlot"
                :plot-name="`combined_${gene}`"
                :phenotypes-data="pigeanDataFiltered"
                :phenotype-map="
                    phenotypeMap
                "
                :colors="plotColors"
                :plot-margin="phewasPlotMargin"
                :render-config="
                    combinedConfig
                "
                :pkg-data="null"
                :pkg-data-selected="null"
                :filter="null"
                :utils="utilsBox"
                :options="['open phenotype page']"
            >
            </research-pigean-phewas-plot>
            <div class="mt-3" style="position: relative">
                <div
                    v-html="'Total rows: ' + pigeanDataFiltered.length"
                    class="table-total-rows"
                ></div>
                <div class="text-right mb-2" v-if="pigeanDataFiltered.length > 0">
                    <data-download
                        :data="pigeanDataFiltered"
                        :filename="`pigean_gene_${gene}`"
                    ></data-download>
                </div>
                <div
                    v-if="pigeanDataFiltered.length > 0"
                    class="evidence-range-legend"
                >
                    <strong>Evidence range (Combined score):</strong>
                    <span class="very-strong">Very Strong</span> &gt; 3 |
                    <span class="strongly-suggestive">Strongly Suggestive</span>: 2-3 |
                    <span class="nominally-significant">Nominally Significant</span>: 1-2 |
                    <span class="not-significant">Not Significant</span>: &lt; 1
                </div>
                <b-table 
                    striped 
                    hover 
                    :items="pigeanTableItems" 
                    :fields="tableFields"
                    :per-page="perPage"
                    :current-page="currentPage"
                    detail-key="_rowKey"
                    responsive
                >
                    <template #head(Combined_GWAS_gene_sets)="data">
                        <span class="column-header-with-tooltip">
                            <span>{{ data.label }}</span>
                            <span @click.stop>
                                <tooltip-documentation
                                    name="pigean.column.pigean.tooltip"
                                    :is-hover="true"
                                    :no-icon="false"
                                    supply-text="Placeholder documentation for PIGEAN scores (combined, GWAS support, and gene set support)."
                                ></tooltip-documentation>
                            </span>
                        </span>
                    </template>
                    <template #head(PPA)="data">
                        <span class="column-header-with-tooltip">
                            <span>{{ data.label }}</span>
                            <span @click.stop>
                                <tooltip-documentation
                                    name="pigean.column.falcon.tooltip"
                                    :is-hover="true"
                                    :no-icon="false"
                                    supply-text="Placeholder documentation for FALCON posterior probability of association (PPA)."
                                ></tooltip-documentation>
                            </span>
                        </span>
                    </template>
                    <template #head(Factor)="data">
                        <span class="column-header-with-tooltip">
                            <span>{{ data.label }}</span>
                            <span @click.stop>
                                <tooltip-documentation
                                    name="pigean.column.eaggl.tooltip"
                                    :is-hover="true"
                                    :no-icon="false"
                                    supply-text="Placeholder documentation for the EAGGL mechanistic factor."
                                ></tooltip-documentation>
                            </span>
                        </span>
                    </template>
                    <template v-slot:cell(Phenotype)="row">
                        <a :href="'/phenotype.html?phenotype='+row.item.phenotype">{{ phenotypeMap[row.item.phenotype] && phenotypeMap[row.item.phenotype]['description'] ? phenotypeMap[row.item.phenotype]['description'] : row.item.Phenotype }}</a>
                    </template>
                    <template #cell(Combined_GWAS_gene_sets)="row">
                        <span class="combined-score-cell">
                            <span class="score-piece">
                                <span
                                    :class="['score-swatch', 'score-swatch-combined', evidenceRangeClass(row.item.Combined_GWAS_gene_sets)]"
                                ></span>
                                {{ formatScore(row.item.Combined_GWAS_gene_sets) }}
                            </span>
                            <span>|</span>
                            <span class="score-piece">
                                <span
                                    :class="['score-swatch', 'score-swatch-part', evidenceRangeClass(row.item.GWAS_support)]"
                                ></span>
                                {{ formatScore(row.item.GWAS_support) }}
                            </span>
                            <span>|</span>
                            <span class="score-piece">
                                <span
                                    :class="['score-swatch', 'score-swatch-part', evidenceRangeClass(row.item.Gene_set_support)]"
                                ></span>
                                {{ formatScore(row.item.Gene_set_support) }}
                            </span>
                        </span>
                    </template>
                    <template #cell(PPA)="row">
                        {{ formatPpa(row.item.PPA) }}
                    </template>
                    <template #cell(cfde_gene_set)="r">
                        <button
                            class="btn view-features-btn btn-secondary"
                            @click="toggleGeneSetDetails(r.item)"
                        >
                            View Gene Sets
                        </button>
                    </template>
                    <template #cell(factor_gene_set)="r">
                        <button
                            class="btn view-features-btn btn-secondary"
                            @click="toggleFactorGeneSetDetails(r.item)"
                        >
                            View Gene Sets
                        </button>
                    </template>
                    <template #row-details="row">
                        <div
                            class="p-3"
                            style="
                                background-color: #eeeeee;
                                border-left: 5px solid #cccccc;
                            "
                        >
                            <template v-if="expandedDetailType === 'cfde'">
                                <div
                                    v-if="getGeneSetSubtableLoading(row.item)"
                                    class="text-muted"
                                >
                                    Loading gene sets...
                                </div>
                                <div
                                    v-else-if="getGeneSetSubtableError(row.item)"
                                    class="text-danger"
                                >
                                    {{ getGeneSetSubtableError(row.item) }}
                                </div>
                                <template v-else>
                                    <div
                                        class="kc-logo-container"
                                        style="
                                            position: relative;
                                            height: 70px;
                                            margin-top: -20px;
                                        "
                                    >
                                        <kc-cfde-logo></kc-cfde-logo>
                                    </div>
                                    <b-table
                                        small
                                        responsive
                                        :items="getGeneSetSubtableData(row.item)"
                                        :fields="geneSetSubtableFields"
                                        :per-page="geneSetSubtablePerPage"
                                        :current-page="getGeneSetSubtablePage(row.item)"
                                        show-empty
                                        empty-text="No gene set data."
                                    >
                                        <template v-slot:[geneSetCellSlot]="cell">
                                            <a
                                                :href="`https://cfdeknowledge.org/r/kc_gsb?geneSet=${encodeURIComponent(
                                                    cell.value || ''
                                                )}`"
                                                :title="cell.value"
                                                >{{ formatGeneSetCell(cell.value) }}</a
                                            >
                                        </template>
                                        <template #cell(Source)="cell">
                                            <a
                                                :href="`https://cfdeknowledge.org/r/kc_gsb?source=${encodeURIComponent(
                                                    cell.value || ''
                                                )}`"
                                                >{{ cell.value }}</a
                                            >
                                        </template>
                                    </b-table>
                                    <b-pagination
                                        v-if="
                                            getGeneSetSubtableData(row.item).length >
                                            geneSetSubtablePerPage
                                        "
                                        :value="getGeneSetSubtablePage(row.item)"
                                        class="pagination-sm justify-content-center mt-2"
                                        :total-rows="
                                            getGeneSetSubtableData(row.item).length
                                        "
                                        :per-page="geneSetSubtablePerPage"
                                        @input="setGeneSetSubtablePage(row.item, $event)"
                                    ></b-pagination>
                                </template>
                            </template>
                            <template v-else-if="expandedDetailType === 'factor'">
                                <div
                                    v-if="getFactorGeneSetSubtableLoading(row.item)"
                                    class="text-muted"
                                >
                                    Loading gene sets...
                                </div>
                                <div
                                    v-else-if="getFactorGeneSetSubtableError(row.item)"
                                    class="text-danger"
                                >
                                    {{ getFactorGeneSetSubtableError(row.item) }}
                                </div>
                                <template v-else>
                                    <b-table
                                        small
                                        responsive
                                        :items="getFactorGeneSetSubtableData(row.item)"
                                        :fields="factorGeneSetSubtableFields"
                                        :per-page="geneSetSubtablePerPage"
                                        :current-page="getFactorGeneSetSubtablePage(row.item)"
                                        show-empty
                                        empty-text="No gene set data."
                                    >
                                        <template #cell(gene_set)="cell">
                                            {{ formatFactorGeneSetName(cell.item) }}
                                        </template>
                                    </b-table>
                                    <b-pagination
                                        v-if="
                                            getFactorGeneSetSubtableData(row.item).length >
                                            geneSetSubtablePerPage
                                        "
                                        :value="getFactorGeneSetSubtablePage(row.item)"
                                        class="pagination-sm justify-content-center mt-2"
                                        :total-rows="
                                            getFactorGeneSetSubtableData(row.item).length
                                        "
                                        :per-page="geneSetSubtablePerPage"
                                        @input="setFactorGeneSetSubtablePage(row.item, $event)"
                                    ></b-pagination>
                                </template>
                            </template>
                        </div>
                    </template>
                </b-table>
                <b-pagination
                    v-model="currentPage"
                    class="pagination-sm justify-content-center"
                    :total-rows="pigeanDataFiltered.length"
                    :per-page="perPage"
                ></b-pagination>
            </div>
        </b-tab>
        <b-tab title="HuGE Scores">
            <h4 class="card-title">HuGE Scores</h4>
            <span>
                <documentation
                    name="gene.hugecal.subheader"
                    :content-fill="docDetails"
                    :content-map="documentations"
                >
                </documentation>
            </span>
            <criterion-function-group>
                <filter-enumeration-control
                    :field="'phenotype'"
                    placeholder="Select a phenotype ..."
                    :options="hugeScorePhenotypes"
                    :label-formatter="phenotypeLabel"
                    :multiple="true"
                >
                    <div class="label">Phenotypes</div>
                </filter-enumeration-control>
                <filter-greater-control
                    :field="'huge'"
                    placeholder="Set HuGE..."
                >
                    <div>
                        <strong>HuGE Score (&ge;)</strong>
                    </div>
                </filter-greater-control>
                <template slot="filtered" slot-scope="{ filter }">
                    <research-phewas-plot
                        v-if="hugeScores && hugeScores.length > 0"
                        ref="hugeScorePheWASPlot"
                        canvas-id="hugeScorePlot"
                        :plot-name="`huge_scores_${gene}`"
                        :phenotypes-data="hugeScores"
                        :phenotype-map="phenotypeMap"
                        :colors="plotColors"
                        :plot-margin="phewasPlotMargin"
                        :render-config="hugeScoreRenderConfig"
                        :pkg-data="null"
                        :pkg-data-selected="null"
                        :filter="filter"
                        :utils="utilsBox"
                        :options="['open phenotype page']"
                    >
                    </research-phewas-plot>
                    <unauthorized-message
                        :restricted="restrictedAssociations"
                    >
                    </unauthorized-message>
                    <huge-scores-table
                        v-if="hugeScores && hugeScores.length > 0"
                        :page-key="geneRecord"
                        lead-table-field="phenotype"
                        :huge-scores="hugeScores"
                        :phenotype-map="phenotypeMap"
                        :filter="filter"
                    >
                    </huge-scores-table>
                </template>
            </criterion-function-group>
        </b-tab>
        <b-tab title="Combined scores vs HuGE scores">
            <div class="tab-documentation">
                Documentation for combined scores vs HuGE scores
            </div>
            <research-pigean-phewas-plot
                v-if="combinedVsHugeData.length > 0"
                ref="pigeanPhewasPlot"
                canvas-id="pigeanPlot"
                :plot-name="`combined_vs_huge_${gene}`"
                :phenotypes-data="combinedVsHugeData"
                :phenotype-map="
                    phenotypeMap
                "
                :colors="plotColors"
                :plot-margin="phewasPlotMargin"
                :render-config="
                    pigeanConfig
                "
                :pkg-data="null"
                :pkg-data-selected="null"
                :filter="null"
                :utils="utilsBox"
                :options="['open phenotype page']"
            >
            </research-pigean-phewas-plot>
            <div class="mt-3" style="position: relative">
                <div
                    v-html="'Total rows: ' + combinedVsHugeData.length"
                    class="table-total-rows"
                ></div>
                <div class="text-right mb-2" v-if="combinedVsHugeData.length > 0">
                    <data-download
                        :data="combinedVsHugeData"
                        :filename="`combined_vs_huge_${gene}`"
                    ></data-download>
                </div>
                <div
                    v-if="combinedVsHugeData.length > 0"
                    class="evidence-range-legend"
                >
                    <strong>Evidence range:</strong>
                    <span class="very-strong">Very Strong</span> &gt; 3 |
                    <span class="strongly-suggestive">Strongly Suggestive</span>: 2-3 |
                    <span class="nominally-significant">Nominally Significant</span>: 1-2 |
                    <span class="not-significant">Not Significant</span>: &lt; 1
                </div>
                <b-table
                    striped
                    hover
                    :items="combinedVsHugeData"
                    :fields="combinedVsHugeFields"
                    :per-page="perPage"
                    :current-page="combinedVsHugePage"
                    responsive
                >
                    <template #head(PPA)="data">
                        <span class="column-header-with-tooltip">
                            <span>{{ data.label }}</span>
                            <span @click.stop>
                                <tooltip-documentation
                                    name="pigean.column.falcon.vs.huge.tooltip"
                                    :is-hover="true"
                                    :no-icon="false"
                                    supply-text="Placeholder documentation for FALCON posterior probability of association (PPA)."
                                ></tooltip-documentation>
                            </span>
                        </span>
                    </template>
                    <template v-slot:cell(Phenotype)="row">
                        <a :href="'/phenotype.html?phenotype='+row.item.phenotype">{{ phenotypeMap[row.item.phenotype] && phenotypeMap[row.item.phenotype]['description'] ? phenotypeMap[row.item.phenotype]['description'] : row.item.Phenotype }}</a>
                    </template>
                    <template #cell(Combined_GWAS_gene_sets)="row">
                        <span class="score-piece">
                            <span
                                :class="['score-swatch', 'score-swatch-combined', evidenceRangeClass(row.item.Combined_GWAS_gene_sets)]"
                            ></span>
                            {{ formatScore(row.item.Combined_GWAS_gene_sets) }}
                        </span>
                    </template>
                    <template #cell(PPA)="row">
                        {{ formatPpa(row.item.PPA) }}
                    </template>
                    <template #cell(HuGE_Score)="row">
                        {{ formatScore(row.item.HuGE_Score) }}
                    </template>
                </b-table>
                <b-pagination
                    v-model="combinedVsHugePage"
                    class="pagination-sm justify-content-center"
                    :total-rows="combinedVsHugeData.length"
                    :per-page="perPage"
                ></b-pagination>
            </div>
        </b-tab>
        <!-- <b-tab title="GWAS support vs HuGE score">
            <div class="tab-documentation">
                Documentation for pigean genetic support
            </div>
            <research-pigean-phewas-plot
                v-if="pigeanDataFiltered.length > 0"
                ref="pigeanPhewasPlot"
                canvas-id="pigeanPlot"
                :plot-name="`pigean_${gene}`"
                :phenotypes-data="pigeanDataFiltered"
                :phenotype-map="
                    phenotypeMap
                "
                :colors="plotColors"
                :plot-margin="phewasPlotMargin"
                :render-config="
                    pigeanConfig
                "
                :pkg-data="null"
                :pkg-data-selected="null"
                :filter="null"
                :utils="utilsBox"
                :options="['open phenotype page']"
            >
            </research-pigean-phewas-plot>
        </b-tab> -->
        
        <!-- <b-tab title="GWAS support">
            <div class="tab-documentation">
                Documentation for GWAS support
            </div>
            <research-phewas-plot
                v-if="pigeanDataFiltered.length > 0"
                ref="gwasPhewasPlot"
                canvas-id="gwasPlot"
                :plot-name="`gwas_${gene}`"
                :phenotypes-data="pigeanDataFiltered"
                :phenotype-map="phenotypeMap"
                :colors="plotColors"
                :plot-margin="phewasPlotMargin"
                :render-config="gwasConfig"
                :pkg-data="null"
                :pkg-data-selected="null"
                :filter="null"
                :utils="utilsBox"
                :options="['open phenotype page']"
            >
            </research-phewas-plot>
        </b-tab>
        <b-tab title="Gene set support">
            <div class="tab-documentation">
                Documentation for gene set support
            </div>
            <research-phewas-plot
                v-if="pigeanDataFiltered.length > 0"
                ref="geneSetPhewasPlot"
                canvas-id="geneSetPlot"
                :plot-name="`gene_set_${gene}`"
                :phenotypes-data="pigeanDataFiltered"
                :phenotype-map="phenotypeMap"
                :colors="plotColors"
                :plot-margin="phewasPlotMargin"
                :render-config="geneSetConfig"
                :pkg-data="null"
                :pkg-data-selected="null"
                :filter="null"
                :utils="utilsBox"
                :options="['open phenotype page']"
            >
            </research-phewas-plot>
        </b-tab>
        <b-tab title="HuGE scores">
            <div class="tab-documentation">
                Documentation for HuGE scores
            </div>
            <research-phewas-plot
                v-if="pigeanDataFiltered.length > 0"
                ref="hugePhewasPlot"
                canvas-id="hugePlot"
                :plot-name="`huge_${gene}`"
                :phenotypes-data="pigeanDataFiltered"
                :phenotype-map="phenotypeMap"
                :colors="plotColors"
                :plot-margin="phewasPlotMargin"
                :render-config="hugeConfig"
                :pkg-data="null"
                :pkg-data-selected="null"
                :filter="null"
                :utils="utilsBox"
                :options="['open phenotype page']"
            >
            </research-phewas-plot>
        </b-tab>-->
      </b-tabs>
    </div>
  </div>
</template>
<script>
import Vue from "vue";

import ResearchPigeanPheWAS from "@/components/researchPortal/PIGEAN/ResearchPigeanPheWAS.vue";
import ResearchPheWAS from "@/components/researchPortal/ResearchPheWAS.vue";
import DataDownload from "@/components/DataDownload.vue";
import HugeScoresTable from "@/components/HugeScoresTable.vue";
import Documentation from "@/components/Documentation.vue";
import UnauthorizedMessage from "@/components/UnauthorizedMessage";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import KcCfdeLogo from "@/components/Cfde2Kp/KcCfdeLogo.vue";
import TooltipDocumentation from "@/components/TooltipDocumentation.vue";

import uiUtils from "@/utils/uiUtils";
import plotUtils from "@/utils/plotUtils";
import sortUtils from "@/utils/sortUtils";
import alertUtils from "@/utils/alertUtils";
import Formatters from "@/utils/formatters";
import dataConvert from "@/utils/dataConvert";
import keyParams from "@/utils/keyParams";
import filterUtils from "@/utils/filterUtils";
import regionUtils from "@/utils/regionUtils";
import userUtils from "@/utils/userUtils.js";
import { query, DEFAULT_SIGMA, DEFAULT_GENESET_SIZE } from "@/utils/bioIndexUtils";

const GENE_SET_TABLE_FORMAT = {
    "data convert": [
        { type: "raw", "field name": "Phenotype", "raw field": "phenotype" },
        { type: "raw", "field name": "Gene set", "raw field": "gene_set" },
        {
            type: "raw",
            "field name": "Description",
            "raw field": "gene_set_description",
        },
        { type: "raw", "field name": "Model", "raw field": "gene_set_size" },
        {
            type: "raw",
            "field name": "Joint effect",
            "raw field": "beta",
            "if no value": "0",
        },
        {
            type: "translate to categories",
            "field name": "Evidence range (Joint effect)",
            "raw field": "Joint effect",
            categories: [
                {
                    name: "Not Significant",
                    condition: "less than",
                    range: 0.01,
                },
                { name: "Significant", condition: "and", range: [0.01, 0.1] },
                {
                    name: "Strongly Significant",
                    condition: "and",
                    range: [0.1, 1],
                },
                {
                    name: "Extremely Significant",
                    condition: "greater than",
                    range: 1,
                },
            ],
        },
        {
            type: "raw",
            "field name": "Marginal effect",
            "raw field": "beta_uncorrected",
            "if no value": "0",
        },
        {
            type: "translate to categories",
            "field name": "Evidence range (Marginal effect)",
            "raw field": "Marginal effect",
            categories: [
                {
                    name: "Not Significant",
                    condition: "less than",
                    range: 0.01,
                },
                { name: "Significant", condition: "and", range: [0.01, 0.1] },
                {
                    name: "Strongly Significant",
                    condition: "and",
                    range: [0.1, 1],
                },
                {
                    name: "Extremely Significant",
                    condition: "greater than",
                    range: 1,
                },
            ],
        },
        {
            type: "raw",
            "field name": "Number of genes in gene set",
            "raw field": "n",
        },
        { type: "raw", "field name": "Source", "raw field": "source" },
        {
            type: "join multi",
            "field name": "Genes in gene set",
            "fields to join": ["phenotype", "gene_set"],
            "join by": [","],
        },
        {
            type: "join multi",
            "field name": "Hypothesis",
            "fields to join": ["phenotype", "gene_set"],
            "join by": [","],
        },
        {
            type: "join multi",
            "field name": "BYOGL",
            "fields to join": ["phenotype", "gene_set"],
            "join by": [","],
        },
    ],
    "top rows": [
        "Gene set",
        "Description",
        "Joint effect",
        "Evidence range (Joint effect)",
        "Marginal effect",
        "Evidence range (Marginal effect)",
        "Number of genes in gene set",
        "Source",
    ],
};

function valueMatchesCategory(value, cat) {
    const r = cat.range;
    const c = cat.condition;
    if (c === "less than") return value < r;
    if (c === "greater than") return value > r;
    if (c === "and" && Array.isArray(r)) return value >= r[0] && value <= r[1];
    return false;
}

function translateToCategory(value, categories) {
    const num = Number(value);
    if (Number.isNaN(num)) return "";
    const cat = categories.find((c) => valueMatchesCategory(num, c));
    return cat ? cat.name : "";
}

const GENE_SET_SOURCE_EXCLUDE = ["gene_set_list_mouse", "gene_set_list_msigdb"];
function geneSetSourceFilteredOut(source) {
    const s = String(source || "");
    return GENE_SET_SOURCE_EXCLUDE.some((x) => s.includes(x));
}

function joinMultiValues(fieldsToJoin, joinBy, row) {
    let out = "";
    const n = fieldsToJoin.length;
    for (let i = 0; i < n; i++) {
        out += row[fieldsToJoin[i]] != null ? String(row[fieldsToJoin[i]]) : "";
        if (i < n - 1 && joinBy[i] != null) out += joinBy[i];
    }
    return out;
}

export default Vue.component("pigean-gene", {
  components: {
    ResearchPigeanPheWAS,
    ResearchPheWAS,
    DataDownload,
    HugeScoresTable,
    Documentation,
    UnauthorizedMessage,
    CriterionFunctionGroup,
    FilterEnumeration,
    FilterGreaterThan,
    KcCfdeLogo,
    TooltipDocumentation,
  },
  props: ["gene","pigeanData","falconGeneAssociations","phenotypeMap","phenotypesInSession","hugeScores","docDetails"],
  data() {
      return {
        activeTab: 0,
        perPage: 10,
        currentPage: 1,
        combinedVsHugePage: 1,
        geneSetsApi:
            "https://cfde-dev.hugeampkpnbi.org/api/bio/query/pigean-gene-set-phenotype?q=$phenotype,cfde&limit=10000",
        expandedRowKey: null,
        expandedDetailType: null,
        geneSetDataByRow: {},
        factorGeneSetDataByRow: {},
        geneSetSubtablePerPage: 10,
        geneSetSubtablePageByRow: {},
        factorGeneSetSubtablePageByRow: {},
        factorGeneSetSubtableFields: [
          {
            key: "gene_set",
            label: "Gene set",
            sortable: true,
          },
          {
            key: "factor_value",
            label: "Mechanism value",
            sortable: true,
            formatter: (value) =>
              value === null || value === undefined || value === ""
                ? "N/A"
                : Number(value).toFixed(2),
          },
          {
            key: "beta",
            label: "Effect (joint)",
            sortable: true,
            formatter: (value) =>
              value === null || value === undefined || value === ""
                ? "N/A"
                : Number(value).toFixed(2),
          },
          {
            key: "beta_uncorrected",
            label: "Effect (marginal)",
            sortable: true,
            formatter: (value) =>
              value === null || value === undefined || value === ""
                ? "N/A"
                : Number(value).toFixed(2),
          },
        ],
        tableFields: [
          {
            key: 'Phenotype',
            label: 'Phenotype',
            sortable: true
          },
          {
            key: 'Combined_GWAS_gene_sets',
            label: 'PIGEAN scores (combined | GWAS support | gene set support)',
            sortable: true
          },
          {
            key: 'PPA',
            label: 'FALCON PPA',
            sortable: true
          },
          {
            key: 'Factor',
            label: 'EAGGL Mechanistic factor',
            sortable: true
          },
          {
            key: 'factor_gene_set',
            label: 'Gene sets by trait + factor'
          },
          {
            key: 'cfde_gene_set',
            label: 'CFDE Gene Sets'
          }
        ],
        combinedVsHugeFields: [
          {
            key: 'Phenotype',
            label: 'Phenotype',
            sortable: true
          },
          {
            key: 'Combined_GWAS_gene_sets',
            label: 'Combined score',
            sortable: true
          },
          {
            key: 'PPA',
            label: 'FALCON PPA',
            sortable: true
          },
          {
            key: 'HuGE_Score',
            label: 'HuGE score',
            sortable: true
          }
        ],
        pigeanConfig: {
            "type": "pigean phewas plot",
            "render by": "Phenotype",
            "group by": "group",
            "phenotype map": "kp phenotype map",
            "y axis fields": ["Combined_GWAS_gene_sets","Log_HuGE_Score"],
            "y axis field labels": ["Combined score","Log(HuGE scores)"],
            "primary y axis field": "Combined_GWAS_gene_sets",
            "secondary y axis field": "Log_HuGE_Score",
            "secondary y axis label": "Log(HuGE scores)",
            "convert y -log10": "false",
            "y axis label": "Combined score",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Phenotype", "Factor","Combined_GWAS_gene_sets", "HuGE_Score", "Log_HuGE_Score"],
            "filter by threshold": true,
            "thresholds": [2],
            "label in black": "greater than",
            "height": "600",
            "plot margin": {
                "left": 150,
                "right": 180,
                "top": 250,
                "bottom": 300,
            },
        },
        combinedConfig: {
            "type": "pigean phewas plot",
            "render by": "Phenotype",
            "group by": "group",
            "phenotype map": "kp phenotype map",
            "y axis fields": ["Combined_GWAS_gene_sets","GWAS_support","Gene_set_support"],
            "y axis field labels": ["Combined (GWAS support + Gene set support)","GWAS support","Gene set support"],
            "primary y axis field": "Combined_GWAS_gene_sets",
            "convert y -log10": "false",
            "y axis label": "Combined (GWAS + gene sets)",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Phenotype", "Factor", "Combined_GWAS_gene_sets", "GWAS_support", "Gene_set_support", "PPA"],
            "filter by threshold": true,
            thresholds: [2],
            "label in black": "greater than",
            height: "600",
            "ppa field": "PPA",
            "ppa axis label": "PPA",
            "ppa strip height": 30,
            "plot margin": {
                left: 150,
                right: 180,
                top: 250,
                bottom: 300,
            },
        },
        gwasConfig: {
            type: "phewas plot",
            "render by": "Phenotype",
            "group by": "group",
            "phenotype map": "kp phenotype map",
            "y axis field": "GWAS_support",
            "convert y -log10": "false",
            "y axis label": "GWAS support",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Phenotype", "GWAS_support", "Combined_GWAS_gene_sets", "Gene_set_support", "HuGE_Score"],
            thresholds: [2],
            "label in black": "greater than",
            height: "600",
            "plot margin": {
                left: 150,
                right: 150,
                top: 250,
                bottom: 300,
            },
        },
        geneSetConfig: {
            type: "phewas plot",
            "render by": "Phenotype",
            "group by": "group",
            "phenotype map": "kp phenotype map",
            "y axis field": "Gene_set_support",
            "convert y -log10": "false",
            "y axis label": "Gene set support",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Phenotype", "Gene_set_support", "GWAS_support", "Combined_GWAS_gene_sets", "HuGE_Score"],
            thresholds: [2],
            "label in black": "greater than",
            height: "600",
            "plot margin": {
                left: 150,
                right: 150,
                top: 250,
                bottom: 300,
            },
        },
        hugeConfig: {
            type: "phewas plot",
            "render by": "Phenotype",
            "group by": "group",
            "phenotype map": "kp phenotype map",
            "y axis field": "HuGE_Score",
            "convert y -log10": "false",
            "y axis label": "HuGE Score",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Phenotype", "HuGE_Score", "GWAS_support", "Gene_set_support", "Combined_GWAS_gene_sets"],
            thresholds: [2],
            "label in black": "greater than",
            height: "600",
            "plot margin": {
                left: 150,
                right: 150,
                top: 250,
                bottom: 300,
            },
        },
        plotColors: [
            "#007bff",
            "#048845",
            "#8490C8",
            "#BF61A5",
            "#EE3124",
            "#FCD700",
            "#5555FF",
            "#7aaa1c",
            "#9F78AC",
            "#F88084",
            "#F5A4C7",
            "#CEE6C1",
            "#cccc00",
            "#6FC7B6",
            "#D5A768",
            "#d4d4d4",
        ],
        phewasPlotMargin: {
            leftMargin: 150,
            rightMargin: 40,
            topMargin: 20,
            bottomMargin: 100,
            bump: 11,
        },
        hugeScoreRenderConfig: {
            type: "phewas plot",
            "render by": "phenotype",
            "group by": "group",
            "phenotype map": "kp phenotype map",
            "y axis field": "renderScore",
            "convert y -log10": "false",
            "y axis label": "Log(HuGE score)",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["bf_common", "bf_rare", "huge"],
            thresholds: [Math.log(3), Math.log(30)],
            "label in black": "greater than",
            height: "600",
            "plot margin": {
                left: 150,
                right: 150,
                top: 250,
                bottom: 300,
            },
        },
      };
  },
  async mounted(){
    // Render the initial tab's plot when component is mounted
    this.$nextTick(() => {
      setTimeout(() => {
        this.renderActiveTab();
      }, 1000);
    });
  },
  computed: {
    utilsBox() {
        let utils = {
            Formatters: Formatters,
            uiUtils: uiUtils,
            alertUtils: alertUtils,
            keyParams: keyParams,
            dataConvert: dataConvert,
            sortUtils: sortUtils,
            plotUtils: plotUtils,
            filterUtils: filterUtils,
            regionUtils: regionUtils,
            userUtils: userUtils,
        };
        return utils;
    },
    documentations() {
      return this.$store.state.bioPortal.documentations;
    },
    geneRecord() {
      const geneData = this.$store.state.gene.data;
      return geneData && geneData.length > 0 ? geneData[0] : null;
    },
    restrictedAssociations() {
      return this.$store.state.varassociations.restricted;
    },
    hugeScorePhenotypes() {
      return (this.hugeScores || []).map((score) => score.phenotype);
    },
    pigeanTableItems() {
      const key = this.expandedRowKey;
      return (this.pigeanDataFiltered || []).map((item) => ({
        ...item,
        _rowKey: this.getRowKey(item),
        _showDetails: key !== null && key === this.getRowKey(item),
      }));
    },
    geneSetCellSlot() {
      return "cell(Gene set)";
    },
    geneSetSubtableFields() {
      const topRows = GENE_SET_TABLE_FORMAT["top rows"] || [];
      return topRows.map((key) => ({ key, label: key }));
    },
    ppaByPhenotype() {
      const map = {};
      (this.falconGeneAssociations || []).forEach((row) => {
        const trait = row && (row.TRAIT != null ? row.TRAIT : row.trait);
        if (trait == null || trait === "") {
          return;
        }
        const pipRaw = row.PIP != null ? row.PIP : row.pip;
        if (pipRaw == null || pipRaw === "") {
          return;
        }
        const pip = Number(pipRaw);
        if (Number.isNaN(pip)) {
          return;
        }
        const key = String(trait).toLowerCase();
        if (map[key] == null || pip > map[key]) {
          map[key] = pip;
        }
      });
      return map;
    },
    pigeanDataFiltered() {
      if (!this.pigeanData || !this.phenotypesInSession) {
        return [];
      }
      
      // Create a mapping from raw field names to label field names (using underscores for keys to avoid spaces)
      const fieldMapping = {
        'phenotype': 'Phenotype',
        'label': 'Factor',
        'combined': 'Combined_GWAS_gene_sets',
        'log_bf': 'GWAS_support',
        'prior': 'Gene_set_support',
        'huge_score': 'HuGE_Score'
      };
      
      // Filter and reformat the data
      return this.pigeanData
        .filter(item => this.phenotypesInSession.some(phenotype => phenotype.name === item.phenotype))
        .map(item => {
          // Create a new object with label field names as keys
          const reformattedItem = {};
          
          // Map all fields from raw names to label names
          Object.keys(fieldMapping).forEach(rawKey => {
            if (item.hasOwnProperty(rawKey)) {
              reformattedItem[fieldMapping[rawKey]] = item[rawKey];
            }
          });
          
          // Preserve the original phenotype field for the link (keep lowercase)
          if (item.hasOwnProperty('phenotype')) {
            reformattedItem.phenotype = item.phenotype;
          }

          const ppaKey = item.phenotype != null
            ? String(item.phenotype).toLowerCase()
            : "";
          reformattedItem.PPA = ppaKey && this.ppaByPhenotype[ppaKey] != null
            ? this.ppaByPhenotype[ppaKey]
            : null;
          
          // Preserve other fields that aren't in the mapping
          Object.keys(item).forEach(key => {
            if (!fieldMapping.hasOwnProperty(key) && key !== 'phenotype') {
              reformattedItem[key] = item[key];
            }
          });
          
          return reformattedItem;
        });
    },
    combinedVsHugeData() {
      const hugeByPhenotype = {};
      (this.hugeScores || []).forEach((score) => {
        if (score && score.phenotype) {
          hugeByPhenotype[score.phenotype] = score;
        }
      });
      return (this.pigeanDataFiltered || []).map((item) => {
        const hugeRow = hugeByPhenotype[item.phenotype];
        const hugeValue =
          hugeRow && hugeRow.huge != null && hugeRow.huge !== ""
            ? Number(hugeRow.huge)
            : null;
        const logHuge =
          hugeValue != null && !Number.isNaN(hugeValue) && hugeValue > 0
            ? Math.log(hugeValue)
            : null;
        return {
          ...item,
          HuGE_Score: hugeValue,
          Log_HuGE_Score: logHuge,
        };
      });
    }
  },
  watch: {
    pigeanDataFiltered: {
      handler(newData) {
        if (newData && newData.length > 0 && (this.activeTab === 0 || this.activeTab === 2)) {
          // Use multiple nextTick calls to ensure DOM is ready
          this.$nextTick(() => {
            this.$nextTick(() => {
              setTimeout(() => {
                this.renderActiveTab();
              }, 300);
            });
          });
        }
      },
      immediate: true
    },
    hugeScores: {
      handler() {
        if (this.activeTab === 1 || this.activeTab === 2) {
          this.$nextTick(() => {
            this.$nextTick(() => {
              setTimeout(() => {
                this.renderActiveTab();
              }, 300);
            });
          });
        }
      }
    },
    activeTab() {
      // Bootstrap Vue tabs need extra time to mount the content
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$nextTick(() => {
            setTimeout(() => {
              this.renderActiveTab();
            }, 500);
          });
        });
      });
    }
  },
  methods: {
    phenotypeLabel(phenotype) {
      return this.phenotypeMap && this.phenotypeMap[phenotype]
        ? this.phenotypeMap[phenotype].description
        : phenotype;
    },
    formatScore(value) {
      if (value === null || value === undefined || value === "") {
        return "N/A";
      }
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      return Number.isNaN(numValue) ? "N/A" : numValue.toFixed(2);
    },
    formatPpa(value) {
      if (value === null || value === undefined || value === "") {
        return "N/A";
      }
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      return Number.isNaN(numValue) ? "N/A" : numValue.toFixed(4);
    },
    evidenceRangeClass(value) {
      if (value === null || value === undefined || value === "") {
        return "not-significant";
      }
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (Number.isNaN(numValue) || numValue < 1) {
        return "not-significant";
      }
      if (numValue > 3) {
        return "very-strong";
      }
      if (numValue >= 2) {
        return "strongly-suggestive";
      }
      return "nominally-significant";
    },
    getRowKey(item) {
      return `${item.phenotype || ""}|${item.Factor || ""}`;
    },
    applyGeneSetDataConvert(rawRows) {
      const convertConfig = GENE_SET_TABLE_FORMAT["data convert"];
      const out = [];
      for (const row of rawRows) {
        const obj = {};
        for (const c of convertConfig) {
          const fieldName = c["field name"];
          if (c.type === "raw") {
            let v = row[c["raw field"]];
            if (v === undefined || v === null)
              v = c["if no value"] !== undefined ? c["if no value"] : "";
            if (v === 0) v = "0";
            obj[fieldName] = v;
          } else if (c.type === "translate to categories") {
            const rawVal =
              obj[c["raw field"]] !== undefined
                ? obj[c["raw field"]]
                : row[c["raw field"]] ?? 0;
            obj[fieldName] = translateToCategory(rawVal, c.categories);
          } else if (c.type === "join multi") {
            obj[fieldName] = joinMultiValues(
              c["fields to join"],
              c["join by"],
              row
            );
          }
        }
        out.push(obj);
      }
      return out;
    },
    getGeneSetSubtableData(item) {
      const key = this.getRowKey(item);
      const state = this.geneSetDataByRow[key];
      const data = state && state.data ? state.data : [];
      return data.filter((row) => !geneSetSourceFilteredOut(row.Source));
    },
    getGeneSetSubtablePage(item) {
      const key = this.getRowKey(item);
      return this.geneSetSubtablePageByRow[key] || 1;
    },
    setGeneSetSubtablePage(item, page) {
      const key = this.getRowKey(item);
      this.$set(this.geneSetSubtablePageByRow, key, page);
    },
    formatGeneSetCell(value) {
      if (value == null) return "";
      const s = String(value);
      return s.length > 25 ? s.slice(0, 25) + "…" : s;
    },
    getGeneSetSubtableLoading(item) {
      const key = this.getRowKey(item);
      const state = this.geneSetDataByRow[key];
      return state ? state.loading : false;
    },
    getGeneSetSubtableError(item) {
      const key = this.getRowKey(item);
      const state = this.geneSetDataByRow[key];
      return state && state.error ? state.error : null;
    },
    toggleGeneSetDetails(item) {
      const key = this.getRowKey(item);
      if (this.expandedRowKey === key && this.expandedDetailType === "cfde") {
        this.expandedRowKey = null;
        this.expandedDetailType = null;
        return;
      }
      this.expandedRowKey = key;
      this.expandedDetailType = "cfde";
      const state = this.geneSetDataByRow[key];
      if (
        !state ||
        (!state.loading && !(state.data && state.data.length))
      ) {
        this.fetchGeneSetForRow(item);
      }
    },
    formatFactorGeneSetName(item) {
      const id = item && item.gene_set ? item.gene_set : "";
      const label =
        (item && (item.label || item.gene_set_description)) || "";
      if (label && id && label !== id) {
        return `${label} (${id})`;
      }
      return label || id;
    },
    getFactorGeneSetQueryKey(item) {
      const factor = item.factor || item.cluster || "";
      return `${item.phenotype},${DEFAULT_SIGMA},${DEFAULT_GENESET_SIZE},${factor}`;
    },
    getFactorGeneSetSubtableData(item) {
      const key = this.getFactorGeneSetQueryKey(item);
      const state = this.factorGeneSetDataByRow[key];
      return state && state.data ? state.data : [];
    },
    getFactorGeneSetSubtablePage(item) {
      const key = this.getFactorGeneSetQueryKey(item);
      return this.factorGeneSetSubtablePageByRow[key] || 1;
    },
    setFactorGeneSetSubtablePage(item, page) {
      const key = this.getFactorGeneSetQueryKey(item);
      this.$set(this.factorGeneSetSubtablePageByRow, key, page);
    },
    getFactorGeneSetSubtableLoading(item) {
      const key = this.getFactorGeneSetQueryKey(item);
      const state = this.factorGeneSetDataByRow[key];
      return state ? state.loading : false;
    },
    getFactorGeneSetSubtableError(item) {
      const key = this.getFactorGeneSetQueryKey(item);
      const state = this.factorGeneSetDataByRow[key];
      return state && state.error ? state.error : null;
    },
    toggleFactorGeneSetDetails(item) {
      const key = this.getRowKey(item);
      if (this.expandedRowKey === key && this.expandedDetailType === "factor") {
        this.expandedRowKey = null;
        this.expandedDetailType = null;
        return;
      }
      this.expandedRowKey = key;
      this.expandedDetailType = "factor";
      const queryKey = this.getFactorGeneSetQueryKey(item);
      const state = this.factorGeneSetDataByRow[queryKey];
      if (
        !state ||
        (!state.loading && !(state.data && state.data.length))
      ) {
        this.fetchFactorGeneSetForRow(item);
      }
    },
    async fetchFactorGeneSetForRow(item) {
      const queryKey = this.getFactorGeneSetQueryKey(item);
      const phenotype = item.phenotype;
      const factor = item.factor || item.cluster;
      if (!phenotype || !factor) {
        this.$set(this.factorGeneSetDataByRow, queryKey, {
          loading: false,
          data: [],
          error: "Missing phenotype or factor for gene set query.",
        });
        return;
      }
      this.$set(this.factorGeneSetDataByRow, queryKey, {
        loading: true,
        data: [],
        error: null,
      });
      try {
        const data = await query("pigean-gene-set-factor", queryKey);
        this.$set(this.factorGeneSetDataByRow, queryKey, {
          loading: false,
          data: data || [],
          error: null,
        });
      } catch (err) {
        this.$set(this.factorGeneSetDataByRow, queryKey, {
          loading: false,
          data: [],
          error: err.message || "Failed to load gene sets.",
        });
      }
    },
    async fetchGeneSetForRow(item) {
      const key = this.getRowKey(item);
      const phenotype = item.phenotype;
      if (!phenotype) return;
      this.$set(this.geneSetDataByRow, key, {
        loading: true,
        data: [],
        error: null,
      });
      const url = this.geneSetsApi.replace(
        "$phenotype",
        encodeURIComponent(phenotype)
      );
      try {
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const json = await response.json();
        const rawRows = json.data || json || [];
        const data = this.applyGeneSetDataConvert(rawRows);
        this.$set(this.geneSetDataByRow, key, {
          loading: false,
          data,
          error: null,
        });
      } catch (err) {
        this.$set(this.geneSetDataByRow, key, {
          loading: false,
          data: [],
          error: err.message || "Failed to load gene sets.",
        });
      }
    },
    renderActiveTab() {
      // Render the plot for the currently active tab
      let refName = null;
      if (this.activeTab === 0) {
        refName = 'combinedPhewasPlot';
      } else if (this.activeTab === 1) {
        refName = 'hugeScorePheWASPlot';
      } else if (this.activeTab === 2) {
        refName = 'pigeanPhewasPlot';
      }
      
      if (refName) {
        this.renderPhewas(refName);
      }
    },
    renderPhewas(refName) {
      // Try multiple times with delays to ensure component is ready
      const tryRender = (attempts = 0) => {
        const ref = this.$refs[refName];
        if (ref) {
          // Check if component has renderPheWas method
          if (typeof ref.renderPheWas === 'function') {
            try {
              // Force a re-render by calling renderPheWas
              // This should trigger the rendering even if data hasn't changed
              ref.renderPheWas();
              console.log(`Successfully rendered ${refName}`);
              return; // Success, exit
            } catch (error) {
              console.warn(`Error rendering ${refName}:`, error);
              // Continue retrying on error
            }
          }
        }
        
        // Retry if component not ready or method not available
        if (attempts < 20) {
          setTimeout(() => {
            tryRender(attempts + 1);
          }, 250);
        } else {
          console.warn(`Could not render ${refName} after ${attempts} attempts. Ref exists: ${!!ref}, has method: ${ref && typeof ref.renderPheWas === 'function'}`);
        }
      };
      // Start with a delay to ensure tab content is mounted
      // Bootstrap Vue tabs may need time to mount lazy-loaded content
      setTimeout(() => {
        tryRender();
      }, 600);
    }
  },
});
</script>
<style scoped>
  .loading {
    margin-left: 50px;
  }
  .tab-documentation {
    padding: 20px 0;
  }
  .column-header-with-tooltip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  ::v-deep .very-strong {
    background-color: #4a90e2 !important;
    color: #ffffff !important;
    padding: 2px 4px;
  }
  ::v-deep .strongly-suggestive {
    background-color: #f5a623 !important;
    color: #ffffff !important;
    padding: 2px 4px;
  }
  ::v-deep .nominally-significant {
    background-color: #f8e71c !important;
    color: #333333 !important;
    padding: 2px 4px;
  }
  ::v-deep .not-significant {
    background-color: transparent !important;
  }
  .combined-score-cell {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    gap: 6px;
  }
  .score-piece {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .score-swatch {
    display: inline-block;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    flex-shrink: 0;
  }
  .score-swatch-combined {
    width: 17px;
    height: 17px;
  }
  .score-swatch-part {
    width: 13px;
    height: 13px;
  }
  .score-swatch.very-strong {
    background-color: #4a90e2;
  }
  .score-swatch.strongly-suggestive {
    background-color: #f5a623;
  }
  .score-swatch.nominally-significant {
    background-color: #f8e71c;
  }
  .score-swatch.not-significant {
    background-color: #ffffff;
  }
  .evidence-range-legend {
    font-size: 12px;
    white-space: nowrap;
    margin-bottom: 10px;
    padding-top: 5px;
  }
</style>

