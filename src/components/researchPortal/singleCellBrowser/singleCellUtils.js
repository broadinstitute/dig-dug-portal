import dataConvert from "@/utils/dataConvert";
import * as d3 from 'd3';
import { llog } from "./llog.js";

/* fetch utils */
export async function fetchMetadata(url) {
    //console.log('getting metadata', url);
    try {
        const response = await fetch(url);
        //returns line json
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const metadata = lines.map(line => JSON.parse(line));
        return metadata;
    } catch (error) {
        llog('Error fetching metadata:', error);
        return null;
    }
}
export async function fetchFields(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    //console.log('getting fields', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        const fields = await response.json();
        return fields;
    } catch (error) {
        llog('Error fetching fields:', error);
        return null;
    }
}
export async function fetchCoordinates(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    //console.log('getting coordinates', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        const json = dataConvert.tsv2Json(await response.text());
        return json;
    } catch (error) {
        console.error('Error fetching coordinates:', error);
    }
}
export async function fetchMarkers(url, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId);
    //console.log('getting markers', replacedUrl);
    try {
        const response = await fetch(replacedUrl);
        //likely temporary, but currently the marker_genes api
        //may send a json object or line-json
        //here we catch that and return a json object either way
        const text = await response.text();
        let markers;
        try {
            markers = JSON.parse(text);
        } catch {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            markers = lines.map(line => JSON.parse(line));
        }
        return markers;
    } catch (error) {
        llog('Error fetching markers:', error);
        return null;
    }
}
export async function fetchGeneExpression(url, gene, datasetId) {
    const replacedUrl = url.replace('$datasetId', datasetId).replace('$gene', gene);
    //console.log(`getting ${gene} expression`, replacedUrl)
    try {
        const response = await fetch(replacedUrl);
        const json = await response.json();
        if (json.data.length === 0) {
            //console.log(`${gene} not found`);
            return null;
        }
        const expression = json.data[0]['expression'];
        return expression;
    } catch (error) {
        console.error('   Error fetching gene expression', error);
        return null;
    }
}

export function calcFieldsDisplayList(fields) {
    const list = [];
    for (const [key, value] of Object.entries(fields.metadata_labels)) {
        list.push({ "raw field": key, "field label": key.replaceAll("_", " ") });
    }
    //console.log('   calcFieldsDisplayList', list);
    return list;
}

export function calcLabelColors(fields, colors) {
    let colorIndex = 0;
    const colorScaleIndex = d3.scaleOrdinal(colors);
    const labelColors = {};
    for (const [key, value] of Object.entries(fields.metadata_labels)) {
        labelColors[key] = {};
        for (var i = 0; i < value.length; i++) {
            labelColors[key][value[i]] = colorScaleIndex(colorIndex)
            colorIndex++;
        }
    }
    //console.log('calcLabelColors', labelColors);
    return labelColors;
}

