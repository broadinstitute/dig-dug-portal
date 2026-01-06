<template>
  <div class="card mdkp-card">
    <div class="card-body">
      <h4 class="card-title">
        Traits with genetic support for {{gene}}
      </h4>
      <b-tabs v-model="activeTab">
        <b-tab title="Combined genetic support">
            <div class="tab-documentation">
                Documentation for combined genetic support
            </div>
            <research-phewas-plot
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
            </research-phewas-plot>
        </b-tab>
        <b-tab title="GWAS support">
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
        </b-tab>
      </b-tabs>
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
              :items="pigeanDataFiltered" 
              :fields="tableFields"
              :per-page="perPage"
              :current-page="currentPage"
              responsive
          >
              <template v-slot:cell(Phenotype)="row">
                  <a :href="'/phenotype.html?phenotype='+row.item.phenotype">{{ phenotypeMap[row.item.phenotype] && phenotypeMap[row.item.phenotype]['description'] ? phenotypeMap[row.item.phenotype]['description'] : row.item.Phenotype }}</a>
              </template>
          </b-table>
          <b-pagination
              v-model="currentPage"
              class="pagination-sm justify-content-center"
              :total-rows="pigeanDataFiltered.length"
              :per-page="perPage"
          ></b-pagination>
      </div>
    </div>
  </div>
</template>
<script>
import Vue from "vue";

import ResearchPigeanPheWAS from "@/components/researchPortal/PIGEAN/ResearchPigeanPheWAS.vue";
import DataDownload from "@/components/DataDownload.vue";

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
import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";
export default Vue.component("pigean-gene", {
  components: {
    ResearchPigeanPheWAS,
    DataDownload
  },
  props: ["gene","pigeanData","phenotypeMap","phenotypesInSession"],
  data() {
      return {
        activeTab: 0,
        perPage: 10,
        currentPage: 1,
        tableFields: [
          {
            key: 'Phenotype',
            label: 'Phenotype',
            sortable: true
          },
          {
            key: 'Factor',
            label: 'Factor',
            sortable: true
          },
          {
            key: 'Combined_GWAS_gene_sets',
            label: 'Combined (GWAS + gene sets)',
            sortable: true,
            formatter: (value) => value ? value.toFixed(2) : 'N/A',
            tdClass(value) {
              if (value === null || value === undefined) {
                return '';
              }
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              if (numValue > 3) {
                return 'very-strong';
              } else if (numValue >= 2 && numValue <= 3) {
                return 'strongly-suggestive';
              } else if (numValue >= 1 && numValue < 2) {
                return 'nominally-significant';
              } else {
                return 'not-significant';
              }
            }
          },
          {
            key: 'GWAS_support',
            label: 'GWAS support',
            sortable: true,
            formatter: (value) => value ? value.toFixed(2) : 'N/A'
          },
          {
            key: 'Gene_set_support',
            label: 'Gene set support',
            sortable: true,
            formatter: (value) => value ? value.toFixed(2) : 'N/A'
          },
          {
            key: 'HuGE_Score',
            label: 'HuGE Score',
            sortable: true,
            formatter: (value) => value ? value.toFixed(2) : 'N/A'
          }
        ],
        combinedConfig: {
            type: "phewas plot",
            "render by": "Phenotype",
            "group by": "group",
            "phenotype map": "kp phenotype map",
            "y axis field": "Combined_GWAS_gene_sets",
            "convert y -log10": "false",
            "y axis label": "Combined (GWAS + gene sets)",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Phenotype", "Combined_GWAS_gene_sets", "GWAS_support", "Gene_set_support", "HuGE_Score"],
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
        }
      };
  },
  async mounted(){
    // Render the initial tab's plot when component is mounted
    if (this.pigeanDataFiltered && this.pigeanDataFiltered.length > 0) {
      this.$nextTick(() => {
        setTimeout(() => {
          this.renderPhewas('combinedPhewasPlot');
        }, 1000);
      });
    }
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
          
          // Preserve other fields that aren't in the mapping
          Object.keys(item).forEach(key => {
            if (!fieldMapping.hasOwnProperty(key) && key !== 'phenotype') {
              reformattedItem[key] = item[key];
            }
          });
          
          return reformattedItem;
        });
    }
  },
  watch: {
    pigeanDataFiltered: {
      handler(newData) {
        if (newData && newData.length > 0) {
          // Use multiple nextTick calls to ensure DOM is ready
          this.$nextTick(() => {
            this.$nextTick(() => {
              setTimeout(() => {
                if (this.activeTab === 0) {
                  this.renderPhewas('combinedPhewasPlot');
                } else if (this.activeTab === 1) {
                  this.renderPhewas('gwasPhewasPlot');
                } else if (this.activeTab === 2) {
                  this.renderPhewas('geneSetPhewasPlot');
                } else if (this.activeTab === 3) {
                  this.renderPhewas('hugePhewasPlot');
                }
              }, 300);
            });
          });
        }
      },
      immediate: true
    },
    activeTab(newTab) {
      if (this.pigeanDataFiltered && this.pigeanDataFiltered.length > 0) {
        // Use multiple nextTick calls to ensure tab content is mounted
        this.$nextTick(() => {
          this.$nextTick(() => {
            setTimeout(() => {
              if (newTab === 0) {
                this.renderPhewas('combinedPhewasPlot');
              } else if (newTab === 1) {
                this.renderPhewas('gwasPhewasPlot');
              } else if (newTab === 2) {
                this.renderPhewas('geneSetPhewasPlot');
              } else if (newTab === 3) {
                this.renderPhewas('hugePhewasPlot');
              }
            }, 300);
          });
        });
      }
    }
  },
  methods: {
    renderPhewas(refName) {
      // Try multiple times with delays to ensure component is ready
      const tryRender = (attempts = 0) => {
        const ref = this.$refs[refName];
        if (ref && typeof ref.renderPheWas === 'function') {
          try {
            ref.renderPheWas();
          } catch (error) {
            console.warn(`Error rendering ${refName}:`, error);
          }
        } else if (attempts < 5) {
          // Retry if ref not available yet
          setTimeout(() => {
            tryRender(attempts + 1);
          }, 200);
        }
      };
      setTimeout(() => {
        tryRender();
      }, 100);
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
  .evidence-range-legend {
    font-size: 12px;
    white-space: nowrap;
    margin-bottom: 10px;
    padding-top: 5px;
  }
</style>

