import dataConvert from "@/utils/dataConvert";

const CONTENT_URL = "https://hugeampkpncms.org/rest/byor_content?id=";
const NEWSFEED_URL = "https://hugeampkpncms.org/rest/news_list?project=";
const NEWSITEM_URL = "https://hugeampkpncms.org/rest/news?id=";
const BIO_INDEX_HOST = "https://matkp.hugeampkpnbi.org";
const MOTRPAC_AUTH = process.env.MOTRPAC;
export const ACCESSIBLE_RED = "rgb(191 044 035)"; // colorblind safe red
export const ACCESSIBLE_BLUE = "rgb(047 103 177)"; // colorblind safe blue,
export const ACCESSIBLE_GRAY = "rgb(249 249 249)";
export const ACCESSIBLE_PURPLE = "rgb(116 040 129)";
export const ACCESSIBLE_DARK_GRAY = "rgb(170 170 170)";
export const ACCESSIBLE_GREEN = "rgb(092 174 000)";

export async function getMotrpac(gene){
	let config = {
		"type": "openApi",
		"url": "https://search.motrpac-data.org/api/beta/differential-abundance",
		"index": "huge",
		"parameters": [
			"gene"
		],
		"header": {
			"Content-Type": "application/json",
			"Authorization": MOTRPAC_AUTH
		},
		"body": {
			"ktype": "gene",
			"keys": gene,
			"omics": [
				"transcriptomics",
				"proteomics"
			],
			"filters": {
				"assay": [],
				"tissue": []
			},
			"fields": [
				"gene_symbol",
				"feature_ID",
				"tissue",
				"assay",
				"sex",
				"comparison_group",
				"logFC",
				"logFC_se",
				"p_value",
				"adj_p_value",
				"p_value_male",
				"p_value_female"
			],
			"unique_fields": [
				"tissue",
				"assay"
			],
			"size": 10000,
			"start": 0,
			"save": false
		},
	};
	let currentRequest = new Request (config.url, {
		method: "POST",
		headers: new Headers(config.header),
		body: JSON.stringify(config.body),
	});
	try {
		const response = await fetch(currentRequest);
		if (!response.ok){
			throw new Error(`Response status: ${response.status}`);
		}
		const json = await response.json();
		return json;
	} catch(error){
		console.error(error.message);
	}
	return {};
}

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

export async function getNewsFeed(feedId) {
	const newsFeedUrl = NEWSFEED_URL+feedId;
	const newsFeed = await fetch(newsFeedUrl).then((resp) => { return resp.json();});
	console.log({newsFeedUrl, newsFeed});
	//trim feed to 5 items
	if (newsFeed.length > 5) newsFeed.length = 5;
	newsFeed.forEach((item) => {
		//extract only the img element frforom thumbnail, wysiwyg html can be polluted sometimes
		item.field_thumbnail_image =
			new DOMParser()
				.parseFromString(
					item.field_thumbnail_image,
					"text/html"
				)
				.querySelector("img")?.outerHTML || "";
	});
	return newsFeed;
}

export async function getNewsItem(itemId){
	const itemUrl = NEWSITEM_URL+itemId;
	const newsItem = await fetch(itemUrl).then(resp => { return resp.json(); });
	console.log({itemUrl, newsItem});
	if(newsItem.length===0){
		console.log('no news data for id', id);
		return null;
	}else{
		return newsItem;
	}
	
}

export async function getEnrichr(genesList, library){
	let enrichrEndpoint = `${BIO_INDEX_HOST}/api/enrichr/enrichr`;
	let enrichrRequest = {
			"gene_set_library": library,
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
		return jsonData;
	} catch (error){
		console.error(error.message);
		return [];
	}
}

export async function getDatasets() {
	const fetchPath =
		"/api/raw/file/single_cell_all_metadata/dataset_metadata.json.gz";
	const response = await fetch(`${BIO_INDEX_HOST}${fetchPath}`);
	const dataText = await response.text();
	const lines = dataText
		.split("\n")
		.filter((line) => line.trim() !== "");
	const jsonObjects = lines.map((line) => JSON.parse(line));
	jsonObjects.forEach((object) => {
		object._showDetails = false;
	});
	return jsonObjects;
}