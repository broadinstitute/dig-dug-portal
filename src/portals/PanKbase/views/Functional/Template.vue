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
                            Total Donors
                            <h3>{{ $store.state.metadata.length }}</h3>
                        </div>
                        <div class="col-md-6">
                            Donors with Functional Data
                            <h3>{{ Object.keys(this.$store.state.ins[0]).length - 2 }}</h3>
                        </div>
                    </div>
                    <div v-if="$store.state.metadata.length > 0">
                        Filter and explore donor data
                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'Gender'"
                                :multiple="true"
                                :options="
                                    $store.state.metadata.map(m => m.Gender)
                                "
                            >
                                <div class="label">Gender</div>
                            </filter-enumeration-control>
                            <filter-enumeration-control
                                :field="'Derived diabetes status'"
                                :multiple="true"
                                :options="
                                    $store.state.metadata.map(m => m['Derived diabetes status'])
                                "
                            >
                                <div class="label">Diabetes Status</div>
                            </filter-enumeration-control>
                            <filter-enumeration-control
                                :field="'Cause of Death'"
                                :multiple="true"
                                :options="
                                    $store.state.metadata.map(m => m['Cause of Death'])
                                "
                            >
                                <div class="label">Cause of Death</div>
                            </filter-enumeration-control>
                            <filter-enumeration-control
                                :field="'Collections'"
                                :multiple="true"
                                :options="
                                    $store.state.metadata.map(m => m.Collections)
                                "
                            >
                                <div class="label">Collection Center</div>
                            </filter-enumeration-control>
                            <filter-enumeration-control
                                :field="'Ethnicities'"
                                :multiple="true"
                                :options="
                                    $store.state.metadata.map(m => m.Ethnicities)
                                "
                            >
                                <div class="label">Ethnicity</div>
                            </filter-enumeration-control>
                            <template slot="filtered" slot-scope="{ filter }">
                                <donor-metadata-table
                                    :metadata="$parent.availableDonorsMetadata"
                                    :filter="filter"
                                    @filteredDonors="data => $parent.getDonors(data)">

                                </donor-metadata-table>
                            </template>
                        </criterion-function-group>
                    </div>
                    <div>
                        Visualize perifusion time-series data
                        <time-series-line-plot
                            :plotData="$parent.insData"
                            :donors="$parent.filteredDonors"
                            :config="$parent.linePlotConfig"
                            :plotId="`insulin_ieq`">

                        </time-series-line-plot>
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
</style>
