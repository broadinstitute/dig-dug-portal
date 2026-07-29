<template>
  <div class="factors-viz-container" :style="containerStyle">
    <div v-if="error" class="error-alert">
      {{ error }}
    </div>
    <b-tabs v-model="activeTab" class="heatmap-tabs">
      <b-tab title="Factors × Genes" active>
        <div class="viz-legend" v-if="!loading && heatmapData && heatmapData.genes && heatmapData.genes.length > 0">
          <div class="legend-content">
            <div class="legend-item">
              <span class="legend-label">Phenotype associations:</span>
              <span class="legend-color-item">
                <span class="legend-color very-strong"></span>
                <span class="legend-color-text">Very Strong (&gt; 3)</span>
              </span>
              <span class="legend-color-item">
                <span class="legend-color strongly-suggestive"></span>
                <span class="legend-color-text">Strongly Suggestive (2-3)</span>
              </span>
              <span class="legend-color-item">
                <span class="legend-color nominally-significant"></span>
                <span class="legend-color-text">Nominally Significant (1-2)</span>
              </span>
              <span class="legend-color-item">
                <span class="legend-color not-significant"></span>
                <span class="legend-color-text">Not Significant (&lt; 1)</span>
              </span>
            </div>
            <div class="legend-item">
              <span class="legend-label">Factor relevance:</span>
              <span class="legend-color factor-relevance"></span>
              <span class="legend-text">Darker = more relevant</span>
            </div>
          </div>
          <div class="legend-actions">
            <button class="btn btn-sm btn-outline-primary" @click="downloadHeatmap">
              Download
            </button>
          </div>
        </div>
        <div class="heatmap-container">
          <div v-if="!heatmapData || !heatmapData.genes || heatmapData.genes.length === 0" class="text-center p-3 text-muted">
            Loading heatmap data...
          </div>
          <div v-else class="heatmap-scrollable-wrapper">
            <div class="heatmap-labels-fixed" ref="heatmapLabelsContainer"></div>
            <div class="heatmap-content-scrollable" ref="heatmapContainer"></div>
          </div>
        </div>
      </b-tab>
      <b-tab title="Factors × Gene Sets">
        <div class="viz-legend" v-if="!loading && geneSetsHeatmapData && geneSetsHeatmapData.geneSets && geneSetsHeatmapData.geneSets.length > 0">
          <div class="legend-content">
            <div class="legend-item">
              <span class="legend-label">Factor relevance:</span>
              <span class="legend-color factor-relevance"></span>
              <span class="legend-text">Darker = more relevant</span>
            </div>
          </div>
          <div class="legend-actions">
            <button class="btn btn-sm btn-outline-primary" @click="downloadGeneSetsHeatmap">
              Download
            </button>
          </div>
        </div>
        <div class="heatmap-container gene-sets-heatmap-container">
          <div v-if="!geneSetsHeatmapData || !geneSetsHeatmapData.geneSets || geneSetsHeatmapData.geneSets.length === 0" class="text-center p-3 text-muted">
            Loading gene sets heatmap data...
          </div>
          <div v-else class="heatmap-scrollable-wrapper">
            <div class="heatmap-labels-fixed" ref="geneSetsHeatmapLabelsContainer"></div>
            <div class="heatmap-content-scrollable" ref="geneSetsHeatmapContainer"></div>
          </div>
        </div>
      </b-tab>
    </b-tabs>
    <div v-if="loading" class="loading">Loading visualization...</div>
  </div>
</template>
<script>
import Vue from "vue";
import JSZip from "jszip";

