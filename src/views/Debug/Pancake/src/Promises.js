import * as d3 from "d3";
import * as dataController from "./controller/Controller";

const tissueToT2d = d3.map();
const t2dTissues = ["adipose tissue", "Malignant Pancreatic Neoplasm", "skeletal muscle tissue", "body of pancreas", "exocrine pancreas", "pancreas", "brown adipose tissue", "mesenchymal stem cell of abdominal adipose", "subcutaneous adipose tissue measurement", "adipose tissue derived mesenchymal stem cell", "skeletal muscle tissue of transversus thoracis", "skeletal muscle myoblast","skeletal muscle", "adipose", "liver", "pancreatic_islet", "pancreatic_alpha_cell", "pancreatic_beta_cell", "pancreas", "pancreatic PP cell", "pancreatic A cell"]
t2dTissues.forEach(function(d){ tissueToT2d.set(d, true) })

const defaultConfig = {
    query: { // sets default active query for first gene in list
      chromosome: "",
      range:[]
      },
      static: {
        tissueOntology:[]
      },
      return: {
        regions:[],
        credibleSets:[]
      },
      subset: [],
      filterActive: {
        credibleSetId: "All",
        range: [],
        posteriorProbability: 0.01,
        checkedSelections: {varId:[], gene:[], tissue:[], lineOfEvidence:[], tissueParent:[]} // remove hard coding for filter defaults
      },
      filterOptions: {
        credibleSetId: [], 
        varId:[],
        gene:[],
        tissue: [],
        lineOfEvidence:[]
      },
      maps: {
          varId: {
              posteriorProbability: "",
              position: "",
              credibleSetId: ""
          },
          gene: {
            tss: "",
            name: ""
        },
        tissue: {
            t2d: tissueToT2d,
            name: "",
            tissueOrgan: ""
        }
      }
};



const varIdToPosteriorProbability = d3.map();
const varIdToPosition = d3.map();
const varIdToCredibleSet = d3.map();
const geneToTss = d3.map();
//const tissueToT2d = d3.map();
// const tissueToOrgan = d3.map();


async function makePromises(config = defaultConfig, query){

    let queryRange;
    if (query.type == "geneId"){
        queryRange = await getQueryRange(query.geneId);
    } else if (query.type == "genomicRange"){
        queryRange = query.genomicRange;
    }

    let phenotype = query.phenotype;
    // let geneId = query.geneId;
    // let queryRange = await getQueryRange(geneId);

    let credibleSets = await getCredibleSets(phenotype, queryRange);
   // console.log("credibleSets", credibleSets);

    let credibleVariants = await getCredibleVariants(phenotype, credibleSets);
    credibleVariants = credibleVariants.flat(2)

   // console.log("credibleVariants", credibleVariants);

    let annotations = await getCredibleRegions(phenotype, credibleSets);
    annotations = annotations.flat(2)

    d3.select("#pancakeplot-viewer-loader").classed("pancakeplot-viewer-loading", false)
    // console.log("annotations", annotations);

   // let tissueOntologies = await getTissueOntologies()

    let annotatedCredibleVariants = await getCredibleVariantRegions(credibleVariants, annotations)
   // console.log("annotatedCredibleVariants", annotatedCredibleVariants)

    let linesOfEvidence = await createDataStructure(annotatedCredibleVariants)

    createDataMaps(annotatedCredibleVariants) // create maps to be used for visualization
    updateConfig(config)


    config.return = {
        credibleVariants: annotatedCredibleVariants,
        regions: linesOfEvidence
    }

     config.query.coordinates = queryRange;

     const ranges = ( (queryRange.split(":")[1].split("-")).map(Number) ).concat(d3.extent(credibleVariants.map(d => d.position)))
     const range = d3.extent(ranges)
     config.query.range = range;
     config.filterActive.range = range;

     dataController.init(config)
}



function createDataMaps(data){
    data.forEach(d => {
        varIdToPosteriorProbability.set(d.varId, d.posteriorProbability)
        varIdToPosition.set(d.varId, d.position)
        varIdToCredibleSet.set(d.varId, d.credibleSetId)
    })
}

