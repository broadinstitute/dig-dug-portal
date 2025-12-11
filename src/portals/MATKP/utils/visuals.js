import * as d3 from 'd3';

export function createColorScale(numericalExtremes, colorExtremes){
    return d3.scaleLinear()
        .range(colorExtremes)
        .domain(numericalExtremes);
}