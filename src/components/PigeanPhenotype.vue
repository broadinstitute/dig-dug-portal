<template>
  <div class="card mdkp-card">
    <div class="card-body">
      <h4 class="card-title">
        Genes with genetic support for {{ phenotypeName }}
      </h4>
      
      <!-- Scatter Plot Tabs -->
      <div v-if="pigeanDataFiltered && pigeanDataFiltered.length > 0" class="mb-4">
        <div v-if="filteredScatterPlotData.length === 0" class="alert alert-info">
          <p>No data available for scatter plots. All rows are missing GWAS support or Gene set support values.</p>
          <p>Data rows: {{ pigeanDataFiltered.length }}, Valid scatter plot rows: {{ filteredScatterPlotData.length }}</p>
        </div>
        <b-tabs v-else-if="isFilteredScatterDataReady" v-model="activeTab" class="scatter-plot-tabs">
          <b-tab title="Combined genetic support (GWAS + gene sets)">
            <div class="tab-documentation">
                Documentation for combined genetic support
            </div>
            <research-pigean-phewas-plot
                v-if="pigeanDataFiltered.length > 0"
                ref="combinedPhewasPlot"
                canvas-id="combinedPlot"
                :plot-name="`combined_${phenotypeName}`"
                :phenotypes-data="getFilteredDataForPlot"
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
          </b-tab>
          <b-tab title="GWAS support (HuGE score enhanced(?) with gene set support)">
            <div class="tab-documentation">
                Documentation for GWAS support
            </div>
          <research-pigean-phewas-plot
                v-if="pigeanDataFiltered.length > 0"
                ref="gwasPhewasPlot"
                canvas-id="gwasPlot"
                :plot-name="`gwas_${phenotypeName}`"
                :phenotypes-data="getFilteredDataForPlot"
                :phenotype-map="
                    phenotypeMap
                "
                :colors="plotColors"
                :plot-margin="phewasPlotMargin"
                :render-config="
                    gwasConfig
                "
                :pkg-data="null"
                :pkg-data-selected="null"
                :filter="null"
                :utils="utilsBox"
                :options="['open phenotype page']"
            >
            </research-pigean-phewas-plot>
          </b-tab>
          <!--<b-tab title="GWAS vs Gene Set (by Factor)">
            <div class="tab-documentation">
              Documentation for GWAS vs Gene Set (by Factor)
            </div>
            <div class="scatter-plot-wrapper" :style="scatterPlotWrapperStyle">
              <research-simple-scatter-plot
                :data="filteredScatterPlotData"
                :renderConfig="{
                  xKey: 'Gene_set_support',
                  yKey: 'GWAS_support',
                  colorKey: 'Factor',
                  xLabel: 'Gene Set Support',
                  yLabel: 'GWAS Support',
                  width: 800,
                  height: 300,
                  colors: compareGroupColors,
                  margin: plotMargin,
                  hoverContent: ['Gene', 'Factor', 'Combined_GWAS_gene_sets', 'GWAS_support', 'Gene_set_support',  'Evidence_range', 'HuGE_Score']
                }"
              ></research-simple-scatter-plot>
            </div>
          </b-tab>
          <b-tab title="GWAS vs Gene Set (by Evidence Range)">
            <div class="tab-documentation">
              Documentation for GWAS vs Gene Set (by Evidence Range)
            </div>
            <div class="scatter-plot-wrapper" :style="scatterPlotWrapperStyle">
              <research-simple-scatter-plot
                :data="filteredScatterPlotData"
                :renderConfig="{
                  xKey: 'Gene_set_support',
                  yKey: 'GWAS_support',
                  colorKey: 'Evidence_range',
                  xLabel: 'Gene Set Support',
                  yLabel: 'GWAS Support',
                  width: 800,
                  height: 300,
                  colors: evidenceRangeColors,
                  colorMap: evidenceRangeColorMap,
                  margin: plotMargin,
                  hoverContent: ['Gene', 'Factor', 'Combined_GWAS_gene_sets', 'GWAS_support', 'Gene_set_support',  'Evidence_range', 'HuGE_Score']
                }"
              ></research-simple-scatter-plot>
            </div>
          </b-tab>-->
        </b-tabs>
      </div>
      
      <criterion-function-group v-if="pigeanDataFiltered.length > 0" v-model="currentFilter">
          <filter-enumeration-control
              :field="'Factor'"
              :options="uniqueFactors"
          >
              <div class="label">Factor</div>
          </filter-enumeration-control>
          
          <filter-enumeration-control
              :field="'Evidence_range'"
              :options="evidenceRangeOptions"
              :multiple="true"
              :disable-sort="true"
          >
              <div class="label">Evidence range</div>
          </filter-enumeration-control>
          
          <filter-greater-control 
              :field="'GWAS_support'"
              :predicate="numericPredicate"
              :computed-field="getNumericField('GWAS_support')"
          >
              <div class="label">GWAS support (&ge;)</div>
          </filter-greater-control>
          
          <filter-greater-control 
              :field="'Gene_set_support'"
              :predicate="numericPredicate"
              :computed-field="getNumericField('Gene_set_support')"
          >
              <div class="label">Gene set support (&ge;)</div>
          </filter-greater-control>
          
          <template slot="filtered" slot-scope="{ filter }">
              <div class="mt-3" style="position: relative">
          <div
              v-html="'Total rows: ' + getFilteredData(filter).length"
              class="table-total-rows"
          ></div>
          <div class="text-right mb-2" v-if="getFilteredData(filter).length > 0">
              <data-download
                  :data="getFilteredData(filter)"
                  :filename="`pigean_phenotype_${phenotypeName}`"
              ></data-download>
          </div>
          <div
              v-if="getFilteredData(filter).length > 0"
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
              :items="getFilteredData(filter)" 
              :fields="tableFields"
              :per-page="perPage"
              :current-page="currentPage"
              responsive
          >
              <template v-slot:cell(Gene)="row">
                  <a :href="'/gene.html?gene='+row.item.gene">{{ row.item.Gene }}</a>
              </template>
          </b-table>
          <b-pagination
              v-model="currentPage"
              class="pagination-sm justify-content-center"
              :total-rows="getFilteredData(filter).length"
              :per-page="perPage"
          >          </b-pagination>
              </div>
          </template>
      </criterion-function-group>
      <div v-else class="mt-3" style="position: relative">
          <div class="table-total-rows">Total rows: 0</div>
      </div>
    </div>
  </div>
