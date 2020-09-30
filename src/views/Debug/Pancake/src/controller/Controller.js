import * as d3 from "d3";
import * as controlUtils from "./controllerFunctions";
import * as createControl from "./createController";
import * as igvUtils from "../utils/createIgvData";
// import * as igvPlot from "../plots/igvPlot";
import * as barcodeUtils from "../utils/createBarcodeData";
import * as barcodePlot from "../plots/barcodePlot";
import * as pancakePlot from "../plots/pancakePlot";
import * as pancakePlotModel from "../models/pancakePlotModel";
import * as colorUtils from  "../utils/colors";
const defaultVerbose = true;


pancakePlotModel.createAxisOptions()
pancakePlotModel.createColorOptions()

/**
 *
 * @param {*} config if data config with query, filterOptions, activeFilters etc
 * @param {*} verbose
 */


function init(config, verbose = defaultVerbose){



  d3.select("#queriedRange").html(config.query.coordinates)
  updateConfig(config)

  // igvPlot.render checks for a svg and creates one if it doesnt exist
  // then it appends a group for igvPlot if it doesnt exist
  const igvData = igvUtils.createIgvData(config.return.credibleVariants)
//   igvPlot.render(config, undefined, igvData)

  // barcodePlot.render uses svg created by igvPlot and checks for a group
  // then it appends a group for barcodePlot if it doesn't exist
  const barcodeData = barcodeUtils.createBarcodeData(config.return.credibleVariants)
  barcodePlot.render(config, undefined, barcodeData)

  createControl.createDropdown( "select-set-credibleSetId", config.filterOptions.credibleSetId, "active")


  // checkboxes below need to sort and auto-check after update from range/credibleset/posterior filters
  createControl.createCheckbox(config, "checkbox-set-gene", config.filterOptions.gene, "checkbox-item")
  createControl.createCheckbox(config, "checkbox-set-varId", config.filterOptions.varId, "checkbox-item")
  createControl.createCheckbox(config, "checkbox-set-lineOfEvidence", config.filterOptions.lineOfEvidence, "checkbox-item")
  createControl.createCheckbox(config, "checkbox-set-tissue", config.filterOptions.tissue, "checkbox-item")

  d3.select("#summary-value-credibleSetId").html( config.filterOptions.credibleSetId.length - 1)
  d3.select("#summary-value-varId").html( config.filterOptions.varId.length - 1)
  d3.select("#summary-value-gene").html(config.filterOptions.gene.length - 1)
  d3.select("#summary-value-tissue").html(config.filterOptions.tissue.length - 1)
  d3.select("#summary-value-lineOfEvidence").html( config.filterOptions.lineOfEvidence.length - 1)
  /** #############################################*/

//   igvPlot.dispatch.on('updateextent',function(range){
//     config.filterActive.range = range;
//     let subset = createSubset(config)
//     subsetController(config, subset)
//   });

  barcodePlot.dispatch.on('updateslider',function(h, c){
    config.filterActive.posteriorProbability = h;
    let subset = createSubset(config)
    subsetController(config, subset)
  });

  d3.select("#select-set-credibleSetId").on("change", function(){ // filtered by brush range
    config.filterActive.credibleSetId = this.value;
    let subset = createSubset(config)
    subsetController(config, subset)
  })

  let subset = createSubset(config) // checks if variant meets filtered criteria
  subsetController(config, subset)
}
// below if for handling the checkboxes when we change range/gene
// function checkCheckBoxSelections(array, selections){
//   for (i = 0; i < array.length; i++){
//     for (j = 0; j< selections.length; j++){
//       if (selections[j] == array[i]){
//       } else { removeItem(selections, selections[j]) }
//     }
//     if (selections.includes(array[i])){
//     } else { removeItem(selections, array[i]) }
//   }
//   return selections
// }

/**
 *
 * @param {*} config filters data for credibleVariants
 */
