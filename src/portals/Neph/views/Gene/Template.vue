<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <search-header-wrapper>
                <!-- Wrap page level searchs with "pageSearchParameters" div -->

                <div class="col filter-col-md">
                    <div class="label">Gene</div>
                    <gene-selectpicker
                        @onGeneChange="$store.dispatch('queryGeneName', $event)"
                    ></gene-selectpicker>
                </div>
            </search-header-wrapper>

            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">Gene</div>
                    <div class="col-md-12 gene-page-header-body">
                        <div>
                            <span>{{ $store.state.geneName }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Variants in NephKP database</h4>
                    <documentation
                        name="variantsearch.subheader"
                        group="neph"
                    ></documentation>
                    <variant-search
                        :gene="$store.state.geneName"
                    ></variant-search>
                </div>
            </div>
            <!-- <div class="card mdkp-card">
                <div class="card-body">
                    <div v-if="$parent.dbReference">
                        <h4 class="card-title">
                            Common variant gene-level associations for
                            {{ $store.state.geneName }}
                            <tooltip-documentation
                                name="gene.associations.tooltip.hover"
                                :content-fill="$parent.documentationMap"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>

                        <criterion-function-group>
                            <filter-enumeration-control
                                :field="'phenotype'"
                                :options="
                                    $store.state.geneassociations.data.map(
                                        (association) => association.phenotype
                                    )
                                "
                                :labelFormatter="
                                    (phenotype) =>
                                        !!$store.state.bioPortal.phenotypeMap[
                                            phenotype
                                        ]
                                            ? $store.state.bioPortal
                                                  .phenotypeMap[phenotype]
                                                  .description
                                            : phenotype
                                "
                            >
                                <div class="label">Phenotypes</div>
                            </filter-enumeration-control>
                            <filter-pvalue-control :field="'pValue'">
                                <div class="label">P-Value (&le;)</div>
                            </filter-pvalue-control>

                            <template slot="filtered" slot-scope="{ filter }">
                                <locuszoom
                                    v-if="$store.state.gene"
                                    ref="locuszoom"
                                    :filter="filter"
                                    :refSeq="false"
                                    :loglog="true"
                                >
                                    <lz-phewas-panel
                                        v-if="$store.state.geneName"
                                        :id="$store.state.geneName"
                                        :type="'gene'"
                                        :phenotypeMap="
                                            $store.state.bioPortal.phenotypeMap
                                        "
                                    ></lz-phewas-panel>
                                </locuszoom>
                                <unauthorized-message
                                    :restricted="
                                        $store.state.varassociations.restricted
                                    "
                                ></unauthorized-message>
                                <gene-associations-table
                                    v-if="$store.state.gene.data.length > 0"
                                    :gene="$store.state.gene.data[0]"
                                    :associations="
                                        $store.state.geneassociations.data
                                    "
                                    :phenotypeMap="
                                        $store.state.bioPortal.phenotypeMap
                                    "
                                    :filter="filter"
                                ></gene-associations-table>
                            </template>
                        </criterion-function-group>
                    </div>
                </div>
            </div> -->

            <div class="card mdkp-card">
                <!-- <div class="card-body">
                    <h4>{{`Functional associations for ${$store.state.geneName}`}}</h4>
                    <h6>With terms from GO, Reactome, KEGG and Wikipathways.</h6><br>
                    <documentation name="gene.translator.dashboard"></documentation>
                    <translator-results-dashboard
                        :queries="$parent.queries"
                    ></translator-results-dashboard>
                </div>-->
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
                                <div class="col-md-4">
                                    <h4>Info</h4>
                                    <div
                                        v-if="$parent.geneNames"
                                        class="alternative-names"
                                    >
                                        <strong
                                            >Alternative names:&nbsp;</strong
                                        >
                                        <span
                                            v-for="gene in $parent.alternateNames"
                                            v-if="gene.source == 'alias'"
                                            :key="gene.name"
                                            >{{ gene.name }}</span
                                        >&nbsp;
                                    </div>
                                    <div v-if="$parent.regionText">
                                        <strong>Coding sequence:</strong>
                                        {{ $parent.regionText }}
                                    </div>
                                    <div v-if="$parent.region">
                                        <strong>Length:</strong>
                                        {{
                                            " " +
                                            (
                                                $parent.region.end -
                                                $parent.region.start
                                            ).toLocaleString()
                                        }}
                                        bp
                                    </div>
                                    <div><strong>Assembly:</strong> GRCh37</div>
                                    <div>
                                        <strong>Gene sources:</strong>
                                        <span
                                            >&nbsp;Ensembl, HGNC, UCSC, RGD,
                                            MGD</span
                                        >
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
                            v-if="$parent.accession.length > 0"
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
                                :href="
                                    $parent.externalResources[gene.source]
                                        .link + $parent.symbolName
                                "
                                target="_blank"
                                :title="
                                    $parent.externalResources[gene.source].title
                                "
                                >{{ gene.source.toUpperCase() }}</a
                            >
                        </div>

                        <div
                            class="gene-with-signal none"
                            v-if="$parent.ensemblElement"
                        >
                            <a
                                :href="
                                    $parent.externalResources['opentargets']
                                        .link + $parent.ensemblElement.name
                                "
                                target="_blank"
                                title="Open Targets - Genetics"
                                >{{
                                    `Open Targets - Genetics`.toUpperCase()
                                }}</a
                            >
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>

<style scoped>
div >>> #pageSearchHeaderContent.hidden {
    display: block;
}
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
/* color bar plot */
.arrow-up {
    width: 0;
    /*height: 40px;*/
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid #de202c;
    animation: moveright 1s alternate 1s;
    margin-left: auto;
    margin-right: auto;
}
.arrow-side {
    width: 0;
    /*height: 40px;*/
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
/* your colors */
.legend .superawesome {
    background-color: #e7edf7;
}
.legend .awesome {
    background-color: #fef8dc;
}
</style>
