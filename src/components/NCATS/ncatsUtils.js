import { data } from "jquery";

// TODO: replace with domain resolution resource
const links = {
    "pubmed": "pubmed.ncbi.nlm.nih.gov/",
    "go": "amigo.geneontology.org/cgi-bin/amigo/term-details.cgi?term=",
    "reactome": "http://www.reactome.org/cgi-bin/eventbrowser_st_id?FROM_REACTOME=1&ST_ID=",
    "wikipathway": "www.wikipathways.org/index.php/Pathway:",
};

async function uri(prefix) {
    return await fetch("https://elastic.prefixcommons.org/prefixcommons/_search?size=10&from=0", {
        "credentials": "omit",
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.5",
            "Content-Type": "application/json;charset=utf-8"
        },
        "referrer": "https://prefixcommons.org/?q=id:go",
        "body": `{\"aggs\":{\"type_0\":{\"terms\":{\"field\":\"type\",\"size\":10}},\"keywords_1\":{\"terms\":{\"field\":\"keywords\",\"size\":8}},\"organization_2\":{\"terms\":{\"field\":\"organization\",\"size\":8}}},\"query\":{\"match\":{\"preferredPrefix\":{\"query\":\"${prefix}\"}}}}`,
        "method": "POST",
        "mode": "cors"
    })
    .then(data => data.json())
    .then(data => {
        const { total, hits } = data.hits;
        if (total > 0) {
            return hits;
        } else {
            return null;
        }
    })
    .catch(console.error);
}

async function linkInDomainForId(links=links, domain, content) {
    const { providerHtmlTemplate, idRegex } = await uri(domain)[0];
    if (!!links[domain]) {
        return `http://${providerHtmlTemplate}${content}`
    } else {
        return null;
    }
}

export default {
    linkInDomainForId,
    uri,
    links,
}