</template>
<script>
import Vue from "vue";

import DataDownload from "@/components/DataDownload.vue";
import FilterEnumeration from "@/components/criterion/FilterEnumeration.vue";
import FilterGreaterThan from "@/components/criterion/FilterGreaterThan.vue";
import CriterionFunctionGroup from "@/components/criterion/group/CriterionFunctionGroup.vue";
import ResearchSimpleScatterPlot from "@/components/researchPortal/ResearchSimpleScatterPlot.vue";
import ResearchPigeanPheWAS from "@/components/researchPortal/PIGEAN/ResearchPigeanPheWAS.vue";

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

export default Vue.component("pigean-phenotype", {
  components: {
    DataDownload,
    FilterEnumeration,
    FilterGreaterThan,
    CriterionFunctionGroup,
    ResearchSimpleScatterPlot,
    ResearchPigeanPheWAS
  },
  props: ["phenotypeMap", "pigeanData", "filter"],
  data() {
      return {
        perPage: 10,
        currentPage: 1,
        activeTab: 0,
        currentFilter: null,
        combinedConfig: {
            "type": "pigean phewas plot",
            "render by": "Gene",
            "group by": "Factor",
            "phenotype map": null,
            "y axis fields": ["Combined_GWAS_gene_sets","GWAS_support","Gene_set_support"],
            "y axis field labels": ["Combined (GWAS + gene sets)","GWAS support","Gene set support"],
            "primary y axis field": "Combined_GWAS_gene_sets",
            "convert y -log10": "false",
            "y axis label": "Combined (GWAS + gene sets)",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Gene", "Factor", "Combined_GWAS_gene_sets", "GWAS_support", "Gene_set_support", "HuGE_Score"],
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
        gwasConfig: {
            "type": "pigean phewas plot",
            "render by": "Gene",
            "group by": "Factor",
            "phenotype map": null,
            "y axis fields": ["GWAS_support","HuGE_Score"],
            "y axis field labels": ["GWAS support","HuGE Score"],
            "primary y axis field": "GWAS_support",
            "convert y -log10": "false",
            "y axis label": "GWAS support",
            "x axis label": "",
            "beta field": "null",
            "hover content": ["Gene", "Factor", "GWAS_support", "HuGE_Score"],
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
        plotMargin: {
          top: 30,
          bottom: 50,
          left: 60,
          right: 30
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
        compareGroupColors: [
          '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
          '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
          '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
          '#c49c94'
        ],
        evidenceRangeColors: [
          '#4a90e2', // Very Strong
          '#f5a623', // Strongly Suggestive
          '#f8e71c', // Nominally Significant
          '#cccccc'  // Not Significant (using light gray since transparent won't show)
        ],
        tableFields: [
          {
            key: 'Gene',
            label: 'Gene',
            sortable: true
          },
          {
            key: 'Factor',
            label: 'Mechanistic factor',
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
        ]
      };
  },
  computed: {
    scatterPlotWrapperStyle() {
      const plotWidth = 800;
      const plotHeight = 300;
      const legendHeight = 30; // Height for legend above plot
      const totalWidth = plotWidth + (this.plotMargin.left || 0) + (this.plotMargin.right || 0);
      const totalHeight = plotHeight + (this.plotMargin.top || 0) + (this.plotMargin.bottom || 0) + legendHeight;
      return {
        width: totalWidth + 'px',
        height: 'auto'
        //height: totalHeight + 'px'
      };
    },
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
    phenotypeName() {
      // Get phenotype name from the first data item or from store
      if (this.pigeanData && this.pigeanData.length > 0 && this.pigeanData[0].phenotype) {
        const phenotype = this.phenotypeMap && this.phenotypeMap[this.pigeanData[0].phenotype];
        return phenotype ? phenotype.description : this.pigeanData[0].phenotype;
      }
      return 'this phenotype';
    },
    uniqueFactors() {
      if (!this.pigeanDataFiltered || this.pigeanDataFiltered.length === 0) {
        return [];
      }
      const factors = this.pigeanDataFiltered
        .map(item => item.Factor)
        .filter(factor => factor != null && factor !== undefined && factor !== '');
      return [...new Set(factors)].sort();
    },
    evidenceRangeOptions() {
      // Order matches the legend: Very Strong, Strongly Suggestive, Nominally Significant, Not Significant
      return ['Very Strong', 'Strongly Suggestive', 'Nominally Significant', 'Not Significant'];
    },
    evidenceRangeColorMap() {
      // Map evidence range values to their corresponding colors from the legend
      return {
        'Very Strong': '#4a90e2',
        'Strongly Suggestive': '#f5a623',
        'Nominally Significant': '#f8e71c',
        'Not Significant': '#cccccc'
      };
    },
    pigeanDataFiltered() {
      if (!this.pigeanData) {
        return [];
      }
      
      // Create a mapping from raw field names to label field names (using underscores for keys to avoid spaces)
      const fieldMapping = {
        'gene': 'Gene',
        'phenotype': 'Phenotype',
        'label': 'Factor',
        'combined': 'Combined_GWAS_gene_sets',
        'log_bf': 'GWAS_support',
        'prior': 'Gene_set_support',
        'huge_score': 'HuGE_Score'
      };
      
      // Reformat the data
      return this.pigeanData
        .map(item => {
          // Create a new object with label field names as keys
          const reformattedItem = {};
          
          // Map all fields from raw names to label names
          // Always set the field, even if null/undefined, so filters can work properly
          Object.keys(fieldMapping).forEach(rawKey => {
            if (item.hasOwnProperty(rawKey)) {
              reformattedItem[fieldMapping[rawKey]] = item[rawKey];
            } else {
              // Set to null explicitly so the field exists for filtering
              reformattedItem[fieldMapping[rawKey]] = null;
            }
          });
          
          // Preserve the original gene and phenotype fields for the links (keep lowercase)
          if (item.hasOwnProperty('gene')) {
            reformattedItem.gene = item.gene;
          }
          if (item.hasOwnProperty('phenotype')) {
            reformattedItem.phenotype = item.phenotype;
          }
          
          // Preserve other fields that aren't in the mapping
          Object.keys(item).forEach(key => {
            if (!fieldMapping.hasOwnProperty(key) && key !== 'gene' && key !== 'phenotype') {
              reformattedItem[key] = item[key];
            }
          });
          
          // Calculate and add Evidence_range based on Combined_GWAS_gene_sets
          const combined = reformattedItem.Combined_GWAS_gene_sets;
          if (combined !== null && combined !== undefined) {
            const numValue = typeof combined === 'string' ? parseFloat(combined) : combined;
            if (!isNaN(numValue) && isFinite(numValue)) {
              if (numValue > 3) {
                reformattedItem.Evidence_range = 'Very Strong';
              } else if (numValue >= 2 && numValue <= 3) {
                reformattedItem.Evidence_range = 'Strongly Suggestive';
              } else if (numValue >= 1 && numValue < 2) {
                reformattedItem.Evidence_range = 'Nominally Significant';
              } else {
                reformattedItem.Evidence_range = 'Not Significant';
              }
            } else {
              reformattedItem.Evidence_range = 'Not Significant';
            }
          } else {
            reformattedItem.Evidence_range = 'Not Significant';
          }
          
          return reformattedItem;
        });
    },
    scatterPlotData() {
      // Filter out rows with missing GWAS_support or Gene_set_support
      return this.pigeanDataFiltered.filter(item => {
        return item.GWAS_support !== null && 
               item.GWAS_support !== undefined && 
               !isNaN(item.GWAS_support) &&
               item.Gene_set_support !== null && 
               item.Gene_set_support !== undefined && 
               !isNaN(item.Gene_set_support);
      });
    },
    filteredScatterPlotData() {
      // Start with scatter plot data (valid GWAS/Gene_set support)
      let data = this.scatterPlotData;
      
      // Apply user filters if available
      if (this.currentFilter && typeof this.currentFilter === 'function') {
        data = data.filter(this.currentFilter);
      }
      
      return data;
    },
    isDataReady() {
      // Check if we have valid scatter plot data
      return this.scatterPlotData && this.scatterPlotData.length > 0;
    },
    isFilteredScatterDataReady() {
      // Check if we have valid filtered scatter plot data
      return this.filteredScatterPlotData && this.filteredScatterPlotData.length > 0;
    },
    getFilteredDataForPlot() {
      // Return filtered data for the plot using the current filter
      return this.getFilteredData(this.currentFilter);
    }
  },
  methods: {
    getFilteredData(filter) {
      let data = this.pigeanDataFiltered;
      if (filter) {
        data = data.filter(filter);
      }
      return data;
    },
    getNumericField(fieldName) {
      // Return a function that ensures predicate is called
      // When field exists (even if null), return a wrapper object so !!data is true
      // This bypasses the looseMatch bypass for null values
      return (obj) => {
        // Check if field exists in object
        if (obj.hasOwnProperty(fieldName)) {
          const value = obj[fieldName];
          // Return a wrapper object so !!data is true, allowing predicate to be called
          // The predicate will extract the actual value
          return { value: value, exists: true };
        }
        // Field doesn't exist - return marker object
        return { value: undefined, exists: false };
      };
    },
    numericPredicate(value, threshold) {
      // Handle wrapper object from computedField
      let actualValue = value;
      if (value && typeof value === 'object' && value.hasOwnProperty('value')) {
        // Field doesn't exist - exclude
        if (!value.exists) {
          return false;
        }
        actualValue = value.value;
      }
      
      // Exclude null, undefined, NaN, and non-numeric values
      if (actualValue === null || actualValue === undefined || actualValue === '') {
        return false;
      }
      // Convert to number if it's a string
      const numValue = typeof actualValue === 'string' ? parseFloat(actualValue) : Number(actualValue);
      // Check if it's a valid number (not NaN and is finite)
      if (isNaN(numValue) || !isFinite(numValue)) {
        return false;
      }
      return numValue >= threshold;
    },
    renderActiveTab() {
      // Render the plot for the currently active tab
      let refName = null;
      if (this.activeTab === 0) {
        refName = 'combinedPhewasPlot';
      } else if (this.activeTab === 1) {
        refName = 'gwasPhewasPlot';
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
  watch: {
    activeTab(newTab) {
      // Re-render plot when tab changes
      if (this.pigeanDataFiltered && this.pigeanDataFiltered.length > 0) {
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
    currentFilter() {
      // Re-render plot when filter changes (which changes getFilteredDataForPlot)
      this.$nextTick(() => {
        this.$nextTick(() => {
          setTimeout(() => {
            this.renderActiveTab();
          }, 300);
        });
      });
    }
  },
  mounted() {
    // Render initial tab's plot when component is mounted
    if (this.pigeanDataFiltered && this.pigeanDataFiltered.length > 0) {
      this.$nextTick(() => {
        setTimeout(() => {
          this.renderActiveTab();
        }, 1000);
      });
    }
  }
});
</script>
<style scoped>
    .tab-documentation {
    padding: 20px 0;
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
  .scatter-plot-wrapper {
    margin: auto;
  }
</style>
