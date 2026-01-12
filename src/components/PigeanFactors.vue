<template>
  <div class="card mdkp-card">
    <div class="card-body">
      <h4 class="card-title">
        {{ title }}
      </h4>

      <div class="mb-4" v-if="pigeanDataFiltered.length > 0">
        <div v-if="heatmapLoading && !heatmapDataLoaded" class="text-center p-3 text-muted">
          Loading heatmap data...
        </div>
        <pigean-factors-viz
          v-else-if="heatmapDataLoaded || Object.keys(heatmapData).length > 0"
          :pigean-factor-data="pigeanDataFiltered"
          :phenotype-name="phenotypeName"
          :heatmap-data="heatmapDataForViz"
          :gene-sets-heatmap-data="geneSetsHeatmapDataForViz"
          height="500px"
        ></pigean-factors-viz>
      </div>

      <div class="mt-3" style="position: relative">
        <div
          v-html="'Total rows: ' + pigeanDataFiltered.length"
          class="table-total-rows"
        ></div>
        <div class="text-right mb-2" v-if="pigeanDataFiltered.length > 0">
          <data-download
            :data="pigeanDataFiltered"
            :filename="`pigean_factors`"
          ></data-download>
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
          <template v-slot:cell(top_gene_sets)="row">
            <span v-if="row.item.top_gene_sets" class="top-gene-sets-cell">
              {{ formatSemicolonList(row.item.top_gene_sets) }}
            </span>
            <span v-else>-</span>
          </template>
          <template v-slot:cell(top_genes)="row">
            <span v-if="row.item.top_genes">
              {{ formatSemicolonList(row.item.top_genes) }}
            </span>
            <span v-else>-</span>
          </template>
          <template v-slot:cell(genes_in_gene_sets)="row">
            <b-button
              variant="outline-primary"
              size="sm"
              @click="toggleSubtable(row)"
            >
              {{ row.detailsShowing && row.item.subtableActive ? "Hide" : "View" }}
            </b-button>
          </template>
          <template v-slot:cell(gene_sets)="row">
            <b-button
              variant="outline-primary"
              size="sm"
              @click="toggleGeneSetsSubtable(row)"
            >
              {{ row.detailsShowing && row.item.geneSetsSubtableActive ? "Hide" : "View" }}
            </b-button>
          </template>
          <template v-slot:row-details="row">
            <div v-if="row.item.subtableActive" class="subtable-container">
              <div v-if="subtableLoading[row.item.factor || row.item.cluster]" class="text-center p-3">
                Loading...
              </div>
              <div v-else-if="subtableData[getSubtableKey(row.item)] && subtableData[getSubtableKey(row.item)].length > 0">
                <div class="subtable-header">
                  <span class="table-total-rows">Total rows: {{ subtableData[getSubtableKey(row.item)].length }}</span>
                </div>
                <b-table
                  striped
                  hover
                  :items="subtableData[getSubtableKey(row.item)]"
                  :fields="subtableFields"
                  :per-page="subtablePerPage"
                  :current-page="getSubtableCurrentPage(row.item)"
                  responsive
                  small
                >
                  <template v-slot:cell(gene)="subRow">
                    <a :href="`/gene.html?gene=${subRow.item.gene}`">
                      {{ subRow.item.gene }}
                    </a>
                  </template>
                  <template v-slot:cell(combined)="subRow">
                    {{ formatNumericValue(subRow.item.combined) }}
                  </template>
                  <template v-slot:cell(gwas_support)="subRow">
                    {{ formatNumericValue(subRow.item.gwas_support) }}
                  </template>
                  <template v-slot:cell(gene_set_support)="subRow">
                    {{ formatNumericValue(subRow.item.gene_set_support) }}
                  </template>
                </b-table>
                <b-pagination
                  v-model="subtableCurrentPages[getSubtableKey(row.item)]"
                  class="pagination-sm justify-content-center mt-2"
                  :total-rows="subtableData[getSubtableKey(row.item)].length"
                  :per-page="subtablePerPage"
                ></b-pagination>
              </div>
              <div v-else class="text-center p-3 text-muted">
                No data available
              </div>
            </div>
            <div v-if="row.item.geneSetsSubtableActive" class="subtable-container">
              <div v-if="subtableLoadingGeneSets[row.item.factor || row.item.cluster]" class="text-center p-3">
                Loading...
              </div>
              <div v-else-if="subtableDataGeneSets[getGeneSetsSubtableKey(row.item)] && subtableDataGeneSets[getGeneSetsSubtableKey(row.item)].length > 0">
                <div class="subtable-header">
                  <span class="table-total-rows">Total rows: {{ subtableDataGeneSets[getGeneSetsSubtableKey(row.item)].length }}</span>
                </div>
                <b-table
                  striped
                  hover
                  :items="subtableDataGeneSets[getGeneSetsSubtableKey(row.item)]"
                  :fields="geneSetsSubtableFields"
                  :per-page="subtablePerPage"
                  :current-page="getGeneSetsSubtableCurrentPage(row.item)"
                  responsive
                  small
                >
                  <template v-slot:cell(gene_set)="subRow">
                    {{ subRow.item.gene_set }}
                  </template>
                  <template v-slot:cell(relevance_to_factor)="subRow">
                    {{ formatNumericValue(subRow.item.relevance_to_factor) }}
                  </template>
                  <template v-slot:cell(beta)="subRow">
                    {{ formatNumericValue(subRow.item.beta) }}
                  </template>
                  <template v-slot:cell(beta_uncorrected)="subRow">
                    {{ formatNumericValue(subRow.item.beta_uncorrected) }}
                  </template>
                </b-table>
                <b-pagination
                  v-model="subtableCurrentPagesGeneSets[getGeneSetsSubtableKey(row.item)]"
                  class="pagination-sm justify-content-center mt-2"
                  :total-rows="subtableDataGeneSets[getGeneSetsSubtableKey(row.item)].length"
                  :per-page="subtablePerPage"
                ></b-pagination>
              </div>
              <div v-else class="text-center p-3 text-muted">
                No data available
              </div>
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
    </div>
  </div>
