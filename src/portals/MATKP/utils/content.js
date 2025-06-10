import dataConvert from "@/utils/dataConvert";

const CONTENT_URL = "https://hugeampkpncms.org/rest/byor_content?id="
const BIO_INDEX_HOST = "https://matkp.hugeampkpnbi.org";
export const ACCESSIBLE_RED = "rgb(191 044 035)"; // colorblind safe red
export const ACCESSIBLE_BLUE = "rgb(047 103 177)"; // colorblind safe blue,
export const ACCESSIBLE_GRAY = "rgb(249 249 249)";

export async function getTextContent(contentId, getBody=false, getAll=false){
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

export async function getEnrichr(genesList){
			let enrichrEndpoint = `${BIO_INDEX_HOST}/api/enrichr/enrichr`;
			let enrichrRequest = {
					"gene_set_library": "KEGG_2015",
					"gene_list": genesList,
					"gene_list_desc": "my_list"
			}
			try {
				const response = await fetch(enrichrEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
                        'accept': 'application/json'

					},
					body: JSON.stringify(enrichrRequest),
				});
				let jsonData = await response.json();
				jsonData.forEach(d => {
						let rank = `${d["Rank"]}`.padStart(3, "0");
						d.rankLabel = `${rank}_${d["Term name"]}`;
				})
				console.log(jsonData[0]);
				return jsonData;
			} catch (error){
				console.error(error.message);
				return [];
			}
		}