export default Vue.component("pigean-factors-viz", {
  props: {
    pigeanFactorData: {
      type: Array,
      default: () => []
    },
    phenotypeName: {
      type: String,
      default: ""
    },
    height: {
      type: String,
      default: "600px"
    },
    heatmapData: {
      type: Object,
      default: () => ({ genes: [], factors: [], data: [] })
    },
    geneSetsHeatmapData: {
      type: Object,
      default: () => ({ geneSets: [], factors: [], data: [] })
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      activeTab: 0
    };
  },
  computed: {
    containerStyle() {
      // Calculate dynamic height based on number of factors
      let dynamicHeight = this.height;
      
      if (this.heatmapData && this.heatmapData.factors && this.heatmapData.factors.length > 0) {
        const numSpecialRows = 3; // Combined score, GWAS support, Gene set support
        const numFactors = this.heatmapData.factors.length;
        const cellHeight = 20;
        const margin = { top: 100, bottom: 20 };
        const legendHeight = 60; // Approximate legend height
        const scrollbarHeight = 30; // Extra height for scrollbar visibility
        const extraPadding = 100; // Extra padding to prevent cutoff
        const totalRows = numSpecialRows + numFactors;
        const calculatedHeight = totalRows * cellHeight + margin.top + margin.bottom + legendHeight + scrollbarHeight + extraPadding;
        
        // Use calculated height if it's larger than the default, but set a reasonable max
        const minHeight = parseInt(this.height) || 500;
        const maxHeight = 2000; // Maximum height to prevent extremely tall containers
        dynamicHeight = Math.min(Math.max(calculatedHeight, minHeight), maxHeight) + 'px';
      }
      
      return {
        height: dynamicHeight,
        width: "100%",
        position: "relative",
        background: "#fff"
      };
    }
  },
  watch: {
    heatmapData: {
      handler() {
        // Clean up any orphaned tooltips before rendering
        this.cleanupTooltips();
        this.$nextTick(() => {
          setTimeout(() => {
            this.renderHeatmap();
          }, 100);
        });
      },
      deep: true,
      immediate: true
    },
    geneSetsHeatmapData: {
      handler(newVal, oldVal) {
        console.log('geneSetsHeatmapData watcher triggered', { 
          newVal, 
          hasGeneSets: newVal && newVal.geneSets && newVal.geneSets.length > 0,
          geneSetsLength: newVal && newVal.geneSets ? newVal.geneSets.length : 0
        });
        // Clean up any orphaned tooltips before rendering
        this.cleanupTooltips();
        if (newVal && newVal.geneSets && newVal.geneSets.length > 0) {
          this.$nextTick(() => {
            setTimeout(() => {
              this.renderGeneSetsHeatmap();
            }, 300);
          });
        }
      },
      deep: true,
      immediate: true
    },
    activeTab() {
      // Clean up tooltips when switching tabs
      this.cleanupTooltips();
    }
  },
  mounted() {
    this.$nextTick(() => {
      // Render heatmap if data is available
      if (this.heatmapData && this.heatmapData.genes && this.heatmapData.genes.length > 0) {
        setTimeout(() => {
          this.renderHeatmap();
        }, 200);
      }
      // Render gene sets heatmap if data is available
      if (this.geneSetsHeatmapData && this.geneSetsHeatmapData.geneSets && this.geneSetsHeatmapData.geneSets.length > 0) {
        setTimeout(() => {
          this.renderGeneSetsHeatmap();
        }, 400);
      }
    });
  },
  beforeDestroy() {
    // Clean up all tooltips when component is destroyed
    this.cleanupTooltips();
  },
  methods: {
    cleanupTooltips() {
      // Remove any orphaned tooltips from the DOM
      const existingTooltips = document.querySelectorAll('.heatmap-tooltip');
      existingTooltips.forEach(tooltip => {
        try {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
        } catch (e) {
          // Tooltip already removed
        }
      });
    },
    // Truncate label if too long
    truncateLabel(label, maxLength = 30) {
      if (!label || label.length <= maxLength) {
        return label;
      }
      return label.substring(0, maxLength - 3) + '...';
    },
    // Get color based on score using same thresholds as PigeanPhenotype.vue table
    // Very Strong (> 3): #4a90e2, Strongly Suggestive (2-3): #f5a623
    // Nominally Significant (1-2): #f8e71c, Not Significant (< 1): #cccccc
    getColorByScore(score) {
      if (score > 3) {
        // Very Strong - blue
        return { background: "#4a90e2", border: "#2c5aa0" };
      } else if (score >= 2 && score <= 3) {
        // Strongly Suggestive - orange
        return { background: "#f5a623", border: "#d68910" };
      } else if (score >= 1 && score < 2) {
        // Nominally Significant - yellow
        return { background: "#f8e71c", border: "#d4c716" };
      } else {
        // Not Significant - gray
        return { background: "#cccccc", border: "#999999" };
      }
    },
    renderHeatmap() {
      console.log('renderHeatmap called', this.heatmapData);
      
      if (!this.heatmapData || !this.heatmapData.genes || this.heatmapData.genes.length === 0) {
        console.log('No heatmap data or empty genes array');
        return;
      }
      
      if (!this.$refs.heatmapContainer || !this.$refs.heatmapLabelsContainer) {
        console.log('heatmapContainer or heatmapLabelsContainer ref not found');
        return;
      }
      
      // Clear previous heatmap and clean up any orphaned tooltips
      // Remove any tooltips that might still be in the DOM
      const existingTooltips = document.querySelectorAll('.heatmap-tooltip');
      existingTooltips.forEach(tooltip => {
        try {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
        } catch (e) {
          // Tooltip already removed
        }
      });
      
      // Clear previous heatmap
      this.$refs.heatmapContainer.innerHTML = '';
      this.$refs.heatmapLabelsContainer.innerHTML = '';
      
      let { genes, factors, factorLabels, factorScores, data, gwasData, geneSetData, combinedScores, gwasScores, geneSetScores } = this.heatmapData;
      const labels = factorLabels || factors; // Use labels if available, otherwise use factor IDs
      
      // Factors are already sorted by relevance score in PigeanFactors.vue, but ensure we have scores
      const relevanceScores = factorScores || factors.map(() => 0);
      
      console.log('Heatmap data:', { genes: genes.length, factors: factors.length, data: data ? data.length : 0 });
      
      if (genes.length === 0 || factors.length === 0) {
        console.log('Empty genes or factors array');
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No data array');
        return;
      }
      
      // Sort genes by combined score (descending - bigger first)
      if (combinedScores && combinedScores.length === genes.length) {
        // Create array of indices with scores for sorting
        const geneIndices = genes.map((gene, index) => ({
          gene,
          index,
          score: combinedScores[index] !== null && combinedScores[index] !== undefined ? combinedScores[index] : -Infinity
        }));
        
        // Sort by score descending
        geneIndices.sort((a, b) => b.score - a.score);
        
        // Reorder genes and all related arrays
        const sortedGenes = geneIndices.map(item => item.gene);
        const sortedData = geneIndices.map(item => data[item.index]);
        const sortedGwasData = gwasData ? geneIndices.map(item => gwasData[item.index]) : [];
        const sortedGeneSetData = geneSetData ? geneIndices.map(item => geneSetData[item.index]) : [];
        const sortedCombinedScores = geneIndices.map(item => combinedScores[item.index]);
        const sortedGwasScores = gwasScores ? geneIndices.map(item => gwasScores[item.index]) : [];
        const sortedGeneSetScores = geneSetScores ? geneIndices.map(item => geneSetScores[item.index]) : [];
        
        // Update variables
        genes = sortedGenes;
        data = sortedData;
        gwasData = sortedGwasData;
        geneSetData = sortedGeneSetData;
        combinedScores = sortedCombinedScores;
        gwasScores = sortedGwasScores;
        geneSetScores = sortedGeneSetScores;
      }
      
      // Calculate dimensions (swapped: genes on x-axis, factors on y-axis)
      // Add 3 extra rows for Combined score, GWAS support, and Gene set support
      // Add 1 extra column for factor relevance score in y-axis labels
      const numSpecialRows = 3;
      const relevanceColumnWidth = 20; // Fixed width for relevance score column in y-axis labels
      const cellWidth = Math.max(30, 300 / genes.length); // Dynamic width based on number of genes
      const cellHeight = 20;
      const labelWidth = 200 + relevanceColumnWidth; // Width for fixed factor labels + relevance column
      const margin = { top: 100, right: 20, bottom: 20, left: 0 }; // Increased top margin for x-axis labels and rotated relevance label
      const labelMargin = { top: 100, right: 0, bottom: 20, left: 10 }; // Match top margin - increased to accommodate rotated label
      
      const scrollableWidth = Math.max(600, genes.length * cellWidth + margin.left + margin.right);
      const totalRows = numSpecialRows + factors.length;
      const height = totalRows * cellHeight + margin.top + margin.bottom;
      
      // Background color for cells - using purple gradient (different from network colors)
      const getBackgroundColor = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
          return '#f0f0f0'; // Light gray for missing values
        }
        
        // Clamp value to 0-1 range
        const clampedValue = Math.max(0, Math.min(1, value));
        
        // Create gradient from light purple to dark purple
        const r1 = 243, g1 = 229, b1 = 245; // Light purple
        const r2 = 156, g2 = 39, b2 = 176;  // Dark purple
        
        const r = Math.round(r1 + (r2 - r1) * clampedValue);
        const g = Math.round(g1 + (g2 - g1) * clampedValue);
        const b = Math.round(b1 + (b2 - b1) * clampedValue);
        
        return `rgb(${r}, ${g}, ${b})`;
      };
      
      // Create fixed labels SVG (y-axis labels + relevance column)
      const labelsSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      labelsSvg.setAttribute('width', labelWidth);
      labelsSvg.setAttribute('height', height);
      labelsSvg.setAttribute('class', 'heatmap-labels-svg');
      
      // Group for factor labels (text labels)
      const labelsG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      labelsG.setAttribute('transform', `translate(${labelWidth - relevanceColumnWidth - 10},${labelMargin.top})`);
      
      // Group for relevance column (cells and header)
      const relevanceG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      relevanceG.setAttribute('transform', `translate(${labelWidth - relevanceColumnWidth},${labelMargin.top})`);
      
      // Draw relevance column header label (rotated 90 degrees)
      // Position it further up and adjust for rotation to prevent cutoff
      // When rotated -90 degrees, the text extends horizontally, so we need more vertical space
      const relevanceHeaderText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const relevanceHeaderX = 10;//relevanceColumnWidth / 2;
      const relevanceHeaderY = -60; // Move further up to accommodate rotated text (text extends left when rotated -90)
      relevanceHeaderText.setAttribute('x', relevanceHeaderX);
      relevanceHeaderText.setAttribute('y', relevanceHeaderY);
      relevanceHeaderText.setAttribute('text-anchor', 'middle');
      relevanceHeaderText.setAttribute('alignment-baseline', 'middle');
      relevanceHeaderText.setAttribute('class', 'heatmap-label');
      relevanceHeaderText.setAttribute('font-size', '10px'); // Slightly smaller font to fit better
      relevanceHeaderText.setAttribute('font-weight', '600');
      relevanceHeaderText.setAttribute('font-family', 'Arial');
      // Rotate -90 degrees around the center point
      relevanceHeaderText.setAttribute('transform', `rotate(-90, ${relevanceHeaderX}, ${relevanceHeaderY})`);
      relevanceHeaderText.textContent = 'Relevance to trait';
      relevanceG.appendChild(relevanceHeaderText);
      
      // Draw special row labels (Combined score, GWAS support, Gene set support)
      const specialRowLabels = ['Combined score', 'GWAS support', 'Gene set support'];
      
      // Draw relevance column cells for special rows (empty cells)
      specialRowLabels.forEach((label, rowIndex) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 0);
        rect.setAttribute('y', rowIndex * cellHeight);
        rect.setAttribute('width', relevanceColumnWidth);
        rect.setAttribute('height', cellHeight);
        rect.setAttribute('fill', '#f5f5f5');
        rect.setAttribute('stroke', '#fff');
        rect.setAttribute('stroke-width', '1');
        rect.setAttribute('class', 'heatmap-cell-bg');
        relevanceG.appendChild(rect);
      });
      
      // Draw relevance column cells for factor rows (color-coded)
      factors.forEach((factor, factorIndex) => {
        const relevanceScore = relevanceScores[factorIndex];
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 0);
        rect.setAttribute('y', (numSpecialRows + factorIndex) * cellHeight);
        rect.setAttribute('width', relevanceColumnWidth);
        rect.setAttribute('height', cellHeight);
        
        // Color code based on relevance score
        if (relevanceScore !== null && relevanceScore !== undefined) {
          const color = this.getColorByScore(relevanceScore);
          rect.setAttribute('fill', color.background);
          rect.setAttribute('stroke', color.border);
          rect.setAttribute('stroke-width', '1');
          rect.setAttribute('title', `Relevance to trait: ${relevanceScore.toFixed(2)}`);
        } else {
          rect.setAttribute('fill', '#f0f0f0');
          rect.setAttribute('stroke', '#fff');
          rect.setAttribute('stroke-width', '1');
        }
        rect.setAttribute('class', 'heatmap-cell-bg');
        relevanceG.appendChild(rect);
      });
      specialRowLabels.forEach((label, rowIndex) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 0);
        text.setAttribute('y', rowIndex * cellHeight + cellHeight / 2);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('class', 'heatmap-label');
        text.setAttribute('font-size', '11px');
        text.setAttribute('font-weight', '600'); // Make special rows bold
        text.setAttribute('font-family', 'Arial');
        text.textContent = label;
        labelsG.appendChild(text);
      });
      
      // Draw factor labels (y-axis) in fixed container
      factors.forEach((factor, factorIndex) => {
        const label = labels[factorIndex] || factor;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 0);
        text.setAttribute('y', (numSpecialRows + factorIndex) * cellHeight + cellHeight / 2);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('class', 'heatmap-label');
        text.setAttribute('font-size', '11px');
        text.setAttribute('font-family', 'Arial');
        // Show full label without truncation
        text.textContent = label;
        
        // Add tooltip for full label (always show tooltip for better UX)
        if (label.length > 20) {
          const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          labelGroup.setAttribute('class', 'heatmap-label-group');
          
          const showLabelTooltip = (event) => {
            // Remove existing tooltip if any
            if (labelGroup._tooltip) {
              try {
                if (labelGroup._tooltip.parentNode) {
                  labelGroup._tooltip.parentNode.removeChild(labelGroup._tooltip);
                }
              } catch (e) {
                // Tooltip already removed
              }
            }
            
            const tooltip = document.createElement('div');
            tooltip.className = 'heatmap-tooltip';
            tooltip.textContent = label;
            // Add inline styles to ensure visibility
            tooltip.style.position = 'fixed';
            tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
            tooltip.style.color = '#fff';
            tooltip.style.padding = '6px 10px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '12px';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.whiteSpace = 'nowrap';
            tooltip.style.zIndex = '10000';
            tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            tooltip.style.lineHeight = '1.4';
            tooltip.style.display = 'block';
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
            
            document.body.appendChild(tooltip);
            
            // Get mouse position
            const getMousePos = (e) => {
              if (e && typeof e === 'object') {
                if (e.clientX !== undefined && e.clientY !== undefined) {
                  return { x: e.clientX, y: e.clientY };
                }
                if (e.touches && e.touches[0]) {
                  return { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }
              }
              return { x: window.event?.clientX || 0, y: window.event?.clientY || 0 };
            };
            
            // Set initial position
            const initialPos = getMousePos(event);
            tooltip.style.left = (initialPos.x + 10) + 'px';
            tooltip.style.top = (initialPos.y - 10) + 'px';
            
            // Use window mousemove for better tracking
            const mousemoveHandler = (e) => {
              const pos = getMousePos(e);
              if (pos.x > 0 || pos.y > 0) {
                tooltip.style.left = (pos.x + 10) + 'px';
                tooltip.style.top = (pos.y - 10) + 'px';
              }
            };
            window.addEventListener('mousemove', mousemoveHandler);
            
            labelGroup._tooltip = tooltip;
            labelGroup._mousemoveHandler = mousemoveHandler;
          };
          
          const hideLabelTooltip = () => {
            if (labelGroup._tooltip) {
              try {
                if (labelGroup._tooltip.parentNode) {
                  labelGroup._tooltip.parentNode.removeChild(labelGroup._tooltip);
                }
              } catch (e) {
                // Tooltip already removed or doesn't exist
              }
              if (labelGroup._mousemoveHandler) {
                window.removeEventListener('mousemove', labelGroup._mousemoveHandler);
              }
              delete labelGroup._tooltip;
              delete labelGroup._mousemoveHandler;
            }
          };
          
          text.addEventListener('mouseenter', showLabelTooltip);
          text.addEventListener('mouseleave', hideLabelTooltip);
          
          labelGroup.appendChild(text);
          labelsG.appendChild(labelGroup);
        } else {
          labelsG.appendChild(text);
        }
      });
      
      labelsSvg.appendChild(labelsG);
      labelsSvg.appendChild(relevanceG);
      this.$refs.heatmapLabelsContainer.appendChild(labelsSvg);
      
      // Create scrollable heatmap SVG (cells and x-axis labels)
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', scrollableWidth);
      svg.setAttribute('height', height);
      svg.setAttribute('class', 'heatmap-svg');
      
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
      
      // Draw special rows with circles (Combined score, GWAS support, Gene set support)
      const specialRowData = [
        { scores: combinedScores || [], label: 'Combined score' },
        { scores: gwasScores || [], label: 'GWAS support' },
        { scores: geneSetScores || [], label: 'Gene set support' }
      ];
      
      // Calculate min/max scores for circle size normalization
      const allScores = [];
      specialRowData.forEach(rowData => {
        rowData.scores.forEach(score => {
          if (score !== null && score !== undefined) {
            allScores.push(score);
          }
        });
      });
      const minScore = allScores.length > 0 ? Math.min(...allScores) : 0;
      const maxScore = allScores.length > 0 ? Math.max(...allScores) : 1;
      const minCircleRadius = Math.min(cellWidth, cellHeight) * 0.2; // 20% of cell size
      const maxCircleRadius = Math.min(cellWidth, cellHeight) * 0.4; // 40% of cell size
      
      specialRowData.forEach((rowData, rowIndex) => {
        genes.forEach((gene, geneIndex) => {
          const score = rowData.scores[geneIndex];
          const x = geneIndex * cellWidth; // No offset needed, relevance column is in y-axis labels
          const y = rowIndex * cellHeight;
          const centerX = x + cellWidth / 2;
          const centerY = y + cellHeight / 2;
          
          // Create cell group
          const cellGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          cellGroup.setAttribute('class', 'heatmap-cell-group');
          
          // Background rectangle (light gray for special rows) - append first so it's behind
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', x);
          rect.setAttribute('y', y);
          rect.setAttribute('width', cellWidth);
          rect.setAttribute('height', cellHeight);
          rect.setAttribute('fill', '#f5f5f5');
          rect.setAttribute('stroke', '#fff');
          rect.setAttribute('stroke-width', '1');
          rect.setAttribute('class', 'heatmap-cell-bg');
          cellGroup.appendChild(rect);
          
          // Store score in closure for event handlers
          const cellScore = score;
          const cellRowLabel = rowData.label;
          
          // Create tooltip function
          const showTooltip = (event) => {
            if (cellScore !== null && cellScore !== undefined) {
              // Remove existing tooltip if any
              if (cellGroup._tooltip) {
                try {
                  if (cellGroup._tooltip.parentNode) {
                    cellGroup._tooltip.parentNode.removeChild(cellGroup._tooltip);
                  }
                } catch (e) {
                  // Tooltip already removed
                }
              }
              
              const tooltip = document.createElement('div');
              tooltip.className = 'heatmap-tooltip';
              tooltip.textContent = `${cellRowLabel}: ${cellScore.toFixed(2)}`;
              // Add inline styles to ensure visibility
              tooltip.style.position = 'fixed';
              tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
              tooltip.style.color = '#fff';
              tooltip.style.padding = '6px 10px';
              tooltip.style.borderRadius = '4px';
              tooltip.style.fontSize = '12px';
              tooltip.style.pointerEvents = 'none';
              tooltip.style.whiteSpace = 'nowrap';
              tooltip.style.zIndex = '10000';
              tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
              tooltip.style.lineHeight = '1.4';
              tooltip.style.display = 'block';
              tooltip.style.visibility = 'visible';
              tooltip.style.opacity = '1';
              
              document.body.appendChild(tooltip);
              
              // Get mouse position - SVG events should have clientX/Y
              const getMousePos = (e) => {
                // Try different event properties
                if (e && typeof e === 'object') {
                  if (e.clientX !== undefined && e.clientY !== undefined) {
                    return { x: e.clientX, y: e.clientY };
                  }
                  if (e.touches && e.touches[0]) {
                    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  }
                }
                // Fallback: try to get from window event
                return { x: window.event?.clientX || 0, y: window.event?.clientY || 0 };
              };
              
              // Set initial position
              const initialPos = getMousePos(event);
              tooltip.style.left = (initialPos.x + 10) + 'px';
              tooltip.style.top = (initialPos.y - 10) + 'px';
              
              // Use window mousemove for better tracking
              const mousemoveHandler = (e) => {
                const pos = getMousePos(e);
                if (pos.x > 0 || pos.y > 0) {
                  tooltip.style.left = (pos.x + 10) + 'px';
                  tooltip.style.top = (pos.y - 10) + 'px';
                }
              };
              window.addEventListener('mousemove', mousemoveHandler);
              
              cellGroup._tooltip = tooltip;
              cellGroup._mousemoveHandler = mousemoveHandler;
            }
          };
          
          const hideTooltip = () => {
            if (cellGroup._tooltip) {
              document.body.removeChild(cellGroup._tooltip);
              if (cellGroup._mousemoveHandler) {
                window.removeEventListener('mousemove', cellGroup._mousemoveHandler);
              }
              delete cellGroup._tooltip;
              delete cellGroup._mousemoveHandler;
            }
          };
          
          // Add hover event listeners
          rect.addEventListener('mouseenter', showTooltip);
          rect.addEventListener('mouseleave', hideTooltip);
          
          // Circle with network color coding and variable size - append after rect so it's on top
          if (score !== null && score !== undefined) {
            const color = this.getColorByScore(score);
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            
            // Calculate circle radius based on score (normalized)
            let circleRadius;
            if (maxScore > minScore) {
              const normalizedScore = (score - minScore) / (maxScore - minScore);
              circleRadius = minCircleRadius + (maxCircleRadius - minCircleRadius) * normalizedScore;
            } else {
              circleRadius = (minCircleRadius + maxCircleRadius) / 2;
            }
            
            circle.setAttribute('cx', centerX);
            circle.setAttribute('cy', centerY);
            circle.setAttribute('r', circleRadius);
            circle.setAttribute('fill', color.background);
            circle.setAttribute('class', 'heatmap-circle-special');
            
            // Add hover events to circle as well
            circle.addEventListener('mouseenter', showTooltip);
            circle.addEventListener('mouseleave', hideTooltip);
            
            cellGroup.appendChild(circle);
          }
          
          g.appendChild(cellGroup);
        });
      });
      
      // Draw heatmap cells for factors (swapped: factors on y-axis, genes on x-axis)
      factors.forEach((factor, factorIndex) => {
        // Draw gene columns for this factor
        genes.forEach((gene, geneIndex) => {
          const value = data[geneIndex][factorIndex]; // Note: data is still [gene][factor]
          
          const x = geneIndex * cellWidth; // No offset needed, relevance column is in y-axis labels
          const y = (numSpecialRows + factorIndex) * cellHeight; // Offset by special rows
          
          // Create cell group
          const cellGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          cellGroup.setAttribute('class', 'heatmap-cell-group');
          
          // Background rectangle with purple gradient
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', x);
          rect.setAttribute('y', y);
          rect.setAttribute('width', cellWidth);
          rect.setAttribute('height', cellHeight);
          rect.setAttribute('fill', getBackgroundColor(value));
          rect.setAttribute('stroke', '#fff');
          rect.setAttribute('stroke-width', '1');
          rect.setAttribute('class', 'heatmap-cell-bg');
          cellGroup.appendChild(rect);
          
          // Create tooltip function for factor cells
          const cellValue = value;
          const cellGene = gene;
          const cellFactorLabel = labels[factorIndex] || factor;
          
          const showCellTooltip = (event) => {
            if (cellValue !== null && cellValue !== undefined) {
              // Remove existing tooltip if any
              if (cellGroup._tooltip) {
                try {
                  if (cellGroup._tooltip.parentNode) {
                    cellGroup._tooltip.parentNode.removeChild(cellGroup._tooltip);
                  }
                } catch (e) {
                  // Tooltip already removed
                }
              }
              
              const tooltip = document.createElement('div');
              tooltip.className = 'heatmap-tooltip';
              tooltip.innerHTML = `${cellGene} - ${cellFactorLabel}<br>Relevance: ${cellValue.toFixed(2)}`;
              // Add inline styles to ensure visibility
              tooltip.style.position = 'fixed';
              tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
              tooltip.style.color = '#fff';
              tooltip.style.padding = '6px 10px';
              tooltip.style.borderRadius = '4px';
              tooltip.style.fontSize = '12px';
              tooltip.style.pointerEvents = 'none';
              tooltip.style.whiteSpace = 'nowrap';
              tooltip.style.zIndex = '10000';
              tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
              tooltip.style.lineHeight = '1.4';
              tooltip.style.display = 'block';
              tooltip.style.visibility = 'visible';
              tooltip.style.opacity = '1';
              
              document.body.appendChild(tooltip);
              
              // Get mouse position
              const getMousePos = (e) => {
                if (e && typeof e === 'object') {
                  if (e.clientX !== undefined && e.clientY !== undefined) {
                    return { x: e.clientX, y: e.clientY };
                  }
                  if (e.touches && e.touches[0]) {
                    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  }
                }
                return { x: window.event?.clientX || 0, y: window.event?.clientY || 0 };
              };
              
              // Set initial position
              const initialPos = getMousePos(event);
              tooltip.style.left = (initialPos.x + 10) + 'px';
              tooltip.style.top = (initialPos.y - 10) + 'px';
              
              // Use window mousemove for better tracking
              const mousemoveHandler = (e) => {
                const pos = getMousePos(e);
                if (pos.x > 0 || pos.y > 0) {
                  tooltip.style.left = (pos.x + 10) + 'px';
                  tooltip.style.top = (pos.y - 10) + 'px';
                }
              };
              window.addEventListener('mousemove', mousemoveHandler);
              
              cellGroup._tooltip = tooltip;
              cellGroup._mousemoveHandler = mousemoveHandler;
            }
          };
          
          const hideCellTooltip = () => {
            if (cellGroup._tooltip) {
              document.body.removeChild(cellGroup._tooltip);
              if (cellGroup._mousemoveHandler) {
                window.removeEventListener('mousemove', cellGroup._mousemoveHandler);
              }
              delete cellGroup._tooltip;
              delete cellGroup._mousemoveHandler;
            }
          };
          
          rect.addEventListener('mouseenter', showCellTooltip);
          rect.addEventListener('mouseleave', hideCellTooltip);
          
          g.appendChild(cellGroup);
        });
      });
      
      // Draw gene labels (x-axis) - positioned higher to avoid overlap
      genes.forEach((gene, geneIndex) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const labelY = -30; // Move labels further up to avoid overlap with first row
        const labelX = geneIndex * cellWidth + cellWidth / 2; // No offset needed
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'heatmap-label');
        text.setAttribute('font-size', '11px');
        text.setAttribute('font-family', 'Arial');
        text.setAttribute('transform', `rotate(-45, ${labelX}, ${labelY})`);
        text.textContent = gene;
        g.appendChild(text);
      });
      
      svg.appendChild(g);
      this.$refs.heatmapContainer.appendChild(svg);
    },
    renderGeneSetsHeatmap() {
      console.log('renderGeneSetsHeatmap called', this.geneSetsHeatmapData);
      
      if (!this.geneSetsHeatmapData || !this.geneSetsHeatmapData.geneSets || this.geneSetsHeatmapData.geneSets.length === 0) {
        console.log('No gene sets heatmap data or empty gene sets array');
        return;
      }
      
      // Wait for refs to be available
      if (!this.$refs.geneSetsHeatmapContainer || !this.$refs.geneSetsHeatmapLabelsContainer) {
        console.log('geneSetsHeatmapContainer or geneSetsHeatmapLabelsContainer ref not found, retrying...');
        // Retry after a short delay
        setTimeout(() => {
          this.renderGeneSetsHeatmap();
        }, 100);
        return;
      }
      
      // Clear previous heatmap and clean up any orphaned tooltips
      // Remove any tooltips that might still be in the DOM
      const existingTooltips = document.querySelectorAll('.heatmap-tooltip');
      existingTooltips.forEach(tooltip => {
        try {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
          }
        } catch (e) {
          // Tooltip already removed
        }
      });
      
      // Clear previous heatmap
      this.$refs.geneSetsHeatmapContainer.innerHTML = '';
      this.$refs.geneSetsHeatmapLabelsContainer.innerHTML = '';
      
      let { geneSets, factors, factorLabels, factorScores, data } = this.geneSetsHeatmapData;
      const labels = factorLabels || factors;
      const relevanceScores = factorScores || factors.map(() => 0);
      
      console.log('Gene sets heatmap data:', { geneSets: geneSets.length, factors: factors.length, data: data ? data.length : 0 });
      
      if (geneSets.length === 0 || factors.length === 0) {
        console.log('Empty gene sets or factors array');
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No data array');
        return;
      }
      
      // Calculate dimensions: factors on y-axis, gene sets on x-axis
      const relevanceColumnWidth = 20;
      const cellWidth = Math.max(30, 300 / geneSets.length);
      const cellHeight = 20;
      const labelWidth = 200 + relevanceColumnWidth;
      const margin = { top: 120, right: 20, bottom: 20, left: 0 }; // Increased top margin for x-axis labels
      const labelMargin = { top: 120, right: 0, bottom: 20, left: 10 }; // Match top margin
      
      const scrollableWidth = Math.max(600, geneSets.length * cellWidth + margin.left + margin.right);
      const totalRows = factors.length;
      const height = totalRows * cellHeight + margin.top + margin.bottom;
      
      // Background color for cells - using purple gradient (same as main heatmap)
      const getBackgroundColor = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
          return '#f0f0f0';
        }
        const clampedValue = Math.max(0, Math.min(1, value));
        const r1 = 243, g1 = 229, b1 = 245;
        const r2 = 156, g2 = 39, b2 = 176;
        const r = Math.round(r1 + (r2 - r1) * clampedValue);
        const g = Math.round(g1 + (g2 - g1) * clampedValue);
        const b = Math.round(b1 + (b2 - b1) * clampedValue);
        return `rgb(${r}, ${g}, ${b})`;
      };
      
      // Create fixed labels SVG (y-axis labels + relevance column)
      const labelsSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      labelsSvg.setAttribute('width', labelWidth);
      labelsSvg.setAttribute('height', height);
      labelsSvg.setAttribute('class', 'heatmap-labels-svg');
      
      // Group for factor labels
      const labelsG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      labelsG.setAttribute('transform', `translate(${labelWidth - relevanceColumnWidth - 10},${labelMargin.top})`);
      
      // Group for relevance column
      const relevanceG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      relevanceG.setAttribute('transform', `translate(${labelWidth - relevanceColumnWidth},${labelMargin.top})`);
      
      // Draw relevance column header label (rotated 90 degrees)
      const relevanceHeaderText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const relevanceHeaderX = 10;
      const relevanceHeaderY = -60;
      relevanceHeaderText.setAttribute('x', relevanceHeaderX);
      relevanceHeaderText.setAttribute('y', relevanceHeaderY);
      relevanceHeaderText.setAttribute('text-anchor', 'middle');
      relevanceHeaderText.setAttribute('alignment-baseline', 'middle');
      relevanceHeaderText.setAttribute('class', 'heatmap-label');
      relevanceHeaderText.setAttribute('font-size', '10px');
      relevanceHeaderText.setAttribute('font-weight', '600');
      relevanceHeaderText.setAttribute('font-family', 'Arial');
      relevanceHeaderText.setAttribute('transform', `rotate(-90, ${relevanceHeaderX}, ${relevanceHeaderY})`);
      relevanceHeaderText.textContent = 'Relevance to trait';
      relevanceG.appendChild(relevanceHeaderText);
      
      // Draw relevance column cells for factor rows
      factors.forEach((factor, factorIndex) => {
        const relevanceScore = relevanceScores[factorIndex];
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 0);
        rect.setAttribute('y', factorIndex * cellHeight);
        rect.setAttribute('width', relevanceColumnWidth);
        rect.setAttribute('height', cellHeight);
        
        if (relevanceScore !== null && relevanceScore !== undefined) {
          const color = this.getColorByScore(relevanceScore);
          rect.setAttribute('fill', color.background);
          rect.setAttribute('stroke', color.border);
          rect.setAttribute('stroke-width', '1');
          rect.setAttribute('title', `Relevance to trait: ${relevanceScore.toFixed(2)}`);
        } else {
          rect.setAttribute('fill', '#f0f0f0');
          rect.setAttribute('stroke', '#fff');
          rect.setAttribute('stroke-width', '1');
        }
        rect.setAttribute('class', 'heatmap-cell-bg');
        relevanceG.appendChild(rect);
      });
      
      // Draw factor labels (y-axis)
      factors.forEach((factor, factorIndex) => {
        const label = labels[factorIndex] || factor;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 0);
        text.setAttribute('y', factorIndex * cellHeight + cellHeight / 2);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('class', 'heatmap-label');
        text.setAttribute('font-size', '11px');
        text.setAttribute('font-family', 'Arial');
        text.textContent = label;
        text.setAttribute('title', label); // Full label on hover
        labelsG.appendChild(text);
      });
      
      labelsSvg.appendChild(relevanceG);
      labelsSvg.appendChild(labelsG);
      this.$refs.geneSetsHeatmapLabelsContainer.appendChild(labelsSvg);
      
      // Create scrollable heatmap SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', scrollableWidth);
      svg.setAttribute('height', height);
      svg.setAttribute('class', 'heatmap-svg');
      
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${margin.left},${margin.top})`);
      
      // Draw heatmap cells: factors (rows) x gene sets (columns)
      factors.forEach((factor, factorIndex) => {
        const rowData = data[factorIndex] || [];
        
        geneSets.forEach((geneSet, geneSetIndex) => {
          const value = rowData[geneSetIndex];
          
          const cellGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          cellGroup.setAttribute('class', 'heatmap-cell-group');
          
          // Background rectangle
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', geneSetIndex * cellWidth);
          rect.setAttribute('y', factorIndex * cellHeight);
          rect.setAttribute('width', cellWidth);
          rect.setAttribute('height', cellHeight);
          rect.setAttribute('fill', getBackgroundColor(value));
          rect.setAttribute('stroke', '#fff');
          rect.setAttribute('stroke-width', '1');
          rect.setAttribute('class', 'heatmap-cell-bg');
          
          // Tooltip on hover
          const showCellTooltip = (event) => {
            if (!cellGroup._tooltip) {
              const tooltip = document.createElement('div');
              tooltip.className = 'heatmap-tooltip';
              tooltip.textContent = value !== null && value !== undefined 
                ? `Factor: ${labels[factorIndex]}\nGene Set: ${geneSet}\nRelevance: ${value.toFixed(4)}`
                : `Factor: ${labels[factorIndex]}\nGene Set: ${geneSet}\nRelevance: N/A`;
              
              tooltip.style.position = 'fixed';
              tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
              tooltip.style.color = '#fff';
              tooltip.style.padding = '6px 10px';
              tooltip.style.borderRadius = '4px';
              tooltip.style.fontSize = '12px';
              tooltip.style.pointerEvents = 'none';
              tooltip.style.whiteSpace = 'pre-line';
              tooltip.style.zIndex = '10000';
              tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
              tooltip.style.display = 'block';
              tooltip.style.visibility = 'visible';
              tooltip.style.opacity = '1';
              
              document.body.appendChild(tooltip);
              
              const getMousePos = (e) => {
                if (e && typeof e === 'object') {
                  if (e.clientX !== undefined && e.clientY !== undefined) {
                    return { x: e.clientX, y: e.clientY };
                  }
                  if (e.touches && e.touches[0]) {
                    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  }
                }
                return { x: window.event?.clientX || 0, y: window.event?.clientY || 0 };
              };
              
              const initialPos = getMousePos(event);
              tooltip.style.left = (initialPos.x + 10) + 'px';
              tooltip.style.top = (initialPos.y - 10) + 'px';
              
              const mousemoveHandler = (e) => {
                const pos = getMousePos(e);
                if (pos.x > 0 || pos.y > 0) {
                  tooltip.style.left = (pos.x + 10) + 'px';
                  tooltip.style.top = (pos.y - 10) + 'px';
                }
              };
              window.addEventListener('mousemove', mousemoveHandler);
              
              cellGroup._tooltip = tooltip;
              cellGroup._mousemoveHandler = mousemoveHandler;
            }
          };
          
          const hideCellTooltip = () => {
            if (cellGroup._tooltip) {
              document.body.removeChild(cellGroup._tooltip);
              if (cellGroup._mousemoveHandler) {
                window.removeEventListener('mousemove', cellGroup._mousemoveHandler);
              }
              delete cellGroup._tooltip;
              delete cellGroup._mousemoveHandler;
            }
          };
          
          rect.addEventListener('mouseenter', showCellTooltip);
          rect.addEventListener('mouseleave', hideCellTooltip);
          
          cellGroup.appendChild(rect);
          g.appendChild(cellGroup);
        });
      });
      
      // Draw gene set labels (x-axis) - positioned to avoid overlap, left-aligned
      geneSets.forEach((geneSet, geneSetIndex) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const labelY = -15; // Position labels closer to heatmap cells
        const labelX = geneSetIndex * cellWidth; // Start at left edge of cell
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY);
        text.setAttribute('text-anchor', 'start'); // Left-align so text extends right and up when rotated
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('class', 'heatmap-label');
        text.setAttribute('font-size', '10px'); // Slightly smaller font
        text.setAttribute('font-family', 'Arial');
        // Rotate -45 degrees around the start point
        // The text will extend upward and to the right when rotated, avoiding cell overlap
        text.setAttribute('transform', `rotate(-45, ${labelX}, ${labelY})`);
        text.textContent = geneSet;
        g.appendChild(text);
      });
      
      svg.appendChild(g);
      this.$refs.geneSetsHeatmapContainer.appendChild(svg);
    },
    downloadHeatmap() {
      try {
        // Get both SVG elements
        const labelsContainer = this.$refs.heatmapLabelsContainer;
        const heatmapContainer = this.$refs.heatmapContainer;
        
        if (!labelsContainer || !heatmapContainer) {
          console.error('Heatmap containers not found');
          return;
        }
        
        const labelsSvg = labelsContainer.querySelector('svg');
        const heatmapSvg = heatmapContainer.querySelector('svg');
        
        if (!labelsSvg || !heatmapSvg) {
          console.error('SVG elements not found');
          return;
        }
        
        // Get dimensions
        const labelsWidth = parseFloat(labelsSvg.getAttribute('width')) || 0;
        const labelsHeight = parseFloat(labelsSvg.getAttribute('height')) || 0;
        const heatmapWidth = parseFloat(heatmapSvg.getAttribute('width')) || 0;
        const heatmapHeight = parseFloat(heatmapSvg.getAttribute('height')) || 0;
        
        // Create a combined SVG
        const combinedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        combinedSvg.setAttribute('width', labelsWidth + heatmapWidth);
        combinedSvg.setAttribute('height', Math.max(labelsHeight, heatmapHeight));
        combinedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        combinedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        
        // Add style to ensure Arial font is used
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.textContent = 'text { font-family: Arial, sans-serif; }';
        combinedSvg.appendChild(style);
        
        // Create a group for labels (positioned at x=0)
        const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        labelsGroup.setAttribute('transform', 'translate(0, 0)');
        // Clone all children from labels SVG and ensure font-family is set
        Array.from(labelsSvg.children).forEach(child => {
          const cloned = child.cloneNode(true);
          // Ensure all text elements have Arial font
          if (cloned.tagName === 'text' && !cloned.getAttribute('font-family')) {
            cloned.setAttribute('font-family', 'Arial');
          }
          // Recursively set font-family for nested text elements
          const textElements = cloned.querySelectorAll('text');
          textElements.forEach(textEl => {
            if (!textEl.getAttribute('font-family')) {
              textEl.setAttribute('font-family', 'Arial');
            }
          });
          labelsGroup.appendChild(cloned);
        });
        combinedSvg.appendChild(labelsGroup);
        
        // Create a group for heatmap (positioned after labels)
        const heatmapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const heatmapG = heatmapSvg.querySelector('g');
        if (heatmapG) {
          // Get current transform
          const currentTransform = heatmapG.getAttribute('transform') || '';
          // Extract translate values if any
          const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
          let translateX = 0, translateY = 0;
          if (translateMatch) {
            const coords = translateMatch[1].split(',');
            translateX = parseFloat(coords[0]) || 0;
            translateY = parseFloat(coords[1]) || 0;
          }
          // Set transform to position after labels
          heatmapGroup.setAttribute('transform', `translate(${translateX + labelsWidth}, ${translateY})`);
        } else {
          heatmapGroup.setAttribute('transform', `translate(${labelsWidth}, 0)`);
        }
        // Clone all children from heatmap SVG's main group and ensure font-family is set
        const cloneWithFontFamily = (element) => {
          const cloned = element.cloneNode(true);
          // Ensure all text elements have Arial font
          if (cloned.tagName === 'text' && !cloned.getAttribute('font-family')) {
            cloned.setAttribute('font-family', 'Arial');
          }
          // Recursively set font-family for nested text elements
          const textElements = cloned.querySelectorAll('text');
          textElements.forEach(textEl => {
            if (!textEl.getAttribute('font-family')) {
              textEl.setAttribute('font-family', 'Arial');
            }
          });
          return cloned;
        };
        
        if (heatmapG) {
          Array.from(heatmapG.children).forEach(child => {
            heatmapGroup.appendChild(cloneWithFontFamily(child));
          });
        } else {
          Array.from(heatmapSvg.children).forEach(child => {
            heatmapGroup.appendChild(cloneWithFontFamily(child));
          });
        }
        combinedSvg.appendChild(heatmapGroup);
        
        // Ensure SVG has proper viewBox for rendering
        if (!combinedSvg.getAttribute('viewBox')) {
          combinedSvg.setAttribute('viewBox', `0 0 ${labelsWidth + heatmapWidth} ${Math.max(labelsHeight, heatmapHeight)}`);
        }
        
        // Create ZIP file with SVG and data
        this.downloadAsZip(combinedSvg);
      } catch (error) {
        console.error('Error downloading heatmap:', error);
      }
    },
    downloadGeneSetsHeatmap() {
      try {
        // Get both SVG elements for gene sets heatmap
        const labelsContainer = this.$refs.geneSetsHeatmapLabelsContainer;
        const heatmapContainer = this.$refs.geneSetsHeatmapContainer;
        
        if (!labelsContainer || !heatmapContainer) {
          console.error('Gene sets heatmap containers not found');
          return;
        }
        
        const labelsSvg = labelsContainer.querySelector('svg');
        const heatmapSvg = heatmapContainer.querySelector('svg');
        
        if (!labelsSvg || !heatmapSvg) {
          console.error('Gene sets SVG elements not found');
          return;
        }
        
        // Get dimensions
        const labelsWidth = parseFloat(labelsSvg.getAttribute('width')) || 0;
        const labelsHeight = parseFloat(labelsSvg.getAttribute('height')) || 0;
        const heatmapWidth = parseFloat(heatmapSvg.getAttribute('width')) || 0;
        const heatmapHeight = parseFloat(heatmapSvg.getAttribute('height')) || 0;
        
        // Create a combined SVG
        const combinedSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        combinedSvg.setAttribute('width', labelsWidth + heatmapWidth);
        combinedSvg.setAttribute('height', Math.max(labelsHeight, heatmapHeight));
        combinedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        combinedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        combinedSvg.setAttribute('viewBox', `0 0 ${labelsWidth + heatmapWidth} ${Math.max(labelsHeight, heatmapHeight)}`);
        
        // Add style to ensure Arial font is used
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.textContent = 'text { font-family: Arial, sans-serif; }';
        combinedSvg.appendChild(style);
        
        // Create a group for labels (positioned at x=0)
        const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        labelsGroup.setAttribute('transform', 'translate(0, 0)');
        // Clone all children from labels SVG and ensure font-family is set
        Array.from(labelsSvg.children).forEach(child => {
          const cloned = child.cloneNode(true);
          // Ensure all text elements have Arial font
          if (cloned.tagName === 'text' && !cloned.getAttribute('font-family')) {
            cloned.setAttribute('font-family', 'Arial');
          }
          // Recursively set font-family for nested text elements
          const textElements = cloned.querySelectorAll('text');
          textElements.forEach(textEl => {
            if (!textEl.getAttribute('font-family')) {
              textEl.setAttribute('font-family', 'Arial');
            }
          });
          labelsGroup.appendChild(cloned);
        });
        combinedSvg.appendChild(labelsGroup);
        
        // Create a group for heatmap (positioned after labels)
        const heatmapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const heatmapG = heatmapSvg.querySelector('g');
        if (heatmapG) {
          // Get current transform
          const currentTransform = heatmapG.getAttribute('transform') || '';
          // Adjust transform to account for labels width
          const adjustedTransform = currentTransform.replace(/translate\(([^,]+),([^)]+)\)/, 
            (match, x, y) => `translate(${parseFloat(x) + labelsWidth},${y})`);
          heatmapGroup.setAttribute('transform', adjustedTransform || `translate(${labelsWidth}, 0)`);
          
          // Clone all children from heatmap SVG and ensure font-family is set
          Array.from(heatmapG.children).forEach(child => {
            const cloned = child.cloneNode(true);
            // Ensure all text elements have Arial font
            if (cloned.tagName === 'text' && !cloned.getAttribute('font-family')) {
              cloned.setAttribute('font-family', 'Arial');
            }
            // Recursively set font-family for nested text elements
            const textElements = cloned.querySelectorAll('text');
            textElements.forEach(textEl => {
              if (!textEl.getAttribute('font-family')) {
                textEl.setAttribute('font-family', 'Arial');
              }
            });
            heatmapGroup.appendChild(cloned);
          });
        } else {
          // Fallback: clone entire heatmap SVG
          const cloned = heatmapSvg.cloneNode(true);
          cloned.setAttribute('transform', `translate(${labelsWidth}, 0)`);
          heatmapGroup.appendChild(cloned);
        }
        combinedSvg.appendChild(heatmapGroup);
        
        // Download as ZIP
        this.downloadGeneSetsHeatmapAsZip(combinedSvg);
      } catch (error) {
        console.error('Error downloading gene sets heatmap:', error);
      }
    },
    async downloadGeneSetsHeatmapAsZip(combinedSvg) {
      try {
        const zip = new JSZip();
        const timestamp = new Date().getTime();
        const phenotype = this.phenotypeName.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Serialize SVG
        const serializer = new XMLSerializer();
        const svgData = serializer.serializeToString(combinedSvg);
        
        // Add SVG to ZIP
        zip.file(`gene_sets_heatmap_${phenotype}_${timestamp}.svg`, svgData);
        
        // Add data JSON
        const heatmapDataJson = {
          metadata: {
            phenotype: this.phenotypeName,
            timestamp: new Date().toISOString(),
            description: 'Factors × Gene Sets heatmap data'
          },
          geneSets: this.geneSetsHeatmapData.geneSets || [],
          factors: this.geneSetsHeatmapData.factors || [],
          factorLabels: this.geneSetsHeatmapData.factorLabels || [],
          factorScores: {
            data: this.geneSetsHeatmapData.factorScores || [],
            description: 'Array of factor relevance scores to phenotype'
          },
          data: {
            data: this.geneSetsHeatmapData.data || [],
            description: '2D array [factor][geneSet] of gene relevance to factor (factor_value)'
          }
        };
        
        zip.file(`gene_sets_heatmap_${phenotype}_${timestamp}_data.json`, JSON.stringify(heatmapDataJson, null, 2));
        
        // Generate and download ZIP
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gene_sets_heatmap_${phenotype}_${timestamp}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error creating ZIP file:', error);
      }
    },
    createCanvasAndDownload(img, totalWidth, totalHeight, scale, combinedSvg) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = totalWidth * scale;
        canvas.height = totalHeight * scale;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error('Failed to get canvas context');
          return;
        }
        
        // Set high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Use the actual image dimensions
        const imgWidth = img.naturalWidth || img.width || totalWidth;
        const imgHeight = img.naturalHeight || img.height || totalHeight;
        
        // Draw the image scaled up
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, totalWidth * scale, totalHeight * scale);
        
        // Verify canvas has content by checking a pixel
        const imageData = ctx.getImageData(0, 0, Math.min(10, canvas.width), Math.min(10, canvas.height));
        const hasContent = imageData.data.some((val, idx) => idx % 4 !== 3 && val !== 255); // Check if not all white (alpha channel is index 3)
        
        if (!hasContent) {
          console.warn('Canvas appears to be empty, downloading as SVG instead');
          // Try downloading as SVG instead
          this.downloadAsSVG(combinedSvg);
          return;
        }
        
        // Download as PNG - try toBlob first, fallback to toDataURL
        if (canvas.toBlob) {
          canvas.toBlob((blob) => {
            if (!blob || blob.size === 0) {
              console.warn('Blob creation failed or empty, trying data URL fallback');
              this.downloadFromDataURL(canvas);
              return;
            }
            try {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `heatmap_${this.phenotypeName || 'pigean'}_${new Date().getTime()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              // Clean up URL after a short delay to ensure download starts
              setTimeout(() => {
                URL.revokeObjectURL(url);
              }, 100);
            } catch (error) {
              console.error('Error creating download link:', error);
              // Fallback to data URL
              this.downloadFromDataURL(canvas);
            }
          }, 'image/png');
        } else {
          // Browser doesn't support toBlob, use data URL
          this.downloadFromDataURL(canvas);
        }
      } catch (error) {
        console.error('Error creating canvas:', error);
        // Fallback: download as SVG
        const svgData = new XMLSerializer().serializeToString(img);
        this.downloadAsSVGString(svgData);
      }
    },
    downloadFromDataURL(canvas) {
      try {
        // Use toDataURL as fallback
        const dataUrl = canvas.toDataURL('image/png');
        if (!dataUrl || dataUrl === 'data:,') {
          console.error('Canvas toDataURL returned empty');
          return;
        }
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `heatmap_${this.phenotypeName || 'pigean'}_${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading from data URL:', error);
      }
    },
    downloadAsSVG(svgElement) {
      try {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        this.downloadAsSVGString(svgData);
      } catch (error) {
        console.error('Error serializing SVG:', error);
      }
    },
    downloadAsSVGString(svgData) {
      try {
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `heatmap_${this.phenotypeName || 'pigean'}_${new Date().getTime()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
      } catch (error) {
        console.error('Error downloading SVG:', error);
      }
    },
    async downloadAsZip(combinedSvg) {
      try {
        const zip = new JSZip();
        const timestamp = new Date().getTime();
        const baseName = `heatmap_${this.phenotypeName || 'pigean'}_${timestamp}`;
        
        // Add SVG file to ZIP
        const svgData = new XMLSerializer().serializeToString(combinedSvg);
        zip.file(`${baseName}.svg`, svgData);
        
        // Prepare data for JSON file
        if (this.heatmapData && this.heatmapData.genes && this.heatmapData.genes.length > 0) {
          const dataObject = {
            metadata: {
              phenotype: this.phenotypeName || '',
              timestamp: new Date().toISOString(),
              description: 'Heatmap data for PIGEAN factors visualization'
            },
            genes: this.heatmapData.genes || [],
            factors: this.heatmapData.factors || [],
            factorLabels: this.heatmapData.factorLabels || [],
            factorScores: this.heatmapData.factorScores || [],
            data: {
              description: '2D array [gene][factor] of gene relevance to factor',
              values: this.heatmapData.data || []
            },
            gwasData: {
              description: '2D array [gene][factor] of GWAS support scores (log_bf)',
              values: this.heatmapData.gwasData || []
            },
            geneSetData: {
              description: '2D array [gene][factor] of gene set support scores (prior)',
              values: this.heatmapData.geneSetData || []
            },
            combinedScores: {
              description: 'Array of combined scores per gene',
              values: this.heatmapData.combinedScores || []
            },
            gwasScores: {
              description: 'Array of GWAS scores per gene',
              values: this.heatmapData.gwasScores || []
            },
            geneSetScores: {
              description: 'Array of gene set scores per gene',
              values: this.heatmapData.geneSetScores || []
            }
          };
          
          // Add JSON data file to ZIP
          const jsonData = JSON.stringify(dataObject, null, 2);
          zip.file(`${baseName}_data.json`, jsonData);
        }
        
        // Generate ZIP file and download
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${baseName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);
      } catch (error) {
        console.error('Error creating ZIP file:', error);
        // Fallback to SVG only if ZIP creation fails
        this.downloadAsSVG(combinedSvg);
      }
    }
  }
});
</script>
<style scoped>
.factors-viz-container {
  /*border: 1px solid #ddd;
  border-radius: 4px;*/
  overflow: hidden;
}

