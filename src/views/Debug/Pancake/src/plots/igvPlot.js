import * as d3 from "d3";
import * as colorUtils from  "../utils/colors";
const dispatch = d3.dispatch('updateextent');

// default config
const defaultIgvConfig = {
    domId: "igv-barcode-plot-wrapper",
    width: 500,
    height: 500,
    padding: {top: 20, right: 50, bottom:20, left:150},
    label: {x:"Genomic Position", y:"Posterior Probability"},
    ticks: {x: undefined, y: 6}
};

function render(dataConfig, config = defaultIgvConfig, data){
    updateConfig(config)

    var parentSvg;
    var svg;
    if (!document.getElementById(`${config.domId}-svg`)) {
        parentSvg = createSvg(config);
        svg = createGroup(config)
    } else {
        d3.selectAll(".igv-axis").remove()
        parentSvg = d3.select(`#${config.domId}-svg`)
        svg = d3.select(`#${config.domId}-igv`)
    }

    const scale = {
        x: d3.scaleLinear().range([0, config.innerWidth]).domain(dataConfig.query.range),
        y: d3.scaleLinear().range([config.innerHeight, 0]).domain([0, 1])
    };

   // add exit, enter, update
   var circle = svg.selectAll(".igv-circle").data(data)
   circle.enter()
        .append("circle")
        .attr("class", "igv-circle")
        .merge(circle)
        .attr("cx", (d) => scale.x(d.x))
        .attr("cy", (d) => scale.y(d.y))
        .attr("r", (d)=> d.radius)
        .attr("fill", (d) => {
            if (d.posteriorProbability < dataConfig.filterActive.posteriorProbability) {
                return colorUtils.grey
            } else {
                return d.color
            }
        });


        circle.exit().remove()

    var xAxis = svg.append("g")
        .attr("class", "igv-axis")
        .attr("transform", `translate(0,${config.innerHeight})`)
        .call(d3.axisBottom(scale.x));

    var yAxis = svg.append("g")
        .attr("class", "igv-axis")
        .call(d3.axisLeft(scale.y).ticks(config.ticks.y));

    var xLabel = svg.append("text")
        .attr("class", "igv-axis igv-axis-title")
        .html(config.label.x)
        .attr("x", config.innerWidth/2)
        .attr("y", config.innerHeight + config.padding.top + config.padding.bottom);

    var yLabel = svg.append("text")
        .attr("class", "igv-axis igv-axis-title")
        .attr("text-anchor", "end")
        .html(config.label.y)
        .attr("x", 0)
        .attr("y", -config.padding.top);




    var brush = svg.append("g")
        .attr("class", "igv-axis brush")
        .call(d3.brushX()
            .extent([[0, 0], [config.innerWidth, config.innerHeight]])
          //  .on('brush',brushed)
            .on("end", function(){
                // if brush is empty, return full extent of data
                if (!d3.event.selection){
                    dispatch.call("updateextent", this, scale.x.domain());
                }

                if (!d3.event.sourceEvent) return; // Only transition after input.
                if (!d3.event.selection) return; // Ignore empty selections. What is this doing???
                  var d0 = d3.event.selection.map(scale.x.invert),
                    //   d1 = d0.map(d3.round);
                    d1 = d0.map(Math.round);

                  // If empty when rounded, use floor & ceil instead.
                  if (d1[0] >= d1[1]) {
                    d1[0] = Math.floor(d0[0]);
                    d1[1] = Math.offset(d1[0]);
                  }
                  d3.select(this).transition().call(d3.event.target.move, d1.map(scale.x));

                  dispatch.call("updateextent", this, d1);

            })
         )


    // function brushed() {

    // if (!d3.event.sourceEvent) return; // Only transition after input.
    // if (!d3.event.selection) return; // Ignore empty selections. What is this doing???
    //   var d0 = d3.event.selection.map(scale.x.invert),
    //     //   d1 = d0.map(d3.round);
    //     d1 = d0.map(Math.round);

    //   // If empty when rounded, use floor & ceil instead.
    //   if (d1[0] >= d1[1]) {
    //     d1[0] = Math.floor(d0[0]);
    //     d1[1] = Math.offset(d1[0]);
    //   }
    //   d3.select(this).transition().call(d3.event.target.move, d1.map(scale.x));

    //   dispatch.call("updateextent", this, d1);
    // }


}

// any config
function updateConfig(config){ // this updates/adds fields #can do similar for calcSize
    config.innerWidth = config.width - config.padding.left - config.padding.right;
    config.innerHeight = config.height - config.padding.top - config.padding.bottom;
}

//any svg
function createSvg(config){
    const svg = d3.select(`#${config.domId}`).append("svg").attr("id", `${config.domId}-svg`)
        .attr("width", config.width)
        .attr("height", config.height)
      //  .append("g").attr("id", `${config.domId}-svg-g`)
     //   .attr("transform", `translate(${config.padding.left}, ${config.padding.top})`);

    return svg;
}


function createGroup(config){
    const svg = d3.select(`#${config.domId}-svg`)
        .append("g").attr("id", `${config.domId}-igv`)
        .attr("transform", `translate(${config.padding.left}, ${config.padding.top})`);

    return svg;
}


export{
    render,
    dispatch
}



//    let summary = d3.select(`#${config.domId}`)
//         .append("div")
//         .style("margin-left", `${config.padding.left}px`)
//         .attr("id", "igv-summary")

//         summary.append("div").attr("class", "igv-summary-block").append("h3")
//         .html(`Queried Gene: <span class="summary-value">${dataConfig.queryGene}</span>`)

//         summary.append("div").attr("class", "igv-summary-block").append("h3")
//         .html(`Credible Sets: <span id="igv-credible-sets-summary" class="summary-value">${dataConfig.credibleSets.length}</span>`)

//         summary.append("div").attr("class", "igv-summary-block").append("h3")
//         .html(`Variants: <span id="igv-variants-summary" class="summary-value">${data.length}</span>`)
