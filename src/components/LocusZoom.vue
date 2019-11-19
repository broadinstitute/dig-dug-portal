<template>
	<div id="locuszoom" data-region="10:114550452-115067678"></div>
</template>

<script>
import Vue from "vue";
// import LocusZoom from "locuszoom";
import LocusZoom from "../../node_modules/locuszoom/dist/locuszoom.app";

export default Vue.component("locuszoom", {
	props: ["gene", "recomb", "interval", "phewas", "static", "ld", "ld2"],
	data() {
		return {
			// plot: null,
			// dataSources: new LocusZoom.DataSources()
		};
	},
	mounted() {
		this.dataSources = new LocusZoom.DataSources();

		if (this.static) {
			this.dataSources.add("static", ["StaticJSON", this.static]);
		}
		//...
		let layout = {
			//id: "plot",
			//type: "filledCurve",
			width: 100,
			height: 100,
			responsive_resize: "both",
			panels: [
				LocusZoom.Layouts.get("panel", "association", {
					//namespace: { phewas: "static" }
					data_layers: [
						LocusZoom.Layouts.get("data_layer", "significance", {
							name: "Line of GWAS Significance",
							namespace: { sig: "static" }
						})
					]
				})
			]
			//id_field: "{{namespace[phewas]}}static",
			//fields: ["{{namespace[phewas]}}static"]
			//dashboard: LocusZoom.Layouts.get("dashboard", "region_nav_plot")
		};
		// let layout = LocusZoom.Layouts.get("plot", "association", {
		// 	//namespace: { standard_association: "static" }
		// });
		this.plot = LocusZoom.populate("#locuszoom", this.dataSources, layout);
	}
});

// // Define base data sources
// var apiBase = "https://portaldev.sph.umich.edu/api/v1/";
// var data_sources = new LocusZoom.DataSources()
// 	.add("recomb", [
// 		"RecombLZ",
// 		{
// 			url: apiBase + "annotation/recomb/results/",
// 			params: { build: "GRCh37" }
// 		}
// 	])
// 	.add("gene", [
// 		"GeneLZ",
// 		{ url: apiBase + "annotation/genes/", params: { build: "GRCh37" } }
// 	])
// 	.add("constraint", [
// 		"GeneConstraintLZ",
// 		{ url: "http://exac.broadinstitute.org/api/constraint" }
// 	]);

// // Build the base layout
// var association_panel_mods = {
// 	data_layers: [
// 		LocusZoom.Layouts.get("data_layer", "significance", {
// 			name: "Line of GWAS Significance"
// 		}),
// 		LocusZoom.Layouts.get("data_layer", "recomb_rate", {
// 			namespace: { recomb: "recomb" },
// 			name: "Recombination Rate"
// 		})
// 	],
// 	dashboard: LocusZoom.Layouts.get("panel", "association")["dashboard"]
// };
// association_panel_mods.dashboard.components.push({
// 	type: "data_layers",
// 	position: "right",
// 	statuses: ["faded", "hidden"]
// });
// var layout = {
// 	width: 800,
// 	height: 500,
// 	responsive_resize: "both",
// 	panels: [
// 		LocusZoom.Layouts.get("panel", "association", association_panel_mods),
// 		LocusZoom.Layouts.get("panel", "genes", { namespace: { gene: "gene" } })
// 	],
// 	dashboard: LocusZoom.Layouts.get("dashboard", "region_nav_plot")
// };