.heatmap-tabs {
  margin-top: 10px;
}

.heatmap-tabs ::v-deep .nav-tabs {
  border-bottom: 2px solid #dee2e6;
  margin-bottom: 20px;
}

.heatmap-tabs ::v-deep .nav-link {
  color: #495057;
  padding: 10px 20px;
  font-weight: 500;
}

.heatmap-tabs ::v-deep .nav-link.active {
  color: #007bff;
  border-color: #dee2e6 #dee2e6 #fff;
  font-weight: 600;
}

.heatmap-tabs ::v-deep .tab-content {
  padding: 0;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #666;
}

.error-alert {
  padding: 10px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin: 10px;
}

.viz-legend {
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ddd;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 12px;
  align-items: center;
  justify-content: space-between;
}

.legend-content {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  flex: 1;
}

.legend-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.legend-label {
  font-weight: 600;
  color: #333;
  margin-right: 4px;
}

.legend-text {
  color: #666;
}

.legend-color-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
}

.legend-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.legend-color-text {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
}

.legend-color.factor-relevance {
  background-color: #9c27b0; /* Dark purple matching heatmap gradient */
}

.legend-color.very-strong {
  background-color: #4a90e2;
}

.legend-color.strongly-suggestive {
  background-color: #f5a623;
}

.legend-color.nominally-significant {
  background-color: #f8e71c;
}

