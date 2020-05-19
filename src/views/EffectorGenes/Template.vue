<template>
    <div>
        <page-header :disease-group="$parent.diseaseGroup" :front-contents="$parent.frontContents"></page-header>
        <div class="container-fluid mdkp-body">
            <div class="filtering-tools">
                <div id="traits">
                    <div class="form-group table-filter">
                        <label for="traits">Traits</label>
                        <select
                            class="form-control"
                            id="selectTrait"
                            v-model="$parent.selectedPhenotype"
                        >
                            <option
                                v-for="item in $parent.listPheno"
                                :value="item.value"
                                :selected="item.value == $store.state.selectedPhenotype"
                            >{{ item.name }}</option>
                        </select>
                    </div>

                    <div class="table-filter">
                        <label>Search a gene</label>
                        <input
                            id="geneSearch"
                            type="text"
                            v-model.lazy.trim="searchGene"
                            placeholder="Gene ID"
                        />
                    </div>

                    <div class="table-filter">
                        <label>Filter by prob score</label>&gt;=
                        <input
                            id="probFilter"
                            type="text"
                            v-model.lazy.number="searchScore"
                            placeholder="Prob score"
                        />
                    </div>
                </div>
                <div id="regionFilter">
                    <div class="form-group">
                        <div class="table-filter">
                            <label for="region">Chromosome</label>
                            <select class="form-control" id="selectChrom" v-model="searchChrom">
                                <option value="0" selected>All</option>
                                <option
                                    v-for="item in $parent.listChrom"
                                    :value="item.value"
                                >{{ item.name }}</option>
                            </select>
                        </div>
                        <div class="table-filter">
                            <label>Region start</label>
                            <input
                                id="geneStart"
                                type="text"
                                v-model.lazy.number="chromStart"
                                placeholder="Start position"
                            />
                        </div>
                        <div class="table-filter">
                            <label>Region end</label>
                            <input
                                id="geneEnd"
                                type="text"
                                v-model.lazy.number="chromEnd"
                                placeholder="End position"
                            />
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
                <span class="column-option" v-for="item in $parent.listCol">
                    <input type="checkbox" :value="item.value" v-model="item.checked" />
                    {{item.name}} - {{item.checked}}
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

            <div id="table">
                <div v-for="(gene, i) in filteredGene" :key="i">
                    <template>
                        <div
                            v-if="(i === 0) || (gene[1]['names.genes'] !== filteredGene[i-1][1]['names.genes'])"
                        >
                            <div class="row summary">
                                <div class="sum geneName">{{gene[1]["names.genes"]}}</div>
                                <div
                                    class="sum prob"
                                    @click="this.isHidden = !this.isHidden"
                                >{{gene[1]["all.locus.prob"]}}</div>
                                <div class="sum chromLocation">
                                    <span class="chrom">{{gene[1]["locus.chrom"].slice(3)}}</span> :
                                    <span class="chromStart">{{ gene[1]["locus.chrom.start"]}}</span> -
                                    <span class="chromEnd">{{gene[1]["locus.chrom.end"]}}</span>
                                </div>
                                <div class="sum ei"></div>
                            </div>

                            <div
                                class="probInfo"
                                :class="{hidden: isHidden}"
                                :id="gene[1]['names.genes'].split('.').join('_')"
                            >
                                <div class="probHeaders">
                                    <div v-for="col in $parent.listCol" :key="col.name">
                                        <span>{{col.name}}</span>
                                    </div>
                                </div>
                                <div class="probDetails">
                                    <portal-target :name="gene[1]['names.genes']" multiple></portal-target>
                                </div>
                            </div>
                        </div>
                        <portal :to="gene[1]['names.genes']">
                            <div class="detailRow">
                                <div
                                    v-for="col in $parent.listCol"
                                    :key="col.name"
                                >{{gene[1][col.name]}}</div>
                            </div>
                        </portal>

                        <!-- <div class="probInfo">
						<div class="probHeaders">
							<div v-for="col in $parent.listCol">
								<span v-bind="col">{{col.name}}</span>
							</div>
						</div>
                        </div>-->

                        <!-- <div v-for="(detail, j) in gene" class="probInfo" :key="detail.id">

                        </div>-->

                        <!-- <div v-for="(detail, j) in gene" class="probInfo" :key="detail.id">
						<div class="probHeaders">
							<div v-for="col in $parent.listCol">
								<span v-bind="col">{{col.name}}</span>
							</div>
						</div>
						<div class="proDetails">
							<div v-for="dCol in detail">
								<span></span>
							</div>
						</div>
                        </div>-->

                        <!-- {{gene["names.genes"]}} - {{$parent.geneData[i]["names.genes"]}} -->
                        <!-- <div
						v-if="i > 0 && gene['names.genes'] !== $parent.geneData[i-1]['names.genes']"
					>{{gene['names.genes']}} - {{i}}</div>
                        <div v-else-if="i === 0">{{gene['names.genes']}} - {{i}}</div>-->
                    </template>
                </div>
            </div>
        </div>

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<script>
export default {
    data() {
        return {
            isHidden: true,
            searchGene: "",
            searchScore: "",
            searchChrom: 0,
            chromStart: "",
            chromEnd: ""
        };
    },
    methods: {
        showInfo: function() {
            this.isHidden = !this.isHidden;
        }
    },
    computed: {
        geneData: function() {
            return this.$store.state.effectorGenes.geneData;
        },
        top20Data: function() {
            return this.$store.state.effectorGenes.top20Data;
        },
        prepped: function() {
            return _.chain(this.geneData)
                .groupBy("names.genes")
                .value();
        },
        filteredGene: function() {
            return Object.entries(this.geneData)
                .filter(gene => {
                    return gene[1]["names.genes"]
                        .toLowerCase()
                        .includes(this.searchGene.toLowerCase());
                })
                .filter(gene => {
                    return gene[1]["all.locus.prob"] >= this.searchScore;
                })
                .filter(gene => {
                    if (this.searchChrom > 0)
                        return (
                            gene[1]["locus.chrom"].slice(3) == this.searchChrom
                        );
                    else return gene;
                })
                .filter(gene => {
                    if (this.chromStart)
                        return gene[1]["locus.chrom.start"] >= this.chromStart;
                    else return gene;
                })
                .filter(gene => {
                    if (this.chromEnd)
                        return gene[1]["locus.chrom.end"] <= this.chromEnd;
                    else return gene;
                });
            // return this.geneData;
        }
    }
};
</script>

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

div#data {
    overflow-x: hidden !important;
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

div.probInfo.hidden,
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
div.detailRow {
    display: block;
}
div.detailRow > div {
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