export function calcCellCounts(fields, labelColors, primaryKey, subsetKey) {
    //console.log('calcCellCounts', {fields, labelColors, primaryKey, subsetKey})
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

export function calcCellCounts2(fields, labelColors, primaryKey, subsetKey, facetKey) {
    llog('calcCellCounts2', { fields, labelColors, primaryKey, subsetKey, facetKey })
    const keys = fields.metadata_labels;
    const values = fields.metadata;

    const primaryLabels = keys[primaryKey];
    const primaryValues = values[primaryKey];

    const result = [];

    if (!facetKey && !subsetKey) {
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
    } else if (!facetKey) {
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
    } else {
        // calculate counts grouped by primary key, subset key, and facet key
        const subsetValues = values[subsetKey];
        const subsetLabels = keys[subsetKey];

        const facetValues = values[facetKey];
        const facetLabels = keys[facetKey];

        primaryLabels.forEach((primaryLabel, primaryIndex) => {
            const primaryIndices = [];
            for (let i = 0; i < primaryValues.length; i++) {
                if (primaryValues[i] === primaryIndex) primaryIndices.push(i);
            }

            facetLabels.forEach((facetLabel, facetIndex) => {
                const facetFiltered = primaryIndices.filter(
                    i => facetValues[i] === facetIndex
                );

                subsetLabels.forEach((subsetLabel, subsetIndex) => {
                    const subsetFiltered = facetFiltered.filter(
                        i => subsetValues[i] === subsetIndex
                    );

                    result.push({
                        [primaryKey]: primaryLabel,
                        [subsetKey]: subsetLabel,
                        [facetKey]: facetLabel,
                        count: subsetFiltered.length,
                        color: labelColors[subsetKey][subsetLabel]
                    });
                });
            });
        });
    }

    return result;
}

/**
 * computeProportions - pooled proportions normalized within group(s)
 * @param {Object} metadata - key: annotation name, value: array of numeric indices
 * @param {Object} metadataLabels - key: annotation name, value: array of string labels
 * @param {Array} groupBy - 1-3 keys to group proportions by, in order: x, stack, facet
 * @param {Boolean} debug - optional flag to log intermediate keys
 * @returns {Object} - { data: Array of results, roles: { x, stack, facet } }
 */
export function computeCellProportions(metadata, metadataLabels, groupBy = [], debug = false) {
    if (groupBy.length < 1 || groupBy.length > 3) {
        throw new Error("You must group by 1 to 3 metadata keys.");
    }

    const [xKey, stackKey, facetKey] = groupBy;
    const roles = {
        x: xKey || null,
        stack: stackKey || null,
        facet: facetKey || null,
    };

    const numCells = metadata[groupBy[0]].length;
    const counts = {};
    const totals = {};

    for (let i = 0; i < numCells; i++) {
        const labelParts = groupBy.map(k => metadataLabels[k][metadata[k][i]]);
        const compositeKey = labelParts.join("|||");

        // Group key determines the denominator group: everything that shares x + facet
        const denominatorKey = groupBy.length === 1
            ? "ALL"
            : [xKey, facetKey]
                .filter(Boolean)
                .map(k => metadataLabels[k][metadata[k][i]])
                .join("|||");

        counts[compositeKey] = (counts[compositeKey] || 0) + 1;
        totals[denominatorKey] = (totals[denominatorKey] || 0) + 1;

        if (debug) {
            console.log("compositeKey:", compositeKey, "groupKey:", denominatorKey);
        }
    }

    const data = Object.entries(counts).map(([compositeKey, count]) => {
        const parts = compositeKey.split("|||");
        const row = {};
        groupBy.forEach((k, i) => row[k] = parts[i]);

        const denominatorKey = groupBy.length === 1
            ? "ALL"
            : [xKey, facetKey]
                .filter(Boolean)
                .map(k => row[k])
                .join("|||");

        row.Count = count;
        row.GroupTotal = totals[denominatorKey];
        row.Proportion = count / row.GroupTotal;

        return row;
    });

    return { data, roles };
}


function computePerSampleProportions(metadata, metadataLabels, groupBy, sampleKey, conditionKey = null) {
    const numCells = metadata[groupBy[0]].length;
    const resultMap = {}, totalMap = {};

    for (let i = 0; i < numCells; i++) {
        const sample = metadataLabels[sampleKey][metadata[sampleKey][i]];
        const groupVals = groupBy.map(k => metadataLabels[k][metadata[k][i]]);
        const condition = conditionKey ? metadataLabels[conditionKey][metadata[conditionKey][i]] : null;

        const compositeKey = [sample, ...groupVals, condition].filter(Boolean).join("|||");
        const totalKey = [sample, condition].filter(Boolean).join("|||");

        resultMap[compositeKey] = (resultMap[compositeKey] || 0) + 1;
        totalMap[totalKey] = (totalMap[totalKey] || 0) + 1;
    }

    return Object.entries(resultMap).map(([key, count]) => {
        const parts = key.split("|||");
        const sample = parts[0];
        const groupValues = parts.slice(1, 1 + groupBy.length);
        const condition = parts.length > groupBy.length + 1 ? parts[parts.length - 1] : null;
        const totalKey = [sample, condition].filter(Boolean).join("|||");

        const row = { [sampleKey]: sample, Count: count, Total: totalMap[totalKey], Proportion: count / totalMap[totalKey] };
        groupBy.forEach((k, i) => row[k] = groupValues[i]);
        if (conditionKey) row[conditionKey] = condition;
        return row;
    });
}


export function computeCellStats(metadata, metadataLabels, groupBy, sampleKey, conditionKey = null) {
    const sampleData = computePerSampleProportions(metadata, metadataLabels, groupBy, sampleKey, conditionKey);
    const groupMap = {};

    for (const row of sampleData) {
        const keyParts = groupBy.map(k => row[k]);
        if (conditionKey) keyParts.push(row[conditionKey]);
        const groupKey = keyParts.join("|||");

        if (!groupMap[groupKey]) {
            groupMap[groupKey] = { exprValues: [], rawPoints: [] };
            groupBy.forEach((k, i) => groupMap[groupKey][k] = keyParts[i]);
            if (conditionKey) groupMap[groupKey][conditionKey] = keyParts[keyParts.length - 1];
        }

        groupMap[groupKey].exprValues.push(row.Proportion);
        groupMap[groupKey].rawPoints.push({ sample: row[sampleKey], proportion: row.Proportion, count: row.Count, total: row.Total });
    }

    const q = (arr, p) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const pos = (sorted.length - 1) * p;
        const base = Math.floor(pos);
        const rest = pos - base;
        return rest && sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
    };

    const result = Object.entries(groupMap).map(([_, g]) => {
        const sorted = g.exprValues.slice().sort((a, b) => a - b);
        return {
            ...g,
            min: sorted[0],
            q1: q(sorted, 0.25),
            median: q(sorted, 0.5),
            q3: q(sorted, 0.75),
            max: sorted[sorted.length - 1]
        };
    });

    return result.sort((a, b) => {
        const outerCompare = String(a[groupBy[0]]).localeCompare(String(b[groupBy[0]]));
        if (outerCompare !== 0) return outerCompare;
        if (conditionKey) {
            return String(a[conditionKey] || '').localeCompare(String(b[conditionKey] || ''));
        }
        return 0;
    });
}



