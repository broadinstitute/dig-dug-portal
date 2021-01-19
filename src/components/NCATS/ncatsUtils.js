// TODO: replace with domain resolution resource
const links = {
    "pubmed": "pubmed.ncbi.nlm.nih.gov/",
    "go": "amigo.geneontology.org/amigo/medial_search?q=",
    "reactome": "",
    "wikipathway": "",
};

function linkInDomainForId(links=links, domain, id) {
    if (!!links[domain]) {
        return `http://${links[domain]}${id}`
    } else {
        return null;
    }
}

export default {
    linkInDomainForId,
    links,
}