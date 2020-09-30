import * as d3 from "d3";
import * as functionUtils from  "../utils/functions";
import * as colorUtils from  "../utils/colors";
import * as renderUtils from  "../utils/renderUtils";

const dispatch = d3.dispatch('updateslider');
const barcodeConfig = {
    domId: "igv-barcode-plot-wrapper",
    width: 100,
    height: 500, // d3.select("#igv-barcode-plot-wrapper").node().clientHeight,
    padding: {top: 20, right: 10, bottom:20, left:50}
}


function render(dataConfig, config = barcodeConfig, data){
    config.defaultPosterior = dataConfig.filterActive.posteriorProbability;

    updateConfig(config)

    config.scale = d3.scaleLinear()
        .rangeRound([0, config.innerHeight])
        .domain([1, 0]) // 0.01 is minimum posterior we will ever look at
        .clamp(true);

    var svg;
    if (!document.getElementById(`${config.domId}-barcodeplot`)) {
        svg = createGroup(config);
        // background rectangle only appends once
        svg.append("rect")
        .attr("class", "barcodeplot")
        .attr("x", 0)
        .attr("y", 0 )
        .attr("width", config.innerWidth)
        .attr("height", config.innerHeight)
        .style("fill", "none")
        .style("stroke", colorUtils.grey)
        .style("stroke-width", 1)


    } else {

        d3.selectAll(".slider").remove()
        svg = d3.select(`#${config.domId}-barcodeplot`)
    }



    var line = svg.selectAll(".barcode-line")
        .data(data)

        line.enter()
        .append("line")
        .attr("class", "barcode-line")
        .merge(line)
        .attr("x1", function(d){ return 0})
        .attr("x2", function(d){ return config.innerWidth})
        .attr("y1", function(d){ return config.scale(d.y)})
        .attr("y2", function(d){ return config.scale(d.y)})
        .style("stroke", function(d){ return  d.color })
        .style("stroke-width", 2)
        .style("opacity", .4)

        line.exit().remove()


let slider = svg.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + config.innerWidth + "," + 0 + ")")

slider.append("line")
    .attr("class", "track")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", config.scale(0))
    .attr("y2", config.scale(1))
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")


    slider.insert("line", ".track-overlay")
        .attr("class", "handle-line")
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("x1", -config.innerWidth - 10)
        .attr("x2", 0)
        .attr("stroke-width", 1)
        .attr("stroke", "black")

    slider.insert("text", ".track-overlay")
        .attr("class", "handle-label")
        .attr("text-anchor", "end")
        .attr("y", 0)
        .attr("x", -config.innerWidth - 10)
        .attr("dy", renderUtils.dySm)
        .html(config.defaultPosterior);

    slider.insert("circle", ".track-overlay")
        .attr("class", "handle-circle handle")
        .attr("cy", 0)
        .attr("r", 6);

slider.call(d3.drag()
    // .on("start.interrupt", function() {
    //     slider.interrupt();
    // })
    // .on("start drag", function() {
    //     slide(config.scale.invert(d3.event.y), config);
    // }));
    .on("drag", function() {
        slide(config.scale.invert(d3.event.y), config);
    })
    .on("end", function() {
        slideEnd(config.scale.invert(d3.event.y), config);
    }));


    slide(config.defaultPosterior, config);
    slideEnd(config.defaultPosterior, config);
}

function slideEnd(h, config){
    dispatch.call("updateslider", this, h, config);
}
function slide(h, config) {
    d3.selectAll(".handle-circle").attr("cy", config.scale(functionUtils.ConvertToDecimal(h)) );
    d3.selectAll(".handle-label")
        .attr("y", config.scale(functionUtils.ConvertToDecimal(h))  )
        .html(functionUtils.ConvertToDecimal(h) )

    d3.selectAll(".handle-line")
        .attr("y1", config.scale(functionUtils.ConvertToDecimal(h))  )
        .attr("y2", config.scale(functionUtils.ConvertToDecimal(h))  )
}




// any config
function updateConfig(config){ // this updates/adds fields #can do similar for calcSize
    config.innerWidth = config.width - config.padding.left - config.padding.right;
    config.innerHeight = config.height - config.padding.top - config.padding.bottom;
}

function createGroup(config){
    const svg = d3.select(`#${config.domId}-svg`)
        .append("g").attr("id", `${config.domId}-barcodeplot`)
        .attr("transform", `translate(${config.padding.left}, ${config.padding.top})`);

    return svg;
}

export {
    render,
    dispatch
}