export function calcExpressionStats(fields, labelColors, expression, gene, primaryKey, subsetKey, partial = false) {
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


function calculateExpressionStats(exprValues, partial = false) {
    const sortedValues = exprValues.sort(d3.ascending);

    const mean = d3.mean(sortedValues) || 0;
    const median = d3.quantile(sortedValues, 0.5) || 0;
    const pctExpr = (sortedValues.filter(v => v > 0).length / sortedValues.length) * 100 || 0;
    const q1 = d3.quantile(sortedValues, 0.25) || 0;
    const q3 = d3.quantile(sortedValues, 0.75) || 0;

    if (!partial) {
        return {
            exprValues: sortedValues,
            interQuantileRange: q3 - q1,
            min: sortedValues[0] || 0,
            max: sortedValues[sortedValues.length - 1] || 0,
            mean,
            median,
            pctExpr,
            q1,
            q3
        }
    } else {
        return {
            mean,
            pctExpr
        }
    }
}

export function groupByKey(arr, key) {
    return arr.reduce((acc, item) => {
        if (!acc[item[key]]) acc[item[key]] = [];
        acc[item[key]].push(item);
        return acc;
    }, {});
}



export function inferDataType(values) {
    const cleaned = values.filter(v => v !== null && v !== undefined);
    const unique = [...new Set(cleaned)];
    const totalCount = cleaned.length;
    const uniqueCount = unique.length;
    const uniqueRatio = uniqueCount / totalCount;

    const isNumeric = v => !isNaN(parseFloat(v)) && isFinite(v);

    // Pattern checkers
    const isBinnedCategory = v => {
        if (typeof v !== 'string') return false;
        return /^(\d+)\s*[-–]\s*(\d+)$/.test(v) || /^\d+\s*\+$/.test(v) || /under|over|less|more|to/i.test(v);
    };

    const isMixedAlphaNumeric = v => typeof v === 'string' && /[a-zA-Z]/.test(v) && /\d/.test(v);

    // Force categorical if any values look like binned ranges or mixed alphanum
    if (cleaned.some(isBinnedCategory) || cleaned.some(isMixedAlphaNumeric)) {
        return "categorical";
    }

    const allNumbers = cleaned.every(isNumeric);
    if (allNumbers) {
        const allIntegers = cleaned.every(v => Number.isInteger(Number(v)));
        if (uniqueCount <= 10 && allIntegers) return "categorical";
        return "continuous";
    }

    // Default heuristics
    if (uniqueCount <= 20 || uniqueRatio < 0.2) {
        return "categorical";
    }

    return "continuous";
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
    //console.log(uniqueValues.size, nonMissing.length, ratio, categoricalThreshold)
    //console.log(parsedValues);
    if (ratio >= categoricalThreshold) {
        return 'categorical';
    }

    // 7. If none of the above, it’s probably freeform text
    return 'text';
}