function createSubset(config){

  let inCredibleSetVariants;
  if (config.filterActive.credibleSetId == "All"){ inCredibleSetVariants = config.return.credibleVariants }
  else { inCredibleSetVariants = config.return.credibleVariants.filter(function(d){ return d.credibleSetId ==  config.filterActive.credibleSetId} ) }

  let inRangeVariants = inCredibleSetVariants.filter(function(d){ return d.position >= config.filterActive.range[0] && d.position <= config.filterActive.range[1] })
  let abovePosteriorVariants = inRangeVariants.filter(function(d){ return d.posteriorProbability >= config.filterActive.posteriorProbability })
  config.subset = abovePosteriorVariants;

  return abovePosteriorVariants
}

// used for IGV (excludes range)
function filterToCredibleSetAndPosterior(config){
  let inCredibleSetVariants;
  if (config.filterActive.credibleSetId == "All"){ inCredibleSetVariants = config.return.credibleVariants }
  else { inCredibleSetVariants = config.return.credibleVariants.filter(function(d){ return d.credibleSetId ==  config.filterActive.credibleSetId} ) }

  let abovePosteriorVariants = inCredibleSetVariants.filter(function(d){ return d.posteriorProbability >= config.filterActive.posteriorProbability })
  let variants = [...new Set(abovePosteriorVariants.map(d => d["varId"] ))];
  return variants
}
// used for barcodePlot (excludes range and posterior)
// function filterToCredibleSet(config){
//   let inCredibleSetVariants;
//   if (config.filterActive.credibleSetId == "All"){ inCredibleSetVariants = config.return.credibleVariants }
//   else { inCredibleSetVariants = config.return.credibleVariants.filter(function(d){ return d.credibleSetId ==  config.filterActive.credibleSetId} ) }
//   let variants = [...new Set(inCredibleSetVariants.map(d => d["varId"] ))];
//   return variants
// }


/**
 *
 * @param {*} config: data info
 * @param {*} data: subset of credible variants that passes filter
 */
function subsetController(config, data){
  /** All variants in list meet primary filter criteria for credibleSetId, PosteriorProbability, Range */
  let variants = [...new Set(data.map(d => d["varId"] ))];


  let igvPts = filterToCredibleSetAndPosterior(config)
  updateIgvPtsInRange(igvPts)

  let barcodePts = filterToCredibleSetAndPosterior(config)
  updateBarcodePtsInRange(barcodePts)


  // filter regions if they involve variants
  let regionSubset = config.return.regions.filter(function(d){ return variants.includes(d.varId) })

  plotController(config, regionSubset)

  d3.selectAll(".checkbox-set").selectAll("input").on("click", function(){
    controlUtils.recordFilters(this, config.filterActive.checkedSelections)
    let subset = controlUtils.filterCheckedSelections(regionSubset, config.filterActive.checkedSelections)
    plotController(config, subset)
  })

}

/**
 *
 * This is only spot where render is called
 */
function plotController(config, data){

  config.model = pancakePlotModel.axisModel();
  config.color = pancakePlotModel.colorModel();

  pancakePlot.render(undefined, config, data);
  createControl.createButton("color-legend-wrapper", config.color.scale.keys(), config.color.scale);

  axisController(config, data)
  colorController(config, data)
}

function updateBarcodePtsInRange(variants){
    d3.selectAll(".barcode-line")
    .style("stroke", (d) => {
      if (variants.includes(d.varId)){
        return d.color
      } else {
        return colorUtils.grey
      }
    })
    d3.selectAll(".barcode-line").filter(function(d){
      return variants.includes(d.varId) == false
    })
    .moveToBack()

}
function updateIgvPtsInRange(variants){

  d3.selectAll(".igv-circle").attr("fill", (d) => {
    if (variants.includes(d.varId)){
      return d.color
    } else {
      return colorUtils.grey
    }
  });

  d3.selectAll(".igv-circle").filter(function(d){
    return variants.includes(d.varId) == false
  })
  .moveToBack()

}



