<template>
    <div class="pkb-wrapper f-col fill-height">
        <!-- NAV -->
        <pkb-header></pkb-header>
        <!-- BODY -->
        <div class="pkb-body">
            <div class="card mdkp-card">
                <div class="card-body functional-page">
                    <div id="stats">
                        <span id="stats-header">Islet perifusion data explorer</span>
                        <span v-if="$parent.filteredMetadata.length > 0">
                            ({{ $parent.donorsWithData.length }} donors with available functional data)</span>
                        <div v-html="$parent.about"></div>
                    </div>
                    <div v-if="$parent.filteredMetadata.length > 0">
                        <div class="row">
                            <div class="col-md-3 side-panel-filters">
                                <b-tabs>
                                    <b-tab title="Filter donor data"
                                        @click="$parent.useSelectedDonors(false)">
                                        <criterion-function-group
                                            @update:filter-list="list => $parent.updateFilterList(list)">
                                            <filter-slider v-for="oField in Object.values($parent.fieldsObject)
                                                .filter(f => f.isNumeric && !f.noSidebar)"
                                                :field="oField.key"
                                                :values="$parent.filteredMetadata.map(m => m[oField.key])"
                                                :customStep="!!oField.customStep ? oField.customStep : 0"
                                                :presets="$parent.presets">
                                            </filter-slider>
                                            <filter-radio v-for="oField in Object.values($parent.fieldsObject)
                                                .filter(f => !f.isNumeric && !f.noSidebar)"
                                                :field="oField.key"
                                                :label="oField.label"
                                                :options="$parent.filteredMetadata.map(m => m[oField.key])"
                                                :presets="$parent.presets">
                                            </filter-radio>
                                            <div class="advanced-filters" :hidden="!$parent.showAdvanced">
                                                <filter-slider v-for="advField in Object.values($parent.advancedFields)
                                                    .filter(f => f.isNumeric)"
                                                    :field="advField.key"
                                                    :values="$parent.filteredMetadata.map(m => m[advField.key])"
                                                    :customStep="!!advField.customStep ? advField.customStep : 0"
                                                    :presets="$parent.presets">
                                                </filter-slider>
                                                <filter-radio v-for="advField in Object.values($parent.advancedFields)
                                                    .filter(f => !f.isNumeric)"
                                                    :field="advField.key"
                                                    :options="$parent.filteredMetadata.map(m => m[advField.key])"
                                                    :presets="$parent.presets">
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
                                    <b-tab title="Perifusion traces" class="line-plot-tab">
                                        <div class="line-plots">
                                            {{ $parent.filteredAccession.length }} donors meeting filter criteria
                                            <button class="btn btn-secondary btn-sm" @click="$parent.copyResults()">
                                                Copy link to results
                                            </button>
                                            <div class="radio-labels">
                                                <label>
                                                    <input type="radio"
                                                        name="showContent"
                                                        :value="false"
                                                        v-model="$parent.showContent"/>
                                                    View by IEQ
                                                </label>
                                                <label>
                                                    <input type="radio"
                                                        name="showContent"
                                                        :value="true"
                                                        v-model="$parent.showContent"/>
                                                    View by content
                                                </label>
                                            </div>
                                            <div class="insulin-plot line-plot">
                                                <time-series-line-plot v-if="$parent.insTimepoints.length > 0"
                                                    :plotData="$parent.resultsIns"
                                                    plotTitle="Islet Insulin Secretion"
                                                    :donors="$parent.filteredAccession"
                                                    :plotId="`insulin_ieq`"
                                                    :timepoints="$parent.insTimepoints"
                                                    :yAxisLabel=" $parent.showContent
                                                        ? '% content min'
                                                        : 'ng/100IEQ/min'">
                                                </time-series-line-plot>
                                            </div>
                                            <div class="glucagon-plot line-plot">
                                                <time-series-line-plot v-if="$parent.gcgTimepoints.length > 0"
                                                    :plotData="$parent.resultsGcg"
                                                    plotTitle="Islet Glucagon Secretion"
                                                    :donors="$parent.filteredAccession"
                                                    :plotId="`glucagon_ieq`"
                                                    :timepoints="$parent.gcgTimepoints"
                                                    :yAxisLabel="$parent.showContent 
                                                        ? '% content min' 
                                                        : 'pg/100IEQ/min'">
                                                </time-series-line-plot>
                                            </div>
                                        </div>
                                    </b-tab>
                                    <b-tab title="Functional data by trait">
                                        <div>
                                            <div class="functional-select">
                                                <select 
                                                    v-model="$parent.functionalTrait">
                                                    <option :value="null">Select a trait</option>
                                                    <option v-for="oField in Object.values($parent.fieldsObject)
                                                    .filter(f => !f.isNumeric && !f.noSidebar)"
                                                    :value="oField.key">
                                                        {{ oField.label || oField.key }}
                                                    </option>
                                                </select>
                                            </div>
                                            <div v-if="!!$parent.functionalTrait" class="color-legend">
                                                <div v-for="item in Object.keys($parent.functionalColorMap)">
                                                    <div class="color-legend-block" :style="`background-color: ${$parent.functionalColorMap[item]};`"></div>
                                                    {{ item }}
                                                </div>
                                            </div>
                                            <div v-if="$parent.vlnConditions.length > 0">
                                                <strong>Insulin secretion traits ({{ $parent.filteredAccession.length }} / {{ $parent.filteredMetadata.length }} donors)</strong>
                                            <div class="vlnPlots row">
                                                <div v-for="(condition, index) in 
                                                    $parent.vlnConditions.filter(c => c.startsWith('INS'))"
                                                    class="vlnPlot col-md-4"
                                                    v-if="$parent.functionalTrait !== null">
                                                    <functional-violin-plot
                                                        v-if="$parent.filteredAucData.length > 0"
                                                        :data="$parent.filteredAucData"
                                                        :xField="$parent.functionalTrait"
                                                        :xLabel="$parent.functionalTrait"
                                                        :yField="condition"
                                                    >
                                                    </functional-violin-plot>
                                                </div>
                                            </div>
                                            <strong>Glucagon secretion traits ({{ $parent.filteredAccession.length }} / {{ $parent.filteredMetadata.length }} donors)</strong>
                                            <div class="vlnPlots row" v-if="$parent.vlnConditions.length > 0">
                                                <div v-for="(condition, index) in 
                                                    $parent.vlnConditions.filter(c => c.startsWith('GCG'))"
                                                    class="vlnPlot col-md-4"
                                                    v-if="$parent.functionalTrait !== null">
                                                    <functional-violin-plot
                                                        v-if="$parent.filteredAucData.length > 0"
                                                        :data="$parent.filteredAucData"
                                                        :xField="$parent.functionalTrait"
                                                        :xLabel="$parent.functionalTrait"
                                                        :yField="condition"
                                                    >
                                                    </functional-violin-plot>
                                                </div>
                                            </div>
                                        </div>
                                        </div>
                                    </b-tab>
                                    <b-tab title="Functional trait associations"
                                        @click="$parent.populateAssoc()"
                                    >
                                        <div class="functional-select">
                                            <select 
                                                v-model="$parent.functionalAssocTrait">
                                                <option :value="null">Select a trait</option>
                                                <option v-for="trait in $parent.assocTraits"
                                                    :value="trait">
                                                    {{ $parent.replaceFieldNames(trait.replaceAll("-", " "))}}
                                                </option>
                                            </select>
                                        </div>
                                        <div id="functional-assoc-table">
                                            <b-table
                                                small
                                                :fields="$parent.functionalAssocFields"
                                                :items="$parent.assocTraitData"
                                                :sortable="true"
                                            >
                                            <template #cell(predictor)=r>
                                                {{ $parent.replaceFieldNames(r.item.predictor) }}
                                            </template>
                                            <template #cell(term)=r>
                                                {{ $parent.replaceFieldNames(r.item.term) }}
                                            </template>
                                            <template #cell(covariates)="r">
                                                <button class="btn btn-sm btn-secondary"
                                                    @click="r.toggleDetails()">
                                                    {{ r.detailsShowing ? "Hide" : "Show"}}
                                                </button>
                                            </template>
                                            <template #row-details="r">
                                                <div 
                                                    style="background-color: #efefef;text-align: right;">
                                                    {{ $parent.replaceFieldNames(
                                                        r.item.covariates.replaceAll(";", ", ")) }}
                                                </div>
                                            </template>
                                            </b-table>
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
                            :fields="$parent.tableFields"
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
.line-plot-tab {
    background-color:  #efefef;
}
div.line-plot {
    margin: 10px;
    margin-top: 20px;
    padding: 5px;
    background-color: white;

}
.side-panel-filters {
    border-right: 3px solid lightgray;
    overflow-y: scroll !important;
}
.vln-plot, .vlnPlots {
    background-color:  #efefef !important;
}
.functional-select {
    margin-top: 10px;
    margin-bottom: 10px;
}
.radio-labels label {
    margin-right: 10px;
}
#functional-assoc-table {
    overflow-x: scroll;
}
.color-legend {
    background-color: #efefef;
    padding: 10px;
    width: fit-content;
    border-radius: 5px;
}
.color-legend-block {
    width: 10px;
    height: 10px;
    display: inline-block;
}
</style>