.legend-color.not-significant {
  background-color: #cccccc;
}

.heatmap-container {
  padding: 20px;
  overflow: visible; /* Changed from hidden to visible to allow scrollbars */
  /* Removed max-height to allow dynamic sizing */
}

.heatmap-scrollable-wrapper {
  display: flex;
  position: relative;
  overflow-y: auto; /* Only vertical scrolling on wrapper */
  /* Removed max-height to allow dynamic sizing based on container */
  scrollbar-width: thin; /* Firefox - make scrollbar visible */
  scrollbar-color: #888 #f1f1f1; /* Firefox - thumb and track colors */
}

/* Webkit browsers (Chrome, Safari, Edge) - make scrollbar visible */
.heatmap-scrollable-wrapper::-webkit-scrollbar {
  width: 12px; /* Vertical scrollbar width */
}

.heatmap-scrollable-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

.heatmap-scrollable-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
}

.heatmap-scrollable-wrapper::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.heatmap-labels-fixed {
  position: sticky;
  left: 0;
  z-index: 9;
  background-color: #fff;
  border-right: 2px solid #ddd;
  flex-shrink: 0;
}

.heatmap-content-scrollable {
  flex: 1;
  overflow-x: scroll; /* Changed from auto to scroll to always show scrollbar */
  overflow-y: hidden;
  scrollbar-width: thin; /* Firefox - make scrollbar visible */
  scrollbar-color: #888 #f1f1f1; /* Firefox - thumb and track colors */
  min-width: 0; /* Allow flex item to shrink below content size */
  width: 0; /* Force flex item to respect container width */
}

