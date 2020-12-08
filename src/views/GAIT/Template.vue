<template>
    <div id="gait">
        <!-- Header -->
        <page-header
            :disease-group="$parent.diseaseGroup"
            :front-contents="$parent.frontContents"
        ></page-header>

        <!-- Body -->
        <div class="container-fluid mdkp-body">
            <div class="card mdkp-card dataset-page-header">
                <div class="row card-body">
                    <div class="col-md-12">
                        <h2>Genetic Association Interactive Tool</h2>
                        <documentation
                            style="margin-top: 20px"
                            name="tools.gait.subheader"
                        ></documentation>
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Build Search Criteria</h4>

                    <criterion-list-group
                        v-model="$parent.searchCriteria"
                        :header="'Search Criteria'"
                    >
                        <filter-basic-control
                            ref="gene"
                            :field="'gene'"
                            placeholder="Select a gene ..."
                        >
                            <div class="label">Gene</div>
                        </filter-basic-control>

                        <b-col class="divider"></b-col>

                        <filter-enumeration-control
                            ref="mask"
                            :field="'mask'"
                            :multiple="true"
                            :disableSort="true"
                            placeholder="Select one or more masks ..."
                            :options="$parent.masks.map((v) => v.value)"
                            :labelFormatter="
                                (v) =>
                                    $parent.masks.find((o) => o.value === v)
                                        .text
                            "
                            ><div class="label">
                                Masks
                            </div></filter-enumeration-control
                        >
                    </criterion-list-group>

                    <div class="function">
                        <!-- <b-progress
                            max="4"
                            height="3rem"
                            variant="info"
                            class="mt-2"
                        >
                            <b-progress-bar value="3"> </b-progress-bar>
                            <div class="progress-bar-title">Something</div>
                        </b-progress> -->
                        <transition name="fade"
                            ><b-alert
                                show
                                v-if="
                                    $parent.selectedGene.length == 0 ||
                                    $parent.selectedGene[0] === undefined
                                "
                                >Please select a gene.</b-alert
                            >

                            <b-alert
                                show
                                v-else-if="$parent.selectedMasks.length == 0"
                                >Please select one or more masks.</b-alert
                            ></transition
                        >

                        <b-button
                            variant="primary"
                            @click="$parent.searchVariants"
                            :disabled="$parent.selectedMasks.length == 0"
                            >Search Variants</b-button
                        >
                    </div>
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
                                    :variant="
                                        $parent.criteriaChanged &&
                                        $parent.tableData.length > 0
                                            ? 'outline-warning'
                                            : 'outline-primary'
                                    "
                                    >Variants</b-button
                                >
                            </b-card-header>
                            <b-collapse
                                id="accordion-1"
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

                                        <div
                                            class="variants"
                                            v-if="$parent.tableData.length > 0"
                                        >
                                            <b-alert
                                                show
                                                variant="warning"
                                                v-if="$parent.criteriaChanged"
                                                >Search criteria changed. Click
                                                <b-button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    disabled
                                                    >Search Variants</b-button
                                                >
                                                again to update variant
                                                list.</b-alert
                                            >
                                            <strong
                                                >View optional columns
                                            </strong>
                                            <template
                                                v-for="field in $parent.optionalFields"
                                            >
                                                <b-checkbox
                                                    v-if="
                                                        $parent.defaultFields.indexOf(
                                                            field.key
                                                        ) < 0
                                                    "
                                                    :disabled="
                                                        $parent.visibleFields
                                                            .length == 1 &&
                                                        field.visible
                                                    "
                                                    :key="field.key"
                                                    v-model="field.visible"
                                                    inline
                                                >
                                                    {{ field.label }}
                                                </b-checkbox>
                                            </template>

                                            <b-table
                                                striped
                                                hover
                                                small
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
                                            </b-table>
                                        </div>

                                        <b-card
                                            header="Association statistics for selected variants"
                                            class="text-center"
                                            border-variant="info"
                                            header-bg-variant="info"
                                            header-text-variant="white"
                                        >
                                            <criterion-list-group
                                                v-if="
                                                    $parent.tableData.length > 0
                                                "
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
                                                    ref="phenotype"
                                                    :field="'phenotype'"
                                                    placeholder="Select one or more phenotypes ..."
                                                    :disableSort="true"
                                                    :disabled="
                                                        $parent.selectedDataset
                                                            .length == 0 ||
                                                        $parent
                                                            .selectedDataset[0] ===
                                                            undefined
                                                    "
                                                    :multiple="true"
                                                    :options="
                                                        $parent.selectedDataset ==
                                                        '52k'
                                                            ? $store.state.ldServer.phenotypes.map(
                                                                  (phenotype) =>
                                                                      phenotype.name
                                                              )
                                                            : ['T2D']
                                                    "
                                                    :labelFormatter="
                                                        (phenotype) =>
                                                            !!$store.state
                                                                .bioPortal
                                                                .phenotypeMap[
                                                                phenotype
                                                            ]
                                                                ? $store.state
                                                                      .bioPortal
                                                                      .phenotypeMap[
                                                                      phenotype
                                                                  ].description
                                                                : phenotype
                                                    "
                                                >
                                                    <div class="label">
                                                        Phenotypes
                                                    </div>
                                                </filter-enumeration-control>

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
                                                <transition name="fade">
                                                    <b-alert
                                                        show
                                                        v-if="
                                                            $parent
                                                                .selectedDataset
                                                                .length == 0
                                                        "
                                                        >Please select a
                                                        dataset.</b-alert
                                                    >
                                                    <b-alert
                                                        show
                                                        v-else-if="
                                                            $parent
                                                                .selectedPhenotypes
                                                                .length == 0
                                                        "
                                                        >Please select one or
                                                        more
                                                        phenotypes.</b-alert
                                                    >
                                                    <b-alert
                                                        show
                                                        v-else-if="
                                                            $parent
                                                                .selectedTests
                                                                .length == 0 ||
                                                            $parent
                                                                .selectedTests[0] ===
                                                                undefined
                                                        "
                                                        >Please select one or
                                                        more tests to
                                                        run.</b-alert
                                                    ></transition
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
                                                        $parent.searchCovariances
                                                    "
                                                    >Run Analysis</b-button
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
                                    v-b-toggle.accordion-2
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
                                id="accordion-2"
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
                                                    >Search criteria changed.
                                                    Click
                                                    <b-button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        disabled
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
                                                    >Test criteria changed.
                                                    Click
                                                    <b-button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        disabled
                                                        >Run Analysis</b-button
                                                    >
                                                    again to update the
                                                    results.</b-alert
                                                >
                                                <b-table
                                                    v-for="(p, i) in $store
                                                        .state.ldServer
                                                        .covariances"
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
                                                                    data.value <
                                                                    1
                                                                        ? 'negative'
                                                                        : 'positive'
                                                                }`"
                                                                >{{
                                                                    data.value <
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
