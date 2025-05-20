import { BIO_INDEX_HOST } from "@/utils/bioIndexUtils";

export async function getParams(endpoint, arity=2){
  let params = [];
  let url = `${BIO_INDEX_HOST}/api/bio/keys/${endpoint}/${arity}`;
  try {
      const response = await fetch(url);
      const data = await (response.json());
      let allKeys = data.keys;
      params = Array.from(new Set(allKeys.map(item => item[0])));
  } catch (error) {
      console.error("Error: ", error);
  }
  return params;
}

export async function getBulkData(dataset) {
  let bulkFileUrl = `${BIO_INDEX_HOST}/api/raw/file/single_cell_bulk/`;
  let results = {};
  let datasetFile = `${bulkFileUrl}${dataset}/dea.tsv.gz`;

  const response = await fetch(datasetFile);
  const bulkDataText = await response.text();
  
  bulkDataObject = dataConvert.tsv2Json(bulkDataText);
  let bulkDataComparisons = bulkDataObject
    .filter(item => !!item.comparison)
    .map(item => [item.comparison_id, item.comparison]);
  
    comparisons = Object.fromEntries(bulkDataComparisons);
  results.bulkDataObject = bulkDataObject;
  results.comparisons = comparisons;
  console.log("Is this thing on? Hello?!")
  return results;
}