function updateConfig(config){
    config.maps.varId.posteriorProbability = varIdToPosteriorProbability;
    config.maps.varId.position = varIdToPosition;
    config.maps.varId.credibleSet = varIdToCredibleSet;
}


async function getCredibleVariantRegions(credibleVariants, annotations){

    let uniqueVariants =  [...new Set(credibleVariants.map(d => d["varId"] ))]
    let uniqueObjects = credibleVariants.filter(function(d){ return uniqueVariants.includes(d.varId) })

    let map = d3.map();

    uniqueObjects.forEach(function(variant){
        let linesOfEvidence = []
        annotations.forEach(annotation => {
            if (annotation.start <= variant.position && annotation.end >= variant.position){
                linesOfEvidence.push(annotation)
            }
        })
        map.set(variant.varId, linesOfEvidence)
    })
    credibleVariants.forEach(variant => {
        let linesOfEvidence = map.get(variant.varId)
        linesOfEvidence.forEach(d => {
            d.varId = variant.varId;
            d.position = variant.position;
            d.posteriorProbability = variant.posteriorProbability;
            d.credibleSetId = variant.credibleSetId;
            d.lineOfEvidence = d.method ? d.method : d.annotation;
            d.tissueOrgan = "tissue/organ NA";
            d.gene = d.predictedTargetGene;
        })
        variant.linesOfEvidence = linesOfEvidence.filter(function(d){ 
            return d.lineOfEvidence == "ABC" 
            || d.lineOfEvidence == "DNASE" 
            || d.lineOfEvidence == "H3K27AC" 
            || d.lineOfEvidence == "CHiCAGO"
            || d.lineOfEvidence == "ChromHMM"
        })
    })

    return credibleVariants
}



// async function getCredibleVariantRegions(credibleVariants, annotations){
//     credibleVariants.forEach(variant => {
//         let linesOfEvidence = []
//         annotations.forEach(annotation => {
//             if (annotation.start <= variant.position && annotation.end >= variant.position){
//                 let obj =  Object.assign(annotation, { 
//                     gene: annotation.predictedTargetGene, 
//                     varId: variant.varId, 
//                     position: variant.position, 
//                     posteriorProbability: variant.posteriorProbability, 
//                     credibleSet: variant.credibleSetId, 
//                     lineOfEvidence: annotation.method ? annotation.method : annotation.annotation, 
//                     tissueOrgan: "tissue/organ NA" // coming soon using a map..
//                 });
//                 linesOfEvidence.push(obj)
//             }
//         })

//         variant.linesOfEvidence = linesOfEvidence.filter(function(d){ 
//             return d.lineOfEvidence == "ABC" 
//             || d.lineOfEvidence == "DNASE" 
//             || d.lineOfEvidence == "H3K27AC" 
//             || d.lineOfEvidence == "CHiCAGO"
//             || d.lineOfEvidence == "ChromHMM"
//         })
//     })
//     return credibleVariants
// }


async function createDataStructure(credibleVariants){
    let data = []
    credibleVariants.forEach(variant => {
        variant.linesOfEvidence.forEach(d => {
            data.push(d)
        })
    })
    return data
}



/**
 * API allows queries by canonical symbol, ensembl, alias names, hgnc id, ucsc id, rgd id, or mgd id
 */
async function getQueryRange(geneId) {
    let geneUrl = `http://18.215.38.136:5000/api/bio/query/gene?q=${geneId}`;
    let geneData = await processRequest(geneUrl)
    let queryRange;
    switch(geneData.length) {
        case 0:
            throw("Gene not found");
        case 1:
            let gene = geneData[0];
            let range = 5000000;
            let chr = gene.chromosome;
            let tss = gene.start;
            let regionStart = tss - range > 0 ? tss - range : 0;
            let regionEnd = tss + range;
            queryRange = `${chr}:${regionStart}-${regionEnd}`;
            break;
        default:
            console.log(geneData);
            throw("Gene identifier is not unique")
    }
    return queryRange;
}

