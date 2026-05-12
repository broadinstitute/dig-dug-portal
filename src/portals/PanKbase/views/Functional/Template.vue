<template>
    <div class="pkb-wrapper f-col fill-height">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->
        <div class="pkb-body">
            <div class="card mdkp-card">
                <div class="card-body">
                    <h2>Data Explorer</h2>
                    <div id="stats" class="row" v-if="$store.state.metadata.length > 0">
                        <div class="col-md-6">
                            Total donors
                            <h3>{{ $store.state.metadata.length }}</h3>
                        </div>
                        <div class="col-md-6">
                            Donors with available functional data
                            <h3>{{ Object.keys(this.$store.state.ins[0]).length - 2 }}</h3>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4 filtering-ui-wrapper">
                            <div class="label">
                                Age
                                <dual-slider
                                    :field="$parent.fieldKey($parent.fieldsObject.ageMin)"
                                    :sliderId="'age'"
                                    :unfilteredDataset="$parent.filteredMetadata"
                                    @filterChanged="range => $parent.updateFilters(
                                        $parent.fieldKey($parent.fieldsObject.ageMin),
                                        true,
                                        range)">
                                </dual-slider>
                            </div>
                        </div>
                        <div class="col-md-8" v-if="$parent.filteredMetadata.length > 0">
                            <div>
                                <div class="insulin-plot line-plot">
                                    <h5>Visualize perifusion time-series data: Insulin IEQ</h5>
                                    <time-series-line-plot v-if="$parent.insTimepoints.length > 0"
                                        :plotData="$parent.resultsIns"
                                        :maxTime="$parent.maxTimeIns"
                                        :maxScore="$parent.maxScoreIns"
                                        :donors="$parent.filteredDonors"
                                        :plotId="`insulin_ieq`"
                                        :timepoints="$parent.insTimepoints"
                                        :lineColor="$parent.insColor"
                                        yAxisLabel="ng/100 IEQ/min">
                                    </time-series-line-plot>
                                </div>
                                <div class="glucagon-plot line-plot">
                                    <h5>Visualize perifusion time-series data: Glucagon IEQ</h5>
                                    <time-series-line-plot v-if="$parent.gcgTimepoints.length > 0"
                                        :plotData="$parent.resultsGcg"
                                        :maxTime="$parent.maxTimeGcg"
                                        :maxScore="$parent.maxScoreGcg"
                                        :donors="$parent.filteredDonors"
                                        :plotId="`glucagon_ieq`"
                                        :timepoints="$parent.gcgTimepoints"
                                        :lineColor="$parent.gcgColor"
                                        yAxisLabel="pg/100 IEQ/min">
                                    </time-series-line-plot>
                                </div>
                            </div>
                        </div>
                    </div> 
                    <donor-metadata-table v-if="$parent.filteredMetadata.length > 0"
                        :metadata="$parent.filteredMetadata"
                        :fieldsObject="$parent.fieldsObject"
                        :minSuffix="$parent.minSuffix"
                        @filteredDonors="data => $parent.getDonors(data)">
                    </donor-metadata-table>
                </div>
            </div>
        </div>
        <!-- FOOTER -->
        <pkb-footer></pkb-footer>
    </div>
</template>
<style scoped>
.pkb-body {
    max-width: 2000px;
}
.container {
    display: flex;
    justify-content: center;
}
.center {
    padding: 10px;
}

/* basic positioning */
.legend {
    list-style: none;
}
.legend li {
    float: left;
    margin-right: 10px;
}
.legend span {
    border: 0px;
    float: left;
    width: 12px;
    height: 12px;
    margin: 2px;
}

.mdkp-card {
    margin-top: 20px;
    margin-bottom: 20px;
}
.toc-item {
    padding: 10px;
    margin-bottom: 5px;
    background-color: #efefef;
    border: 1px solid #dddddd;
    border-radius: 5px;
}
.stats {
    margin-bottom: 10px;;
}
.line-plot{
    align-items: center;
    padding: 25px;
}
.inline-radio {
    display: inline;
}
</style>
