<template>
	<div>
		<!-- <page-header></page-header> -->
		<div class="container-fluid mdkp-body">
			<div class="filtering-tools">
				<div id="traits">
					<div class="form-group table-filter">
						<label for="traits">Traits</label>
						hello
						{{ $store.state.selectedPhenotype }}
						<select
							class="form-control"
							id="selectTrait"
							v-bind:selectedPhenotype="$store.state.selectedPhenotype"
							@change="$store.dispatch('onPhenotypeChange', {selectedPhenotype});"
						>
							<option value="calcium">Calcium</option>
							<option value="dbilirubin">Dbilirubin</option>
							<option value="dbp">Diastolic blood pressure</option>
							<option value="ebmd">Estimated bone mineral density</option>
							<option value="glucose">Glucose</option>
							<option value="height">Height</option>
							<option value="ldl">LDL cholesterol</option>
							<option value="lowtsh">Lowtsh</option>
							<option value="rbc">RBC</option>
							<option value="sbp">Systolic blood pressure</option>
							<option value="t2d" selected>Type 2 diabetes</option>
							<option value="tg">Triglycerides</option>
						</select>
					</div>
					<div class="table-filter">
						<label>Search a gene</label>
						<input id="geneSearch" type="text" placeholder="Gene ID" />
					</div>
					<div class="table-filter">
						<label>Search a locus</label>
						<input id="locusSearch" type="text" placeholder="Locus ID" />
					</div>
					<div class="table-filter">
						<label>Filter by prob score</label>&gt;=
						<input id="probFilter" type="text" placeholder="Prob score" />
					</div>
				</div>
				<div id="regionFilter">
					<div class="form-group">
						<div class="table-filter">
							<label for="region">Chromosome</label>
							<select class="form-control" id="selectChrom">
								<option value="0" selected>All</option>
								<option value="1">1</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
								<option value="5">5</option>
								<option value="6">6</option>
								<option value="7">7</option>
								<option value="8">8</option>
								<option value="9">9</option>
								<option value="10">10</option>
								<option value="11">11</option>
								<option value="12">12</option>
								<option value="13">13</option>
								<option value="14">14</option>
								<option value="15">15</option>
								<option value="16">16</option>
								<option value="17">17</option>
								<option value="18">18</option>
								<option value="19">19</option>
								<option value="20">20</option>
								<option value="21">21</option>
								<option value="22">22</option>
							</select>
						</div>
						<div class="table-filter">
							<label>Region start</label>
							<input id="geneStart" type="text" placeholder="Start position" />
						</div>
						<div class="table-filter">
							<label>Region end</label>
							<input id="geneEnd" type="text" placeholder="End position" />
						</div>
					</div>
				</div>
			</div>
		</div>

		<div id="setButton">
			<div id="colOptions" class="hidden">
				<div class="colOptionClose">
					<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
				</div>
				<h3>Set visibility of annotation columns</h3>
				<span class="column-option">
					<input type="checkbox" value="col1" checked /> snp.name
				</span>
				<span class="column-option">
					<input type="checkbox" value="col2" checked /> snp.locus
				</span>
				<span class="column-option">
					<input type="checkbox" value="col3" checked /> snp.pos
				</span>
				<span class="column-option">
					<input type="checkbox" value="col4" checked /> maf
				</span>
				<span class="column-option">
					<input type="checkbox" value="col5" checked /> beta
				</span>
				<span class="column-option">
					<input type="checkbox" value="col6" checked /> se
				</span>
				<span class="column-option">
					<input type="checkbox" value="col7" checked /> z
				</span>
				<span class="column-option">
					<input type="checkbox" value="col8" checked /> prob
				</span>
				<span class="column-option">
					<input type="checkbox" value="col9" checked /> log10bf
				</span>
				<span class="column-option">
					<input type="checkbox" value="col10" checked /> log10bf_group
				</span>
				<span class="column-option">
					<input type="checkbox" value="col11" checked /> snpeff.impact
				</span>
				<span class="column-option">
					<input type="checkbox" value="col12" /> dsbsnp.func
				</span>
				<span class="column-option">
					<input type="checkbox" value="col13" /> is.dbsnp.delit
				</span>
				<span class="column-option">
					<input type="checkbox" value="col14" /> is.snpeff.delit
				</span>
				<span class="column-option">
					<input type="checkbox" value="col15" /> snp.in.trait.DHS
				</span>
				<span class="column-option">
					<input type="checkbox" value="col16" /> nearest.trait.DHS.from.gene
				</span>
				<span class="column-option">
					<input type="checkbox" value="col17" /> nearest.gene.from.trait.DHS
				</span>
				<span class="column-option">
					<input type="checkbox" value="col18" /> snp.in.DHS
				</span>
				<span class="column-option">
					<input type="checkbox" value="col19" /> nearest.DHS.from.gene
				</span>
				<span class="column-option">
					<input type="checkbox" value="col20" /> nearest.gene.from.DHS
				</span>
				<span class="column-option">
					<input type="checkbox" value="col21" /> in.gtex
				</span>
			</div>
			<button id="setColumn" class="btn btn-default">Set Columns</button>
		</div>

		<div id="data">
			<div class="legends legends1">
				<span class="legend">
					<b>Locus probability:</b>
				</span>
				<span class="legend prob_5">>= 0.8</span>
				<span class="legend prob_4">>= 0.6</span>
				<span class="legend prob_3">>= 0.4</span>
				<span class="legend prob_2">>= 0.2</span>
				<span class="legend">
					<b>Locus Y:</b>
				</span>
				<span class="legend locus_y_0">= 0</span>
				<span class="legend locus_y_1">= 1</span>
				<span class="legend">
					<b>SNP effect impact:</b>
				</span>
				<span class="legend snp_eff_4">high</span>
				<span class="legend snp_eff_3">moderate</span>
				<span class="legend snp_eff_2">low</span>
				<span class="legend snp_eff_1">modifier</span>
				<span class="legend snp_eff_5">none</span>
			</div>
			<div class="legends legends2">
				<span>*Hover gene name for gene information</span>
				<span>*Click probability value to see detailed annotations</span>
			</div>
		</div>

		<!-- <page-footer></page-footer> -->
	</div>
