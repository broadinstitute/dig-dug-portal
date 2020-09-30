

function createAxis(data, axisConfig, innerRange){




}




function createNodes(data, config){
    let x_= config.axis.x.attribute;
    let y_= config.axis.y1.attribute;

    var x = x_[x_.length - 1] // x
    var y = y_[y_.length - 1] // y
    var yb = yb_[yb_.length - 1] // group
    var ya = ya_;
        // group elements by xy
        var nest = d3.nest()
            .key(function(d){ return d[x] + "*" + d[y] })
            .entries(data.filter(function(d){ return d[y] != undefined }) )
    
        transformHier(nest)
}

export{
    createAxis,
    createNodes
}