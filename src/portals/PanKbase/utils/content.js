import dataConvert from "@/utils/dataConvert";


const CONTENT_URL = "https://hugeampkpncms.org/rest/byor_content?id="

export async function getPankbaseContent(contentId, getBody=false, getAll=false){
  let resourceUrl = `${CONTENT_URL}${contentId}`;
  let jsonContent = await fetch(resourceUrl).then(
    resp => resp.json());
  if (jsonContent.length === 0){
    return null;
  }
  if (getBody){
    return jsonContent[0].body;
  }
  if (getAll){
    return jsonContent[0];
  }
  let csvContent = jsonContent[0].field_data_points;
  return dataConvert.csv2Json(csvContent);
}

export function highlightIntro(content){
  let tag = "<p>"
  let newTag = "<p class='page-info'>"
  return content.replace(tag, newTag);
}

export function linkPubMed(content){
  const pubMedItem = /(PubMed:)(\d*)/gi;
  return content.replaceAll(pubMedItem, 
    "<a href='https://pubmed.ncbi.nlm.nih.gov/$2/'>PubMed: $2</a>");
}