import dataConvert from "@/utils/dataConvert";
import * as d3 from 'd3';

/* fetch utils */
export async function fetchMetadata(url) {
    console.log('getting metadata', url);
    try {
        const response = await fetch(url);
        //returns line json
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const metadata = lines.map(line => JSON.parse(line));
        return metadata;
    } catch (error) {
        console.error('Error fetching metadata:', error);
    }
}
export async function fetchFields(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    console.log('getting fields', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        const fields = await response.json();
        return fields;
    } catch (error) {
        console.error('Error fetching fields:', error);
    }
}
export async function fetchCoordinates(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    console.log('getting coordinates', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        const json = dataConvert.tsv2Json(await response.text());
        return json;
    }catch (error){
        console.error('Error fetching coordinates:', error);
    }
}
export async function fetchMarkers(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    console.log('getting fields', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        const fields = await response.json();
        return fields;
    } catch (error) {
        console.error('Error fetching fields:', error);
        return null;
    }
}
export async function fetchGeneExpression(url, gene, datasetId){
    const replacedUrl = url.replace('$datasetId', datasetId).replace('$gene', gene);
    console.log(`getting ${gene} expression`, replacedUrl)
    try{
        const response = await fetch(replacedUrl);
        const json = await response.json();
        if(json.data.length===0){
            console.log(`${gene} not found`);
            return null;
        }
        const expression = json.data[0]['expression'];
        return expression;
    }catch(error){
        console.error('   Error fetching gene expression', error);
    }
}

export function calcFieldsDisplayList(fields){
    const list = [];
    for(const [key, value] of Object.entries(fields.metadata_labels)){
        list.push({"raw field": key, "field label": key.replaceAll("_", " ")});
    }
    console.log('   calcFieldsDisplayList', list);
    return list;
}

export function calcLabelColors(fields, colors){
    let colorIndex = 0;
    const colorScaleIndex = d3.scaleOrdinal(colors);
    const labelColors = {};
    for(const [key, value] of Object.entries(fields.metadata_labels)){
        labelColors[key] = {};
        for(var i=0; i<value.length; i++){
            labelColors[key][value[i]] = colorScaleIndex(colorIndex)
            colorIndex++;
        }
    }
    console.log('calcLabelColors', labelColors);
    return labelColors;
}

export function calcCellCounts(fields, labelColors, primaryKey, subsetKey){
    console.log('calcCellCounts', {fields, labelColors, primaryKey, subsetKey})
    const keys = fields.metadata_labels;
    const values = fields.metadata;
    
    const primaryLabels = keys[primaryKey];
    const primaryValues = values[primaryKey];

    const result = [];

    if (!subsetKey) {
        // calculate counts by primary key only
        primaryLabels.forEach((label, index) => {
            const indices = [];
                for (let i = 0; i < primaryValues.length; i++) {
                    if (primaryValues[i] === index) indices.push(i);
                }

            result.push({
                [primaryKey]: label,  
                count: indices.length,
                color: labelColors[primaryKey][label]
            });
        });
    } else {
        // calculate counts grouped by primary key and subset key
        const subsetValues = values[subsetKey];
        const subsetLabels = keys[subsetKey];

        primaryLabels.forEach((primaryLabel, primaryIndex) => {
            const primaryIndices = [];
                for (let i = 0; i < primaryValues.length; i++) {
                    if (primaryValues[i] === primaryIndex) primaryIndices.push(i);
                }

            subsetLabels.forEach((subsetLabel, subsetIndex) => {
                const subsetIndices = primaryIndices.filter(
                    i => subsetValues[i] === subsetIndex
                );
                result.push({
                    [primaryKey]: primaryLabel, 
                    [subsetKey]: subsetLabel, 
                    count: subsetIndices.length,
                    color: labelColors[subsetKey][subsetLabel]
                })
            });
        });
    }

    return result;
}

export function calcExpressionStats(fields, labelColors, expression, gene, primaryKey, subsetKey, partial=false) {
    //const expression = this.expressionData[gene];
    const keys = fields.metadata_labels;
    const values = fields.metadata;

    const primaryLabels = keys[primaryKey];
    const primaryValues = values[primaryKey];

    const result = [];

    if (!subsetKey) {
        // calculate stats grouped by primary key only
        primaryLabels.forEach((label, index) => {
            const indices = [];
            for (let i = 0; i < primaryValues.length; i++) {
                if (primaryValues[i] === index) indices.push(i);
            }

            const exprValues = indices.map(i => expression[i]);
            result.push({
                gene: gene,
                [primaryKey]: label, 
                color: labelColors[primaryKey][label],
                ...calculateExpressionStats(exprValues, partial)
            });
        });
    } else {
        // calculate stats grouped by primary key and subset key
        const subsetValues = values[subsetKey];
        const subsetLabels = keys[subsetKey];

        primaryLabels.forEach((primaryLabel, primaryIndex) => {

            const primaryIndices = [];
            for (let i = 0; i < primaryValues.length; i++) {
                if (primaryValues[i] === primaryIndex) primaryIndices.push(i);
            }

            subsetLabels.forEach((subsetLabel, subsetIndex) => {
                const subsetIndices = primaryIndices.filter(
                    i => subsetValues[i] === subsetIndex
                );
                const exprValues = subsetIndices.map(i => expression[i]);
                result.push({
                    gene: gene,
                    [primaryKey]: primaryLabel,
                    [subsetKey]: subsetLabel,
                    color: labelColors[subsetKey][subsetLabel],
                    ...calculateExpressionStats(exprValues)
                })
            });
        });
    }

    return result;
}


function calculateExpressionStats(exprValues, partial=false) {
    const sortedValues = exprValues.sort(d3.ascending);

    const mean = d3.mean(sortedValues) || 0;
    const median = d3.quantile(sortedValues, 0.5) || 0;
    const pctExpr = (sortedValues.filter(v => v > 0).length / sortedValues.length) * 100 || 0;
    const q1 = d3.quantile(sortedValues, 0.25) || 0;
    const q3 = d3.quantile(sortedValues, 0.75) || 0;

    if(!partial){
        return {
            exprValues: sortedValues,
            interQuantileRange: q3 - q1,
            min: sortedValues[0] || 0,
            max: sortedValues[sortedValues.length-1] || 0,
            mean,
            median,
            pctExpr,
            q1,
            q3
        }
    }else{
        return {
            mean,
            pctExpr
        }
    }
}