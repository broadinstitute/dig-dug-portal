function createPosteriorData(data, x, y, className){ // add option to scale radius if provided
    var igvData = data.map(function(d){
        return {
            x: d[x],
            y: d[y],
            radius:2,
            color:red,
            class: d[className]
        }
    })
    return igvData;
}