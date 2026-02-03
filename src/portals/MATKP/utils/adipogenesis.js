const TIME_SERIES_RAW = "https://matkp.hugeampkpnbi.org/api/raw/file/single_cell_time_series/";

import dataConvert from "@/utils/dataConvert";

export async function getTimeSeries(timeSeriesId, top100=true) {
    let fullTxSuffix = "full_transcript_data.tsv.gz";
    let top100Suffix = "heatmap_top100_transcript_data.tsv.gz";
    let suffix = top100 ? top100Suffix : fullTxSuffix;
    let datasetFile = `${TIME_SERIES_RAW}${timeSeriesId}/${suffix}`;
    const response = await fetch(datasetFile);
    const bulkDataText = await response.text();
    let bulkDataObject = dataConvert.tsv2Json(bulkDataText);    
    return bulkDataObject;
}

export async function getTimeSeriesMetadata(timeSeriesId){
    let queryUrl = `https://matkp.hugeampkpnbi.org/api/raw/file/single_cell_time_series/${timeSeriesId}/sample_metadata.json.gz`;
    try {
        const response = await fetch(queryUrl);
        const data = await(response.text());
        console.log("what's this?", data);
        let crudeParse = data.split("}").map(t => `${t}}`);
        crudeParse = crudeParse.slice(0, crudeParse.length - 1);
        crudeParse = crudeParse.map(t => JSON.parse(t));
        let directory = {};
        crudeParse.forEach(c => {
            let sample = c.sample_id;
            directory[sample] = c;
        });
        return directory;
    }
    catch(error) {
        console.error("Error: ", error);
        return {};
    }
}

export async function mapConditions(data, timeSeriesId){
    let metadata = await getTimeSeriesMetadata(timeSeriesId);
    let conditions = Object.keys(data[0])
        .filter(t => t.startsWith("GSM"));
    let timeElapsed = new RegExp(/day (-?\d+)/);
    let rep = new RegExp(/replicate (\d+)/);
    let findPrefix = new RegExp(/([^,]*)/);
    let mapping = {
        conditions: {}
    };
    conditions.forEach(c => {
        let sourceName = metadata[c].source_name;
        let days = parseInt(sourceName.match(timeElapsed)[1]);
        let replicate = parseInt(sourceName.match(rep)[1]);
        let prefix = sourceName.match(findPrefix)[1];
        let entry = {
            days: days,
            replicate: replicate,
            prefix: prefix,
            label: `${prefix}`
        };
        mapping.conditions[c] = entry;
    });
    let replicates = Array.from(new Set(Object.values(mapping.conditions).map(v => v.replicate)));
    mapping.replicates = replicates;

    let timePoints = Array.from(new Set(Object.values(mapping.conditions).map(v => v.days)))
    mapping.timePoints = timePoints;
    return mapping;

}

export function includeAverages(data, conditionsMap){
    let conditions = Object.keys(conditionsMap.conditions);
    data.forEach(d => {
        conditionsMap.timePoints.forEach(time => {
            let repConditions = conditions.filter(c => 
                conditionsMap.conditions[c].days === time);
            let replicates = repConditions.map(rc => parseFloat(d[rc]));
            let avg = replicates.reduce((sum, replicate) => sum + replicate, 0) / replicates.length;
            let label = `day_${time}_rep_avg`;
            d[label] = avg;
        });
        // Relabel replicates to conform
        conditions.forEach(c => {
            let info = conditionsMap.conditions[c];
            let label = `day_${info.days}_rep_${info.replicate}`;
            d[label] = d[c];
        })
    });
    return data;
}

export function processDataForHeatmap(data, conditionsMap){
    if (data === null){
        return null;
    }
    
    let output = [];
    
    let timePoints = conditionsMap.timePoints;
    let replicates = structuredClone(conditionsMap.replicates);
    replicates.push("avg");

    data.forEach(tsd => {
        timePoints.forEach(t => {
            replicates.forEach(rep => {
                let source = `day_${t}_rep_${rep}`;
                let entry = {
                    source: source,
                    gene: tsd.gene,
                    transcript_id: tsd.transcript_id,
                    score: tsd[source],
                    days: t,
                    replicate: rep,
                    order: tsd.order,
                    gene_tx: `${tsd.gene}___${tsd.transcript_id}`,
                    identifier: `${tsd.transcript_id}_rep_${rep}`
                }
                output.push(entry);
            });
        });
    });
    return output;
}

export function extremeVal(data, min=true){
    let extreme = data[0].score;
    data.forEach(d => extreme = 
        (min && d.score < extreme) || (!min && d.score > extreme)
        ? d.score
        : extreme);
    return extreme;
}