</template>

<style scoped>
.content.effector-genes-page {
	width: 140%;
	margin-left: -20%;
}

.row.locus_y_0 {
	border-right: 8px #eee solid;
}

.row.locus_y_1 {
	border-right: 8px #fa0 solid;
}
div#data .row {
	margin: 0 !important;
	border-bottom: solid 1px #fff;
}

div#data .row:hover {
	background-color: #eee;
}

div#data div.row > div {
	display: inline-block;
	width: 25%;
	white-space: nowrap;
	text-overflow: ellipsis;
	padding: 3px 8px;
	vertical-align: top;
}

div#data .row:hover {
	background-color: #eee;
}

div#data div.row.headers {
	border-bottom: solid 1px #bbb;
	margin-bottom: 5px !important;
}

.selected {
	color: blue;
}

.hidden,
.start-hidden,
.end-hidden {
	display: none;
}

.headers {
	font-weight: bold;
	font-size: 1.2em;
}
.probHeaders {
	font-size: 1.1em;
}
#setButton {
	text-align: right;
}
.prob {
	cursor: pointer;
}
div.filtering-tools {
	border: solid 1px #ddd;
	border-radius: 5px;
	background-color: #efefef;
	text-align: center;
	margin-bottom: 40px;
	padding-top: 8px;
}

#traits,
#regionFilter {
	display: inline-block;
}

.table-filter,
#traits {
	display: inline-block;
	padding-right: 5px;
	padding-left: 5px;
	border-right: solid 1px #fff;
}

#traits {
	border-right: solid 1px #fff;
}

.table-filter:last-child {
	border-right: none;
}

.table-filter label {
	display: block;
}

#selectTrait {
	width: auto;
}

.prob_score_1,
.prob_score_2,
.prob_score_3,
.prob_score_4,
.prob_score_5 {
}

div.legends1,
div.legends2 {
	text-align: left;
	border-bottom: solid 1px #ddd;
	padding-bottom: 10px;
}

div.legends1 {
	margin-bottom: 0px;
}

div.legends2 {
	padding: 0;
	text-align: left;
}

div.legends span {
	display: inline-block;
	padding: 0px 5px;
	margin-left: 5px;
}

div.legends span.legend {
	display: inline-block;
	padding: 0px 5px;
	margin-left: 5px;
	font-size: 12px;
}

div.legends span > b {
	font-size: 14px;
}

.prob_score_1 div.prob,
div.legends span.legend.prob_1 {
	background-color: rgba(91, 203, 245, 0);
}

.prob_score_2 div.prob,
div.legends span.legend.prob_2 {
	background-color: rgba(91, 203, 245, 0.15);
}

.prob_score_3 div.prob,
div.legends span.legend.prob_3 {
	background-color: rgba(91, 203, 245, 0.35);
}

.prob_score_4 div.prob,
div.legends span.legend.prob_4 {
	background-color: rgba(91, 203, 245, 0.55);
}

.prob_score_5 div.prob,
div.legends span.legend.prob_5 {
	background-color: rgba(91, 203, 245, 1);
}

.snp_eff_4 {
	background-color: rgba(100, 200, 0, 1);
}

.snp_eff_3 {
	background-color: rgba(100, 200, 0, 0.75);
}

.snp_eff_2 {
	background-color: rgba(100, 200, 0, 0.4);
}

.snp_eff_1 {
	background-color: rgba(100, 200, 0, 0.15);
}

.snp_eff_5 {
	background-color: rgba(100, 200, 0, 0);
}

