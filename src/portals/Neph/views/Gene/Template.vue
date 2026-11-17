<template>
    <div>
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <div class="container-fluid mdkp-body">
            <search-header-wrapper>

                <div class="col filter-col-md">
                    <gene-selectpicker
                        @onGeneChange="$store.dispatch('queryGeneName', $event)"
                    ></gene-selectpicker>
                </div>
            </search-header-wrapper>

            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">Gene</div>
                    <div class="col-md-12 gene-page-header-body">
                        <div :key="$store.state.geneName">
                            <span>{{ $store.state.geneName }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div >
                        <h4 class="card-title">Variant Counts in BCH Aggregator</h4>
                        <p>To view information about cohorts in the BCH Aggregator, visit the <a href="research.html?pageid=bch_datasets_n127">dataset page</a></p>
                        <variant-search
                            :key="$store.state.geneName"
                            :gene="$store.state.geneName"
                        ></variant-search>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.dbReference">
                        <h4 class="card-title">
                            Rare variant gene-level associations for
                            {{ $store.state.geneName }}
                            <tooltip-documentation
                                name="gene.52k.tooltip.hover"
                                :content-fill="$parent.documentationMap"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>
                       
                        <gene-associations-masks
                            :associations="$store.state.associations52k.data"
                            :phenotypeMap="$store.state.HPOTerms"
                        ></gene-associations-masks> 
                        
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4>
                        {{
                            `Functional associations for ${$store.state.geneName}`
                        }}
                        <tooltip-documentation
                            name="gene.translator.tooltip.hover"
                            :content-fill="$parent.documentationMap"
                            :isHover="true"
                            :noIcon="false"
                        ></tooltip-documentation>
                    </h4>

                    <documentation
                        name="gene.translator.dashboard"
                        :content-fill="$parent.documentationMap"
                    ></documentation>
                    <b-tabs>
                        <b-tab title="Function">
                            <div class="card-body row">
                                <div class="col-md-8">
                                    <div v-if="$parent.geneFunction">
                                        <h4>
                                            Function
                                            <tooltip-documentation
                                                name="gene.function.tooltip.hover"
                                                :content-fill="
                                                    $parent.documentationMap
                                                "
                                                :isHover="true"
                                                :noIcon="false"
                                            ></tooltip-documentation>
                                        </h4>

                                        <div>{{ $parent.geneFunction }}</div>
                                    </div>
                                    <div v-else>
                                        <h5>Gene function not found</h5>
                                    </div>
                                </div>
                            </div>
                        </b-tab>
                        <b-tab title="Gene Ontology">
                            <translator-predicate-table
                                title="Gene Ontology (GO) Annotations"
                                :geneSymbol="$store.state.geneName"
                                :field="'go'"
                            ></translator-predicate-table>
                        </b-tab>
                        <b-tab title="Pathways">
                            <translator-predicate-table
                                title="Pathway Annotations (Reactome, KEGG, BioCarta, WikiPathways)"
                                :geneSymbol="$store.state.geneName"
                                :field="'pathway'"
                            ></translator-predicate-table>
                        </b-tab>
                        <b-tab title="Uniprot">
                            <div class="card-body row">
                                <div class="col-md-12">
                                    <div v-if="$parent.dbReference">
                                        <h4 class="card-title">
                                            UniProt cross-references
                                            <tooltip-documentation
                                                name="gene.xref.tooltip.hover"
                                                :content-fill="
                                                    $parent.documentationMap
                                                "
                                                :isHover="true"
                                                :noIcon="false"
                                            ></tooltip-documentation>
                                        </h4>

                                        <criterion-function-group
                                            :inclusive="true"
                                        >
                                            <filter-enumeration-control
                                                :field="'source'"
                                                :options="
                                                    $parent.dbReference.map(
                                                        (reference) =>
                                                            reference.source
                                                    )
                                                "
                                                :inclusive="false"
                                            >
                                                <div class="label">Sources</div>
                                            </filter-enumeration-control>
                                            <filter-enumeration-control
                                                :field="'moleculeType'"
                                                :options="
                                                    $parent.dbReference.map(
                                                        (reference) =>
                                                            reference.moleculeType
                                                    )
                                                "
                                                :inclusive="true"
                                            >
                                                <div class="label">
                                                    Molecule Type
                                                </div>
                                            </filter-enumeration-control>

                                            <template
                                                slot="filtered"
                                                slot-scope="{ filter }"
                                            >
                                                <uniprot-references-table
                                                    :references="
                                                        $parent.dbReference
                                                    "
                                                    :filter="filter"
                                                ></uniprot-references-table>
                                            </template>
                                        </criterion-function-group>
                                    </div>
                                </div>
                            </div>
                        </b-tab>
                    </b-tabs>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.geneNames">
                        <h4 class="card-title">External resources</h4>
                        <div
                            v-if="$parent.accession && $parent.accession.length > 0"
                            class="gene-with-signal none"
                        >
                            <a
                                :href="
                                    $parent.externalResources['uniprot'].link +
                                    $parent.accession[0]
                                "
                                target="_blank"
                                :title="
                                    $parent.externalResources['uniprot'].title
                                "
                                >UNIPROT</a
                            >
                        </div>
                        <div
                            v-for="gene in $parent.alternateNames"
                            v-if="gene.source != 'alias'"
                            class="gene-with-signal none"
                            :key="gene.name"
                        >
                            <a
                                v-if="gene.source != 'ucsc'"
                                :href="
                                    $parent.externalResources[gene.source]
                                        .link + gene.name
                                "
                                target="_blank"
                                :title="
                                    $parent.externalResources[gene.source].title
                                "
                                >{{ gene.source.toUpperCase() }}</a
                            >
                            <a
                                v-else
                                :href="$parent.externalResources[gene.source].link + $parent.symbolName"
                                target="_blank"
                                :title="
                                    $parent.externalResources[gene.source].title
                                "
                                >{{ gene.source.toUpperCase() }}</a
                            >
                        </div>
                    </div>
                </div>
            </div> 
        </div> 

        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style>
.color-bar-plot-wrapper {
    width: calc(100% - 32px);
    margin-left: 16px;
}

.color-bars-wrapper {
    background-color: #eee;
    font-weight: 500;
    font-size: 13px;
}

.color-bar-plot-wrapper .each-bar-section {
    width: calc(100% / 7);
    text-align: center;
}

* {
    box-sizing: border-box;
}
.container {
    display: flex;
    justify-content: center;
}
.center {
    padding: 10px;
}
.arrow-up {
    width: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid #de202c;
    animation: moveright 1s alternate 1s;
    margin-left: auto;
    margin-right: auto;
}
.arrow-side {
    width: 0;
    border-left: 10px solid transparent;
    border-bottom: 0px solid transparent;
    border-top: 10px solid black;
    animation: moveright 1s alternate 1s;
    margin-left: auto;
    margin-right: auto;
}

.arrow {
    border: solid black;
    border-width: 0 3px 3px 0;
    display: inline-block;
    padding: 3px;
}

.right {
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
}

#combinedVariation .variationCausal {
    background-color: #3fb54a;
    font-weight: bold;
}
#combinedVariation .variationStrong {
    background-color: #4ebf59;
    font-weight: bold;
}
#combinedVariation .variationModerate {
    background-color: #5ecc69;
    font-weight: bold;
}
#combinedVariation .variationPossible {
    background-color: #71d97b;
    font-weight: bold;
}
#combinedVariation .variationPotential {
    background-color: #7ee087;
    font-weight: bold;
}
#combinedVariation .variationWeak {
    background-color: #91eb9a;
    font-weight: bold;
}
#combinedVariation .variationEquivocal {
    background-color: #a1f0a9;
    font-weight: bold;
}

#combinedVariation .variationNoEvidence {
    background-color: #c4edc8;
    font-weight: bold;
}
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
.legend .superawesome {
    background-color: #e7edf7;
}
.legend .awesome {
    background-color: #fef8dc;
}
</style>
