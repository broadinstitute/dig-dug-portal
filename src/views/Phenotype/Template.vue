<template>
    <div>
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="gene-page-header card mdkp-card">
                <div class="row card-body">
                    <div class="col-md-12 gene-page-header-title">
                        Phenotype
                        <a
                            class="edit-btn"
                            v-on:click="
                                $parent.showHideElement('phenotypeSearchHolder')
                            "
                            >Set phenotype</a
                        >
                    </div>

                    <div class="col-md-12 gene-page-header-body">
                        <div
                            id="phenotypeSearchHolder"
                            class="gene-page-header-search-holder hidden"
                        >
                            <phenotype-selectpicker
                                v-if="$store.state.phenotype"
                                :phenotypes="$store.state.bioPortal.phenotypes"
                                :default-phenotype="
                                    $store.state.phenotype.description
                                "
                            ></phenotype-selectpicker>
                        </div>
                        <span v-if="$store.state.phenotype">{{
                            $store.state.phenotype.description
                        }}</span>
                    </div>
                </div>
            </div>

            <div v-if="$store.state.phenotype">
                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Genome-wide associations for
                            {{ $store.state.phenotype.description }}
                        </h4>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card" style="width: 95%; border: 0">
                                    <raw-img
                                        id="manhattanPlot"
                                        :src="$parent.manhattanPlot"
                                        alt="Manhattan Plot"
                                        :documentation="'phenotype.associationplots.manhattan'"
                                        :content-fill="
                                            $store.getters['documentationMap']
                                        "
                                    />
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card" style="width: 95%; border: 0">
                                    <raw-img
                                        id="qqPlot"
                                        :src="$parent.qqPlot"
                                        alt="QQ Plot"
                                        :documentation="'phenotype.associationplots.qq'"
                                        :content-fill="
                                            $store.getters['documentationMap']
                                        "
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Top
                            {{
                                $parent.intFormatter(
                                    $store.state.associations.data.length
                                )
                            }}
                            associations for
                            {{ $store.state.phenotype.description }}
                            <tooltip-documentation
                                name="phenotype.top1000.tooltip"
                                :content-fill="$parent.documentationMap"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>

                        <filter-group
                            v-model="$parent.associationsFilter"
                            :looseMatch="true"
                        >
                            <filter-enumeration-control
                                :field="'consequence'"
                                :options="
                                    $store.state.associations.data.map(
                                        (association) => association.consequence
                                    )
                                "
                            >
                                <div class="label">Consequence</div>
                            </filter-enumeration-control>
                            <filter-enumeration-control
                                :field="'nearest'"
                                :options="
                                    $store.state.associations.data.map(
                                        (association) => association.nearest[0]
                                    )
                                "
                            >
                                <div class="label">Closest Genes</div>
                            </filter-enumeration-control>

                            <filter-pvalue-control :field="'pValue'">
                                <div class="label">P-Value (&le;)</div>
                            </filter-pvalue-control>

                            <filter-effect-direction-control :field="'beta'">
                                <div class="label">Effect (+/-)</div>
                            </filter-effect-direction-control>
                        </filter-group>

                        <associations-table
                            :phenotypes="[$store.state.phenotype]"
                            :associations="$store.state.associations.data"
                            :filter="$parent.associationsFilter"
                            :per-page="10"
                        ></associations-table>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Top
                            {{
                                $parent.intFormatter(
                                    $store.state.genes.data.length
                                )
                            }}
                            genes associated with
                            {{ $store.state.phenotype.description }}
                            with P-Value &le; 1e-5
                            <tooltip-documentation
                                name="phenotype.genes.tooltip"
                                :content-fill="$parent.documentationMap"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>

                        <filter-group
                            v-model="$parent.geneFinderFilter"
                            :looseMatch="true"
                        >
                            <filter-enumeration-control
                                :field="'gene'"
                                :options="
                                    $store.state.genes.data.map(
                                        (gene) => gene.gene
                                    )
                                "
                            >
                                <div class="label">Gene</div>
                            </filter-enumeration-control>

                            <filter-pvalue-control :field="'pValue'">
                                <div class="label">P-Value (&le;)</div>
                            </filter-pvalue-control>
                        </filter-group>

                        <gene-finder-table
                            :phenotypes="[$store.state.phenotype.name]"
                            :phenotypeMap="$store.state.bioPortal.phenotypeMap"
                            :associations="$store.state.genes.data"
                            :per-page="10"
                            :filter="$parent.geneFinderFilter"
                            :showPlot="true"
                        ></gene-finder-table>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Datasets contributing to meta-analysis for
                            {{ $store.state.phenotype.description }}
                        </h4>
                        <documentation
                            name="pheno.assocdatasets.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

                        <filter-group
                            v-model="$parent.phenotypeFilter"
                            :looseMatch="true"
                        >
                            <filter-enumeration-control
                                :field="'tech'"
                                :options="
                                    $store.state.bioPortal.datasets.map(
                                        (dataset) => dataset.tech
                                    )
                                "
                            >
                                <div class="label">Technology</div>
                            </filter-enumeration-control>

                            <filter-enumeration-control
                                :field="'ancestry'"
                                :options="
                                    $store.state.bioPortal.datasets.map(
                                        (dataset) => dataset.ancestry
                                    )
                                "
                                :labelFormatter="$parent.ancestryFormatter"
                            >
                                <div class="label">Ancestry</div>
                            </filter-enumeration-control>
                        </filter-group>

                        <datasets-table
                            :datasets="$store.state.bioPortal.datasets"
                            :phenotype="$store.state.phenotype"
                            :filter="$parent.phenotypeFilter"
                        ></datasets-table>
                    </div>
                </div>

                <div class="card mdkp-card">
                    <div class="card-body">
                        <h4 class="card-title">
                            Globally enriched annotations for
                            {{ $store.state.phenotype.description }}
                            <tooltip-documentation
                                name="phenotype.annot.tooltip"
                                :content-fill="$parent.documentationMap"
                                :isHover="true"
                                :noIcon="false"
                            ></tooltip-documentation>
                        </h4>
                        <documentation
                            name="pheno.globalenrich.subheader"
                            :content-fill="$parent.documentationMap"
                        ></documentation>

                        <filter-group
                            v-model="$parent.annotationsFilter"
                            :looseMatch="true"
                        >
                            <filter-enumeration-control
                                :field="'annotation'"
                                :options="
                                    $store.state.annotations.data.map(
                                        (annotation) => annotation.annotation
                                    )
                                "
                            >
                                <div class="label">Annotations</div>
                            </filter-enumeration-control>

                            <filter-enumeration-control
                                :field="'method'"
                                :options="
                                    $store.state.annotations.data.map(
                                        (annotation) => annotation.method
                                    )
                                "
                            >
                                <div class="label">Methods</div>
                            </filter-enumeration-control>

                            <filter-enumeration-control
                                :field="'tissue'"
                                :options="
                                    $store.state.annotations.data.map(
                                        (annotation) => annotation.tissue
                                    )
                                "
                            >
                                <div class="label">Tissues</div>
                            </filter-enumeration-control>

                            <filter-enumeration-control
                                :field="'ancestry'"
                                :options="
                                    $store.state.annotations.data.map(
                                        (annotation) => annotation.ancestry
                                    )
                                "
                                :labelFormatter="$parent.ancestryFormatter"
                            >
                                <div class="label">Ancestry</div>
                            </filter-enumeration-control>

                            <filter-pvalue-control :field="'pValue'">
                                <div class="label">P-Value (&le;)</div>
                            </filter-pvalue-control>

                            <filter-greater-control :field="'fold'">
                                <div class="label">Fold (&ge;)</div>
                            </filter-greater-control>
                        </filter-group>

                        <enrichment-table
                            :phenotypes="[$store.state.phenotype]"
                            :annotations="$store.state.annotations.data"
                            :filter="$parent.annotationsFilter"
                            :per-page="10"
                        ></enrichment-table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
