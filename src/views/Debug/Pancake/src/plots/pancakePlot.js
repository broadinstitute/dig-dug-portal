"use strict";

// import * as dataPromises from "../dataPromises";
import * as dataPromises from "../Promises";
// import * as dataController from "../controller/Controller";

import * as calcUtils from "../utils/layout";
// import * as createPancakePlotData from "../utils/createPancakePlotData";
import * as d3 from "d3";
import * as colorUtils from "../utils/colors";
import * as pancakePlotSelections from "../selections/selections.js";
// temp variables below
const t2dTissueMap = d3.map();
const t2dTissues = ["adipose tissue", "Malignant Pancreatic Neoplasm", "skeletal muscle tissue", "body of pancreas", "exocrine pancreas", "pancreas", "brown adipose tissue", "mesenchymal stem cell of abdominal adipose", "subcutaneous adipose tissue measurement", "adipose tissue derived mesenchymal stem cell", "skeletal muscle tissue of transversus thoracis", "skeletal muscle myoblast","skeletal muscle", "adipose", "liver", "pancreatic_islet", "pancreatic_alpha_cell", "pancreatic_beta_cell", "pancreas", "pancreatic PP cell", "pancreatic A cell"]
t2dTissues.forEach(function(d){
    t2dTissueMap.set(d, true)
})

// default config
const defaultConfig = { // this updates from dataConfig, but that's sloppy
    domId: "pancakeplot-wrapper",
    width: 1000, //d3.select("#pancakeplot-wrapper").node().clientWidth,
    height: 1000, //d3.select("#pancakeplot-wrapper").node().clientHeight,
    padding: {top: 200, right: 50, bottom:50, left: 250}, // try giving axis negative padding for translating

    axis: {
        x: {
            domId: "pancake-plot-axis-x",
            attribute: ["variant"],
            label: "Variants",
            scale: "",
            label: "Variants",
            tickSize: 5,
            padding: { top: -10, right:0, bottom:0, left:0 },
            barHeight:20
        },
        y1: {
            plotId: "pancake-plot-axis-y1-plot",
            domId: "pancake-plot-axis-y1",
            attribute: ["gene"],
            label: "Genes",
            scale: "",
            tickSize: 5,
            padding: { top: 80, right:0, bottom:0, left:-20 }
        },
        y2: {
            plotId: "pancake-plot-axis-y2-plot",
            domId: "pancake-plot-axis-y2",
            attribute: ["tissue"],
            label: "Tissues",
            scale: "",
            tickSize: 5,
            padding: { top: 80, right:0, bottom:0, left:-20 }
        }
    }
};



// all below is temporary mess
const defaultVerbose = false,
        transition = 100;

/**
 * 1. update config for layout
 * 2. makeData (new file)
 *
 * @param {*} plotConfig
 * @param {*} dataConfig
 * @param {*} data
 * @param {*} verbose
 */


function render(plotConfig = defaultConfig, dataConfig, data, verbose = defaultVerbose) {

    updateConfig(plotConfig, dataConfig, data) // data is created here!

    if (verbose){
        console.log("pancakePlot", plotConfig, dataConfig)
    };

    var svg;
    if (!document.getElementById(`${plotConfig.domId}-svg-g`)) {
        svg = createSvg(plotConfig);
    } else {
        svg = d3.select(`#${plotConfig.domId}-svg-g`)
    }

    renderAxisX(plotConfig, plotConfig.axis.x)

    renderAxisY(plotConfig, plotConfig.axis.y1)
    renderNodes(plotConfig, plotConfig.axis.y1)

    renderAxisY(plotConfig, plotConfig.axis.y2)
    renderNodes(plotConfig, plotConfig.axis.y2)


    if (dataConfig.color.value == "loe-color-scale"){
        d3.selectAll(".packed-circle")
        .style("fill", function(e){
           if (e.depth == 1){
               let def = e.definition.filter(function(f){ return f.attribute == "lineOfEvidence" })
               return dataConfig.color.scale.get(def[0].name)
           } else {
            return "white";
           }
        })
        .style("stroke", function(e){
            if (e.depth == 1){
                let def = e.definition.filter(function(f){ return f.attribute == "lineOfEvidence" })
                return dataConfig.color.scale.get(def[0].name)
            } else {
             return colorUtils.darkgrey;
            }
         })
        .style("fill-opacity", .8)


    }

    else if (dataConfig.color.value == "t2d-color-scale"){
        d3.selectAll(".packed-circle")
        .style("fill", function(e){
            if (e.depth == 1){
                let def = e.definition.filter(function(f){
                    return f.attribute == "tissue" ||  f.attribute == "tissueOrgan"
                })

                if (def.length > 0){
                    return dataConfig.color.scale.get(t2dTissueMap.get(def[0].name))
                } else {
                    return "white"
                }
            } else if (e.depth == 0){
                return "white"
            }
        })
        .style("stroke", function(e){
            if (e.depth == 1){
                let def = e.definition.filter(function(f){
                    return f.attribute == "tissue" ||  f.attribute == "tissueOrgan"
                })
                if (def.length > 0){
                    if (t2dTissueMap.get(def[0].name) != undefined){
                        return colorUtils.red
                    } else {
                        return colorUtils.darkgrey
                    }
                } else {
                    return colorUtils.darkgrey
                }
            } else if (e.depth == 0){
                return colorUtils.darkgrey
            }
        })
        .style("fill-opacity", .8)
    }

}