/* Webkit browsers (Chrome, Safari, Edge) - make scrollbar visible */
.heatmap-content-scrollable::-webkit-scrollbar {
  height: 12px; /* Horizontal scrollbar height */
  display: block; /* Ensure scrollbar is always displayed */
}

.heatmap-content-scrollable::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
  -webkit-box-shadow: inset 0 0 2px rgba(0,0,0,0.1);
}

.heatmap-content-scrollable::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
  -webkit-box-shadow: inset 0 0 2px rgba(0,0,0,0.2);
}

.heatmap-content-scrollable::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.heatmap-labels-svg {
  font-family: Arial, sans-serif;
}

.heatmap-wrapper {
  display: inline-block;
  min-width: 100%;
}

.heatmap-svg {
  font-family: Arial, sans-serif;
}

.heatmap-cell {
  cursor: pointer;
}

.heatmap-cell:hover {
  stroke: #333 !important;
  stroke-width: 2px !important;
}

.heatmap-label {
  fill: #333;
  font-weight: 500;
}

.heatmap-score-text {
  fill: #333;
  font-weight: 600;
  pointer-events: none;
  user-select: none;
}

.heatmap-cell-group {
  cursor: pointer;
}

.heatmap-tooltip {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  line-height: 1.4;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.heatmap-tooltip br {
  display: block;
  content: "";
  margin-top: 2px;
}
</style>
<style>
/* Global styles for tooltip since it's appended to body */
.heatmap-tooltip {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.85);
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  line-height: 1.4;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.heatmap-tooltip br {
  display: block;
  content: "";
  margin-top: 2px;
}
</style>
