<template>
    <div id="gait">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card">
                <div class="card-body temporary-card">
                    <documentation
                        name="ncgait.header.info"
                        :contentMap="$parent.contentMap"
                    >
                    </documentation>
                </div>
            </div>
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h2>Non-Coding Genetic Association Interactive Tool</h2>

                        <documentation
                            style="margin-top: 20px"
                            name="tools.ncgait.subheader"
                            :contentMap="$parent.contentMap"
                        ></documentation>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">
                        Association statistics for selected variants
                    </h4>

                    <div class="accordion" role="tablist">
                        <b-card no-body class="mb-1">
                            <b-card-header
                                header-tag="header"
                                class="p-1"
                                role="tab"
                            >
                                <b-button
                                    v-b-toggle.accordion-1
                                    block
                                    variant="outline-primary"
                                    >Criteria
                                    <div class="criteria">
                                        <b-badge
                                            v-if="
                                                $parent.selectedGeneOrRegion
                                                    .length > 0
                                            "
                                            class="filter-pill-geneORregion"
                                        >
                                            {{
                                                $parent.selectedGeneOrRegion[0]
                                            }}
                                        </b-badge>

                                        <b-badge
                                            v-if="
                                                $parent.selectedDataset.length >
                                                0
                                            "
                                            class="filter-pill-dataset"
                                        >
                                            {{ $parent.selectedDataset[0] }}
                                        </b-badge>
                                        <template
                                            v-if="
                                                $parent.selectedPhenotypes
                                                    .length > 0
                                            "
                                        >
                                            <b-badge
                                                v-for="phenotype in $parent.selectedPhenotypes"
                                                :key="phenotype"
                                                class="filter-pill-phenotype"
                                            >
                                                {{
                                                    !!$store.state.bioPortal
                                                        .phenotypeMap[phenotype]
                                                        ? $store.state.bioPortal
                                                              .phenotypeMap[
                                                              phenotype
                                                          ].description
                                                        : phenotype
                                                }}
                                            </b-badge>
                                        </template>
                                    </div>
                                </b-button>
                            </b-card-header>
                            <b-collapse
                                id="accordion-1"
                                visible
                                accordion="my-accordion"
                                role="tabpanel"
                            >
                                <b-card-body>
                                    <transition name="fade"
                                        ><b-alert
                                            v-if="
                                                $parent.selectedGeneOrRegion
                                                    .length === 0 ||
                                                $parent
                                                    .selectedGeneOrRegion[0] ===
                                                    undefined
                                            "
                                            show
                                            >Please select a gene or
                                            region.</b-alert
                                        >
                                        <b-alert
                                            v-else-if="
                                                $parent.selectedDataset
                                                    .length == 0 ||
                                                $parent.selectedDataset[0] ===
                                                    undefined
                                            "
                                            show
                                            >Please select a dataset.</b-alert
                                        >
                                        <b-alert
                                            v-else-if="
                                                $parent.selectedPhenotypes
                                                    .length == 0
                                            "
                                            show
                                            >Please select one or more
                                            phenotypes.</b-alert
                                        >
                                    </transition>
                                    <criterion-list-group
                                        v-model="$parent.searchCriteria"
                                        :header="'Search Criteria'"
                                    >
                                        <!--<filter-enumeration-control
											ref="gene"
											:field="'gene'"
											placeholder="Select a gene ..."
											:options="$parent.matchingGenes"
											@input-change="
												$parent.lookupGenes($event)
											"
											@item-select="
												$parent.EventBus.emit('select')
											"
											@change="
												$parent.eventBus.emit('change')
											"
											@hit="$parent.EventBus.emit('hit')"
											@keyup-enter="
												$parent.EventBus.emit('enter')
											"
											@input="
												$parent.EventBus.emit('input')
											"
										>-->

                                        <filter-enumeration-control
                                            ref="geneORregion"
                                            :field="'geneORregion'"
                                            placeholder="Select a gene or input a region ..."
                                            :options="$parent.matchingGenes"
                                            @input-change="
                                                $parent.lookupGenes($event)
                                            "
                                            @keydown.enter.native="
                                                $parent.feedRegion($event)
                                            "
                                        >
                                            <div class="label">
                                                Gene or Region (chr:start-end)
                                            </div>
                                        </filter-enumeration-control>
                                        <!--
										<div
											class="col divider"
											style="background: none"
										>
											<span class="or-text">or</span>
										</div>
										<filter-basic-control
											ref="region"
											color="primary"
											:field="'region'"
											placeholder="Enter a region (chr:start-stop)"
										>
											<div class="label">Region</div>
										</filter-basic-control>-->
                                        <!-- <autocomplete
                                            :placeholder="'Search'"
                                            :matches="$parent.matchingGenes"
                                            :match-key="null"
                                            @input-change="
                                                $parent.lookupGenes($event)
                                            "
                                            @keyup-enter="
                                                $parent.exploreRegionOrVariant(
                                                    $event
                                                )
                                            "
                                        ></autocomplete>

										<b-col class="divider"></b-col>-->

                                        <filter-enumeration-control
                                            ref="dataset"
                                            :field="'dataset'"
                                            placeholder="Select a dataset ..."
                                            :options="
                                                $parent.datasets.map(
                                                    (v) => v.value
                                                )
                                            "
                                            :label-formatter="
                                                (v) =>
                                                    $parent.datasets.find(
                                                        (o) => o.value === v
                                                    ).text
                                            "
                                            ><div class="label">
                                                Dataset
                                            </div></filter-enumeration-control
                                        >
                                        <filter-enumeration-control
                                            ref="phenotype"
                                            :field="'phenotype'"
                                            placeholder="Select one or more phenotypes ..."
                                            :disable-sort="true"
                                            :multiple="true"
                                            :options="
                                                $parent.selectedDataset == '52k'
                                                    ? $store.state.ldServer.phenotypes.map(
                                                          (phenotype) =>
                                                              phenotype.name
                                                      )
                                                    : $parent.topmedDatasets
                                            "
                                            :label-formatter="
                                                (phenotype) =>
                                                    !!$store.state.bioPortal
                                                        .phenotypeMap[phenotype]
                                                        ? $store.state.bioPortal
                                                              .phenotypeMap[
                                                              phenotype
                                                          ].description
                                                        : phenotype
                                            "
                                        >
                                            <div class="label">Phenotypes</div>
                                        </filter-enumeration-control>
                                    </criterion-list-group>
                                    <!-- <div class="accordion" role="tablist">
                        <b-card no-body class="mb-1">
                            <b-card-header
                                header-tag="header"
                                class="p-1"
                                role="tab"
                            >
                                <b-button
                                    v-b-toggle.accordion-1
                                    block
                                    variant="outline-primary"
                                    >Criteria
                                    <div class="criteria">
                                        <b-badge
                                            v-if="
                                                $parent.selectedGene.length > 0
                                            "
                                            class="filter-pill-gene"
                                        >
                                            {{ $parent.selectedGene[0] }}
                                        </b-badge>
                                        <b-badge
                                            v-if="
                                                $parent.selectedDataset.length >
                                                0
                                            "
                                            class="filter-pill-dataset"
                                        >
                                            {{ $parent.selectedDataset[0] }}
                                        </b-badge>
                                        <template
                                            v-if="
                                                $parent.selectedPhenotypes
                                                    .length > 0
                                            "
                                        >
                                            <b-badge
                                                v-for="phenotype in $parent.selectedPhenotypes"
                                                :key="phenotype"
                                                class="filter-pill-phenotype"
                                            >
                                                {{
                                                    !!$store.state.bioPortal
                                                        .phenotypeMap[phenotype]
                                                        ? $store.state.bioPortal
                                                              .phenotypeMap[
                                                              phenotype
                                                          ].description
                                                        : phenotype
                                                }}
                                            </b-badge>
                                        </template>
                                    </div>
                                </b-button>
                            </b-card-header>
                            <b-collapse
                                id="accordion-1"
                                visible
                                accordion="my-accordion"
                                role="tabpanel"
                            >
                                <b-card-body>
                                    <transition name="fade"
                                        ><b-alert
                                            v-if="
                                                $parent.selectedGene.length ==
                                                    0 ||
                                                $parent.selectedGene[0] ===
                                                    undefined
                                            "
                                            show
                                            >Please select a gene.</b-alert
                                        >
                                        <b-alert
                                            v-else-if="
                                                $parent.selectedDataset
                                                    .length == 0 ||
                                                $parent.selectedDataset[0] ===
                                                    undefined
                                            "
                                            show
                                            >Please select a dataset.</b-alert
                                        >
                                        <b-alert
                                            v-else-if="
                                                $parent.selectedPhenotypes
                                                    .length == 0
                                            "
                                            show
                                            >Please select one or more
                                            phenotypes.</b-alert
                                        >
                                    </transition>
                                    <criterion-list-group
                                        v-model="$parent.searchCriteria"
                                        :header="'Search Criteria'"
                                    >
                                        <filter-enumeration-control
                                            ref="gene"
                                            :field="'gene'"
                                            placeholder="Select a gene ..."
                                            :options="$parent.matchingGenes"
                                            @input-change="
                                                $parent.lookupGenes($event)
                                            "
                                        >
                                            <div class="label">Gene</div>
                                        </filter-enumeration-control>
                                        <b-col class="divider"></b-col>
                                        <filter-enumeration-control
                                            ref="dataset"
                                            :field="'dataset'"
                                            placeholder="Select a dataset ..."
                                            :options="
                                                $parent.datasets.map(
                                                    (v) => v.value
                                                )
                                            "
                                            :label-formatter="
                                                (v) =>
                                                    $parent.datasets.find(
                                                        (o) => o.value === v
                                                    ).text
                                            "
                                            ><div class="label">
                                                Dataset
                                            </div></filter-enumeration-control
                                        >
                                        <filter-enumeration-control
                                            ref="phenotype"
                                            :field="'phenotype'"
                                            placeholder="Select one or more phenotypes ..."
                                            :disable-sort="true"
                                            :multiple="true"
                                            :options="
                                                $parent.selectedDataset == '52k'
                                                    ? $store.state.ldServer.phenotypes.map(
                                                          (phenotype) =>
                                                              phenotype.name
                                                      )
                                                    : $parent.topmedDatasets
                                            "
                                            :label-formatter="
                                                (phenotype) =>
                                                    !!$store.state.bioPortal
                                                        .phenotypeMap[phenotype]
                                                        ? $store.state.bioPortal
                                                              .phenotypeMap[
                                                              phenotype
                                                          ].description
                                                        : phenotype
                                            "
                                        >
                                            <div class="label">Phenotypes</div>
                                        </filter-enumeration-control>
                                    </criterion-list-group> -->

                                    <div class="function">
                                        <b-button
                                            variant="primary"
                                            :disabled="
                                                $parent.selectedGeneOrRegion
                                                    .length === 0 ||
                                                $parent.selectedDataset
                                                    .length === 0 ||
                                                $parent.selectedPhenotypes
                                                    .length === 0
                                            "
                                            @click="$parent.searchAnnotations"
                                            >Search Annotations</b-button
                                        >
                                    </div>
                                </b-card-body>
                            </b-collapse>
                        </b-card>

                        <b-card no-body class="mb-1">
                            <b-card-header
                                header-tag="header"
                                class="p-1"
                                role="tab"
                            >
                                <b-button
                                    v-b-toggle.accordion-2
                                    block
                                    :variant="
                                        $parent.criteriaChanged &&
                                        $parent.tableData.length > 0
                                            ? 'outline-warning'
                                            : 'outline-primary'
                                    "
                                    >Annotations and Tissues
                                    <div class="criteria">
                                        <template
                                            v-if="
                                                $parent.selectedAnnotations
                                                    .length > 0
                                            "
                                        >
                                            <b-badge
                                                v-for="test in $parent.selectedAnnotations"
                                                :key="test"
                                                class="filter-pill-annotation"
                                            >
                                                {{ test }}
                                            </b-badge>
                                        </template>
                                        <template
                                            v-if="
                                                $parent.selectedTissues.length >
                                                0
                                            "
                                        >
                                            <b-badge
                                                v-for="test in $parent.selectedTissues"
                                                :key="test"
                                                class="filter-pill-tissue"
                                            >
                                                {{ test }}
                                            </b-badge>
                                        </template>
                                    </div></b-button
                                >
                            </b-card-header>
                            <b-collapse
                                id="accordion-2"
                                v-model="$parent.showAnnotations"
                                accordion="my-accordion"
                                role="tabpanel"
                            >
                                <b-card-body>
                                    <b-skeleton-wrapper
                                        :loading="$parent.loadingAnnotations"
                                    >
                                        <template #loading>
                                            <b-skeleton-table
                                                :rows="3"
                                                :columns="5"
                                                :table-props="{
                                                    bordered: true,
                                                    striped: true,
                                                }"
                                            ></b-skeleton-table>
                                        </template>
                                        <b-alert
                                            v-if="
                                                $parent.tableData.length > 0 &&
                                                $parent.criteriaChanged
                                            "
                                            show
                                            variant="warning"
                                            ><b-icon
                                                icon="exclamation-triangle"
                                            ></b-icon>
                                            Search criteria changed. Run
                                            <b-button
                                                v-b-toggle.accordion-1
                                                variant="outline-primary"
                                                size="sm"
                                                >Search Annotations</b-button
                                            >

                                            again to update annotations.
                                        </b-alert>
                                        <b-card
                                            class="text-center filter-tests"
                                        >
                                            <research-annotations-plot
                                                :region="
                                                    $parent.searchRegionString
                                                "
                                                :phenotype="
                                                    $parent.selectedPhenotypes
                                                "
                                                :render-config="{
                                                    'annotations server':
                                                        'KP BioIndex',
                                                    'phenotype parameter':
                                                        'phenotype',
                                                    ancestry: 'Mixed',
                                                    'overlapping regions':
                                                        'true',
                                                }"
                                                :plot-margin="
                                                    $parent.plotMargin
                                                "
                                                :compare-group-colors="
                                                    $parent.colors.bold
                                                "
                                                :data-comparison="null"
                                                :pkg-data="$store.state.pkgData"
                                                :pkg-data-selected="
                                                    $store.state.pkgDataSelected
                                                "
                                                :region-zoom="0"
                                                :region-view-area="0"
                                                :utils="$parent.utilsBox"
                                            ></research-annotations-plot>
                                            <!-- {{
                                                $store.state.pkgData[
                                                    "overlappingRegions"
                                                ]
                                            }} -->
                                            <div
                                                v-if="
                                                    $store.state.pkgData[
                                                        'overlappingRegions'
                                                    ] &&
                                                    Object.keys(
                                                        $store.state.pkgData[
                                                            'overlappingRegions'
                                                        ]
                                                    ).length !== 0
                                                "
                                                class="filtering-ui-wrapper add-content"
                                                style="
                                                    width: 100%;
                                                    padding: 0 10px;
                                                    text-align: left;
                                                "
                                            >
                                                <div
                                                    class="filtering-ui-content"
                                                >
                                                    <div
                                                        class="col"
                                                        style="padding: 2px"
                                                    >
                                                        <div
                                                            class="label"
                                                            style="
                                                                display: inline-block;
                                                                margin-right: 10px;
                                                            "
                                                        >
                                                            Search selected
                                                            overlapping regions
                                                            by
                                                        </div>
                                                        <select
                                                            v-model="
                                                                $parent.selectedRegionType
                                                            "
                                                            class="custom-select"
                                                        >
                                                            <option value="or">
                                                                Union (OR)
                                                            </option>
                                                            <option value="and">
                                                                Intersection
                                                                (AND)
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="function">
                                                <b-button
                                                    variant="primary"
                                                    :disabled="
                                                        !$store.state.pkgData.hasOwnProperty(
                                                            'overlappingRegions'
                                                        ) ||
                                                        $store.state.pkgData[
                                                            'overlappingRegions'
                                                        ].length === 0
                                                    "
                                                    @click="
                                                        $parent.searchVariants
                                                    "
                                                    >Search Variants</b-button
                                                >
                                            </div>

                                            <b-alert
                                                v-if="$parent.noVariants"
                                                show
                                                variant="warning"
                                                ><b-icon
                                                    icon="exclamation-triangle"
                                                ></b-icon>
                                                No overlapping regions found for
                                                selected criteria. Please try
                                                again with different options.
                                            </b-alert>
                                        </b-card>
                                    </b-skeleton-wrapper>
                                </b-card-body>
                            </b-collapse>
                        </b-card>

                        <b-card no-body class="mb-1">
                            <b-card-header
                                header-tag="header"
                                class="p-1"
                                role="tab"
                            >
                                <b-button
                                    v-b-toggle.accordion-3
                                    block
                                    :variant="
                                        $parent.criteriaChanged &&
                                        $parent.tableData.length > 0
                                            ? 'outline-warning'
                                            : 'outline-primary'
                                    "
                                    >Variants
                                    <div class="criteria">
                                        <template
                                            v-if="
                                                $parent.selectedTests.length > 0
                                            "
                                        >
                                            <b-badge
                                                v-for="test in $parent.selectedTests"
                                                :key="test"
                                                class="filter-pill-test"
                                            >
                                                {{
                                                    $parent.testMethods.find(
                                                        (o) => o.value === test
                                                    ).text
                                                }}
                                            </b-badge>
                                        </template>
                                    </div></b-button
                                >
                            </b-card-header>
                            <div
                                v-if="
                                    !!$parent.isAccordionVisible('accordion-3')
                                "
                            >
                                <research-region-plot
                                    v-if="
                                        $parent.associationsData != null &&
                                        $parent.searchingRegion != ':-'
                                    "
                                    :plot-data="$parent.associationsData"
                                    :render-config="{
                                        'x axis field': 'Position',
                                        'y axis field': '-log10(P-Value)',
                                        'render by': 'Variant ID',
                                        'y axis label': '-Log10(p-value)',
                                        'x axis label': 'Chromosome',
                                        'hover content': ['P-Value', 'Beta'],
                                        height: 120,
                                        'star key': null,
                                        'ld server': {
                                            pos: 'Position',
                                            ref: 'ref',
                                            alt: 'alt',
                                            'ref variant field': 'Variant ID',
                                            'populations field': 'P-Value',
                                            'populations type': 'fixed',
                                            'fixed population': 'ALL',
                                            populations: { ALL: 'ALL' },
                                        },
                                    }"
                                    :search-parameters="
                                        $store.state.searchParameters
                                    "
                                    :data-comparison-config="null"
                                    :region="$parent.searchingRegion"
                                    :plot-margin="$parent.plotMargin"
                                    :compare-group-colors="$parent.colors.bold"
                                    :region-zoom="0"
                                    :region-view-area="0"
                                    :pkg-data="$store.state.pkgData"
                                    :pkg-data-selected="
                                        $store.state.pkgDataSelected
                                    "
                                    :utils="$parent.utilsBox"
                                ></research-region-plot>
                                <research-genes-track
                                    v-if="$store.state.codingGenesData != null"
                                    :region="$parent.searchingRegion"
                                    :genes-data="$store.state.codingGenesData"
                                    :plot-config="{}"
                                    :plot-type="'region plot'"
                                    :plot-margin="$parent.plotMargin"
                                    :region-zoom="0"
                                    :region-view-area="0"
                                    :utils="$parent.utilsBox"
                                ></research-genes-track>
                            </div>

                            <b-collapse
                                id="accordion-3"
                                v-model="$parent.showVariants"
                                accordion="my-accordion"
                                role="tabpanel"
                            >
                                <b-card-body>
                                    <b-overlay :show="$parent.loadingVariants">
                                        <template #overlay>
                                            <b-alert show>
                                                Searching for variants. Please
                                                wait ...
                                                <b-icon
                                                    icon="arrow-repeat"
                                                    animation="spin"
                                                ></b-icon
                                            ></b-alert>
                                        </template>
                                        <b-skeleton-wrapper
                                            :loading="$parent.loadingVariants"
                                        >
                                            <template #loading>
                                                <b-skeleton-table
                                                    :rows="3"
                                                    :columns="5"
                                                    :table-props="{
                                                        bordered: true,
                                                        striped: true,
                                                    }"
                                                ></b-skeleton-table>
                                            </template>
                                            <b-alert
                                                v-if="
                                                    $parent.tableData.length ===
                                                    0
                                                "
                                                show
                                                variant="warning"
                                                ><b-icon
                                                    icon="exclamation-triangle"
                                                ></b-icon>
                                                There is no variant found with
                                                selected criteria.
                                                <a
                                                    v-b-toggle
                                                    href="#accordion-1"
                                                    @click.prevent
                                                    >Try another gene?</a
                                                >
                                            </b-alert>
                                            <b-alert
                                                v-if="
                                                    $parent.tableData.length >
                                                        0 &&
                                                    $parent.criteriaChanged
                                                "
                                                show
                                                variant="warning"
                                                ><b-icon
                                                    icon="exclamation-triangle"
                                                ></b-icon>
                                                Search criteria changed. Run
                                                <b-button
                                                    v-b-toggle.accordion-1
                                                    variant="outline-primary"
                                                    size="sm"
                                                    >Search
                                                    Annotations</b-button
                                                >

                                                again to update annotations.
                                            </b-alert>
                                            <transition
                                                v-if="
                                                    $parent.tableData.length > 0
                                                "
                                                name="fade"
                                            >
                                                <b-alert
                                                    v-if="
                                                        $parent.selectedDataset
                                                            .length == 0
                                                    "
                                                    show
                                                    >Please select a
                                                    dataset.</b-alert
                                                >

                                                <b-alert
                                                    v-else-if="
                                                        $parent.selectedTests
                                                            .length == 0 ||
                                                        $parent
                                                            .selectedTests[0] ===
                                                            undefined
                                                    "
                                                    show
                                                    >Please select one or more
                                                    tests to run.</b-alert
                                                ></transition
                                            >
                                            <b-card
                                                v-if="
                                                    $parent.tableData.length > 0
                                                "
                                                class="text-center filter-tests"
                                            >
                                                <criterion-list-group
                                                    v-model="
                                                        $parent.selectedMethods
                                                    "
                                                    :header="'Test(s) Selected'"
                                                >
                                                    <filter-enumeration-control
                                                        ref="test"
                                                        :field="'test'"
                                                        placeholder="Select one or more methods ..."
                                                        :multiple="true"
                                                        :disable-sort="true"
                                                        :options="
                                                            $parent.testMethods.map(
                                                                (v) => v.value
                                                            )
                                                        "
                                                        :label-formatter="
                                                            (v) =>
                                                                $parent.testMethods.find(
                                                                    (o) =>
                                                                        o.value ===
                                                                        v
                                                                ).text
                                                        "
                                                        ><div class="label">
                                                            Test Methods
                                                        </div></filter-enumeration-control
                                                    >
                                                </criterion-list-group>

                                                <div
                                                    v-if="
                                                        $parent.tableData
                                                            .length > 0
                                                    "
                                                    class="function"
                                                >
                                                    <b-button
                                                        :disabled="
                                                            $parent
                                                                .selectedVariants
                                                                .length == 0 ||
                                                            $parent
                                                                .selectedPhenotypes
                                                                .length == 0 ||
                                                            $parent
                                                                .selectedDataset
                                                                .length == 0 ||
                                                            $parent
                                                                .selectedTests
                                                                .length == 0
                                                        "
                                                        variant="primary"
                                                        @click="
                                                            $parent.runRaremetal()
                                                        "
                                                        >Run Analysis</b-button
                                                    >
                                                </div>
                                            </b-card>

                                            <div
                                                v-if="
                                                    $parent.tableData.length > 0
                                                "
                                                class="variants"
                                            >
                                                <div class="my-2">
                                                    <b-button
                                                        size="sm"
                                                        variant="outline-secondary"
                                                        title="Select all variants in the table below."
                                                        @click="
                                                            $parent.selectAllVariants()
                                                        "
                                                        ><b-icon
                                                            icon="check2-all"
                                                            aria-hidden="true"
                                                        ></b-icon>
                                                        Select all
                                                        variants</b-button
                                                    >
                                                    <b-button
                                                        size="sm"
                                                        variant="outline-secondary"
                                                        class="ml-2"
                                                        title="Deselect all variants in the table below."
                                                        @click="
                                                            $parent.deselectAllVariants()
                                                        "
                                                        ><b-icon
                                                            icon="dash"
                                                            aria-hidden="true"
                                                        ></b-icon>
                                                        Deselect all
                                                        variants</b-button
                                                    >
                                                    <span
                                                        class="float-right mt-1"
                                                        ><strong
                                                            >Total
                                                            variants:</strong
                                                        >
                                                        {{
                                                            $parent.tableData
                                                                .length
                                                        }}</span
                                                    >
                                                </div>

                                                <b-table
                                                    striped
                                                    hover
                                                    small
                                                    sort-icon-left
                                                    responsive="sm"
                                                    sticky-header="400px"
                                                    :per-page="$parent.perPage"
                                                    :current-page="
                                                        $parent.currentPage
                                                    "
                                                    :items="$parent.tableData"
                                                    :fields="
                                                        $parent.ncbtVariantFields
                                                    "
                                                >
                                                    <template
                                                        #cell(selected)="data"
                                                    >
                                                        <b-form-group>
                                                            <input
                                                                v-model="
                                                                    data.item
                                                                        .selected
                                                                "
                                                                type="checkbox"
                                                                @change="
                                                                    $parent.updateSelectedVariants()
                                                                "
                                                            />
                                                        </b-form-group>
                                                    </template>
                                                    <template
                                                        #cell(burdenBinId)="data"
                                                    >
                                                        {{
                                                            $parent.masks.find(
                                                                (o) =>
                                                                    o.value ===
                                                                    data.value
                                                            ).text
                                                        }}
                                                    </template>
                                                    <template
                                                        #cell(varId)="data"
                                                    >
                                                        <a
                                                            :href="`/variant.html?variant=${data.value}`"
                                                            >{{ data.value }}</a
                                                        >
                                                    </template>
                                                    <template #cell(maf)="data">
                                                        {{
                                                            $parent.zScoreFormatter(
                                                                data.value
                                                            )
                                                        }}
                                                    </template>

                                                    <template #head(altFreq)>
                                                        Alt. Frequency
                                                    </template>
                                                    <template
                                                        #cell(altFreq)="data"
                                                    >
                                                        {{
                                                            !!data.value
                                                                ? data.value.toExponential(
                                                                      3
                                                                  )
                                                                : ""
                                                        }}
                                                    </template>

                                                    <template #head(pvalue)>
                                                        P-Value
                                                    </template>
                                                    <template
                                                        #cell(pvalue)="data"
                                                    >
                                                        {{
                                                            $parent.pValueFormatter(
                                                                data.value
                                                            )
                                                        }}
                                                    </template>

                                                    <template #head(score)>
                                                        Score
                                                    </template>
                                                    <template
                                                        #cell(score)="data"
                                                    >
                                                        {{
                                                            $parent.zScoreFormatter(
                                                                data.value
                                                            )
                                                        }}
                                                    </template>
                                                </b-table>
                                                <b-pagination
                                                    v-model="
                                                        $parent.currentPage
                                                    "
                                                    class="pagination-sm justify-content-center"
                                                    :total-rows="
                                                        $parent.tableData.length
                                                    "
                                                    :per-page="$parent.perPage"
                                                ></b-pagination>
                                            </div> </b-skeleton-wrapper
                                    ></b-overlay>
                                </b-card-body>
                            </b-collapse>
                        </b-card>

                        <b-card no-body class="mb-1">
                            <b-card-header
                                header-tag="header"
                                class="p-1"
                                role="tab"
                            >
                                <b-button
                                    v-b-toggle.accordion-4
                                    block
                                    :variant="
                                        ($parent.criteriaChanged &&
                                            $store.state.ldServer.covariances
                                                .length > 0) ||
                                        ($parent.testChanged &&
                                            $store.state.ldServer.covariances
                                                .length > 0)
                                            ? 'outline-warning'
                                            : 'outline-primary'
                                    "
                                    >Results</b-button
                                >
                            </b-card-header>
                            <b-collapse
                                id="accordion-4"
                                v-model="$parent.showCovariances"
                                accordion="my-accordion"
                                role="tabpanel"
                            >
                                <b-card-body>
                                    <b-skeleton-wrapper
                                        :loading="$parent.loadingCovariances"
                                    >
                                        <template #loading>
                                            <b-skeleton-table
                                                :rows="3"
                                                :columns="7"
                                                :table-props="{
                                                    bordered: true,
                                                    striped: true,
                                                }"
                                            ></b-skeleton-table>
                                        </template>
                                        <!-- <b-table
                                            striped
                                            hover
                                            small
                                            responsive="sm"
                                            :items="
                                                $parent.formatTestData(
                                                    $parent.runResults
                                                )
                                            "
                                        ></b-table>
                                        {{ $parent.runResults }}
