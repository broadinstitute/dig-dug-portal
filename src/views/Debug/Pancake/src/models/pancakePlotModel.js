"use strict";

import * as createControl from "../controller/createController";
import * as d3 from "d3";
import * as colorUtils from "../utils/colors";

// ######## filter to active properties
// ####################################
function axisModel(){
    var model = {}
    for (var prop in data.options){ // ABC
      var active = (data.options[prop]).filter(function(d){ return d.active == true})[0] //ABC
      model[prop] = {}
      model[prop]["option"] = active
      var key = active.value
      model[prop]["sort"] = data[key].sort.filter(function(d){ return d.active == true})[0]
      model[prop]["group"] = data[key].group.filter(function(d){ return d.active == true})[0]

    }
    return model
  }

  function createAxisOptions(){

    // createControl.createSelect("A-sort", data[ (data.options.A.filter(function(d){ return d.active == true }))[0].value ].sort, "active")
    // createControl.createSelect("A-group", data[ (data.options.A.filter(function(d){ return d.active == true }))[0].value ].group, "active")

    // createControl.createSelect("B-sort", data[ (data.options.B.filter(function(d){ return d.active == true }))[0].value ].sort, "active")

    // createControl.createSelect("C-option", data.options.C, "active")
    // createControl.createSelect("C-sort", data[ (data.options.C.filter(function(d){ return d.active == true }))[0].value ].sort, "active")
    // createControl.createSelect("C-group", data[ (data.options.C.filter(function(d){ return d.active == true }))[0].value ].group, "active")

  }
  function createColorOptions(){
    // createControl.createSelect("color-select", colorScales, "active")
  }

  function colorModel(){
    let scale = colorScales.filter(function(each){
      return each.active == true;
    })
    return scale[0]
  }

  const colorScales = [
    {
       scale: colorUtils.lineOfEvidenceColorScale,
       attribute: "lineOfEvidence",
       value: "loe-color-scale",
       name: "Line of Evidence",
       active: true
    }, {
        scale: colorUtils.t2DColorScale,
        attribute: "tissue",
        value: "t2d-color-scale",
        name: "T2D-related Tissues",
        active: false
     }
  ]

/**
 * the options below are for future functionality of grouping any axis by any attribute.
 * This was successful in a previous version of the matrix,
 * but the new node-structure make this difficult/time consuming for the first release of this visualization
 */
var data = {
  options: {
    A:  [
                  {name: "variant", value: "varId", active: true }
                  // {name: "tissue/organ", value: "tissueParent", active: false },
                  // {name: "tissue", value: "tissue", active: false },
                  // {name: "gene", value: "gene",active: false }
        ],

    B:  [         {name: "gene", value: "gene",active: true }
                  // {name: "tissue/organ", value: "tissueParent", active: false },
                  // {name: "tissue", value: "tissue", active: false },
                  // {name: "variant", value: "varId", active: false }
        ],

    C:  [
                  {name: "tissue", value: "tissue", active: true},
                  {name: "tissue/organ", value: "tissueOrgan", active: false }
        ]
  },
  varId: {
      group: [    {name: "credible set", value: "credibleSetId", active: true },
                  {name: "none", value: "none", active: false }
      ],
      sort: [     {name: "posteriorProbability", value: "posteriorProbability", type: "number", active: false },
                  {name: "position", value: "position", active: true }
                  // {name: "num LoEs", value: "numLoE", active: false }
      ]
  },
  tissue: {
      group: [    {name: "none", value: "none", active: true },
                  {name: "tissue/organ", value: "tissueOrgan", active: false }
      ],
      sort: [     {name: "alphabetical", value: "name", active: true }
                  // {name: "num LoEs", value: "numLoE", active: false }
      ]
  },
    tissueOrgan: {
      group: [    {name: "none", value: "none", active: true}

      ],
      sort: [     {name: "alphabetical", value: "name", active: true}
                  // {name: "num LoEs", value: "numLoE", active: false }
      ]
  },
  gene: {
      group: [    {name: "none", value: "none", active: true}
      ],
      sort: [     {name: "alphabetical", value: "name", active: true}
                  // {name: "tss", value: "tss", active: false }
              //    {name: "num LoEs", value: "numLoE", active: false }
      ]
  }
}


  export{
    createAxisOptions,
    axisModel,
    createColorOptions,
    colorModel,
    colorScales,
    data
  }
