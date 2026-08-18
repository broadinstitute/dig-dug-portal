<template>
  <div class="card mdkp-card">
    <div class="card-body">
      <h4 class="card-title">
        Genes with genetic support for {{ phenotypeName }}
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
                :plot-name="`combined_${phenotypeKey}`"
                :phenotypes-data="pigeanDataFiltered"
                :phenotype-map="phenotypeMap"
                :colors="plotColors"
                :plot-margin="phewasPlotMargin"
                :render-config="combinedConfig"
                :pkg-data="null"
                :pkg-data-selected="null"
                :filter="null"
                :utils="utilsBox"
                :options="['open gene page']"
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
                        :filename="`pigean_phenotype_${phenotypeKey}`"
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
                    :items="pigeanDataFiltered"
                    :fields="tableFields"
                    :per-page="perPage"
                    :current-page="currentPage"
                    responsive
                >
                    <template #head(Combined_GWAS_gene_sets)="data">
                        <span class="column-header-with-tooltip">
                            <span>{{ data.label }}</span>
                            <span @click.stop>
                                <tooltip-documentation
                                    name="pigean.phenotype.column.pigean.tooltip"
                                    :is-hover="true"
                                    :no-icon="false"
                                    supply-text="Placeholder documentation for PIGEAN scores (combined, GWAS support, and gene set support)."
                                ></tooltip-documentation>
                            </span>
                        </span>
                    </template>
                    <template #head(Factor)="data">
                        <span class="column-header-with-tooltip">
                            <span>{{ data.label }}</span>
                            <span @click.stop>
                                <tooltip-documentation
                                    name="pigean.phenotype.column.eaggl.tooltip"
                                    :is-hover="true"
                                    :no-icon="false"
                                    supply-text="Placeholder documentation for the EAGGL mechanistic factor."
                                ></tooltip-documentation>
                            </span>
                        </span>
                    </template>
                    <template v-slot:cell(Gene)="row">
                        <a :href="'/gene.html?gene='+row.item.gene">{{ row.item.Gene }}</a>
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
                    :field="'gene'"
                    placeholder="Select a gene ..."
                    :options="hugeScoreGenes"
                    :multiple="true"
                >
                    <div class="label">Genes</div>
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
                    <research-pigean-phewas-plot
                        v-if="hugePhewasData.length > 0"
                        ref="hugeScorePhewasPlot"
                        canvas-id="hugeScorePlot"
                        :plot-name="`huge_scores_${phenotypeKey}`"
                        :phenotypes-data="hugePhewasData"
                        :phenotype-map="phenotypeMap"
                        :colors="plotColors"
                        :plot-margin="phewasPlotMargin"
                        :render-config="hugeScoreRenderConfig"
                        :pkg-data="null"
                        :pkg-data-selected="null"
                        :filter="filter"
                        :utils="utilsBox"
                        :options="['open gene page']"
                    >
                    </research-pigean-phewas-plot>
                    <huge-scores-table
                        v-if="hugeScores && hugeScores.length > 0"
                        lead-table-field="gene"
                        :page-key="phenotypeKey"
                        :huge-scores="hugeScores"
                        :phenotype-map="phenotypeMap"
                        :filter="filter"
                        :hide-cfde-gene-sets="true"
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
                :plot-name="`combined_vs_huge_${phenotypeKey}`"
                :phenotypes-data="combinedVsHugeData"
                :phenotype-map="phenotypeMap"
                :colors="plotColors"
                :plot-margin="phewasPlotMargin"
                :render-config="pigeanConfig"
                :pkg-data="null"
                :pkg-data-selected="null"
                :filter="null"
                :utils="utilsBox"
                :options="['open gene page']"
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
                        :filename="`combined_vs_huge_${phenotypeKey}`"
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
                    <template v-slot:cell(Gene)="row">
                        <a :href="'/gene.html?gene='+row.item.gene">{{ row.item.Gene }}</a>
                    </template>
                    <template #cell(Combined_GWAS_gene_sets)="row">
                        <span class="score-piece">
                            <span
                                :class="['score-swatch', 'score-swatch-combined', evidenceRangeClass(row.item.Combined_GWAS_gene_sets)]"
                            ></span>
                            {{ formatScore(row.item.Combined_GWAS_gene_sets) }}
                        </span>
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
      </b-tabs>
    </div>
  </div>
</template>
<script>
import Vue from "vue";

