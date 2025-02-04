const CONTENT_URL = "https://hugeampkpncms.org/rest/byor_content?id="

export async function getTextContent(contentId, getBody=false, getAll=false){
  let resourceUrl = `${CONTENT_URL}${contentId}`;
  let jsonContent = await fetch(resourceUrl).then(
    resp => resp.json());
  if (jsonContent.length === 0){
    return null;
  }
  return jsonContent[0]; 
}