function axisController(dataConfig, data){

  d3.selectAll(".data-model-options").on("change", function(){
    var key = (this.id).split("-")[0] // A B C
    var list = pancakePlotModel.data.options[key]// gets list of options for key ie: 'tissue'. one item in list is: active = true.  makes ABC values active or not.
    for (var i in list){ // list of 'options' for A B or C
      if (list[i].value == this.value){
         list[i].active = true
         if (key == "gene"){
          createControl.createSelect( (key + "-sort"), pancakePlotModel.data[this.value].sort, "active")
         } else {
          createControl.createSelect( (key + "-sort"), pancakePlotModel.data[this.value].sort, "active")
          createControl.createSelect( (key + "-group"), pancakePlotModel.data[this.value].group, "active")
         }

      } else {  list[i].active = false  }
    }
      dataConfig.model = pancakePlotModel.axisModel();
      pancakePlot.render(undefined, dataConfig, data)
  })

  d3.selectAll(".data-model-features").on("change", function(){
    var key = (this.id).split("-")[0]
    var element = (this.id).split("-")[1] // 'group' or 'sort'

    var activeKey = ((pancakePlotModel.data.options[key]).filter(function(d){ return d.active == true})[0]).value // is active value ie 'variant' or 'tissue'
    var list = pancakePlotModel.data[activeKey][element] // 'properties.variant.group or .sort'

    for (var i in list){
      if (list[i].value == this.value){
         list[i].active = true
      } else {
        list[i].active = false
      }
    }

    dataConfig.model = pancakePlotModel.axisModel();
    pancakePlot.render(undefined, dataConfig, data)
  })

}


function colorController(dataConfig, data){

  d3.select("#color-select").on("change", function(){
    var list = pancakePlotModel.colorScales // 'properties.variant.group or .sort'
    for (var i in list){
      if (list[i].value == this.value){
         list[i].active = true
      } else {
        list[i].active = false
      }
    }
    dataConfig.color = pancakePlotModel.colorModel();
    createControl.createButton("color-legend-wrapper", dataConfig.color.scale.keys(), dataConfig.color.scale)
    pancakePlot.render(undefined, dataConfig, data);

  })
}

function updateConfig(config){

  config.filterOptions.credibleSetId =  [...new Set(config.return.regions.map(d => d["credibleSetId"] ))]
    .filter(d => d!= undefined)
    .sort(function(a, b){ return d3.ascending(a, b)});
  config.filterOptions.varId =  [...new Set(config.return.regions.map(d => d["varId"] ))]
    .filter(d => d!= undefined)
    .sort(function(a, b){ return d3.ascending(a, b)});

  config.filterOptions.gene =  [...new Set(config.return.regions.map(d => d["gene"] ))]
    .filter(d => d!= undefined)
    .sort(function(a, b){ return d3.ascending(a, b)});
  config.filterOptions.tissue =  [...new Set(config.return.regions.map(d => d["tissue"] ))]
    .filter(d => d!= undefined)
    .sort(function(a, b){ return d3.ascending(a, b)});

  config.filterOptions.lineOfEvidence =  [...new Set(config.return.regions.map(d => d["lineOfEvidence"] ))]
    .filter(d => d!= undefined)
    .sort(function(a, b){ return d3.ascending(a, b)});


}

// function updateIgvPtsInRange(config){

//   d3.selectAll(".igv-circle").attr("fill", (d) => {
//     if (d.posteriorProbability < config.filterActive.posteriorProbability) {
//         return colorUtils.grey
//     } else {
//         return d.color
//     }
//   });
// }

// function createSubset(config){

//     let credibleSubset;
//     if (config.filterActive.credibleSetId == "All"){ credibleSubset = config.return.regions  }

//     else { credibleSubset = config.return.regions.filter(function(d){ return d.credibleSetId ==  config.filterActive.credibleSetId} ) }

//   let inRangeVariants = credibleSubset.filter(function(d){ return d.position >= config.filterActive.range[0] && d.position <= config.filterActive.range[1] })

//   // let inRangeSets = [...new Set(inRangeVariants.map(d => d["credibleSetId"] ))];
//   // let inRangeSubset =  credibleSubset.filter(function(d){
//   //   if ( inRangeSets.includes(d.credibleSetId)){ return d } // keeps variants from a credible set together when brushing genome viewer
//   // })
//   // let abovePosterior = inRangeSubset.filter(function(d){ return d.posteriorProbability >= config.filterActive.posteriorProbability })
//   let abovePosterior = inRangeVariants.filter(function(d){ return d.posteriorProbability >= config.filterActive.posteriorProbability })

//   return abovePosterior
// }


export{
  init
}
