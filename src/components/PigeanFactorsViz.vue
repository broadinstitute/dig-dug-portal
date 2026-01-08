<template>
  <div class="factors-viz-container" :style="containerStyle">
    <div v-if="error" class="error-alert">
      {{ error }}
    </div>
    <div class="viz-legend" v-if="!loading && heatmapData && heatmapData.genes && heatmapData.genes.length > 0">
      <div class="legend-item">
        <span class="legend-label">Top 3 rows (against phenotype):</span>
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
        <span class="legend-label">Factor rows (against factor):</span>
        <span class="legend-text">Purple gradient indicates relevance to factor (darker = more relevant)</span>
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
    <div v-if="loading" class="loading">Loading visualization...</div>
  </div>
</template>
<script>
import Vue from "vue";

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
    }
  },
  data() {
    return {
      loading: false,
      error: null
    };
  },
  computed: {
    containerStyle() {
      return {
        height: this.height,
        width: "100%",
        position: "relative",
        background: "#fff"
      };
    }
  },
  watch: {
    heatmapData: {
      handler() {
        this.$nextTick(() => {
          setTimeout(() => {
            this.renderHeatmap();
          }, 100);
        });
      },
      deep: true,
      immediate: true
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
    });
  },
    methods: {
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
      const cellWidth = Math.max(40, 300 / genes.length); // Dynamic width based on number of genes
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
      const relevanceHeaderX = relevanceColumnWidth / 2;
      const relevanceHeaderY = -60; // Move further up to accommodate rotated text (text extends left when rotated -90)
      relevanceHeaderText.setAttribute('x', relevanceHeaderX);
      relevanceHeaderText.setAttribute('y', relevanceHeaderY);
      relevanceHeaderText.setAttribute('text-anchor', 'middle');
      relevanceHeaderText.setAttribute('alignment-baseline', 'middle');
      relevanceHeaderText.setAttribute('class', 'heatmap-label');
      relevanceHeaderText.setAttribute('font-size', '10px'); // Slightly smaller font to fit better
      relevanceHeaderText.setAttribute('font-weight', '600');
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
        // Truncate long labels
        const displayLabel = label.length > 20 ? label.substring(0, 17) + '...' : label;
        text.textContent = displayLabel;
        
        // Add tooltip for full label if truncated
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
              document.body.removeChild(labelGroup._tooltip);
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
            circle.setAttribute('stroke', color.border);
            circle.setAttribute('stroke-width', '1');
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
        text.setAttribute('transform', `rotate(-45, ${labelX}, ${labelY})`);
        text.textContent = gene;
        g.appendChild(text);
      });
      
      svg.appendChild(g);
      this.$refs.heatmapContainer.appendChild(svg);
    }
  }
});
</script>
<style scoped>
.factors-viz-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
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
  overflow: hidden;
  max-height: 600px;
}

.heatmap-scrollable-wrapper {
  display: flex;
  position: relative;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 600px;
}

.heatmap-labels-fixed {
  position: sticky;
  left: 0;
  z-index: 10;
  background-color: #fff;
  border-right: 2px solid #ddd;
  flex-shrink: 0;
}

.heatmap-content-scrollable {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
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