// // Define a set of studies/phenotypes and loop through them to add a data source and data layer for each one
// var phenos = [
// 	{
// 		namespace: "fasting_glucose",
// 		title: "Fasting glucose meta-analysis",
// 		color: "rgb(212, 63, 58)",
// 		study_id: 31
// 	},
// 	{
// 		namespace: "fasting_insulin",
// 		title: "Fasting insulin meta-analysis",
// 		color: "rgb(238, 162, 54)",
// 		study_id: 32
// 	},
// 	{
// 		namespace: "triglycerides",
// 		title: "Triglycerides meta-analysis",
// 		color: "rgb(92, 184, 92)",
// 		study_id: 29
// 	},
// 	{
// 		namespace: "cholesterol",
// 		title: "Total cholesterol meta-analysis",
// 		color: "rgb(53, 126, 189)",
// 		study_id: 30
// 	}
// ];
// phenos.forEach(function(pheno) {
// 	data_sources.add(pheno.namespace, [
// 		"AssociationLZ",
// 		{
// 			url: apiBase + "statistic/single/",
// 			params: { source: pheno.study_id, id_field: "variant" }
// 		}
// 	]);
// 	var association_data_layer_mods = {
// 		namespace: { assoc: pheno.namespace },
// 		id: "associationpvalues_" + pheno.namespace,
// 		name: pheno.title,
// 		point_shape: "circle",
// 		point_size: 40,
// 		color: pheno.color,
// 		legend: [
// 			{
// 				shape: "circle",
// 				color: pheno.color,
// 				size: 40,
// 				label: pheno.title,
// 				class: "lz-data_layer-scatter"
// 			}
// 		],
// 		fields: [
// 			pheno.namespace + ":variant",
// 			pheno.namespace + ":position",
// 			pheno.namespace + ":log_pvalue",
// 			pheno.namespace + ":log_pvalue|logtoscinotation",
// 			pheno.namespace + ":ref_allele"
// 		],
// 		tooltip: {
// 			closable: true,
// 			show: { or: ["highlighted", "selected"] },
// 			hide: { and: ["unhighlighted", "unselected"] },
// 			html:
// 				"<strong>" +
// 				pheno.title +
// 				"</strong><br>" +
// 				"<strong>{{" +
// 				pheno.namespace +
// 				":variant|htmlescape}}</strong><br>" +
// 				"P Value: <strong>{{" +
// 				pheno.namespace +
// 				":log_pvalue|logtoscinotation|htmlescape}}</strong><br>" +
// 				"Ref. Allele: <strong>{{" +
// 				pheno.namespace +
// 				":ref_allele|htmlescape}}</strong><br>"
// 		}
// 	};
// 	layout.panels[0].data_layers.push(
// 		LocusZoom.Layouts.get(
// 			"data_layer",
// 			"association_pvalues",
// 			association_data_layer_mods
// 		)
// 	);
// });

// // Generate the LocusZoom plot
// var plot = LocusZoom.populate("#locuszoom", data_sources, layout);

// // Add a basic loader to each panel (one that shows when data is requested and hides when one rendering)
// plot.layout.panels.forEach(function(panel) {
// 	plot.panels[panel.id].addBasicLoader();
// });

// // Create a method to parse a region string into a 600Kb genome range and load it
// function jumpTo(region) {
// 	var target = region.split(":");
// 	var chr = target[0];
// 	var pos = target[1];
// 	var start = 0;
// 	var end = 0;
// 	if (!pos.match(/[-+]/)) {
// 		start = +pos - 300000;
// 		end = +pos + 300000;
// 	}
// 	plot.applyState({ chr: chr, start: start, end: end, ldrefvar: "" });
// 	return false;
// }

// // Populate a list of top hits links for the plot
// var top_hits = [
// 	["16:53819169", "FTO"],
// 	["15:58680954", "LIPC"],
// 	["2:21231524", "APOB"],
// 	["16:56959412", "CETP"],
// 	["7:44196069", "GCK"],
// 	["2:27518370", "GCKR"],
// 	["10:114758349", "TCF7L2"],
// 	["7:15052860", "DGKB"],
// 	["2:27772914", "MRPL33"],
// 	["6:20679709", "CDKAL1"],
// 	["19:11091630", "LDLR"],
// 	["11:116778201", "APOA1"],
// 	["8:19986711", "LPL"],
// 	["11:92708710", "MTNR1B"]
// ];
// top_hits.forEach(function(hit) {
// 	d3.select("ul.top_hits")
// 		.append("li")
// 		.html(
// 			'<a href="javascript:void(0);" onclick="javascript:jumpTo(\'' +
// 				hit[0] +
// 				"');\">" +
// 				hit[1] +
// 				"</a>"
// 		);
// });
</script>
