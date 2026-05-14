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
                            Donors with available functional data
                            <h3>{{ $parent.donorsWithData.length }}</h3>
                        </div>
                    </div>
                    <div v-if="$parent.filteredMetadata.length > 0">
                        Filter and explore donor data
                        <div class="row">
                            <div class="col-md-3 side-panel-filters">
                                <criterion-function-group>
                                    <filter-slider :field="$parent.fieldsObject.age.key"
                                        :range="$parent.getRange($parent.fieldsObject.age)">
                                        <div class="label">Age</div>
                                    </filter-slider>
                                    <filter-slider :field="$parent.fieldsObject.bmi.key"
                                        :range="$parent.getRange($parent.fieldsObject.age)">
                                        <div class="label">BMI</div>
                                    </filter-slider>
                                    <filter-slider :field="$parent.fieldsObject.hba1c.key"
                                        :range="$parent.getRange($parent.fieldsObject.hba1c)">
                                        <div class="label">HBA1C (%)</div>
                                    </filter-slider>
                                    <filter-slider :field="$parent.fieldsObject.cultureTime.key"
                                        :range="$parent.getRange($parent.fieldsObject.cultureTime)">
                                        <div class="label">Culture time (hrs)</div>
                                    </filter-slider>
                                    <filter-radio :field="$parent.fieldsObject.sex.key"
                                        :options="$parent.filteredMetadata.map(m => m.Gender)">
                                        <div class="label">Gender</div>
                                    </filter-radio>
                                    <filter-radio :field="$parent.fieldsObject.diabetes.key"
                                        :options="$parent.filteredMetadata.map(m => 
                                            m[$parent.fieldsObject.diabetes.key])">
                                        <div class="label">Derived diabetes status</div>
                                    </filter-radio>
                                    <filter-enumeration-control
                                        :field="$parent.fieldsObject.ethnicity.key"
                                        :options="
                                            $parent.filteredMetadata.map(m => 
                                                m[$parent.fieldsObject.ethnicity.key])
                                        "
                                    >
                                        <div class="label">Ethnicity</div>
                                    </filter-enumeration-control>
                                    <filter-enumeration-control
                                        :field="$parent.fieldsObject.isolation.key"
                                        :options="
                                            $parent.filteredMetadata.map(m => 
                                            m[$parent.fieldsObject.isolation.key])
                                        "
                                    >
                                        <div class="label">Isolation Center</div>
                                    </filter-enumeration-control>
                                    <template slot="filtered" slot-scope="{ filter }">
                                        <div class="invisible-table">
                                            <b-table v-model="$parent.filteredDonors"
                                                
                                                :items="$parent.filteredMetadata.filter(filter)">
                                            </b-table>
                                        </div>
                                    </template>
                                </criterion-function-group>
                            </div>
                            <div class="col-md-9">
                                <div class="line-plots">
                                    <div class="insulin-plot line-plot col-md-6">
                                        <h5>Visualize perifusion time-series data: Insulin IEQ</h5>
                                        <time-series-line-plot v-if="$parent.insTimepoints.length > 0"
                                            :plotData="$parent.resultsIns"
                                            :maxTime="$parent.maxTimeIns"
                                            :maxScore="$parent.maxScoreIns"
                                            :donors="$parent.filteredAccession"
                                            :plotId="`insulin_ieq`"
                                            :timepoints="$parent.insTimepoints"
                                            :lineColor="$parent.insColor">
                                        </time-series-line-plot>
                                    </div>
                                    <div class="glucagon-plot line-plot col-md-6">
                                        <h5>Visualize perifusion time-series data: Glucagon IEQ</h5>
                                        <time-series-line-plot v-if="$parent.gcgTimepoints.length > 0"
                                            :plotData="$parent.resultsGcg"
                                            :maxTime="$parent.maxTimeGcg"
                                            :maxScore="$parent.maxScoreGcg"
                                            :donors="$parent.filteredAccession"
                                            :plotId="`glucagon_ieq`"
                                            :timepoints="$parent.gcgTimepoints"
                                            :lineColor="$parent.gcgColor">
                                        </time-series-line-plot>
                                    </div>
                                </div>
                            </div>
                        </div>            
                    </div>
                    <div>
                        <div class="download-button">
                            <data-download
                                :data="$parent.filteredDonors"
                                filename="pankbase_functional_donor_metadata_filtered">
                            </data-download>
                        </div>
                        {{ $parent.filteredDonors.length }} results
                        <b-table
                            small
                            :items="$parent.filteredDonors"
                            :fields="Object.values($parent.fieldsObject)"
                            :sortable="true"
                            :per-page="$parent.perPage"
                            :current-page="$parent.currentPage"
                        >
                            <template #cell(Accession)="r">
                                <a :href="`https://data.pankbase.org/human-donors/${r.item.Accession}/`">
                                    {{ r.item.Accession }}
                                </a>
                            </template>
                        </b-table>
                    <b-pagination
                        class="pagination-md justify-content-center"
                        v-model="$parent.currentPage"
                        :per-page="$parent.perPage"
                        :total-rows="$parent.filteredDonors.length">
                    </b-pagination>    
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
    margin-bottom: 20px;
}
.line-plot{
    align-items: center;
    padding: 25px;
}
.side-panel {
    display: block !important;
}
.invisible-table {
    display: none;
    overflow-x: scroll;
}
.download-button {
    display: flex;
    justify-content: right;
}
</style>
