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
                    <documentation name="gait.header.info"></documentation>
                </div>
            </div>
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h2>Non-Coding Genetic Association Interactive Tool</h2>

                        <documentation
                            style="margin-top: 20px"
                            name="tools.gait.subheader"
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
                                    block
                                    v-b-toggle.accordion-1
                                    variant="outline-primary"
                                    >Criteria
                                    <div class="criteria">
                                        <b-badge
                                            class="filter-pill-gene"
                                            v-if="
                                                $parent.selectedGene.length > 0
                                            "
                                        >
                                            {{ $parent.selectedGene[0] }}
                                        </b-badge>
                                        <template
                                            v-if="
                                                $parent.selectedPhenotypes
                                                    .length > 0
                                            "
                                        >
                                            <b-badge
                                                class="filter-pill-phenotype"
                                                v-for="phenotype in $parent.selectedPhenotypes"
                                                :key="phenotype"
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
                                            show
                                            v-if="
                                                $parent.selectedGene.length ==
                                                    0 ||
                                                $parent.selectedGene[0] ===
                                                    undefined
                                            "
                                            >Please select a gene.</b-alert
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
                                            ref="phenotype"
                                            :field="'phenotype'"
                                            placeholder="Select one or more phenotypes ..."
                                            :disableSort="true"
                                            :multiple="true"
                                            :options="
                                                $parent.selectedDataset == '52k'
                                                    ? $store.state.ldServer.phenotypes.map(
                                                          (phenotype) =>
                                                              phenotype.name
                                                      )
                                                    : $parent.topmedDatasets
                                            "
                                            :labelFormatter="
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

                                    <div class="function">
                                        <b-button
                                            variant="primary"
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
                                    block
                                    v-b-toggle.accordion-2
                                    :variant="
                                        $parent.criteriaChanged &&
                                        $parent.tableData.length > 0
                                            ? 'outline-warning'
                                            : 'outline-primary'
                                    "
                                    >Annotations and Tissues
                                    <div class="criteria">
                                        <b-badge class="filter-pill-dataset">
                                        </b-badge></div
                                ></b-button>
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
                                                :renderConfig="{
                                                    'annotations server':
                                                        'KP BioIndex',
                                                    'phenotype parameter':
                                                        'phenotype',
                                                    'overlapping regions':
                                                        'true',
                                                }"
                                                :plotMargin="{
                                                    leftMargin: 75,
                                                    rightMargin: 20,
                                                    topMargin: 10,
                                                    bottomMargin: 50,
                                                    bump: 5.5,
                                                }"
                                                :compareGroupColors="[
                                                    '#007bff75',
                                                    '#04884575',
                                                    '#8490C875',
                                                    '#BF61A575',
                                                    '#EE312475',
                                                    '#FCD70075',
                                                    '#5555FF75',
                                                    '#7aaa1c75',
                                                    '#9F78AC75',
                                                    '#F8808475',
                                                    '#F5A4C775',
                                                    '#CEE6C175',
                                                    '#cccc0075',
                                                    '#6FC7B675',
                                                    '#D5A76875',
                                                    '#d4d4d475',
                                                ]"
                                                :dataComparison="null"
                                                :pkgData="$store.state.pkgData"
                                                :pkgDataSelected="
                                                    $store.state.pkgDataSelected
                                                "
                                                :regionZoom="0"
                                                :regionViewArea="0"
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
                                                class="
                                                    filtering-ui-wrapper
                                                    add-content
                                                "
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
                                                            Show overlapping
                                                            regions by
                                                        </div>
                                                        <select
                                                            v-model="
                                                                $parent.selectedRegionType
                                                            "
                                                            class="
                                                                custom-select
                                                            "
                                                        >
                                                            <option value="or">
                                                                Union (OR)
                                                            </option>
                                                            <option value="and">
                                                                Intersection
                                                                (AND)
                                                            </option>
                                                        </select>
                                                        <template
                                                            v-if="
                                                                $store.state
                                                                    .pkgData[
                                                                    'overlappingRegions'
                                                                ] &&
                                                                $store.state
                                                                    .pkgData[
                                                                    'overlappingRegions'
                                                                ].length !== 0
                                                            "
                                                            ><div
                                                                v-if="
                                                                    $parent.selectedRegionType ===
                                                                    'or'
                                                                "
                                                            >
                                                                {{
                                                                    $store.state
                                                                        .pkgData[
                                                                        "overlappingRegions"
                                                                    ]["or"]
                                                                }}
                                                            </div>
                                                            <div v-else>
                                                                {{
                                                                    $store.state
                                                                        .pkgData[
                                                                        "overlappingRegions"
                                                                    ]["and"]
                                                                }}
                                                            </div>
                                                        </template>
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
                                    block
                                    v-b-toggle.accordion-3
                                    :variant="
                                        $parent.criteriaChanged &&
                                        $parent.tableData.length > 0
                                            ? 'outline-warning'
                                            : 'outline-primary'
                                    "
                                    >Variants
                                    <div class="criteria">
                                        <b-badge
                                            class="filter-pill-dataset"
                                            v-if="
                                                $parent.selectedDataset.length >
                                                0
                                            "
                                        >
                                            {{ $parent.selectedDataset[0] }}
                                        </b-badge>

                                        <template
                                            v-if="
                                                $parent.selectedTests.length > 0
                                            "
                                        >
                                            <b-badge
                                                class="filter-pill-test"
                                                v-for="test in $parent.selectedTests"
                                                :key="test"
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
                            <b-collapse
                                id="accordion-3"
                                v-model="$parent.showVariants"
                                accordion="my-accordion"
                                role="tabpanel"
                            >
                                <b-card-body>
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
                                            show
                                            variant="warning"
                                            v-if="
                                                $parent.tableData.length === 0
                                            "
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
                                            show
                                            variant="warning"
                                            v-if="
                                                $parent.tableData.length > 0 &&
                                                $parent.criteriaChanged
                                            "
                                            ><b-icon
                                                icon="exclamation-triangle"
                                            ></b-icon>
                                            Search criteria changed. Run
                                            <b-button
                                                variant="outline-primary"
                                                size="sm"
                                                v-b-toggle.accordion-1
                                                >Search Variants</b-button
                                            >

                                            again to update variant
                                            list.</b-alert
                                        >
                                        <transition
                                            name="fade"
                                            v-if="$parent.tableData.length > 0"
                                        >
                                            <b-alert
                                                show
                                                v-if="
                                                    $parent.selectedDataset
                                                        .length == 0
                                                "
                                                >Please select a
                                                dataset.</b-alert
                                            >
                                            <b-alert
                                                show
                                                v-else-if="
                                                    $parent.selectedPhenotypes
                                                        .length == 0
                                                "
                                                >Please select one or more
                                                phenotypes.</b-alert
                                            >
                                            <b-alert
                                                show
                                                v-else-if="
                                                    $parent.selectedTests
                                                        .length == 0 ||
                                                    $parent.selectedTests[0] ===
                                                        undefined
                                                "
                                                >Please select one or more tests
                                                to run.</b-alert
                                            ></transition
                                        >
                                        <b-card
                                            class="text-center filter-tests"
                                            v-if="$parent.tableData.length > 0"
                                        >
                                            <criterion-list-group
                                                v-model="
                                                    $parent.selectedMethods
                                                "
                                                :header="'Test(s) Selected'"
                                            >
                                                <filter-enumeration-control
                                                    ref="dataset"
                                                    :field="'dataset'"
                                                    placeholder="Select a dataset ..."
                                                    :options="
                                                        $parent.datasets.map(
                                                            (v) => v.value
                                                        )
                                                    "
                                                    :labelFormatter="
                                                        (v) =>
                                                            $parent.datasets.find(
                                                                (o) =>
                                                                    o.value ===
                                                                    v
                                                            ).text
                                                    "
                                                    ><div class="label">
                                                        Dataset
                                                    </div></filter-enumeration-control
                                                >

                                                <filter-enumeration-control
                                                    ref="test"
                                                    :field="'test'"
                                                    placeholder="Select one or more methods ..."
                                                    :multiple="true"
                                                    :disableSort="true"
                                                    :options="
                                                        $parent.testMethods.map(
                                                            (v) => v.value
                                                        )
                                                    "
                                                    :labelFormatter="
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
                                                class="function"
                                                v-if="
                                                    $parent.tableData.length > 0
                                                "
                                            >
                                                <b-button
                                                    :disabled="
                                                        $parent.selectedVariants
                                                            .length == 0 ||
                                                        $parent
                                                            .selectedPhenotypes
                                                            .length == 0 ||
                                                        $parent.selectedDataset
                                                            .length == 0 ||
                                                        $parent.selectedTests
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
                                            class="variants"
                                            v-if="$parent.tableData.length > 0"
                                        >
                                            <div class="my-2">
                                                <b-button
                                                    size="sm"
                                                    variant="outline-secondary"
                                                    @click="
                                                        $parent.selectAllVariants()
                                                    "
                                                    title="Select all variants in the table below."
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
                                                    @click="
                                                        $parent.deselectAllVariants()
                                                    "
                                                    title="Deselect all variants in the table below."
                                                    ><b-icon
                                                        icon="dash"
                                                        aria-hidden="true"
                                                    ></b-icon>
                                                    Deselect all
                                                    variants</b-button
                                                >
                                            </div>

                                            <b-table
                                                striped
                                                hover
                                                small
                                                sort-icon-left
                                                responsive="sm"
                                                sticky-header="400px"
                                                :items="$parent.tableData"
                                                :fields="$parent.visibleFields"
                                            >
                                                <template
                                                    #cell(selected)="data"
                                                >
                                                    <b-form-group>
                                                        <input
                                                            type="checkbox"
                                                            v-model="
                                                                data.item
                                                                    .selected
                                                            "
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
                                                <template #cell(varId)="data">
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
                                            </b-table>
                                        </div>
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
                                    block
                                    v-b-toggle.accordion-4
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
                                        <b-table
                                            striped
                                            hover
                                            small
                                            responsive="sm"
                                            :items="$parent.runResults"
                                        ></b-table>
                                        {{ $parent.runResults }}

                                        <div
                                            id="covariances"
                                            v-if="
                                                $store.state.ldServer
                                                    .covariances &&
                                                !$store.state.ldServer
                                                    .runTestsError
                                            "
                                        >
                                            <template
                                                v-if="
                                                    $store.state.ldServer
                                                        .covariances.length > 0
                                                "
                                            >
                                                <b-alert
                                                    show
                                                    variant="warning"
                                                    v-if="
                                                        $parent.criteriaChanged
                                                    "
                                                    ><b-icon
                                                        icon="exclamation-triangle"
                                                    ></b-icon>
                                                    Search criteria changed. Run
                                                    <b-button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        v-b-toggle.accordion-1
                                                        >Search
                                                        Variants</b-button
                                                    >
                                                    again to update variant
                                                    list.</b-alert
                                                >

                                                <b-alert
                                                    show
                                                    variant="warning"
                                                    v-else-if="
                                                        $parent.testChanged
                                                    "
                                                    ><b-icon
                                                        icon="exclamation-triangle"
                                                    ></b-icon>
                                                    Test criteria changed. Click
                                                    on
                                                    <b-button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        v-b-toggle.accordion-2
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
                                                    :items="
                                                        $parent.formatTestData(
                                                            p.samples,
                                                            p.data
                                                        )
                                                    "
                                                >
                                                    <template
                                                        v-slot:thead-top="data"
                                                    >
                                                        <b-th
                                                            colspan="7"
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
                                                        <b-button
                                                            v-if="
                                                                data.value ==
                                                                'burden'
                                                            "
                                                            size="sm"
                                                            variant="outline-primary"
                                                            @click="
                                                                data.toggleDetails
                                                            "
                                                            class="
                                                                mr-2
                                                                btn-mini
                                                            "
                                                        >
                                                            {{
                                                                data.detailsShowing
                                                                    ? "Hide"
                                                                    : "Show"
                                                            }}
                                                            Plot
                                                        </b-button>
                                                    </template>

                                                    <template #head(zscore)>
                                                        Z-Score
                                                    </template>
                                                    <template
                                                        #cell(zscore)="data"
                                                    >
                                                        {{
                                                            $parent.zScoreFormatter(
                                                                data.value
                                                            )
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
                                                        #row-details="row"
                                                    >
                                                        <forest-plot-simple
                                                            :se="row.item.se"
                                                            :effect="
                                                                row.item.effect
                                                            "
                                                            :dichotomous="
                                                                !!$parent
                                                                    .phenotypeMap[
                                                                    p.phenotype
                                                                ].dichotomous
                                                            "
                                                        ></forest-plot-simple>
                                                    </template>
                                                </b-table>
                                            </template>
                                        </div>
                                        <b-alert
                                            show
                                            variant="danger"
                                            v-if="
                                                $store.state.ldServer
                                                    .runTestsError
                                            "
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
</style>