import DataDownload from "@/components/DataDownload.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import ResearchPigeanPheWAS from "@/components/researchPortal/PIGEAN/ResearchPigeanPheWAS.vue";
import HugeScoresTable from "@/components/HugeScoresTable.vue";
import Documentation from "@/components/Documentation.vue";
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

export default Vue.component("pigean-phenotype", {
  components: {
    DataDownload,
    FilterEnumeration,
    FilterGreaterThan,
    CriterionFunctionGroup,
    ResearchPigeanPheWAS,
    HugeScoresTable,
    Documentation,
    TooltipDocumentation,
  },
  props: ["phenotypeMap", "pigeanData", "hugeScores", "phenotype", "docDetails", "filter"],
  data() {
      return {
        perPage: 10,
        currentPage: 1,
        combinedVsHugePage: 1,
        activeTab: 0,
        combinedConfig: {
            "type": "pigean phewas plot",
            "render by": "Gene",
            "group by": "Factor",
            "phenotype map": null,
            "y axis fields": ["Combined_GWAS_gene_sets","GWAS_support","Gene_set_support"],
            "y axis field labels": ["Combined (GWAS support + Gene set support)","GWAS support","Gene set support"],
            "primary y axis field": "Combined_GWAS_gene_sets",
            "convert y -log10": "false",
            "y axis label": "Combined (GWAS + gene sets)",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Gene", "Factor", "Combined_GWAS_gene_sets", "GWAS_support", "Gene_set_support"],
            "filter by threshold": true,
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
        pigeanConfig: {
            "type": "pigean phewas plot",
            "render by": "Gene",
            "group by": "Factor",
            "phenotype map": null,
            "y axis fields": ["Combined_GWAS_gene_sets","Log_HuGE_Score"],
            "y axis field labels": ["Combined score","Log(HuGE scores)"],
            "primary y axis field": "Combined_GWAS_gene_sets",
            "secondary y axis field": "Log_HuGE_Score",
            "secondary y axis label": "Log(HuGE scores)",
            "convert y -log10": "false",
            "y axis label": "Combined score",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Gene", "Factor","Combined_GWAS_gene_sets", "HuGE_Score", "Log_HuGE_Score"],
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
        hugeScoreRenderConfig: {
            "type": "pigean phewas plot",
            "render by": "Gene",
            "group by": "Factor",
            "phenotype map": null,
            "y axis field": "renderScore",
            "convert y -log10": "false",
            "y axis label": "Log(HuGE score)",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Gene", "Factor", "huge"],
            "filter by threshold": true,
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
        phewasPlotMargin: {
            leftMargin: 150,
            rightMargin: 40,
            topMargin: 20,
            bottomMargin: 100,
            bump: 11,
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
        tableFields: [
          {
            key: 'Gene',
            label: 'Gene',
            sortable: true
          },
          {
            key: 'Combined_GWAS_gene_sets',
            label: 'PIGEAN scores (combined | GWAS support | gene set support)',
            sortable: true
          },
          {
            key: 'Factor',
            label: 'EAGGL Mechanistic factor',
            sortable: true
          }
        ],
        combinedVsHugeFields: [
          {
            key: 'Gene',
            label: 'Gene',
            sortable: true
          },
          {
            key: 'Combined_GWAS_gene_sets',
            label: 'Combined score',
            sortable: true
          },
          {
            key: 'HuGE_Score',
            label: 'HuGE score',
            sortable: true
          }
        ]
      };
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
    phenotypeKey() {
      if (this.phenotype && this.phenotype.name) {
        return this.phenotype.name;
      }
      if (this.pigeanData && this.pigeanData.length > 0 && this.pigeanData[0].phenotype) {
        return this.pigeanData[0].phenotype;
      }
      return "";
    },
    phenotypeName() {
      if (this.phenotype && this.phenotype.description) {
        return this.phenotype.description;
      }
      const key = this.phenotypeKey;
      if (key && this.phenotypeMap && this.phenotypeMap[key]) {
        return this.phenotypeMap[key].description;
      }
      return key || "this phenotype";
    },
    hugeScoreGenes() {
      return (this.hugeScores || []).map((score) => score.gene).filter(Boolean);
    },
    hugePhewasData() {
      const factorByGene = {};
      (this.pigeanDataFiltered || []).forEach((item) => {
        if (!item.gene) {
          return;
        }
        const key = String(item.gene).toLowerCase();
        const combined = Number(item.Combined_GWAS_gene_sets);
        const existing = factorByGene[key];
        if (
          !existing ||
          (!Number.isNaN(combined) && combined > existing.combined)
        ) {
          factorByGene[key] = {
            factor: item.Factor || "N/A",
            combined: Number.isNaN(combined) ? -Infinity : combined,
          };
        }
      });
      return (this.hugeScores || []).map((score) => {
        const gene = score.gene;
        const hugeValue =
          score.huge != null && score.huge !== "" ? Number(score.huge) : null;
        const renderScore =
          hugeValue != null && !Number.isNaN(hugeValue) && hugeValue > 0
            ? Math.log(hugeValue)
            : null;
        const factorInfo =
          gene != null ? factorByGene[String(gene).toLowerCase()] : null;
        return {
          ...score,
          Gene: gene,
          gene,
          Factor: factorInfo ? factorInfo.factor : "N/A",
          renderScore,
        };
      });
    },
    pigeanDataFiltered() {
      if (!this.pigeanData) {
        return [];
      }

      const fieldMapping = {
        'gene': 'Gene',
        'phenotype': 'Phenotype',
        'label': 'Factor',
        'combined': 'Combined_GWAS_gene_sets',
        'log_bf': 'GWAS_support',
        'prior': 'Gene_set_support',
        'huge_score': 'HuGE_Score'
      };

      return this.pigeanData
        .map(item => {
          const reformattedItem = {};

          Object.keys(fieldMapping).forEach(rawKey => {
            if (item.hasOwnProperty(rawKey)) {
              reformattedItem[fieldMapping[rawKey]] = item[rawKey];
            }
          });

          if (item.hasOwnProperty('gene')) {
            reformattedItem.gene = item.gene;
          }
          if (item.hasOwnProperty('phenotype')) {
            reformattedItem.phenotype = item.phenotype;
          }

          Object.keys(item).forEach(key => {
            if (!fieldMapping.hasOwnProperty(key) && key !== 'gene' && key !== 'phenotype') {
              reformattedItem[key] = item[key];
            }
          });

          return reformattedItem;
        });
    },
    combinedVsHugeData() {
      const hugeByGene = {};
      (this.hugeScores || []).forEach((score) => {
        if (score && score.gene) {
          hugeByGene[String(score.gene).toLowerCase()] = score;
        }
      });
      return (this.pigeanDataFiltered || []).map((item) => {
        const geneKey = item.gene != null ? String(item.gene).toLowerCase() : "";
        const hugeRow = geneKey ? hugeByGene[geneKey] : null;
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
        if (newData && newData.length > 0 && (this.activeTab === 0 || this.activeTab === 1 || this.activeTab === 2)) {
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
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.renderActiveTab();
      }, 1000);
    });
  },
  methods: {
    formatScore(value) {
      if (value === null || value === undefined || value === "") {
        return "N/A";
      }
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      return Number.isNaN(numValue) ? "N/A" : numValue.toFixed(2);
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
    renderActiveTab() {
      let refName = null;
      if (this.activeTab === 0) {
        refName = 'combinedPhewasPlot';
      } else if (this.activeTab === 1) {
        refName = 'hugeScorePhewasPlot';
      } else if (this.activeTab === 2) {
        refName = 'pigeanPhewasPlot';
      }

      if (refName) {
        this.renderPhewas(refName);
      }
    },
    renderPhewas(refName) {
      const tryRender = (attempts = 0) => {
        const ref = this.$refs[refName];
        if (ref) {
          if (typeof ref.renderPheWas === 'function') {
            try {
              ref.renderPheWas();
              return;
            } catch (error) {
              console.warn(`Error rendering ${refName}:`, error);
            }
          }
        }

        if (attempts < 20) {
          setTimeout(() => {
            tryRender(attempts + 1);
          }, 250);
        }
      };
      setTimeout(() => {
        tryRender();
      }, 600);
    }
  }
});
</script>
<style scoped>
  .tab-documentation {
    padding: 20px 0;
  }
  .column-header-with-tooltip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
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
  ::v-deep .very-strong {
    background-color: #4a90e2 !important;
    color: #ffffff !important;
    padding: 2px 4px;
    border-radius: 2px;
  }
  ::v-deep .strongly-suggestive {
    background-color: #f5a623 !important;
    color: #ffffff !important;
    padding: 2px 4px;
    border-radius: 2px;
  }
  ::v-deep .nominally-significant {
    background-color: #f8e71c !important;
    color: #333333 !important;
    padding: 2px 4px;
    border-radius: 2px;
  }
  ::v-deep .not-significant {
    background-color: transparent !important;
  }
</style>
