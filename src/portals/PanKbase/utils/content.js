import dataConvert from "@/utils/dataConvert";


const CONTENT_URL = "https://hugeampkpncms.org/rest/byor_content?id="

export async function getPankbaseContent(contentId, getBody=false){
  let resourceUrl = `${CONTENT_URL}${contentId}`;
  let jsonContent = await fetch(resourceUrl).then(
    resp => resp.json());
  if (jsonContent.length === 0){
    return [];
  }
  if (getBody){
    return jsonContent[0].body;
  }
  let csvContent = jsonContent[0].field_data_points;
  return dataConvert.csv2Json(csvContent);
}