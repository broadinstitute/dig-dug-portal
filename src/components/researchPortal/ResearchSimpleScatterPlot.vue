<template>
  <div class="scatter-plot-content">
    <div :id="'clicked_dot_value_' + plotId" class="clicked-dot-value hidden"></div>
    <div ref="legend" class="plot-legend"></div>
    <canvas
      v-if="!!renderConfig"
      :id="'scatterPlot_' + plotId"
      class="scatter-plot"
      @mouseleave="hidePanel"
      @mousemove="checkPosition"
      :width="canvasWidth"
      :height="canvasHeight"
      :style="canvasStyle"
    >
    </canvas>
  </div>
</template>

<script>
import * as d3 from 'd3';
import Vue from 'vue';

export default Vue.component('research-simple-scatter-plot', {
  props: {
    data: {
      type: Array,
      required: true,
      default: () => []
    },
    renderConfig: {
      type: Object,
      required: true,
      default: () => ({})
    }
  },
  data() {
    return {
      posData: {},
      plotId: Math.random().toString(36).substr(2, 9)
    };
  },
  computed: {
    adjPlotMargin() {
      const customPlotMargin = this.renderConfig.margin || null;
      
      const plotMargin = customPlotMargin ? {
        left: customPlotMargin.left,
        right: customPlotMargin.right,
        top: customPlotMargin.top,
        bottom: customPlotMargin.bottom,
        bump: customPlotMargin.bump || 5
      } : {
        left: 60,
        right: 30,
        top: 30,
        bottom: 50,
        bump: 5
      };

      return plotMargin;
    },
    renderData() {
      if (!this.data || this.data.length === 0) {
        return [];
      }

      const xKey = this.renderConfig.xKey;
      const yKey = this.renderConfig.yKey;
      const hoverContent = this.renderConfig.hoverContent || [];

      return this.data.map(d => {
        const tempObj = {
          x: d[xKey],
          y: d[yKey]
        };

        // Add color key if provided
        if (this.renderConfig.colorKey) {
          tempObj.color = d[this.renderConfig.colorKey];
        }

        // Add hover content fields
        hoverContent.forEach(field => {
          tempObj[field] = d[field];
        });

        return tempObj;
      }).filter(d => d.x != null && !isNaN(d.x) && d.y != null && !isNaN(d.y));
    },
    canvasWidth() {
      const width = this.renderConfig.width || 500;
      const margin = this.adjPlotMargin;
      const yLabelBumper = 110; // Space for rotated Y-axis label
      return (width + margin.left + margin.right) * 2 + yLabelBumper;
    },
    canvasHeight() {
      const height = this.renderConfig.height || 300;
      const margin = this.adjPlotMargin;
      return (height + margin.top + margin.bottom) * 2;
    },
    canvasStyle() {
      const width = this.renderConfig.width || 500;
      const height = this.renderConfig.height || 300;
      const margin = this.adjPlotMargin;
      const yLabelBumper = 110; // Space for rotated Y-axis label
      return `width:${width + margin.left + margin.right + yLabelBumper / 2}px;height:${height + margin.top + margin.bottom}px;`;
    }
  },
  watch: {
    renderData() {
      this.clearPlot();
      this.renderPlot();
    },
    renderConfig: {
      handler() {
        this.clearPlot();
        this.renderPlot();
      },
      deep: true
    }
  },
  mounted() {
    this.renderPlot();
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    handleResize() {
      this.clearPlot();
      this.renderPlot();
    },
    clearPlot() {
      const c = document.getElementById('scatterPlot_' + this.plotId);
      if (c) {
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      }
      if (this.$refs.legend) {
        this.$refs.legend.innerHTML = '';
      }
      this.posData = {};
    },
    hidePanel() {
      const wrapper = document.getElementById('clicked_dot_value_' + this.plotId);
      if (wrapper) {
        wrapper.classList.add('hidden');
      }
      const canvas = document.getElementById('scatterPlot_' + this.plotId);
      if (canvas) {
        canvas.classList.remove('hover');
      }
    },
    checkPosition(event) {
      const wrapper = document.getElementById('clicked_dot_value_' + this.plotId);
      if (!wrapper) return;

      wrapper.classList.remove('hidden');

      const e = event;
      const rect = document.getElementById('scatterPlot_' + this.plotId).getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);

      const canvas = document.getElementById('scatterPlot_' + this.plotId);
      wrapper.style.top = y + canvas.offsetTop + 'px';
      wrapper.style.left = x + canvas.offsetLeft + 15 + 'px';

      let clickedDotValue = '';

      // Check a small area around the mouse cursor
      for (let h = -3; h <= 3; h++) {
        if (this.posData[x + h]) {
          for (let v = -3; v <= 3; v++) {
            if (this.posData[x + h][y + v]) {
              const dataArray = this.posData[x + h][y + v];
              dataArray.forEach(item => {
                const config = this.renderConfig;
                const hoverContent = config.hoverContent || [];

                // Only render fields from hoverContent
                hoverContent.forEach(field => {
                  if (item[field] != null && item[field] !== undefined) {
                    const value = typeof item[field] === 'number' ? item[field].toFixed(2) : item[field];
                    clickedDotValue += `<div><strong>${field}:</strong> ${value}</div>`;
                  }
                });
                clickedDotValue += '<hr>';
              });
            }
          }
        }
      }

      if (clickedDotValue !== '') {
        wrapper.innerHTML = clickedDotValue;
        document.getElementById('scatterPlot_' + this.plotId).classList.add('hover');
      } else {
        wrapper.innerHTML = '';
        wrapper.classList.add('hidden');
        document.getElementById('scatterPlot_' + this.plotId).classList.remove('hover');
      }
    },
    renderPlot() {
      if (!this.renderData || this.renderData.length === 0 || !this.renderConfig) {
        return;
      }

      const config = this.renderConfig;
      const margin = this.adjPlotMargin;
      const width = config.width || 500;
      const height = config.height || 300;
      const xLabel = config.xLabel || config.xKey || '';
      const yLabel = config.yLabel || config.yKey || '';
      const colorKey = config.colorKey;
      const colors = config.colors || [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
        '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
        '#c49c94'
      ];

      // Add extra space for Y-axis label (bumper)
      const yLabelBumper = 110; // Space for rotated Y-axis label
      const canvasWidth = (width + margin.left + margin.right) * 2 + yLabelBumper;
      const canvasHeight = (height + margin.top + margin.bottom) * 2;
      const chartWidth = width * 2;
      const chartHeight = height * 2;
      const leftMargin = (margin.left * 2) + yLabelBumper; // Add bumper space for Y-axis label
      const topMargin = margin.top * 2;

      const c = document.getElementById('scatterPlot_' + this.plotId);
      if (!c) return;

      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Clear posData
      this.posData = {};

      // Render legend above the plot if colorKey is provided
      if (colorKey && this.$refs.legend) {
        const uniqueValues = [...new Set(this.renderData.map(d => d.color).filter(v => v != null))];
        const colorScale = d3.scaleOrdinal()
          .domain(uniqueValues)
          .range(colors);

        // Clear previous legend
        this.$refs.legend.innerHTML = '';

        // Create HTML legend
        uniqueValues.forEach((value, index) => {
          const legendItem = document.createElement('div');
          legendItem.className = 'legend-item';
          legendItem.style.display = 'inline-block';
          legendItem.style.marginRight = '20px';
          legendItem.style.marginBottom = '5px';
          legendItem.style.verticalAlign = 'middle';

          const circle = document.createElement('span');
          circle.style.display = 'inline-block';
          circle.style.width = '8px';
          circle.style.height = '8px';
          circle.style.borderRadius = '50%';
          circle.style.backgroundColor = value != null ? colorScale(value) : '#999';
          circle.style.marginRight = '5px';
          circle.style.verticalAlign = 'middle';

          const label = document.createElement('span');
          label.style.fontSize = '11px';
          label.style.verticalAlign = 'middle';
          label.textContent = value != null ? value : 'N/A';

          legendItem.appendChild(circle);
          legendItem.appendChild(label);
          this.$refs.legend.appendChild(legendItem);
        });
      }

      // Calculate extents
      const xValues = this.renderData.map(d => d.x);
      const yValues = this.renderData.map(d => d.y);
      
      const xMin = Math.min(...xValues);
      const xMax = Math.max(...xValues);
      const yMin = Math.min(...yValues);
      const yMax = Math.max(...yValues);

      // Add padding to domains
      const xRange = xMax - xMin;
      const yRange = yMax - yMin;
      const xDomain = [xMin - xRange * 0.05, xMax + xRange * 0.05];
      const yDomain = [yMin - yRange * 0.05, yMax + yRange * 0.05];

      // Calculate scales
      const xScale = (value) => {
        return leftMargin + chartWidth * ((value - xDomain[0]) / (xDomain[1] - xDomain[0]));
      };

      const yScale = (value) => {
        return topMargin + chartHeight - (chartHeight * ((value - yDomain[0]) / (yDomain[1] - yDomain[0])));
      };

      // Set up color scale if colorKey is provided
      let colorScale = null;
      if (colorKey) {
        const uniqueValues = [...new Set(this.renderData.map(d => d.color).filter(v => v != null))];
        colorScale = d3.scaleOrdinal()
          .domain(uniqueValues)
          .range(colors);
      }

      // Draw axes
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.setLineDash([]);

      // X-axis
      ctx.moveTo(leftMargin, topMargin + chartHeight);
      ctx.lineTo(leftMargin + chartWidth, topMargin + chartHeight);
      ctx.stroke();

      // Y-axis
      ctx.moveTo(leftMargin, topMargin);
      ctx.lineTo(leftMargin, topMargin + chartHeight);
      ctx.stroke();

      // Draw axis ticks and labels
      const xTickCount = 5;
      const yTickCount = 5;
      const xTickStep = chartWidth / xTickCount;
      const yTickStep = chartHeight / yTickCount;
      const xValueStep = (xDomain[1] - xDomain[0]) / xTickCount;
      const yValueStep = (yDomain[1] - yDomain[0]) / yTickCount;

      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';

      // X-axis ticks
      for (let i = 0; i <= xTickCount; i++) {
        const xPos = leftMargin + i * xTickStep;
        const value = xDomain[0] + i * xValueStep;
        
        ctx.beginPath();
        ctx.moveTo(xPos, topMargin + chartHeight);
        ctx.lineTo(xPos, topMargin + chartHeight + 10);
        ctx.stroke();

        ctx.fillText(value.toFixed(2), xPos, topMargin + chartHeight + 34);
      }

      // Y-axis ticks
      ctx.textAlign = 'right';
      for (let i = 0; i <= yTickCount; i++) {
        const yPos = topMargin + chartHeight - i * yTickStep;
        const value = yDomain[0] + i * yValueStep;
        
        ctx.beginPath();
        ctx.moveTo(leftMargin - 5, yPos);
        ctx.lineTo(leftMargin, yPos);
        ctx.stroke();

        ctx.fillText(value.toFixed(2), leftMargin - 14, yPos + 3);
      }

      // Draw axis labels
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(xLabel, leftMargin + chartWidth / 2, topMargin + chartHeight + 70);

      ctx.save();
      ctx.translate(leftMargin - 110, topMargin + chartHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();

      // Draw grid lines
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical grid lines
      for (let i = 0; i <= xTickCount; i++) {
        const xPos = leftMargin + i * xTickStep;
        ctx.beginPath();
        ctx.moveTo(xPos, topMargin);
        ctx.lineTo(xPos, topMargin + chartHeight);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let i = 0; i <= yTickCount; i++) {
        const yPos = topMargin + chartHeight - i * yTickStep;
        ctx.beginPath();
        ctx.moveTo(leftMargin, yPos);
        ctx.lineTo(leftMargin + chartWidth, yPos);
        ctx.stroke();
      }

      // Reset line style
      ctx.setLineDash([]);
      ctx.lineWidth = 0;

      // Draw points
      this.renderData.forEach(d => {
        const xPos = xScale(d.x);
        const yPos = yScale(d.y);

        // Store position data for hover detection
        const posX = Math.round(xPos / 2);
        const posY = Math.round(yPos / 2);

        if (!this.posData[posX]) {
          this.posData[posX] = {};
        }

        if (!this.posData[posX][posY]) {
          this.posData[posX][posY] = [];
        }

        this.posData[posX][posY].push(d);

        // Draw circle
        ctx.beginPath();
        ctx.fillStyle = colorKey && colorScale && d.color != null 
          ? colorScale(d.color) 
          : colors[0] || '#1f77b4';
        ctx.globalAlpha = 0.7;
        ctx.arc(xPos, yPos, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });
    }
  }
});
</script>

<style scoped>
.scatter-plot-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.scatter-plot.hover,
.scatter-plot:hover {
  cursor: pointer;
}

.clicked-dot-value {
  position: absolute;
  background-color: #fff;
  border: solid 1px #aaa;
  box-shadow: 0 0 5px #00000075;
  font-size: 14px;
  padding: 8px 20px 8px 10px;
  max-width: 300px;
  border-radius: 5px;
  z-index: 10;
  width: auto;
}

.clicked-dot-value.hidden {
  display: none;
}

.plot-legend {
  margin-bottom: 10px;
  padding: 5px 0;
  line-height: 1.5;
  text-align: center;
  width: 100%;
}

.plot-legend .legend-item {
  white-space: nowrap;
}
</style>
