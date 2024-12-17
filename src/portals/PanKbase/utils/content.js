const CONTENT_URL = "https://hugeampkpncms.org/rest/data?pageid=";

export async function getPankbaseContent(contentId){
  console.log("Getting pankbase content");
  let resourceUrl = `${CONTENT_URL}${contentId}`;
  console.log(resourceUrl);
  let jsonContent = await fetch(resourceUrl).then(
    resp => resp.json());
  return jsonContent;
}