div.geneName {
	position: relative;
	color: #337ab7;
	cursor: pointer;
	font-weight: 500;
}

div.geneName div.geneInfo {
	width: 0px;
	height: 0px;
	padding: 0px;
	top: -10px;
	left: 25%;
	background-color: #fff;
	-webkit-transition: all 0.3s ease-out;
	-moz-transition: all 0.3s ease-out;
	-o-transition: all 0.3s ease-out;
	transition: all 0.3s ease-out;
	position: absolute;
	z-index: 100;
	border: none;
	border-radius: 5px;
}

div.geneName:hover div.geneInfo {
	width: auto;
	height: auto;
	padding: 10px;
	border: solid 1px #ddd;
	box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.25);
}
div.geneName:hover div.geneInfo span {
	display: block;
}

div.geneName div.geneInfo span {
	display: none;
	color: #000;
	font-weight: 400;
}

div.legends .legend.locus_y_0 {
	background-color: #eee;
}

div.legends .legend.locus_y_1 {
	background-color: #fa0;
}

#colOptions {
	position: fixed;
	background-color: #fff;
	text-align: left;
	z-index: 100000;
	border: solid 1px #ddd;
	padding: 30px;
	width: 500px;
	border-radius: 15px;
	box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.25);
}

.colOptionClose {
	position: absolute;
	top: 10px;
	right: 10px;
	color: #aaa;
}

#colOptions .column-option {
	display: block;
}

div.probInfo {
	position: relative;
	border-top: 1px solid #000;
	border-bottom: 1px solid #000;
	background-color: #eee;
	display: block;
	width: 100%;
	overflow-x: auto;
}

div.probHeaders {
	display: block;
	white-space: nowrap;
	border-bottom: solid 2px #fff;
}

div.probHeaders > div {
	display: inline-block;
	width: 9%;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	padding: 3px 8px;
}

div.probDetails {
	background-color: #fff;
	display: block;
	white-space: nowrap;
	border-bottom: solid 1px #fff;
}

div.probDetails:hover {
	background-color: #eee;
}

div.probDetails > div {
	display: inline-block;
	width: 9%;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	padding: 3px 8px;
}

input[type="text"] {
	height: 34px;
	border: solid 1px #ccc;
	padding: 5px;
	width: 150px !important;
}

div#data div.row > div.locusName {
	white-space: normal;
}

#setColumn {
	margin-bottom: -35px;
}

.effector_genes_page_title {
	font-family: "Oswald";
	font-size: 55px;
	padding-bottom: 20px;
	border-bottom: solid 2px #dddddd;
	margin-bottom: 30px;
	text-align: center;
}

#effector-genes-table-switch {
	width: 100%;
	text-align: center;
	border-bottom: solid 1px #ddd;
	margin-bottom: 30px;
	font-size: 16px;
}

#effector-genes-table-switch > a.switch {
	display: inline-block;
	color: #999;
	padding: 5px 15px;
	border: solid 1px #ddd;
	margin: 5px;
	margin-bottom: -1px;
	border-top-left-radius: 10px;
	border-top-right-radius: 10px;
}

#effector-genes-table-switch > a.switch.active {
	color: #000;
	border-bottom: solid 1px #fff;
}

/* loading animation */

#load_spinner {
	position: fixed;
	width: 160px;
	height: 160px;
	padding-top: 10px;
	color: #fff;
	background-color: rgba(0, 0, 0, 0.75);
	top: 200px;
	text-align: center;
	border-radius: 10px;
}

.lds-grid {
	position: absolute;
	top: 40px;
	left: 40px;
	width: 80px;
	height: 80px;
}
.lds-grid div {
	position: absolute;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: rgb(91, 203, 245);
	animation: lds-grid 1.2s linear infinite;
}
.lds-grid div:nth-child(1) {
	top: 8px;
	left: 8px;
	animation-delay: 0s;
}
.lds-grid div:nth-child(2) {
	top: 8px;
	left: 32px;
	animation-delay: -0.4s;
}
.lds-grid div:nth-child(3) {
	top: 8px;
	left: 56px;
	animation-delay: -0.8s;
}
.lds-grid div:nth-child(4) {
	top: 32px;
	left: 8px;
	animation-delay: -0.4s;
}
.lds-grid div:nth-child(5) {
	top: 32px;
	left: 32px;
	animation-delay: -0.8s;
}
.lds-grid div:nth-child(6) {
	top: 32px;
	left: 56px;
	animation-delay: -1.2s;
}
.lds-grid div:nth-child(7) {
	top: 56px;
	left: 8px;
	animation-delay: -0.8s;
}
.lds-grid div:nth-child(8) {
	top: 56px;
	left: 32px;
	animation-delay: -1.2s;
}
.lds-grid div:nth-child(9) {
	top: 56px;
	left: 56px;
	animation-delay: -1.6s;
}
@keyframes lds-grid {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}
</style>
