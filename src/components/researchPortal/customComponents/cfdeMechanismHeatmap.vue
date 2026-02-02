<template>
    <div id="heatmapSection" class="heatmap-container">

    </div>
</template>

<script>
    import Vue from "vue";
    import { BootstrapVueIcons } from "bootstrap-vue";
    Vue.use(BootstrapVueIcons);

    import * as d3 from "d3";

    export default Vue.component("cfde-mechanism-heatmap", {
        props: ["associations"],
        data() {
            return {
                
            };
        },
        mounted() {
            console.log('heatmap', this.associations)
            if(!this.associations) return;
            this.processAssociations4KG(this.associations);
        },
        beforeDestroy() {
        },
        methods: {
            processAssociations4KG(associations){
                // 1. Make a copy of associations data so original data wouldn't be modified
                const copiedAssociations = structuredClone(associations);
                
                // 2. Filter out any items with "beta_uncorrected" < 0.01
                const filteredAssociations = copiedAssociations.filter(item => {
                    const beta = parseFloat(item.beta_uncorrected);
                    return !isNaN(beta) && beta >= 0.01;
                });
                
                // 3. Filter out genes with "combined" score < 1 in each association's genes array
                const processedAssociations = filteredAssociations.map(item => {
                    if (Array.isArray(item.genes)) {
                        const filteredGenes = item.genes.filter(gene => {
                            const combined = parseFloat(gene.combined);
                            return !isNaN(combined) && combined >= 1;
                        });
                        return {
                            ...item,
                            genes: filteredGenes
                        };
                    }
                    return item;
                });
                
                // 4. Reorganize the data by phenotypes
                const reorganizedByPhenotype = this.groupBy(processedAssociations, 'phenotype');
                
                // 5. Log the reorganized data
                console.log('Reorganized associations by phenotype:', reorganizedByPhenotype);

                // Render heatmap from processed data
                this.renderHeatmap(reorganizedByPhenotype);
                
                return reorganizedByPhenotype;
            },
            renderHeatmap(reorganizedByPhenotype){
                const root = d3.select('#heatmapSection.heatmap-container');
                if (root.empty()) {
                    console.warn('Heatmap container (#heatmapSection.heatmap-container) not found.');
                    return;
                }

                const phenotypes = Object.keys(reorganizedByPhenotype || {}).filter(Boolean).sort();

                const existingSelectEl = root.select('select.heatmap-phenotype-select').node();
                const previouslySelected = existingSelectEl?.value;
                const defaultPhenotype = previouslySelected && phenotypes.includes(previouslySelected)
                    ? previouslySelected
                    : phenotypes[0];

                root.selectAll('*').remove();

                if (!phenotypes.length) {
                    root.append('div').style('color', '#777').text('No phenotype data available for heatmap.');
                    return;
                }

                document.getElementById('heatmapSection').style.display = 'block';

                // Controls
                const controls = root.append('div')
                    .attr('class', 'heatmap-controls')
                    .style('display', 'flex')
                    .style('flex-wrap', 'wrap')
                    .style('gap', '10px')
                    .style('align-items', 'center')
                    .style('margin', '10px 0');

                controls.append('div').style('font-weight', 'bold').text('Phenotype');
                const select = controls.append('select')
                    .attr('class', 'heatmap-phenotype-select')
                    .attr('id', 'heatmapPhenotypeSelect')
                    .style('padding', '6px 8px')
                    .style('max-width', '100%');
                select.selectAll('option').data(phenotypes, d => d).enter().append('option').attr('value', d => d).text(d => d);
                select.property('value', defaultPhenotype);

                const viz = root.append('div').attr('class', 'heatmap-viz');
                // Append tooltip to body so position:fixed is viewport-relative and it appears near the pointer
                d3.select('#heatmapTooltip').remove();
                const tooltipEl = d3.select('body').append('div')
                    .attr('id', 'heatmapTooltip')
                    .attr('class', 'heatmap-tooltip')
                    .style('position', 'fixed')
                    .style('display', 'none')
                    .style('opacity', 0)
                    .style('left', 0)
                    .style('top', 0)
                    .style('padding', '8px 12px')
                    .style('background', 'rgba(0,0,0,0.85)')
                    .style('color', '#fff')
                    .style('font-size', '12px')
                    .style('border-radius', '6px')
                    .style('pointer-events', 'none')
                    .style('z-index', '10000')
                    .style('max-width', '320px');
                const tooltip = d3.select('#heatmapTooltip');

                const draw = (phenotypeName) => {
                    viz.selectAll('svg').remove();
                    viz.selectAll('.heatmap-legend').remove();
                    const associations = reorganizedByPhenotype?.[phenotypeName] || [];
                    if (!associations.length) {
                        viz.append('div').style('color', '#777').text('No associations for selected phenotype.');
                        return;
                    }

                    // Build DATA: use gene_set for row keys; store gene_set_label for tooltips
                    const phenotypeRelevance = { genes: {}, geneSets: {} };
                    const genesInGeneSet = {};
                    const geneScoresInGeneSet = {};
                    const geneSetLabels = {}; // gene_set -> gene_set_label
                    const byGeneSet = new Map();

                    associations.forEach(a => {
                        const gsId = a.gene_set || '(unknown gene set)';
                        const beta = parseFloat(a.beta_uncorrected);
                        if (!byGeneSet.has(gsId) || (beta > parseFloat(byGeneSet.get(gsId)?.beta_uncorrected))) {
                            byGeneSet.set(gsId, a);
                        }
                        if (a.gene_set_label != null) geneSetLabels[gsId] = a.gene_set_label;
                    });
                    byGeneSet.forEach((assoc, gsId) => {
                        if (assoc.gene_set_label != null) geneSetLabels[gsId] = assoc.gene_set_label;
                        const w = parseFloat(assoc.beta_uncorrected);
                        phenotypeRelevance.geneSets[gsId] = { weight: isNaN(w) ? null : w };
                        const geneList = (assoc.genes || []).map(g => g.gene).filter(Boolean);
                        genesInGeneSet[gsId] = geneList;
                        const scores = {};
                        (assoc.genes || []).forEach(g => {
                            if (g.gene != null) {
                                const c = parseFloat(g.combined);
                                if (!isNaN(c)) scores[g.gene] = c;
                            }
                        });
                        geneScoresInGeneSet[gsId] = scores;
                        (assoc.genes || []).forEach(g => {
                            if (g.gene == null) return;
                            const combined = parseFloat(g.combined);
                            const logBf = parseFloat(g.log_bf);
                            const prior = parseFloat(g.prior);
                            const prev = phenotypeRelevance.genes[g.gene]?.weight;
                            if (prev == null || (combined != null && !isNaN(combined) && combined > prev)) {
                                phenotypeRelevance.genes[g.gene] = {
                                    weight: combined,
                                    log_bf: logBf != null && !isNaN(logBf) ? logBf : null,
                                    prior: prior != null && !isNaN(prior) ? prior : null
                                };
                            }
                        });
                    });
                    Object.keys(phenotypeRelevance.genes).forEach(geneId => {
                        const g = phenotypeRelevance.genes[geneId];
                        if (g.weight == null) g.weight = null;
                        if (g.log_bf == null) g.log_bf = null;
                        if (g.prior == null) g.prior = null;
                    });

                    const genesFilteredByWeight = Object.keys(phenotypeRelevance.genes).filter(id => {
                        const geneData = phenotypeRelevance.genes[id];
                        return geneData.weight !== null;
                    });
                    const geneSetsFilteredByWeight = Object.keys(phenotypeRelevance.geneSets).filter(id => {
                        const gsData = phenotypeRelevance.geneSets[id];
                        return gsData.weight !== null;
                    });

                    const genesFilteredByWeightSet = new Set(genesFilteredByWeight);
                    const finalGeneSets = geneSetsFilteredByWeight.filter(gsId => {
                        const members = genesInGeneSet[gsId] || [];
                        return members.some(geneId => genesFilteredByWeightSet.has(geneId));
                    });
                    finalGeneSets.sort((a, b) => {
                        const scoreA = phenotypeRelevance.geneSets[a]?.weight ?? 0;
                        const scoreB = phenotypeRelevance.geneSets[b]?.weight ?? 0;
                        return scoreB - scoreA;
                    });
                    const finalGenes = genesFilteredByWeight.filter(geneId =>
                        finalGeneSets.some(gsId => (genesInGeneSet[gsId] || []).includes(geneId))
                    );

                    finalGenes.sort((geneIdA, geneIdB) => {
                        const scoreA = phenotypeRelevance.genes[geneIdA]?.weight ?? 0;
                        const scoreB = phenotypeRelevance.genes[geneIdB]?.weight ?? 0;
                        return scoreB - scoreA;
                    });

                    const DATA = {
                        phenotypeRelevance,
                        genesInGeneSet,
                        geneScoresInGeneSet,
                        geneSetLabels
                    };

                    const columns = [phenotypeName, ...finalGenes];
                    const scoreRowIds = ['Combined score', 'GWAS support', 'Gene set support'];
                    const rows = [...scoreRowIds, ...finalGeneSets];

                    console.log('=== Rendered Heatmap Data ===');
                    console.log('Phenotype:', phenotypeName);
                    console.log('Genes rendered:', finalGenes.length);
                    console.log('Gene sets rendered:', finalGeneSets.length);
                    console.log('Genes with scores:', finalGenes.map(geneId => ({ gene: geneId, score: DATA.phenotypeRelevance.genes[geneId]?.weight ?? null })));
                    console.log('Gene sets with scores:', finalGeneSets.map(gsId => ({ geneSet: gsId, score: DATA.phenotypeRelevance.geneSets[gsId]?.weight ?? null })));
                    console.log('Columns:', columns);
                    console.log('Rows:', rows);

                    const cellSize = 20;
                    const margin = { top: 120, right: 20, bottom: 20, left: 200 };
                    const width = columns.length * cellSize + margin.left + margin.right;
                    const height = rows.length * cellSize + margin.top + margin.bottom;

                    // Color legend above the heatmap
                    const legend = viz.append('div').attr('class', 'heatmap-legend').style('margin-bottom', '16px');
                    const legendRow = (parent, items) => {
                        const row = parent.append('div').style('display', 'inline-flex').style('align-items', 'center').style('flex-wrap', 'wrap').style('gap', '10px 6px').style('margin', '1px 0');
                        items.forEach(({ color, border, opacity, label }) => {
                            const pair = row.append('span').style('display', 'inline-flex').style('align-items', 'center').style('gap', '4px');
                            const swatch = pair.append('span').style('display', 'inline-block').style('width', '14px').style('height', '14px').style('background', color).style('flex-shrink', '0');
                            if (border) swatch.style('border', '1px solid #666');
                            if (opacity != null) swatch.style('opacity', opacity);
                            pair.append('span').style('font-size', '12px').style('color', '#333').text(label);
                        });
                        return row;
                    };
                    const sec1 = legend.append('div').style('margin-bottom', '3px');
                    sec1.append('div').style('font-weight', 'bold').style('font-size', '12px').style('color', '#333').style('display', 'inline-flex').style('margin-right', '5px').style('vertical-align', '3px').text('Gene relevance to phenotype:');
                    legendRow(sec1, [
                        { color: '#4a90e2', label: 'Very Strong (> 3)' },
                        { color: '#f5a623', label: 'Strongly Suggestive (2-3)' },
                        { color: '#f8e71c', label: 'Nominally Significant (1-2)' }
                    ]);
                    const sec2 = legend.append('div').style('margin-bottom', '3px');
                    sec2.append('div').style('font-weight', 'bold').style('font-size', '12px').style('color', '#333').style('display', 'inline-flex').style('margin-right', '5px').style('vertical-align', '3px').text('Gene set relevance to phenotype:');
                    legendRow(sec2, [
                        { color: '#4a90e2', label: 'Very Strong (> 1)' },
                        { color: '#f5a623', label: 'Strongly Suggestive (0.1-1)' },
                        { color: '#f8e71c', label: 'Nominally Significant (0.01-0.1)' }
                    ]);
                    const sec3 = legend.append('div');
                    sec3.append('div').style('font-weight', 'bold').style('font-size', '12px').style('color', '#333').style('display', 'inline-flex').style('margin-right', '5px').style('vertical-align', '3px').text('Membership:');
                    legendRow(sec3, [
                        { color: '#9c27b0', label: 'Genes associated with gene set' }
                    ]);

                    const svg = viz.append('svg').attr('id', 'heatmap').attr('width', width).attr('height', height).style('overflow', 'visible');
                    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

                    // Combined score: fixed 16px diameter (radius 8). GWAS/Gene set: radius by proportion of that score in combined for the gene.
                    const fixedCombinedRadius = 8;
                    const scoreColor = (val) => {
                        if (val == null || !Number.isFinite(val)) return { cellColor: '#eee', opacity: 0.5 };
                        if (val >= 3) return { cellColor: '#4a90e2', opacity: 1 };
                        if (val >= 2) return { cellColor: '#f5a623', opacity: 1 };
                        if (val >= 1) return { cellColor: '#f8e71c', opacity: 1 };
                        return { cellColor: '#eee', opacity: 0.5 };
                    };

                    rows.forEach((rowId, rowIndex) => {
                        columns.forEach((colId, colIndex) => {
                            let opacity = 0, type = 'none', value = null, cellColor = '#ff4d4d', isScoreCircle = false, circleRadius = 0;
                            if (rowIndex >= 0 && rowIndex <= 2) {
                                if (colIndex === 0) {
                                    type = 'score_row_label';
                                    cellColor = '#f5f5f5';
                                    opacity = 1;
                                } else {
                                    const geneData = DATA.phenotypeRelevance.genes[colId];
                                    const combined = geneData?.weight != null && Number.isFinite(geneData.weight) ? geneData.weight : 0;
                                    const logBf = geneData?.log_bf != null && Number.isFinite(geneData.log_bf) ? geneData.log_bf : 0;
                                    const priorVal = geneData?.prior != null && Number.isFinite(geneData.prior) ? geneData.prior : 0;
                                    if (rowIndex === 0) {
                                        value = combined;
                                        circleRadius = fixedCombinedRadius;
                                    } else if (rowIndex === 1) {
                                        value = logBf;
                                        circleRadius = combined > 0 ? fixedCombinedRadius * (logBf / combined) : 0;
                                    } else {
                                        value = priorVal;
                                        circleRadius = combined > 0 ? fixedCombinedRadius * (priorVal / combined) : 0;
                                    }
                                    const style = scoreColor(value);
                                    cellColor = style.cellColor;
                                    opacity = style.opacity;
                                    type = rowIndex === 0 ? 'combined_score' : rowIndex === 1 ? 'gwas_support' : 'gene_set_support';
                                    isScoreCircle = true;
                                }
                            } else if (rowIndex >= 3 && colIndex === 0) {
                                const gsData = DATA.phenotypeRelevance.geneSets[rowId];
                                if (gsData && gsData.weight !== null) {
                                    value = gsData.weight; type = 'geneset_relevance';
                                    if (value >= 1) { cellColor = '#4a90e2'; opacity = 1; }
                                    else if (value >= 0.1) { cellColor = '#f5a623'; opacity = 1; }
                                    else if (value >= 0.01) { cellColor = '#f8e71c'; opacity = 1; }
                                    else { cellColor = '#eee'; opacity = 0.5; }
                                }
                            } else if (rowIndex >= 3) {
                                const genesInCurrentSet = DATA.genesInGeneSet[rowId] || [];
                                if (genesInCurrentSet.includes(colId)) {
                                    type = 'membership';
                                    cellColor = '#9c27b0';
                                    const geneScores = DATA.geneScoresInGeneSet?.[rowId] || {};
                                    const score = geneScores[colId];
                                    if (score != null && Number.isFinite(score)) {
                                        if (score >= 3) opacity = 1;
                                        else if (score <= 1) opacity = 0;
                                        else opacity = (score - 1) / 2;
                                    } else {
                                        opacity = 0.5;
                                    }
                                }
                            }

                            const rectFill = isScoreCircle ? '#fafafa' : cellColor;
                            const rectOpacity = isScoreCircle ? 1 : opacity;
                            g.append('rect')
                                .attr('x', colIndex * cellSize)
                                .attr('y', rowIndex * cellSize)
                                .attr('width', cellSize)
                                .attr('height', cellSize)
                                .attr('class', 'heatmap-cell')
                                .attr('fill', rectFill)
                                .attr('opacity', rectOpacity)
                                .attr('stroke', '#ddd')
                                .on('mouseover', function() {
                                    const ev = d3.event || window.event;
                                    let tooltipHtml = '';
                                    const geneSetLabel = DATA.geneSetLabels?.[rowId] ?? rowId;
                                    if (type === 'score_row_label') tooltipHtml = `<strong>${rowId}</strong>`;
                                    else if ((type === 'combined_score' || type === 'gwas_support' || type === 'gene_set_support') && opacity > 0) {
                                        const scoreLabel = type === 'combined_score' ? 'Combined' : type === 'gwas_support' ? 'GWAS support (log_bf)' : 'Gene set support (prior)';
                                        tooltipHtml = `<strong>Gene:</strong> ${colId}<br/><strong>${scoreLabel}:</strong> ${value != null && Number.isFinite(value) ? Number(value).toFixed(3) : 'N/A'}`;
                                    } else if (type === 'geneset_relevance' && opacity > 0) tooltipHtml = `<strong>Gene set:</strong> ${rowId}<br/><strong>Gene set label:</strong> ${geneSetLabel}<br/><strong>Relevance:</strong> ${value != null ? Number(value).toFixed(3) : 'N/A'}`;
                                    else if (type === 'membership' && opacity > 0) {
                                        const geneScores = DATA.geneScoresInGeneSet?.[rowId] || {};
                                        const score = geneScores[colId];
                                        const scoreText = score != null && Number.isFinite(score) ? score.toFixed(3) : 'N/A';
                                        tooltipHtml = `<strong>Gene set label:</strong> ${geneSetLabel}<br/><strong>Gene:</strong> ${colId}<br/><strong>Combined:</strong> ${scoreText}`;
                                    }
                                    if (tooltipHtml && ev) {
                                        // Use clientX/clientY for position:fixed (viewport-relative)
                                        const x = (ev.clientX != null ? ev.clientX : ev.pageX) + 10;
                                        const y = (ev.clientY != null ? ev.clientY : ev.pageY) - 28;
                                        tooltip.style('display', 'block');
                                        tooltip.html(tooltipHtml);
                                        tooltip.style('left', x + 'px').style('top', y + 'px');
                                        tooltip.transition().duration(200).style('opacity', 0.9);
                                        d3.select(`.row-label-${rowIndex}`).classed('highlighted', true);
                                        d3.select(`.col-label-${colIndex}`).classed('highlighted', true);
                                    }
                                })
                                .on('mousemove', function() {
                                    const ev = d3.event || window.event;
                                    if (ev) {
                                        const x = (ev.clientX != null ? ev.clientX : ev.pageX) + 10;
                                        const y = (ev.clientY != null ? ev.clientY : ev.pageY) - 28;
                                        tooltip.style('left', x + 'px').style('top', y + 'px');
                                    }
                                })
                                .on('mouseout', () => {
                                    tooltip.transition().duration(500).style('opacity', 0).on('end', function() {
                                        d3.select(this).style('display', 'none');
                                    });
                                    d3.selectAll('.axis-label').classed('highlighted', false);
                                });

                            if (isScoreCircle && circleRadius > 0) {
                                const cx = colIndex * cellSize + cellSize / 2;
                                const cy = rowIndex * cellSize + cellSize / 2;
                                const scoreLabel = rowIndex === 0 ? 'Combined' : rowIndex === 1 ? 'GWAS support (log_bf)' : 'Gene set support (prior)';
                                g.append('circle')
                                    .attr('cx', cx)
                                    .attr('cy', cy)
                                    .attr('r', circleRadius)
                                    .attr('fill', cellColor)
                                    .attr('opacity', opacity)
                                    .attr('class', 'heatmap-cell heatmap-score-circle')
                                    .attr('stroke', '#ddd')
                                    .on('mouseover', function() {
                                        const ev = d3.event || window.event;
                                        const geneSetLabel = DATA.geneSetLabels?.[rowId] ?? rowId;
                                        const scoreText = value != null && Number.isFinite(value) ? Number(value).toFixed(3) : 'N/A';
                                        const tooltipHtml = `<strong>Gene:</strong> ${colId}<br/><strong>${scoreLabel}:</strong> ${scoreText}`;
                                        if (tooltipHtml && ev) {
                                            const x = (ev.clientX != null ? ev.clientX : ev.pageX) + 10;
                                            const y = (ev.clientY != null ? ev.clientY : ev.pageY) - 28;
                                            tooltip.style('display', 'block').html(tooltipHtml).style('left', x + 'px').style('top', y + 'px');
                                            tooltip.transition().duration(200).style('opacity', 0.9);
                                            d3.select(`.row-label-${rowIndex}`).classed('highlighted', true);
                                            d3.select(`.col-label-${colIndex}`).classed('highlighted', true);
                                        }
                                    })
                                    .on('mousemove', function() {
                                        const ev = d3.event || window.event;
                                        if (ev) tooltip.style('left', ((ev.clientX != null ? ev.clientX : ev.pageX) + 10) + 'px').style('top', ((ev.clientY != null ? ev.clientY : ev.pageY) - 28) + 'px');
                                    })
                                    .on('mouseout', () => {
                                        tooltip.transition().duration(500).style('opacity', 0).on('end', function() { d3.select(this).style('display', 'none'); });
                                        d3.selectAll('.axis-label').classed('highlighted', false);
                                    });
                            }
                        });
                    });

                    g.selectAll('.row-label').data(rows).enter().append('text')
                        .text(d => d)
                        .attr('x', -10)
                        .attr('y', (d, i) => i * cellSize + cellSize / 2)
                        .attr('dy', '.35em')
                        .attr('text-anchor', 'end')
                        .attr('class', (d, i) => `axis-label row-label-${i}`)
                        .style('font-size', '10px')
                        .style('fill', '#333')
                        .style('font-weight', (d, i) => i <= 2 ? 'bold' : 'normal');

                    g.selectAll('.col-label').data(columns).enter().append('text')
                        .text(d => d)
                        .attr('transform', (d, i) => `translate(${i * cellSize + cellSize / 2}, -10) rotate(-45)`)
                        .attr('text-anchor', 'start')
                        .attr('class', (d, i) => `axis-label col-label-${i}`)
                        .style('font-size', '10px')
                        .style('fill', '#333')
                        .style('font-weight', (d, i) => i === 0 ? 'bold' : 'normal');
                };

                draw(defaultPhenotype);
                select.on('change', () => draw(document.getElementById('heatmapPhenotypeSelect').value));
            },
            groupBy(array, key) {
                return array.reduce((result, item) => {
                    const groupKey = item[key];
                    if (!result[groupKey]) {
                        result[groupKey] = [];
                    }
                    result[groupKey].push(item);
                    return result;
                }, {});
            },
        }
    });
</script>

<style scoped>
    .heatmap-container{
        margin-top: 10px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 10px;
        background: #fafafa;
        overflow: auto;
    }

    .heatmap-container .axis-label.highlighted {
        font-weight: bold;
        fill: #ff6600;
    }

    .heatmap-container .heatmap-tooltip {
        pointer-events: none;
    }

    .heatmap-container .heatmap-legend {
        background: #fff;
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid #eee;
    }
</style>