async function getCredibleSets(phenotype, range) {
    let credibleSetUrl = `http://18.215.38.136:5000/api/bio/query/credible-sets?q=${phenotype},${range}`;
    let credibleSets = await processRequest(credibleSetUrl);
    return credibleSets;
}

// probably could parallelize this so they're all happening at the same time
async function getCredibleVariants(phenotype, credibleSets) {
    let credibleVariantsUrl = `http://18.215.38.136:5000/api/bio/query/credible-variants`;
    let variants = [];
    let queries = credibleSets.map(d => `${credibleVariantsUrl}?q=${phenotype},${d.credibleSetId}`);
    await Promise.all(queries.map(d => processRequest(d)))
        .then(data => {
            data.forEach(d => {
                variants.push(d)
            })
        }); 
    return variants;
}

async function getCredibleRegions(phenotype, credibleSets) {
    const timeStart = new Date().getTime();
    const regionsUrl = "http://18.215.38.136:5000/api/bio/query/credible-regions";
    const queries = credibleSets.map(d => `${regionsUrl}?q=${phenotype},${d.credibleSetId}`);
    let annotations = [];
    const promises = queries.map(d => processRequest(d));
    await Promise.all(promises)
        .then(data => {
            const timeEnd = new Date().getTime();
            console.log(`getCredibleRegions() time : ${(timeEnd - timeStart)/1000}`);
            data.forEach(d => {
                // this keeps each list separated by credible set
                annotations.push(d);
                // if we want to flatten this so it's not a 2D list, we can use the line below. note: we'll have to resolve any duplicates.
                // annotations = annotations.concat(d);
            })

        });
    return annotations;
}


/**
 * Queries the Bio Index API. Resolves any continuations it needs.
 * @param {String} requestUrl
 */
async function processRequest(requestUrl) {
    // let timeStart = new Date().getTime();

    let resp = await d3.json(requestUrl);
    let data = resp.data;

    while(!!resp.continuation) {
        let continuationQuery = `http://18.215.38.136:5000/api/bio/cont?token=${resp.continuation}`;
        resp = await d3.json(continuationQuery);
        data = data.concat(resp.data);
    }

    return data;
}

/**
 * parseOverlappingVariants creates a new array for each "line of evidence", for each variant that overlaps an annotated region
 * Renames object properties to match what the visualization uses, ie: 'predictedtargetGene' becomes 'gene'
 * Filters data to a few types of methods/annotations for color coding (color coding is hard coded to a few types of methods/annotations, 
 * so would need to change the color coding function before adding new methods/annotations)
*/ 
// async function  parseOverlappingVariants(annotations, variants){
//     let data = []
//     annotations.forEach(function(a){

//         let lineOfEvidence;
//         let methodAnnotation;

//         if (!a.method){
//             lineOfEvidence = a.annotation
//             methodAnnotation = a.annotation
//         } else {
//             lineOfEvidence = a.method
//             methodAnnotation = `${a.method}: ${a.annotation}`
//         }
//         variants.forEach(function(v){
//             if (v.position <= a.start && v.position <= a.end){
//                 let obj =  Object.assign(a, { 
//                     gene: a.predictedTargetGene, 
//                     varId: v.varId, 
//                     position: v.position,
//                     credibleSet: v.credibleSetId, 
//                     posteriorProbability: v.posteriorProbability, 
//                     lineOfEvidence:lineOfEvidence, 
//                     tissueOrgan: "tissue/organ NA" 
//                 });
//                 data.push(obj)
//             }
//         })
//     })

//     data = data.filter(function(d){ 
//         return d.lineOfEvidence == "ABC" 
//         || d.lineOfEvidence == "DNASE" 
//         || d.lineOfEvidence == "H3K27AC" 
//         || d.lineOfEvidence == "CHiCAGO"
//         || d.lineOfEvidence == "ChromHMM"
//     })

//     return data
// }



export {
    makePromises,
    varIdToPosteriorProbability
  }