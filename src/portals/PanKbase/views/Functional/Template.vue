<template>
    <div class="pkb-wrapper f-col fill-height">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->
        <div class="pkb-body">
            <div class="card mdkp-card">
                <div class="card-body functional-page">
                    <div id="stats">
                        <span id="stats-header">Data Explorer</span>
                        <span v-if="$parent.filteredMetadata.length > 0">
                            ({{ $parent.donorsWithData.length }} donors with available functional data)</span>
                    </div>
                    <div v-if="$parent.filteredMetadata.length > 0">
                        <div class="row">
                            <div class="col-md-3 side-panel-filters">
                                <b-tabs>
                                    <b-tab title="Filter donor data"
                                        @click="$parent.useSelectedDonors(false)">
                                        <criterion-function-group>
                                            <filter-slider v-for="oField in Object.values($parent.fieldsObject)
                                                .filter(f => f.isNumeric && !f.noSidebar)"
                                                :field="oField.key"
                                                :range="$parent.getRange(oField)"
                                                :presets="$parent.presets">
                                                <div class="label">{{ oField.key }}</div>
                                            </filter-slider>
                                            <filter-radio v-for="oField in Object.values($parent.fieldsObject)
                                                .filter(f => !f.isNumeric && !f.noSidebar)"
                                                :field="oField.key"
                                                :options="$parent.filteredMetadata.map(m => m[oField.key])"
                                                :presets="$parent.presets">
                                                <div class="label">{{ oField.key }}</div>
                                            </filter-radio>
                                            <div class="advanced-filters" :hidden="!$parent.showAdvanced">
                                                <filter-slider v-for="advField in Object.values($parent.advancedFields)
                                                    .filter(f => f.isNumeric)"
                                                    :field="advField.key"
                                                    :range="$parent.getRange(advField)"
                                                    :presets="$parent.presets">
                                                    <div class="label">{{ advField.key }}</div>
                                                </filter-slider>
                                                <filter-radio v-for="advField in Object.values($parent.advancedFields)
                                                    .filter(f => !f.isNumeric)"
                                                    :field="advField.key"
                                                    :options="$parent.filteredMetadata.map(m => m[advField.key])"
                                                    :presets="$parent.presets">
                                                    <div class="label">{{ advField.key }}</div>

                                                </filter-radio>
                                            </div>
                                            <button class="btn btn-secondary" @click="$parent.toggleAdvanced">
                                                {{ $parent.showAdvanced ? "Hide" : "Show" }} advanced filters
                                            </button>
                                            <template slot="filtered" slot-scope="{ filter }">
                                                <div class="invisible-table">
                                                    <b-table v-model="$parent.filteredDonors"
                                                        
                                                        :items="$parent.filteredMetadata.filter(filter)">
                                                    </b-table>
                                                </div>
                                            </template>
                                        </criterion-function-group>
                                        </b-tab>
                                        <b-tab title="Select donors"
                                            @click="$parent.useSelectedDonors(true)">
                                            <div class="filter-tab-liner">
                                                <textarea v-model="$parent.selectedDonors"
                                                    rows="10" cols="25">

                                                </textarea>
                                            </div>
                                            <div class="donor-search-button">
                                                <button @click="$parent.selectDonors()" class="btn btn-primary">
                                                    Search donors
                                                </button>
                                            </div>
                                        </b-tab>
                                </b-tabs>
                            </div>
                            <div class="col-md-9">
                                <b-tabs>
                                    <b-tab title="Perifusion traces">
                                        <div class="line-plots">
                                            {{ $parent.filteredAccession.length }} donors meeting filter criteria
                                            <div class="insulin-plot line-plot">
                                                <time-series-line-plot v-if="$parent.insTimepoints.length > 0"
                                                    :plotData="$parent.resultsIns"
                                                    plotTitle="Islet Insulin Secretion"
                                                    :maxTime="$parent.maxTimeIns"
                                                    :maxScore="$parent.maxScoreIns"
                                                    :donors="$parent.filteredAccession"
                                                    :plotId="`insulin_ieq`"
                                                    :timepoints="$parent.insTimepoints"
                                                    :lineColor="$parent.insColor"
                                                    yAxisLabel="ng/100IEQ/min">
                                                </time-series-line-plot>
                                            </div>
                                            <div class="glucagon-plot line-plot">
                                                <time-series-line-plot v-if="$parent.gcgTimepoints.length > 0"
                                                    :plotData="$parent.resultsGcg"
                                                    plotTitle="Islet Glucagon Secretion"
                                                    :maxTime="$parent.maxTimeGcg"
                                                    :maxScore="$parent.maxScoreGcg"
                                                    :donors="$parent.filteredAccession"
                                                    :plotId="`glucagon_ieq`"
                                                    :timepoints="$parent.gcgTimepoints"
                                                    :lineColor="$parent.gcgColor"
                                                    yAxisLabel="pg/100IEQ/min">
                                                </time-series-line-plot>
                                            </div>
                                        </div>
                                    </b-tab>
                                    <b-tab title="Functional data by trait">
                                        <div>
                                            <select v-model="$parent.functionalTrait">
                                                <option :value="null">Select a trait</option>
                                                <option v-for="oField in Object.values($parent.fieldsObject)
                                                .filter(f => !f.isNumeric && !f.noSidebar)"
                                                :value="oField.key">
                                                    {{ oField.key }}
                                                </option>
                                            </select>
                                            <div class="vlnPlots row" v-if="$parent.vlnConditions.length > 0">
                                                <div v-for="(condition, index) in 
                                                    $parent.vlnConditions.filter(c => c.startsWith('INS'))"
                                                    class="vlnPlot col-md-4">
                                                    <functional-violin-plot 
                                                        :data="$parent.filteredAucData"
                                                        :index="index"
                                                        :xField="$parent.violinTrait"
                                                        :xLabel="$parent.violinTrait"
                                                        :yField="condition"
                                                    >
                                                    </functional-violin-plot>
                                                </div>
                                                <div v-for="(condition, index) in 
                                                    $parent.vlnConditions.filter(c => c.startsWith('GCG'))"
                                                    class="vlnPlot col-md-4">
                                                    <functional-violin-plot 
                                                        :data="$parent.filteredAucData"
                                                        :index="index"
                                                        :xField="$parent.violinTrait"
                                                        :xLabel="$parent.violinTrait"
                                                        :yField="condition"
                                                    >
                                                    </functional-violin-plot>
                                                </div>
                                            </div>
                                        </div>
                                    </b-tab>
                                </b-tabs>
                                
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
    border: none !important;
}
.toc-item {
    padding: 10px;
    margin-bottom: 5px;
    background-color: #efefef;
    border: 1px solid #dddddd;
    border-radius: 5px;
}
#stats {
    margin-bottom: 40px;
    vertical-align: baseline;
}
#stats-header {
    font-size: 2rem;
    margin-right: 10px;
}
.line-plot{
    align-items: center;
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
.filter-tab-liner {
    padding-left: 50px;
    padding-top: 20px;
}
.filter-tab-liner textarea {
    width: 80%;
}
.donor-search-button button {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
    border-radius: 0.2rem;
    background-color: white;
    color: inherit;
    border: 1px solid;
}
.donor-search-button {
    text-align: right;
    padding-top: 10px;
    margin-right: 50px;
}
.line-plots {
    margin-top: 20px;
    margin-left: 20px;
}
div.line-plot:first-child {
    margin-top: 20px;
}
.side-panel-filters {
    border-right: 3px solid lightgray;
    overflow-y: scroll !important;
}
</style>
