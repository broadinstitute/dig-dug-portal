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
                    <div v-if="$store.state.metadata.length > 0">
                        Filter and explore donor data
                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'Gender'"
                                :options="
                                    $store.state.metadata.map(m => m.Gender)
                                "
                            >
                                <div class="label">Gender</div>
                            </filter-enumeration-control>
                            <filter-greater-less
                                :field="'Age (years)'"
                                :label="'Age'">
                                <div class="label">Age</div>
                            </filter-greater-less>
                            <filter-enumeration-control
                                :field="'Derived diabetes status'"
                                :options="
                                    $store.state.metadata.map(m => m['Derived diabetes status'])
                                "
                            >
                                <div class="label">Derived Diabetes Status</div>
                            </filter-enumeration-control>
                            <filter-greater-less
                                :field="'BMI'"
                                :label="'BMI'">
                                <div class="label">BMI</div>
                            </filter-greater-less>
                            <template slot="filtered" slot-scope="{ filter }">
                                <div class="row">
                                    <div class="insulin-plot line-plot col-md-6">
                                        <h5>Visualize perifusion time-series data: Insulin IEQ</h5>
                                        <time-series-line-plot v-if="$parent.timepoints.length > 0"
                                            :plotData="$parent.resultsIns"
                                            :maxTime="$parent.maxTimeIns"
                                            :maxScore="$parent.maxScoreIns"
                                            :donors="$parent.filteredDonors"
                                            :plotId="`insulin_ieq`"
                                            :timepoints="$parent.timepoints"
                                            :lineColor="$parent.insColor">
                                        </time-series-line-plot>
                                    </div>
                                    <div class="glucagon-plot line-plot col-md-6">
                                        <h5>Visualize perifusion time-series data: Glucagon IEQ</h5>
                                        <time-series-line-plot v-if="$parent.timepoints.length > 0"
                                            :plotData="$parent.resultsGcg"
                                            :maxTime="$parent.maxTimeGcg"
                                            :maxScore="$parent.maxScoreGcg"
                                            :donors="$parent.filteredDonors"
                                            :plotId="`glucagon_ieq`"
                                            :timepoints="$parent.timepoints"
                                            :lineColor="$parent.gcgColor">
                                        </time-series-line-plot>
                                    </div>
                                </div>
                                
                                <donor-metadata-table
                                    :metadata="$parent.allMetadata"
                                    :filter="filter"
                                    @filteredDonors="data => $parent.getDonors(data)">

                                </donor-metadata-table>
                            </template>
                        </criterion-function-group>
                    </div>
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
</style>