-->
                                        <div
                                            v-if="
                                                $parent.runResults &&
                                                $parent.runResults.length > 0
                                            "
                                            id="covariances"
                                        >
                                            <template
                                                v-if="
                                                    $parent.runResults.length >
                                                    0
                                                "
                                            >
                                                <b-alert
                                                    v-if="
                                                        $parent.criteriaChanged
                                                    "
                                                    show
                                                    variant="warning"
                                                    ><b-icon
                                                        icon="exclamation-triangle"
                                                    ></b-icon>
                                                    Search criteria changed. Run
                                                    <b-button
                                                        v-b-toggle.accordion-1
                                                        variant="outline-primary"
                                                        size="sm"
                                                        >Search
                                                        Annotations</b-button
                                                    >
                                                    again to update annotations
                                                    .</b-alert
                                                >

                                                <b-alert
                                                    v-else-if="
                                                        $parent.testChanged
                                                    "
                                                    show
                                                    variant="warning"
                                                    ><b-icon
                                                        icon="exclamation-triangle"
                                                    ></b-icon>
                                                    Test criteria changed. Click
                                                    on
                                                    <b-button
                                                        v-b-toggle.accordion-3
                                                        variant="outline-primary"
                                                        size="sm"
                                                        >Run Analysis</b-button
                                                    >
                                                    again to update the
                                                    results.</b-alert
                                                >
                                                <b-table
                                                    v-for="(
                                                        p, i
                                                    ) in $parent.runResults"
                                                    :key="p.phenotype"
                                                    striped
                                                    hover
                                                    small
                                                    responsive="sm"
                                                    sort-icon-left
                                                    :items="
                                                        $parent.formatTestData(
                                                            p.samples,
                                                            p.data
                                                        )
                                                    "
                                                    :fields="$parent.ncbtFields"
                                                >
                                                    <template #thead-top="data">
                                                        <b-th
                                                            colspan="8"
                                                            class="reference"
                                                            :class="
                                                                'color-' +
                                                                (i + 1)
                                                            "
                                                        >
                                                            <span>{{
                                                                !!$store.state
                                                                    .bioPortal
                                                                    .phenotypeMap[
                                                                    p.phenotype
                                                                ]
                                                                    ? $store
                                                                          .state
                                                                          .bioPortal
                                                                          .phenotypeMap[
                                                                          p
                                                                              .phenotype
                                                                      ]
                                                                          .description
                                                                    : p.phenotype
                                                            }}</span>
                                                        </b-th>
                                                    </template>

                                                    <template
                                                        #cell(test)="data"
                                                    >
                                                        {{
                                                            $parent.testMethods.find(
                                                                (t) =>
                                                                    t.value ===
                                                                    data.value
                                                            ).text
                                                        }}
                                                    </template>

                                                    <template #head(zscore)>
                                                        Z-Score
                                                    </template>
                                                    <template
                                                        #cell(zscore)="row"
                                                    >
                                                        {{
                                                            row.item.test.includes(
                                                                "skat"
                                                            )
                                                                ? "-"
                                                                : $parent.zScoreFormatter(
                                                                      row.item
                                                                          .stat
                                                                  )
                                                        }}
                                                    </template>
                                                    <template #head(qscore)>
                                                        Q-Score
                                                    </template>
                                                    <template
                                                        #cell(qscore)="row"
                                                    >
                                                        {{
                                                            row.item.test.includes(
                                                                "skat"
                                                            )
                                                                ? $parent.zScoreFormatter(
                                                                      row.item
                                                                          .stat
                                                                  )
                                                                : "-"
                                                        }}
                                                    </template>

                                                    <template #head(pvalue)>
                                                        P-Value
                                                    </template>
                                                    <template
                                                        #cell(pvalue)="data"
                                                    >
                                                        {{
                                                            $parent.pValueFormatter(
                                                                data.value
                                                            )
                                                        }}
                                                    </template>

                                                    <template #head(effect)>
                                                        {{
                                                            !!$parent
                                                                .phenotypeMap[
                                                                p.phenotype
                                                            ].dichotomous
                                                                ? "Odds Ratio"
                                                                : "Beta"
                                                        }}
                                                    </template>
                                                    <template
                                                        #cell(effect)="data"
                                                    >
                                                        <template
                                                            v-if="!!data.value"
                                                        >
                                                            <span
                                                                v-if="
                                                                    !!$parent
                                                                        .phenotypeMap[
                                                                        p
                                                                            .phenotype
                                                                    ]
                                                                        .dichotomous
                                                                "
                                                                :class="`effect ${
                                                                    Math.exp(
                                                                        data.value
                                                                    ) < 1
                                                                        ? 'negative'
                                                                        : 'positive'
                                                                }`"
                                                                >{{
                                                                    Math.exp(
                                                                        data.value
                                                                    ) < 1
                                                                        ? "&#9660;"
                                                                        : "&#9650;"
                                                                }}</span
                                                            >
                                                            <span
                                                                v-else
                                                                :class="`effect ${
                                                                    !!data.value &&
                                                                    data.value <
                                                                        0
                                                                        ? 'negative'
                                                                        : 'positive'
                                                                }`"
                                                                >{{
                                                                    !!data.value &&
                                                                    data.value <
                                                                        0
                                                                        ? "&#9660;"
                                                                        : "&#9650;"
                                                                }}</span
                                                            >
                                                        </template>

                                                        {{
                                                            !!$parent
                                                                .phenotypeMap[
                                                                p.phenotype
                                                            ].dichotomous &&
                                                            !!data.value
                                                                ? $parent.effectFormatter(
                                                                      Math.exp(
                                                                          data.value
                                                                      )
                                                                  )
                                                                : $parent.effectFormatter(
                                                                      data.value
                                                                  )
                                                        }}
                                                    </template>

                                                    <template #head(se)>
                                                        Standard Error
                                                    </template>
                                                    <template #cell(se)="data">
                                                        {{
                                                            $parent.zScoreFormatter(
                                                                data.value
                                                            )
                                                        }}
                                                    </template>

                                                    <template #head(samples)>
                                                        Sample Size
                                                    </template>
                                                    <template
                                                        #cell(samples)="data"
                                                    >
                                                        {{
                                                            $parent.intFormatter(
                                                                data.value
                                                            )
                                                        }}
                                                    </template>
                                                    <template
                                                        #cell(details)="data"
                                                    >
                                                        <b-button
                                                            size="sm"
                                                            variant="outline-primary"
                                                            class="mr-2 btn-mini"
                                                            @click="
                                                                data.toggleDetails
                                                            "
                                                        >
                                                            {{
                                                                data.detailsShowing
                                                                    ? "Hide"
                                                                    : "Show"
                                                            }}
                                                        </b-button>
                                                    </template>

                                                    <template #row-details="row"
                                                        ><div
                                                            class="row-details-table"
                                                        >
                                                            <b-table
                                                                sort-icon-left
                                                                :items="
                                                                    row.item
                                                                        .data
                                                                "
                                                                :fields="
                                                                    $parent.ncbtSubFields
                                                                "
                                                                ><template
                                                                    #head(pvalue)
                                                                >
                                                                    P-Value
                                                                </template>
                                                                <template
                                                                    #cell(pvalue)="data"
                                                                >
                                                                    {{
                                                                        $parent.pValueFormatter(
                                                                            data.value
                                                                        )
                                                                    }}
                                                                </template>

                                                                <template
                                                                    #head(stat)
                                                                >
                                                                    {{
                                                                        row.item.test.includes(
                                                                            "skat"
                                                                        )
                                                                            ? "Q-Score"
                                                                            : "Z-score"
                                                                    }}
                                                                </template>
                                                                <template
                                                                    #cell(stat)="row"
                                                                >
                                                                    {{
                                                                        $parent.zScoreFormatter(
                                                                            row
                                                                                .item
                                                                                .stat
                                                                        )
                                                                    }}
                                                                </template>

                                                                <template
                                                                    #head(effect)
                                                                >
                                                                    {{
                                                                        !!$parent
                                                                            .phenotypeMap[
                                                                            p
                                                                                .phenotype
                                                                        ]
                                                                            .dichotomous
                                                                            ? "Odds Ratio"
                                                                            : "Beta"
                                                                    }}
                                                                </template>
                                                                <template
                                                                    #cell(effect)="data"
                                                                >
                                                                    <template
                                                                        v-if="
                                                                            !!data.value
                                                                        "
                                                                    >
                                                                        <span
                                                                            v-if="
                                                                                !!$parent
                                                                                    .phenotypeMap[
                                                                                    p
                                                                                        .phenotype
                                                                                ]
                                                                                    .dichotomous
                                                                            "
                                                                            :class="`effect ${
                                                                                Math.exp(
                                                                                    data.value
                                                                                ) <
                                                                                1
                                                                                    ? 'negative'
                                                                                    : 'positive'
                                                                            }`"
                                                                            >{{
                                                                                Math.exp(
                                                                                    data.value
                                                                                ) <
                                                                                1
                                                                                    ? "&#9660;"
                                                                                    : "&#9650;"
                                                                            }}</span
                                                                        >
                                                                        <span
                                                                            v-else
                                                                            :class="`effect ${
                                                                                !!data.value &&
                                                                                data.value <
                                                                                    0
                                                                                    ? 'negative'
                                                                                    : 'positive'
                                                                            }`"
                                                                            >{{
                                                                                !!data.value &&
                                                                                data.value <
                                                                                    0
                                                                                    ? "&#9660;"
                                                                                    : "&#9650;"
                                                                            }}</span
                                                                        >
                                                                    </template>

                                                                    {{
                                                                        !!$parent
                                                                            .phenotypeMap[
                                                                            p
                                                                                .phenotype
                                                                        ]
                                                                            .dichotomous &&
                                                                        !!data.value
                                                                            ? $parent.effectFormatter(
                                                                                  Math.exp(
                                                                                      data.value
                                                                                  )
                                                                              )
                                                                            : $parent.effectFormatter(
                                                                                  data.value
                                                                              )
                                                                    }}
                                                                </template>

                                                                <template
                                                                    #head(se)
                                                                >
                                                                    Standard
                                                                    Error
                                                                </template>
                                                                <template
                                                                    #cell(se)="data"
                                                                >
                                                                    {{
                                                                        $parent.zScoreFormatter(
                                                                            data.value
                                                                        )
                                                                    }}
                                                                </template>
                                                            </b-table>
                                                        </div>
                                                    </template>
                                                </b-table>
                                            </template>
                                        </div>
                                        <b-alert
                                            v-if="
                                                $store.state.ldServer
                                                    .runTestsError
                                            "
                                            show
                                            variant="danger"
                                            >{{
                                                $store.state.ldServer
                                                    .runTestsError
                                            }}</b-alert
                                        >
                                        <b-alert
                                            v-if="
                                                $store.state.ldServer
                                                    .covariances.length > 0 &&
                                                $store.state.ldServer
                                                    .covariances[0].data
                                                    .length == 0 &&
                                                !$store.state.ldServer
                                                    .runTestsError
                                            "
                                            show
                                            variant="warning"
                                        >
                                            <b-icon
                                                icon="exclamation-triangle"
                                            ></b-icon>
                                            There is no data available for your
                                            search criteria, please check your
                                            query and try again.
                                        </b-alert>
                                    </b-skeleton-wrapper>
                                </b-card-body>
                            </b-collapse>
                        </b-card>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer-->
        <page-footer :disease-group="$parent.diseaseGroup"></page-footer>
    </div>
</template>
<style>
@import url("/css/table.css");
#gait div.filtering-ui-content .divider.col .or-text {
    padding: 2px 5px;
}
</style>