function updateConfig(plotConfig, dataConfig, data){ // this updates/adds fields #can do similar for calcSize

    plotConfig.innerWidth = plotConfig.width - plotConfig.padding.left - plotConfig.padding.right;

    plotConfig.axis.x.attribute = [dataConfig.model.A.group.value, dataConfig.model.A.option.value].filter(function(d){ return d != "none"} )
    plotConfig.axis.y1.attribute = [dataConfig.model.B.group.value, dataConfig.model.B.option.value].filter(function(d){ return d != "none"} )
    plotConfig.axis.y2.attribute = [dataConfig.model.C.group.value, dataConfig.model.C.option.value].filter(function(d){ return d != "none"} )

    plotConfig.axis.x.sort = dataConfig.model.A.sort.value
    plotConfig.axis.y1.sort = dataConfig.model.B.sort.value
    plotConfig.axis.y2.sort = dataConfig.model.C.sort.value
    plotConfig.color = dataConfig.color;

    let xscale = d3.map();
    let y1scale = d3.map();
    let y2scale = d3.map();

    plotConfig.axis.x.data = calcUtils.axis(data, plotConfig.axis.x, plotConfig.innerWidth, dataConfig.maps)
        plotConfig.axis.x.data.forEach(function(d){ xscale.set(d.name, d.x) })
        plotConfig.axis.x.scale = xscale;

    plotConfig.axis.y1.data =  calcUtils.axis(data, plotConfig.axis.y1, false, dataConfig.maps)
        plotConfig.axis.y1.data.forEach(function(d){ y1scale.set(d.name, d.x) })
        plotConfig.axis.y1.scale = y1scale;

   plotConfig.axis.y2.data =  calcUtils.axis(data, plotConfig.axis.y2, false, dataConfig.maps)
        plotConfig.axis.y2.data.forEach(function(d){ y2scale.set(d.name, d.x) })
        plotConfig.axis.y2.scale = y2scale;


   plotConfig.axis.y1.nodes = calcUtils.nodes(plotConfig, data, plotConfig.axis.x,  plotConfig.axis.y1, "lineOfEvidence",  plotConfig.axis.y2.attribute)
   plotConfig.axis.y2.nodes = calcUtils.nodes(plotConfig, data, plotConfig.axis.x,  plotConfig.axis.y2, "lineOfEvidence",  plotConfig.axis.y1.attribute)

   plotConfig.axis.y1.start = plotConfig.axis.y1.padding.top;

    var max = d3.max( plotConfig.axis.y1.data, function(d){ return d.x })
    if (max == undefined){
        max = 0;
    } else {
        max = max + plotConfig.axis.y1.padding.top;
    }

   plotConfig.axis.y1.end = max;
   plotConfig.axis.y2.start = plotConfig.axis.y1.end + plotConfig.axis.y2.padding.top;
   plotConfig.axis.y2.end = plotConfig.axis.y2.start + d3.max( plotConfig.axis.y2.data, function(d){ return d.x });

   plotConfig.height =  plotConfig.axis.y2.end + plotConfig.padding.bottom + plotConfig.padding.top;
   d3.select("#pancakeplot-wrapper-svg").attr("height",  plotConfig.height)

  // plotConfig.innerHeight = plotConfig.height - plotConfig.padding.top - plotConfig.padding.bottom;


}


