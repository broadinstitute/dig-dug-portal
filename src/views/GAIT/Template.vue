<template>
    <div>
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
                    </div>
                </div>
            </div>
            <div class="card mdkp-card">
                <div class="card-body">
                    <h4 class="card-title">Build Search Criteria</h4>

                    <filter-list-group
                        v-model="$parent.searchCriteria"
                        :looseMatch="true"
                        :header="'Search Criteria'"
                    >
                        <filter-basic-control
                            ref="gene"
                            :field="'gene'"
                            :color="'#FF8C00'"
                        >
                            <div class="label">Gene</div>
                        </filter-basic-control>

                        <filter-enumeration-control
                            ref="dataset"
                            :field="'dataset'"
                            :color="'#8A2BE2'"
                            :options="$parent.datasets.map((v) => v.value)"
                            :labelFormatter="
                                (v) =>
                                    $parent.datasets.find((o) => o.value === v)
                                        .text
                            "
                            ><div class="label">
                                Dataset
                            </div></filter-enumeration-control
                        >

                        <filter-enumeration-control
                            ref="phenotype"
                            :field="'phenotype'"
                            :disableSort="true"
                            :multiple="true"
                            :options="
                                $store.state.ldServer.phenotypes.map(
                                    (phenotype) => phenotype.name
                                )
                            "
                            :labelFormatter="
                                (phenotype) =>
                                    !!$store.state.bioPortal.phenotypeMap[
                                        phenotype
                                    ]
                                        ? $store.state.bioPortal.phenotypeMap[
                                              phenotype
                                          ].description
                                        : phenotype
                            "
                        >
                            <div class="label">Phenotypes</div>
                        </filter-enumeration-control>

                        <filter-enumeration-control
                            ref="mask"
                            :field="'mask'"
                            :multiple="true"
                            :disableSort="true"
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
                    </filter-list-group>

                    <div style="text-align: center">
                        <b-button
                            variant="primary"
                            @click="$parent.searchVariants"
                            :disabled="
                                $parent.selectedPhenotypes.length == 0 ||
                                $parent.selectedGene.length == 0 ||
                                $parent.selectedMasks.length == 0
                            "
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
                                    variant="secondary"
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
                                            <strong
                                                >View optional columns
                                            </strong>
                                            <template
                                                v-for="field in $parent.optionalFields"
                                            >
                                                <b-checkbox
                                                    v-if="
                                                        $parent.hiddenFields.indexOf(
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
                                                sticky-header="500px"
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

                                        <div
                                            style="text-align: center"
                                            v-if="$parent.tableData.length > 0"
                                        >
                                            <b-button
                                                variant="primary"
                                                @click="
                                                    $parent.searchCovariances
                                                "
                                                >Run Analysis</b-button
                                            >
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
                                    v-b-toggle.accordion-2
                                    variant="secondary"
                                    >Covariance</b-button
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
                                                :columns="4"
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
                                                    .covariances
                                            "
                                        >
                                            <b-table
                                                striped
                                                hover
                                                :items="
                                                    $store.state.ldServer
                                                        .covariances
                                                "
                                                :per-page="$parent.perPage"
                                                :current-page="
                                                    $parent.currentPage2
                                                "
                                            >
                                            </b-table>
                                            <b-pagination
                                                v-if="
                                                    $store.state.ldServer
                                                        .covariances
                                                "
                                                v-model="$parent.currentPage2"
                                                :total-rows="
                                                    $store.state.ldServer
                                                        .covariances.variants
                                                        ? $store.state.ldServer
                                                              .covariances
                                                              .variants.length
                                                        : 0
                                                "
                                                :per-page="$parent.perPage"
                                                aria-controls="covariances-table"
                                            ></b-pagination>
                                        </div>
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
