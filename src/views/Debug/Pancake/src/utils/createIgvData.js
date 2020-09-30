import * as colorUtils from  "./colors";

function createIgvData(data){ // add option to scale radius if provided

    var igvData = data.map(function(d){
        return {
            varId: d.varId,
            posteriorProbability: d.posteriorProbability,
            credibleSetId: d.credibleSetId,
            x: d.position,
            y: d.posteriorProbability,
            radius:2,
            color:colorUtils.red
        }
    })

    return igvData;
}

export{
    createIgvData
}