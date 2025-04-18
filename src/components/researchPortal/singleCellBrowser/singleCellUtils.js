import dataConvert from "@/utils/dataConvert";
import * as d3 from 'd3';
import {llog} from "./llog.js";

/* fetch utils */
export async function fetchMetadata(url) {
    llog('getting metadata', url);
    try {
        const response = await fetch(url);
        //returns line json
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const metadata = lines.map(line => JSON.parse(line));
        return metadata;
    } catch (error) {
        llog('Error fetching metadata:', error);
    }
}
export async function fetchFields(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    llog('getting fields', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        const fields = await response.json();
        return fields;
    } catch (error) {
        llog('Error fetching fields:', error);
    }
}
export async function fetchCoordinates(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    llog('getting coordinates', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        const json = dataConvert.tsv2Json(await response.text());
        return json;
    }catch (error){
        llog('Error fetching coordinates:', error);
    }
}
export async function fetchMarkers(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    llog('getting markers', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        //likely temporary, but currently the marker_genes api
        //may send a json object or line-json
        //here we catch that and return a json object either way
        const text = await response.text();
        let markers;
        try{
            markers = JSON.parse(text);
        }catch{
            const lines = text.split('\n').filter(line => line.trim() !== '');
            markers = lines.map(line => JSON.parse(line));
        }
        return markers;
    } catch (error) {
        llog('Error fetching markers:', error);
        return null;
    }
}
export async function fetchGeneExpression(url, gene, datasetId){
    const replacedUrl = url.replace('$datasetId', datasetId).replace('$gene', gene);
    llog(`getting ${gene} expression`, replacedUrl)
    try{
        const response = await fetch(replacedUrl);
        const json = await response.json();
        if(json.data.length===0){
            llog(`${gene} not found`);
            return null;
        }
        const expression = json.data[0]['expression'];
        return expression;
    }catch(error){
        llog('   Error fetching gene expression', error);
        return null;
    }
}

export function calcFieldsDisplayList(fields){
    const list = [];
    for(const [key, value] of Object.entries(fields.metadata_labels)){
        list.push({"raw field": key, "field label": key.replaceAll("_", " ")});
    }
    llog('   calcFieldsDisplayList', list);
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
    llog('calcLabelColors', labelColors);
    return labelColors;
}

export function calcCellCounts(fields, labelColors, primaryKey, subsetKey){
    llog('calcCellCounts', {fields, labelColors, primaryKey, subsetKey})
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

function parseStringValue(str) {
    // Trim it so we handle random spaces
    const trimmed = str.trim().toLowerCase();
    
    // 1. Check for boolean strings
    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
  
    // 2. Check for numeric strings
    const num = Number(str);
    // If parseable and not NaN
    if (!isNaN(num) && str !== '') {
      return num;
    }
  
    // 3. Check for date - just see if new Date(...) is valid
    /*const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime())) {
      return dateObj;
    }*/
  
    // 4. Fallback: keep as string
    return str;
  }
  
  /**
   * Given an array of  values, parse them into real types if possible,
   * then use heuristics to detect if the result is boolean, numeric, datetime, etc.
   */
export function detectVarType(values, options = {}) {
    const { categoricalThreshold = 0.2 } = options;
  
    // 1. Parse each string to the best possible type
    const parsedValues = values.map(parseStringValue);
  
    // 2. Filter out null/undefined
    const nonMissing = parsedValues.filter(v => v !== null && v !== undefined);
    if (nonMissing.length === 0) {
      return 'unknown';
    }
  
    // 3. Check if all booleans
    const allBooleans = nonMissing.every(v => typeof v === 'boolean');
    if (allBooleans) {
      return 'boolean';
    }
  
    // 4. Check if all dates
    /*const allDates = nonMissing.every(v => v instanceof Date && !isNaN(v.getTime()));
    if (allDates) {
      return 'datetime';
    }*/
  
    // 5. Check if all numeric
    const allNumeric = nonMissing.every(v => typeof v === 'number' && !isNaN(v));
    if (allNumeric) {
      // Calculate ratio of unique values to total
      const uniqueNums = new Set(nonMissing);
      const ratio = uniqueNums.size / nonMissing.length;
      return ratio <= categoricalThreshold ? 'categorical' : 'continuous';
    }
  
    // 6. Finally, do a “categorical vs text” check
    const uniqueValues = new Set(nonMissing);
    const ratio = uniqueValues.size / nonMissing.length;
    //llog(uniqueValues.size, nonMissing.length, ratio, categoricalThreshold)
    //llog(parsedValues);
    if (ratio >= categoricalThreshold) {
      return 'categorical';
    }
  
    // 7. If none of the above, it’s probably freeform text
    return 'text';
  }
   