</template>
<script>
import Vue from "vue";
import DataDownload from "@/components/DataDownload.vue";
import PigeanFactorsViz from "@/components/PigeanFactorsViz.vue";
import { query, DEFAULT_SIGMA } from "@/utils/bioIndexUtils";
import keyParams from "@/utils/keyParams";

export default Vue.component("pigean-factors", {
  components: {
    DataDownload,
    PigeanFactorsViz
  },
  props: {
    pigeanFactorData: {
      type: Array,
      default: () => []
    },
    phenotypeMap: {
      type: Object,
      default: () => ({})
    },
    phenotypesInSession: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: "Mechanistic Factors relevant to the trait"
    }
  },
  data() {
    return {
      perPage: 10,
      currentPage: 1,
      tableFields: [
        {
          key: 'label',
          label: 'Factor',
          sortable: true
        },
        {
          key: 'gene_set_score',
          label: 'Factor relevance to phenotype',
          sortable: true,
          formatter: (value) => value ? value.toFixed(2) : 'N/A'
        },
        {
          key: 'top_gene_sets',
          label: 'Top gene sets',
          sortable: false
        },
        {
          key: 'top_genes',
          label: 'Top genes',
          sortable: false
        },
        {
          key: 'genes_in_gene_sets',
          label: 'Genes relevant to factor',
          sortable: false
        },
        {
          key: 'gene_sets',
          label: 'Gene sets relevant to factor',
          sortable: false
        }
      ],
      subtableFields: [
        {
          key: 'gene',
          label: 'Gene',
          sortable: true
        },
        {
          key: 'relevance_to_factor',
          label: 'Relevance to factor',
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
          key: 'combined',
          label: 'Combined score',
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
          key: 'gwas_support',
          label: 'GWAS support',
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
          key: 'gene_set_support',
          label: 'Gene set support',
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
        }
      ],
      geneSetsSubtableFields: [
        {
          key: 'gene_set',
          label: 'Gene set',
          sortable: true
        },
        {
          key: 'relevance_to_factor',
          label: 'Relevance to factor',
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
          key: 'beta',
          label: 'Joint effect',
          sortable: true,
          formatter: (value) => value ? value.toFixed(2) : 'N/A'
        },
        {
          key: 'beta_uncorrected',
          label: 'Marginal effect',
          sortable: true,
          formatter: (value) => value ? value.toFixed(2) : 'N/A'
        }
      ],
      subtableData: {},
      subtableLoading: {},
      subtablePerPage: 10,
      subtableCurrentPages: {},
      subtableDataGeneSets: {},
      subtableLoadingGeneSets: {},
      subtableCurrentPagesGeneSets: {},
      heatmapData: {}, // Map of gene -> { factor -> factor_value }
      heatmapLoading: false, // Track if heatmap data is still loading
      heatmapDataLoaded: false, // Track if heatmap data has been initially loaded
      geneSetsHeatmapDataLoaded: false // Track if gene sets heatmap data has been loaded
    };
  },
  computed: {
    pigeanDataFiltered() {
      if (!this.pigeanFactorData) {
        return [];
      }
      return this.pigeanFactorData;
    },
    phenotypeName() {
      // Get phenotype name from the first data item or from phenotypeMap
      if (this.pigeanFactorData && this.pigeanFactorData.length > 0 && this.pigeanFactorData[0].phenotype) {
        const phenotype = this.phenotypeMap && this.phenotypeMap[this.pigeanFactorData[0].phenotype];
        return phenotype ? phenotype.description : this.pigeanFactorData[0].phenotype;
      }
      return "Phenotype";
    },
    genesetSize() {
      return keyParams.genesetSize || 'small';
    },
    phenotype() {
      // Get phenotype from the first data item
      if (this.pigeanFactorData && this.pigeanFactorData.length > 0 && this.pigeanFactorData[0].phenotype) {
        return this.pigeanFactorData[0].phenotype;
      }
      return null;
    },
    heatmapDataForViz() {
      // Transform heatmapData into format needed for visualization
      // Returns: { genes: [], factors: [], factorLabels: [], data: [[factor_value]], gwasData: [[log_bf]], geneSetData: [[prior]] }
      const genes = Object.keys(this.heatmapData).sort();
      
      // Create factor mapping: factor ID -> factor label
      const factorMap = {};
      this.pigeanDataFiltered.forEach(f => {
        const factorId = f.factor || f.cluster || '';
        if (factorId) {
          factorMap[factorId] = f.label || factorId;
        }
      });
      
      // Create factor objects with ID, label, and relevance score for sorting
      const factorObjects = this.pigeanDataFiltered
        .map(f => ({
          id: f.factor || f.cluster || '',
          label: f.label || f.factor || f.cluster || '',
          score: f.gene_set_score !== undefined && f.gene_set_score !== null 
            ? (typeof f.gene_set_score === 'number' ? f.gene_set_score : parseFloat(f.gene_set_score) || 0)
            : 0
        }))
        .filter(f => f.id !== '');
      
      // Sort factors by relevance score (descending - higher first)
      factorObjects.sort((a, b) => b.score - a.score);
      
      const factors = factorObjects.map(f => f.id);
      const factorLabels = factorObjects.map(f => f.label);
      const factorScores = factorObjects.map(f => f.score);
      
      const data = genes.map(gene => {
        return factors.map(factor => {
          const cellData = this.heatmapData[gene] && this.heatmapData[gene][factor];
          return cellData && cellData.factor_value !== undefined
            ? cellData.factor_value
            : null;
        });
      });
      
      const gwasData = genes.map(gene => {
        return factors.map(factor => {
          const cellData = this.heatmapData[gene] && this.heatmapData[gene][factor];
          return cellData && cellData.log_bf !== undefined && cellData.log_bf !== null
            ? cellData.log_bf
            : null;
        });
      });
      
      const geneSetData = genes.map(gene => {
        return factors.map(factor => {
          const cellData = this.heatmapData[gene] && this.heatmapData[gene][factor];
          return cellData && cellData.prior !== undefined && cellData.prior !== null
            ? cellData.prior
            : null;
        });
      });
      
      // Get combined, GWAS, and Gene set scores for each gene (same across all factors)
      // Use the first factor's data for each gene
      const combinedScores = genes.map(gene => {
        const firstFactor = factors[0];
        const cellData = this.heatmapData[gene] && this.heatmapData[gene][firstFactor];
        return cellData && cellData.combined !== undefined && cellData.combined !== null
          ? cellData.combined
          : null;
      });
      
      const gwasScores = genes.map(gene => {
        const firstFactor = factors[0];
        const cellData = this.heatmapData[gene] && this.heatmapData[gene][firstFactor];
        return cellData && cellData.log_bf !== undefined && cellData.log_bf !== null
          ? cellData.log_bf
          : null;
      });
      
      const geneSetScores = genes.map(gene => {
        const firstFactor = factors[0];
        const cellData = this.heatmapData[gene] && this.heatmapData[gene][firstFactor];
        return cellData && cellData.prior !== undefined && cellData.prior !== null
          ? cellData.prior
          : null;
      });
      
      return {
        genes,
        factors,
        factorLabels,
        factorScores,
        data,
        gwasData,
        geneSetData,
        combinedScores,
        gwasScores,
        geneSetScores
      };
    },
    geneSetsHeatmapDataForViz() {
      // Transform subtableDataGeneSets into format needed for visualization
      // Returns: { geneSets: [], factors: [], factorLabels: [], data: [[factor_value]] }
      
      if (!this.geneSetsHeatmapDataLoaded || Object.keys(this.subtableDataGeneSets).length === 0) {
        return { geneSets: [], factors: [], factorLabels: [], data: [] };
      }
      
      // Create factor objects with ID, label, and relevance score for sorting (same as heatmapDataForViz)
      const factorObjects = this.pigeanDataFiltered
        .map(f => ({
          id: f.factor || f.cluster || '',
          label: f.label || f.factor || f.cluster || '',
          score: f.gene_set_score !== undefined && f.gene_set_score !== null 
            ? (typeof f.gene_set_score === 'number' ? f.gene_set_score : parseFloat(f.gene_set_score) || 0)
            : 0
        }))
        .filter(f => f.id !== '');
      
      // Sort factors by relevance score (descending - higher first)
      factorObjects.sort((a, b) => b.score - a.score);
      
      const factors = factorObjects.map(f => f.id);
      const factorLabels = factorObjects.map(f => f.label);
      const factorScores = factorObjects.map(f => f.score);
      
      // Collect all unique gene sets across all factors
      const geneSetSet = new Set();
      factors.forEach(factorId => {
        // Find the factor object to get phenotype
        const factorObj = this.pigeanDataFiltered.find(f => (f.factor || f.cluster) === factorId);
        if (factorObj) {
          const key = this.getGeneSetsSubtableKey(factorObj);
          const data = this.subtableDataGeneSets[key] || [];
          data.forEach(item => {
            if (item.gene_set) {
              geneSetSet.add(item.gene_set);
            }
          });
        }
      });
      
      // Sort gene sets alphabetically
      const geneSets = Array.from(geneSetSet).sort();
      
      // Create data matrix: factors (rows) x gene sets (columns)
      // Each cell contains factor_value (relevance_to_factor)
      const data = factors.map(factorId => {
        // Find the factor object to get phenotype
        const factorObj = this.pigeanDataFiltered.find(f => (f.factor || f.cluster) === factorId);
        if (!factorObj) {
          return geneSets.map(() => null);
        }
        const key = this.getGeneSetsSubtableKey(factorObj);
        const factorData = this.subtableDataGeneSets[key] || [];
        
        // Create a map of gene_set -> factor_value for quick lookup
        const geneSetMap = {};
        factorData.forEach(item => {
          if (item.gene_set && item.relevance_to_factor !== undefined && item.relevance_to_factor !== null) {
            geneSetMap[item.gene_set] = item.relevance_to_factor;
          }
        });
        
        // Map each gene set to its factor_value
        return geneSets.map(geneSet => {
          return geneSetMap[geneSet] !== undefined ? geneSetMap[geneSet] : null;
        });
      });
      
      const result = {
        geneSets,
        factors,
        factorLabels,
        factorScores,
        data
      };
      
      console.log('geneSetsHeatmapDataForViz computed:', {
        geneSetsCount: geneSets.length,
        factorsCount: factors.length,
        dataRows: data.length,
        loaded: this.geneSetsHeatmapDataLoaded
      });
      
      return result;
    }
  },
  watch: {
    pigeanFactorData: {
      handler() {
        if (this.pigeanFactorData && this.pigeanFactorData.length > 0) {
          this.loadAllGeneFactorData();
        }
      },
      immediate: true
    }
  },
  mounted() {
    // Load all gene-factor data when component is mounted
    if (this.pigeanFactorData && this.pigeanFactorData.length > 0) {
      this.loadAllGeneFactorData();
    }
  },
  methods: {
    formatSemicolonList(value) {
      if (!value) return '';
      return value.split(';').join(', ');
    },
    formatNumericValue(value) {
      if (value === null || value === undefined || value === '') {
        return 'N/A';
      }
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(numValue)) {
        return 'N/A';
      }
      return numValue.toFixed(2);
    },
    getSubtableKey(item) {
      const factor = item.factor || item.cluster || '';
      return `${item.phenotype},${DEFAULT_SIGMA},${this.genesetSize},${factor}`;
    },
    getSubtableCurrentPage(item) {
      const key = this.getSubtableKey(item);
      if (!this.subtableCurrentPages[key]) {
        Vue.set(this.subtableCurrentPages, key, 1);
      }
      return this.subtableCurrentPages[key];
    },
    getGeneSetsSubtableKey(item) {
      const factor = item.factor || item.cluster || '';
      return `${item.phenotype},2,small,${factor}`;
    },
    getGeneSetsSubtableCurrentPage(item) {
      const key = this.getGeneSetsSubtableKey(item);
      if (!this.subtableCurrentPagesGeneSets[key]) {
        Vue.set(this.subtableCurrentPagesGeneSets, key, 1);
      }
      return this.subtableCurrentPagesGeneSets[key];
    },
    async loadAllGeneFactorData() {
      if (!this.pigeanFactorData || this.pigeanFactorData.length === 0) {
        return;
      }
      
      // If heatmap data is already loaded, don't reload it
      if (this.heatmapDataLoaded && Object.keys(this.heatmapData).length > 0) {
        return;
      }
      
      // Set loading state only if we don't have data yet
      if (Object.keys(this.heatmapData).length === 0) {
        this.heatmapLoading = true;
      }
      
      // Only clear existing heatmap data if it's empty
      if (Object.keys(this.heatmapData).length === 0) {
        this.heatmapData = {};
      }
      
      // Load data for all factors in parallel
      const loadPromises = this.pigeanFactorData.map(async (factor) => {
        const key = this.getSubtableKey(factor);
        const factorId = factor.factor || factor.cluster || '';
        
        if (!this.subtableData[key] && factorId) {
          try {
            const data = await query('pigean-gene-factor', key);
            const mappedData = (data || []).map(item => ({
              gene: item.gene,
              relevance_to_factor: item.factor_value,
              combined: item.combined,
              gwas_support: item.log_bf,
              gene_set_support: item.prior,
              ...item
            }));
            
            Vue.set(this.subtableData, key, mappedData);
            
            // Map data for heatmap: gene -> factor -> {factor_value, log_bf, prior, combined}
            mappedData.forEach(item => {
              if (!this.heatmapData[item.gene]) {
                Vue.set(this.heatmapData, item.gene, {});
              }
              Vue.set(this.heatmapData[item.gene], factorId, {
                factor_value: item.factor_value || null,
                log_bf: item.gwas_support || null,
                prior: item.gene_set_support || null,
                combined: item.combined || null
              });
            });
          } catch (error) {
            console.error(`Error loading data for factor ${factorId}:`, error);
          }
        }
      });
      
      await Promise.all(loadPromises);
      
      // Mark loading as complete and set loaded flag
      this.heatmapLoading = false;
      this.heatmapDataLoaded = true;
      
      // After genes_in_gene_sets data is loaded, preload gene sets data
      this.loadAllGeneSetsData();
    },
    async loadAllGeneSetsData() {
      if (!this.pigeanFactorData || this.pigeanFactorData.length === 0) {
        return;
      }
      
      // Load data for all factors in parallel
      const loadPromises = this.pigeanFactorData.map(async (factor) => {
        const key = this.getGeneSetsSubtableKey(factor);
        const factorId = factor.factor || factor.cluster || '';
        
        if (!this.subtableDataGeneSets[key] && factorId) {
          try {
            const data = await query('pigean-gene-set-factor', key);
            // Map the data to match our table fields
            const mappedData = (data || []).map(item => ({
              gene_set: item.gene_set,
              relevance_to_factor: item.factor_value,
              beta: item.beta,
              beta_uncorrected: item.beta_uncorrected,
              // Keep original fields for reference
              ...item
            }));
            Vue.set(this.subtableDataGeneSets, key, mappedData);
            // Initialize pagination for this subtable
            if (!this.subtableCurrentPagesGeneSets[key]) {
              Vue.set(this.subtableCurrentPagesGeneSets, key, 1);
            }
          } catch (error) {
            console.error(`Error loading gene sets data for factor ${factorId}:`, error);
            Vue.set(this.subtableDataGeneSets, key, []);
          }
        }
      });
      
      await Promise.all(loadPromises);
      
      // Mark gene sets heatmap data as loaded
      this.geneSetsHeatmapDataLoaded = true;
    },
    async toggleSubtable(row) {
      const item = row.item;
      const key = this.getSubtableKey(item);
      const factorId = item.factor || item.cluster || '';
      
      // Initialize subtableActive if not exists
      if (!item.hasOwnProperty('subtableActive')) {
        Vue.set(item, 'subtableActive', false);
      }
      
      // Toggle details
      if (row.detailsShowing && item.subtableActive) {
        // Hide
        row.toggleDetails();
        item.subtableActive = false;
      } else {
        // Show
        if (!row.detailsShowing) {
          row.toggleDetails();
        }
        item.subtableActive = true;
        
        // Load data if not already loaded
        if (!this.subtableData[key]) {
          Vue.set(this.subtableLoading, factorId, true);
          try {
            const data = await query('pigean-gene-factor', key);
            // Map the data to match our table fields
            const mappedData = (data || []).map(item => ({
              gene: item.gene,
              relevance_to_factor: item.factor_value,
              combined: item.combined,
              gwas_support: item.log_bf,
              gene_set_support: item.prior,
              // Keep original fields for reference
              ...item
            }));
            Vue.set(this.subtableData, key, mappedData);
            // Initialize pagination for this subtable
            if (!this.subtableCurrentPages[key]) {
              Vue.set(this.subtableCurrentPages, key, 1);
            }
          } catch (error) {
            console.error('Error loading subtable data:', error);
            Vue.set(this.subtableData, key, []);
          } finally {
            Vue.set(this.subtableLoading, factorId, false);
          }
        }
      }
    },
    async toggleGeneSetsSubtable(row) {
      const item = row.item;
      const key = this.getGeneSetsSubtableKey(item);
      const factorId = item.factor || item.cluster || '';
      
      // Initialize geneSetsSubtableActive if not exists
      if (!item.hasOwnProperty('geneSetsSubtableActive')) {
        Vue.set(item, 'geneSetsSubtableActive', false);
      }
      
      // Toggle details
      if (row.detailsShowing && item.geneSetsSubtableActive) {
        // Hide
        row.toggleDetails();
        item.geneSetsSubtableActive = false;
      } else {
        // Show
        if (!row.detailsShowing) {
          row.toggleDetails();
        }
        item.geneSetsSubtableActive = true;
        
        // Load data if not already loaded
        if (!this.subtableDataGeneSets[key]) {
          Vue.set(this.subtableLoadingGeneSets, factorId, true);
          try {
            const data = await query('pigean-gene-set-factor', key);
            // Map the data to match our table fields
            const mappedData = (data || []).map(item => ({
              gene_set: item.gene_set,
              relevance_to_factor: item.factor_value,
              beta: item.beta,
              beta_uncorrected: item.beta_uncorrected,
              // Keep original fields for reference
              ...item
            }));
            Vue.set(this.subtableDataGeneSets, key, mappedData);
            // Initialize pagination for this subtable
            if (!this.subtableCurrentPagesGeneSets[key]) {
              Vue.set(this.subtableCurrentPagesGeneSets, key, 1);
            }
          } catch (error) {
            console.error('Error loading gene sets subtable data:', error);
            Vue.set(this.subtableDataGeneSets, key, []);
          } finally {
            Vue.set(this.subtableLoadingGeneSets, factorId, false);
          }
        }
      }
    }
  }
});
</script>
<style scoped>
.subtable-container {
  background-color: #f8f9fa;
  padding: 15px;
  margin: 10px 0;
  border-radius: 4px;
}

.subtable-header {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
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

::v-deep .top-gene-sets-cell {
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  max-width: 300px;
  display: inline-block;
}
</style>
