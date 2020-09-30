import * as d3 from "d3";
import * as colorUtils from  "./colors";

  function createBarcodeData(data){
    var plotData = data.map(function(d){
        return {
            varId: d.varId,
            posteriorProbability: d.posteriorProbability,
            y: d.posteriorProbability,
            color:colorUtils.red
        }
    })

  return plotData
  }
  
  export{
      createBarcodeData
  }