function renderNodes(plotConfig, axisConfig){

    let plot;
    if (!document.getElementById(`${axisConfig.plotId}`)) {
        plot = d3.select(`#${plotConfig.domId}-svg-g`)
            .append("g")
            .attr("id",`${axisConfig.plotId}`)
            .attr("transform", `translate(${0}, ${axisConfig.start})`);

    } else {

        plot = d3.select(`#${axisConfig.plotId}`)
            .attr("transform", `translate(${0}, ${axisConfig.start})`);

    }

	var nodes = plot.selectAll(`.${axisConfig.plotId}-node`)
	    .data(axisConfig.nodes, function(d) { return d.name || (d.id = ++i); })


    nodes.enter()
        .append("g")
        .attr("class", `${axisConfig.plotId}-node`)
        .classed("node", true)
        .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function(d) {
           pancakePlotSelections.mouseoverNode(d3.select(this), d)
        })
        .on("mouseout", function(d) {
            pancakePlotSelections.mouseoutNode(d3.select(this), d)
        })
        .attr("transform", function(d){
            return "translate(" + d.x + "," + d.y + ")"
        })
        .merge(nodes)
        .transition()
        .duration(transition)
        .attr("transform", function(d){
            return "translate(" + d.x + "," + d.y + ")"
        })
        .each(function(d){
            renderNodeCirclePacking(d3.select(this), d)
        })
        nodes.exit().remove()

}

    // only has root and leaves
    function renderNodeCirclePacking(dom, d){
        var pack = d.pack
        var parents = pack[0]
        var offsetx = parents.x
        var offsety = parents.y

        var nodes = dom.selectAll(".packed-circle")
          .data(pack, function(e){ return e.data.name }) // consider what to do with this...

        nodes.enter()
            .append("circle")
            .attr("class", "packed-circle")
            .attr("id", function(e){ return e.data.name})
            .attr("transform", function(e){
                return "translate(" + (e.x - offsetx) + "," + (e.y - offsety) + ")"
            })
            .merge(nodes)
            .transition()
            .duration(20)
            .attr("transform", function(e){
                return "translate(" + (e.x - offsetx) + "," + (e.y - offsety) + ")"
            })
            .attr("r", function(e){ return e.r })


       nodes.exit().remove()

    }



function renderAxisX(plotConfig, axisConfig){

    let axis;
    if (!document.getElementById(`${axisConfig.domId}`)) {

        axis = d3.select(`#${plotConfig.domId}-svg-g`)
        .append("g")
        .attr("id",`${axisConfig.domId}`)
        .attr("transform", `translate(${axisConfig.padding.left},${axisConfig.padding.top})`);

        axis.append("text").html(axisConfig.label)
        .attr("class", `pancakeplot-axis-title ${axisConfig.domId}-title`)
        .attr("transform", function(){
			return "translate(" + -axisConfig.tickSize + "," + 0 + ")rotate(-90)"
	    })
        .attr("text-anchor", "start")

    } else {
        axis = d3.select(`#${axisConfig.domId}`)
    }

	var nodes = axis.selectAll(".pancake-plot-axis-x-tick")
	    .data(axisConfig.data, function(d, i) { return d.name || (d.id = ++i); })

	  nodes.enter()
		.append("g")
		.attr("class", "pancake-plot-axis-x-tick")
		.classed("axis-node", true)
		// .on("mouseover", function(d){
		// 	pancakePlotSelections.mouseoverAxis(d3.select(this), d)
		// })
		// .on("mouseout", function(d) {
        //     pancakePlotSelections.mouseoutAxis(d3.select(this), d)
		// })
		// .attr("transform", function(d){
        //     return `translate(${d.x0}, ${d.y0})`
		// })
		.merge(nodes)
		.transition()
		.duration(400)
		.attr("transform", function(d){
            return `translate(${d.x0}, ${d.y0})`
		})
		.each(function(d){

            d3.select(this).selectAll("rect").remove()
            d3.select(this).selectAll("text").remove()
            renderXLabel(d3.select(this), d)
            if (d.attribute == "varId"){
                renderXBars(d3.select(this), d, axisConfig)
            }
		})
	   nodes.exit().remove()
}

