import dataConvert from "@/utils/dataConvert";

const CONTENT_URL = "https://hugeampkpncms.org/rest/byor_content?id=";
const NEWSFEED_URL = "https://hugeampkpncms.org/rest/news_list?project=";
const NEWSITEM_URL = "https://hugeampkpncms.org/rest/news?id=";
const BIO_INDEX_HOST = "https://matkp.hugeampkpnbi.org";

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