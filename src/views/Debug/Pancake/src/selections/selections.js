import * as d3 from "d3";
import * as colorUtils from  "../utils/colors";

// put this elsewhere!!!!!!!!!!!!!!!!
const t2dTissueMap = d3.map();
const t2dTissues = ["adipose tissue", "Malignant Pancreatic Neoplasm", "skeletal muscle tissue", "body of pancreas", "exocrine pancreas", "pancreas", "brown adipose tissue", "mesenchymal stem cell of abdominal adipose", "subcutaneous adipose tissue measurement", "adipose tissue derived mesenchymal stem cell", "skeletal muscle tissue of transversus thoracis", "skeletal muscle myoblast","skeletal muscle", "adipose", "liver", "pancreatic_islet", "pancreatic_alpha_cell", "pancreatic_beta_cell", "pancreas", "pancreatic PP cell", "pancreatic A cell"]
t2dTissues.forEach(function(d){
    t2dTissueMap.set(d, true)
})
function renderNodeTooltip(d, x, y){

		d3.select("#node-tooltip").style("visibility", "visible")
	
		var tooltip = d3.select("#node-tooltip")
		var tooltipList = tooltip.select("#tooltip-nodes")
	
		tooltip.select("#tooltip-x")
				.html("<span class='tooltip-key'> " 
					+ d.definition.x.attribute + ": </span>" + "<span class='tooltip-name'> " 
					+ d.definition.x.name  + "</span>" + "<span class='tooltip-value'></span>")
	
		tooltip.select("#tooltip-y")
				.html("<span class='tooltip-key'> " 
				+ d.definition.y.attribute + ": </span>" + "<span class='tooltip-name'> " 
				+ d.definition.y.name + "</span>" + "<span class='tooltip-value'></span>")
	
		tooltip.select("#tooltip-y").select(".tooltip-name")
			.classed("disease-label", function(){
				if (t2dTissueMap.get(d.definition.y.name)){ return true	}
			})
	
		var tooltipNest = d3.nest()
			.key(function(e){ 
				if (e.ybName == "undefined"){ 
					return e.yaField + "*" + e.yaName
				} else { return  e.ybField + "*" + e.ybName }
			})
			.entries(d.nodes)
	
		var tooltipUl = tooltipList.selectAll("div")
			.data(tooltipNest)
			.enter()
			.append("div")
			.attr("class", "tooltip-ul")
	
			tooltipUl
			.append("span")
			.classed("disease-label", function(e){
				if (t2dTissueMap.get(e.key.split("*")[1])){
					return true
				}
			})
			.html(function(e){
				var name = e.key.split("*")[1]
				let firstvalue = e.values[0].yaName
				if (name == firstvalue) {
					name = ""
				}
				
				return "<span class='tooltip-name'> " + name + "</span>" 
			})
	
		tooltipUl.selectAll(".ya-tag")
			.data(function(d){ return d.values})
			.enter()
			.append("span")
			.attr("class", "ya-tag")
			.html(function(e){
				return "<span class='tooltip-tag' style = 'background-color:"  
					+ colorUtils.lineOfEvidenceColorScale.get(e.yaName)+ "; color: white;'>" + e.yaName + " </span>" 
			})
	
		tooltip.style("left", x + 25 + "px").style("top", y + 5 + "px")
	}



function mouseoutTooltip(){
	d3.select("#node-tooltip").style("visibility", "hidden")
	d3.select("#node-tooltip").select("#tooltip-x").html("")
	d3.select("#node-tooltip").select("#tooltip-y").html("")
	d3.select("#node-tooltip").select("#tooltip-nodes").html("")
}

function mouseoutNode(dom, d){
	mouseoutTooltip()
	updateDefaultNodes()
	updateDefaultAxis()
}

function mouseoutAxis(dom, d){
	updateDefaultNodes()
	updateDefaultAxis()
}

function mouseoverNode(dom, d){

	var selected = d3.selectAll(".node").filter(function(e){
		return e.xName == d.xName && e.yName == d.yName
	})
	var selectedAxis = d3.selectAll(".axis-node").filter(function(e){
		return e.name == d.xName && e.name == d.yName
	})
	var unselectedAxis = d3.selectAll(".axis-node").filter(function(e){
		return  e.name != d.xName && e.name != d.yName
	})

	selected.moveToFront()
	var x = d3.event.x;
	var y = d3.event.y;

	renderNodeTooltip(d, x, y)

//	updateSelectedNodes(selected)
//	updateSelectedAxis(selectedAxis)


// updateUnselectedNodes(unselected)
//updateUnselectedAxis(unselectedAxis)

}

function updateSelectedNodes(nodes){
	nodes
		.classed("selected-node", true)
		.classed("unselected-node", false)
}
function updateUnselectedNodes(nodes){
	nodes
		.classed("selected-node", false)
		.classed("unselected-node", true)
}
function updateDefaultNodes(){
	d3.selectAll(".node")
	.classed("selected-node", false)
	.classed("unselected-node", false)
}


function updateSelectedAxis(nodes){
	nodes
		.classed("selected-axis", true)
		.classed("unselected-axis", false)
}
function updateUnselectedAxis(nodes){
	nodes
		.classed("selected-axis", false)
		.classed("unselected-axis", true)
}
function updateDefaultAxis(){
    d3.selectAll(".axis-node")
		.classed("selected-axis", false)
		.classed("unselected-axis", false)
}


function mouseoverAxis(dom, d){
	console.log(d)
	var dependentAxis = []

	var selected = d3.selectAll(".node").filter(function(e){
		return e.xName == d.name || e.yName == d.name
	})
	selected.each(function(e){
		e.nodes.forEach(function(f){
			dependentAxis.push(f.ybName)
		})
		dependentAxis.push(e.xName, e.yName, e.yaName)
	})
	var unselected = d3.selectAll(".node").filter(function(e){
		return e.xName != d.name && e.yName != d.name
	})
	var selectedAxis = d3.selectAll(".axis-node").filter(function(e){
		return e.name == d.name 
	})
	var unselectedAxis = d3.selectAll(".axis-node").filter(function(e){
		return e.name != d.name
	})
	var	dependentSelectedAxis = d3.selectAll(".axis-node").filter(function(e){
		return dependentAxis.includes(e.name)
	})
	var	dependentSelectedNodesY = d3.selectAll(".node").filter(function(e){
		return dependentAxis.includes(e.yName) 
	})

	updateSelectedNodes(selected)
	updateUnselectedNodes(unselected)
	updateSelectedNodes(dependentSelectedNodesY)

	updateSelectedAxis(selectedAxis)
	updateUnselectedAxis(unselectedAxis)
	updateSelectedAxis(dependentSelectedAxis)

}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
    this.parentNode.appendChild(this);
    });
};
d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};



export{
	mouseoverAxis,
	mouseoutAxis,
	mouseoverNode,
	mouseoutNode,
	mouseoutTooltip
}