function renderAxisY(plotConfig, axisConfig){

    let axis;
    if (!document.getElementById(`${axisConfig.domId}`)) {
        axis = d3.select(`#${plotConfig.domId}-svg-g`)
            .append("g")
            .attr("id",`${axisConfig.domId}`)
            .attr("transform", `translate(${axisConfig.padding.left}, ${axisConfig.start})`);

    } else {
        d3.selectAll(`.${axisConfig.domId}-line`).remove()
        d3.selectAll(`.${axisConfig.domId}-title`).remove()
        axis = d3.select(`#${axisConfig.domId}`)
            .attr("transform", `translate(${axisConfig.padding.left}, ${axisConfig.start})`);
    }


if (axisConfig.data.length >=1){

    axis.append("text").html(axisConfig.label)
        .attr("class", `pancakeplot-axis-title ${axisConfig.domId}-title`)
        .attr("transform", function(d){ return `translate(0, ${-axisConfig.tickSize})`   })
        .attr("text-anchor", "end")

    axis.append("line")
        .attr("class", `${axisConfig.domId}-line`)
        .attr("x1", 10)
        .attr("x2",10)
        .attr("y1", -axisConfig.padding.top/2)
        .attr("y2", -axisConfig.padding.top + axisConfig.end )
        .attr("stroke", "black")
}


	var nodes = axis.selectAll( `.${axisConfig.domId}-tick`)
	    .data(axisConfig.data, function(d, i) { return d.name || (d.id = ++i); })


	  nodes.enter()
		.append("g")
		.attr("class", `${axisConfig.domId}-tick`)
		.classed("axis-node", true)
		// .on("mouseover", function(d){
		// 	pancakePlotSelections.mouseoverAxis(d3.select(this), d)
		// })
		// .on("mouseout", function(d) {
        //     pancakePlotSelections.mouseoutAxis(d3.select(this), d)
		// })
		// .attr("transform", function(d){
		// 	return "translate(" + 0 + "," + d.x0 + ")"
		// })
		.merge(nodes)
		.transition()
		.duration(400)
		.attr("transform", function(d){
			return "translate(" + 0 + "," + d.x0 + ")"
		})
		.each(function(d){
			  d3.select(this).selectAll("rect").remove()
			  d3.select(this).selectAll("text").remove()

			  renderYLabel(d3.select(this), d)
		})
	   nodes.exit().remove()
	}


function renderYLabel(dom, d){
	dom.append("text")
	.attr("y", 0)
	.attr("x", 0)
	.attr("class", function(d){
		if (d.depth == 0){ return "axis-root-label" }
		else if (d.depth == 1){
			if (d.children){
				return "axis-parent-label"
			} else { return "axis-child-label"} }
		else { return "axis-child-label" }
	})
	.attr("text-anchor", "end")
	.classed("axis-label", true)
	.classed("axis-disease-label", function(){
			if (t2dTissueMap.get(d.name) == true){
			return true
			} else { return false }
	})
	.html(d.name)
}


function renderXLabel(dom, d){

	dom.append("text")
	.attr("transform", function(){
			return "translate(" + 0 + "," + 0 + ")rotate(-90)"
	})
	.attr("x", 0)
	.attr("y",0 )
	.style("text-anchor",  "start")
	.attr("class", function(d){
		if (d.depth == 0){ return "axis-root-label" }
		else if (d.depth == 1){
			if (d.children){ return "axis-parent-label" }
			else { return "axis-child-label" } }
		else { return "axis-child-label" }
	})
	.classed("axis-label", true)
	.html(d.name)

}

function renderXBars(dom, d, axisConfig){

    var scalePost = d3.scaleLinear()
        .domain([0, 1])
        .range([0, axisConfig.barHeight])



    dom.append("rect")
        .attr("x",-axisConfig.tickSize/2)
        .attr("y", 0 )
        .attr("width", axisConfig.tickSize)
        .attr("height", axisConfig.barHeight )
        .style("fill", "none")
        .style("stroke", colorUtils.grey)
        .style("stroke-width", 1)

    dom.append("rect")
        .attr("x", -axisConfig.tickSize/2 )
        .attr("y", (0 - scalePost(dataPromises.varIdToPosteriorProbability.get(d.name))) + axisConfig.barHeight )
        .attr("width", axisConfig.tickSize)
        .attr("height", scalePost(dataPromises.varIdToPosteriorProbability.get(d.name)))
        .style("fill", colorUtils.red)
        .style("fill-opacity", .4)
        .style("stroke", "none")
    }



function createSvg(config){
    const svg = d3.select(`#${config.domId}`).append("svg").attr("id", `${config.domId}-svg`)
        .attr("width", config.width)
        .attr("height", config.height)
        .append("g").attr("id", `${config.domId}-svg-g`)
        .attr("transform", `translate(${config.padding.left}, ${config.padding.top})`);

    return svg;
}


export {
    render,
    dataPromises
};
